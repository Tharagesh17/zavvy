/**
 * Kimi AI (Moonshot) API Client
 * For generating AI-powered WhatsApp messages
 */

import type { KimiRequest, KimiResponse, KimiMessage } from '@/lib/types/whatsapp';

const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_API_URL = process.env.KIMI_API_URL || 'https://api.moonshot.cn/v1/chat/completions';
const KIMI_MODEL = process.env.KIMI_MODEL || 'moonshot-v1-8k';

if (!KIMI_API_KEY) {
    console.warn('⚠️ KIMI_API_KEY not set. AI WhatsApp messages will not work.');
}

/**
 * Call Kimi API to generate AI response
 */
export async function callKimiAPI(messages: KimiMessage[]): Promise<string> {
    if (!KIMI_API_KEY) {
        throw new Error('KIMI_API_KEY is not configured');
    }

    const request: KimiRequest = {
        model: KIMI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 200, // Keep messages concise
    };

    try {
        const response = await fetch(KIMI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${KIMI_API_KEY}`,
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Kimi API Error:', errorText);
            throw new Error(`Kimi API returned ${response.status}: ${errorText}`);
        }

        const data: KimiResponse = await response.json();

        if (!data.choices || data.choices.length === 0) {
            throw new Error('Kimi API returned no choices');
        }

        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error calling Kimi API:', error);
        throw error;
    }
}

/**
 * Build system prompt for WhatsApp message generation
 */
export function buildSystemPrompt(language: 'en' | 'hi' | 'auto'): string {
    const basePrompt = `You are a professional business communication assistant for Indian e-commerce sellers. Generate WhatsApp messages that are:
- Warm and friendly, not robotic
- Concise (under 160 characters when possible)
- Culturally appropriate for Indian customers
- Include relevant order details (order ID, amount, product name)
- Use appropriate emojis sparingly (1-2 max)
- Professional yet conversational tone`;

    if (language === 'hi') {
        return `${basePrompt}
- IMPORTANT: Respond ONLY in Hindi (Devanagari script)
- Use simple, everyday Hindi words
- Keep English words for technical terms (Order ID, etc.)`;
    }

    if (language === 'en') {
        return `${basePrompt}
- IMPORTANT: Respond ONLY in English
- Use simple, clear language`;
    }

    // Auto-detect
    return `${basePrompt}
- Detect the appropriate language based on the buyer's name and context
- Use Hindi for Indian names, English otherwise`;
}

/**
 * Build user prompt with order context
 */
export function buildUserPrompt(params: {
    messageType: string;
    buyerName: string;
    productName: string;
    amount: number;
    orderId: string;
    buyerHistory?: string;
}): string {
    const { messageType, buyerName, productName, amount, orderId, buyerHistory } = params;
    const amountInr = (amount / 100).toFixed(2);

    let context = `Generate a WhatsApp message for the following scenario:

Message Type: ${messageType}
Buyer Name: ${buyerName}
Product: ${productName}
Amount: ₹${amountInr}
Order ID: ${orderId}`;

    if (buyerHistory) {
        context += `\nBuyer History: ${buyerHistory}`;
    }

    // Add specific instructions based on message type
    switch (messageType) {
        case 'payment_pending':
            context += '\n\nThe buyer has placed an order but payment is pending. Politely remind them to complete payment.';
            break;
        case 'payment_confirmed':
            context += '\n\nPayment has been received. Thank the buyer and confirm order processing.';
            break;
        case 'order_shipped':
            context += '\n\nOrder has been shipped. Provide tracking info and expected delivery.';
            break;
        case 'order_delivered':
            context += '\n\nOrder has been delivered. Thank them and request feedback.';
            break;
    }

    return context;
}
