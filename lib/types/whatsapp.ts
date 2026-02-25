/**
 * WhatsApp Integration Types
 * For AI-powered message generation via Kimi API
 */

export type MessageType =
    | 'payment_pending'
    | 'payment_confirmed'
    | 'order_shipped'
    | 'order_delivered'
    | 'custom';

export type Language = 'en' | 'hi' | 'auto';

export interface WhatsAppMessageRequest {
    orderId: string;
    messageType: MessageType;
    language?: Language;
    customContext?: string;
}

export interface WhatsAppMessageResponse {
    message: string;
    whatsappLink: string;
    logId: string;
}

export interface BuyerHistory {
    totalOrders: number;
    lastOrderDate: string | null;
    preferredLanguage?: Language;
    averageOrderValue: number;
}

export interface WhatsAppLog {
    id: string;
    seller_id: string;
    order_id: string | null;
    buyer_phone: string;
    message_type: MessageType;
    generated_message: string;
    language: Language;
    clicked_at: string | null;
    created_at: string;
}

export interface KimiMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface KimiRequest {
    model: string;
    messages: KimiMessage[];
    temperature?: number;
    max_tokens?: number;
}

export interface KimiResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: {
        index: number;
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
