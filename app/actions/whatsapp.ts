/**
 * WhatsApp Server Actions
 * AI-powered message generation using Kimi API
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { callKimiAPI, buildSystemPrompt, buildUserPrompt } from '@/lib/kimi/client';
import type {
    WhatsAppMessageRequest,
    WhatsAppMessageResponse,
    BuyerHistory,
} from '@/lib/types/whatsapp';

/**
 * Generate AI-powered WhatsApp message for an order
 */
export async function generateAIMessage(
    request: WhatsAppMessageRequest
): Promise<WhatsAppMessageResponse> {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Unauthorized');
    }

    // Get seller ID
    const { data: seller } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!seller) {
        throw new Error('Seller not found');
    }

    // Get order details
    const { data: order } = await supabase
        .from('orders')
        .select(`
      *,
      products (name, price)
    `)
        .eq('id', request.orderId)
        .eq('seller_id', seller.id)
        .single();

    if (!order) {
        throw new Error('Order not found');
    }

    // Get buyer history
    const buyerHistory = await getBuyerHistory(seller.id, order.buyer_phone);

    // Determine language
    const language = request.language || 'auto';

    // Build prompts for Kimi
    const systemPrompt = buildSystemPrompt(language);
    const userPrompt = buildUserPrompt({
        messageType: request.messageType,
        buyerName: order.buyer_name,
        productName: order.products.name,
        amount: order.amount,
        orderId: order.id.slice(0, 8).toUpperCase(),
        buyerHistory: buyerHistory.totalOrders > 1
            ? `Repeat customer (${buyerHistory.totalOrders} orders, avg ₹${buyerHistory.averageOrderValue})`
            : 'First-time buyer',
    });

    // Call Kimi API
    const generatedMessage = await callKimiAPI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
    ]);

    // Create WhatsApp deep link
    const encodedMessage = encodeURIComponent(generatedMessage);
    const whatsappLink = `https://wa.me/${order.buyer_phone}?text=${encodedMessage}`;

    // Log to database
    const { data: log } = await supabase
        .from('whatsapp_logs')
        .insert({
            seller_id: seller.id,
            order_id: order.id,
            buyer_phone: order.buyer_phone,
            message_type: request.messageType,
            generated_message: generatedMessage,
            language: language,
        })
        .select('id')
        .single();

    if (!log) {
        throw new Error('Failed to log WhatsApp message');
    }

    return {
        message: generatedMessage,
        whatsappLink,
        logId: log.id,
    };
}

/**
 * Log when seller clicks WhatsApp link
 */
export async function logWhatsAppClick(logId: string): Promise<void> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Unauthorized');
    }

    // Get seller ID
    const { data: seller } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!seller) {
        throw new Error('Seller not found');
    }

    // Update clicked_at timestamp
    await supabase
        .from('whatsapp_logs')
        .update({ clicked_at: new Date().toISOString() })
        .eq('id', logId)
        .eq('seller_id', seller.id);
}

/**
 * Get buyer's order history for context
 */
async function getBuyerHistory(
    sellerId: string,
    buyerPhone: string
): Promise<BuyerHistory> {
    const supabase = await createClient();

    const { data: orders } = await supabase
        .from('orders')
        .select('amount, created_at')
        .eq('seller_id', sellerId)
        .eq('buyer_phone', buyerPhone)
        .order('created_at', { ascending: false });

    if (!orders || orders.length === 0) {
        return {
            totalOrders: 0,
            lastOrderDate: null,
            averageOrderValue: 0,
        };
    }

    const totalAmount = orders.reduce((sum, o) => sum + o.amount, 0);
    const avgAmount = Math.round(totalAmount / orders.length / 100); // Convert to rupees

    return {
        totalOrders: orders.length,
        lastOrderDate: orders[0].created_at,
        averageOrderValue: avgAmount,
    };
}

