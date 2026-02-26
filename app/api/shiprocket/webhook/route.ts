import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Send a Telegram message using the HTTP API
 */
async function sendTelegramMessage(chatId: string | number, text: string) {
    if (!TELEGRAM_BOT_TOKEN) return false;

    try {
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown' // To allow bolding, etc.
            })
        });
        return res.ok;
    } catch (error) {
        logger.error("Telegram API sending failed", {}, error instanceof Error ? error : undefined);
        return false;
    }
}

/**
 * POST /api/shiprocket/webhook
 * Handles incoming webhooks from Shiprocket (e.g., tracking status updates).
 */
export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();

        logger.info("Shiprocket Webhook received");

        // Log the event type, shiprocket doesn't have a single standard event structure but usually includes current_status
        const currentStatus = payload.current_status;
        const awb = payload.awb;

        // Only process DELIVERED shipments with an AWB
        if (currentStatus !== "DELIVERED" || !awb) {
            return NextResponse.json({ success: true, ignored: true, reason: "Not a delivery or missing AWB" });
        }

        const supabase = createServiceRoleClient();

        // Find the order using the AWB
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select(`
                id, 
                amount, 
                buyer_name, 
                payment_method, 
                seller_id,
                tracking_status,
                sellers (
                    user_id
                )
            `)
            .eq("awb_code", awb)
            .single();

        if (orderError || !order) {
            logger.error("Webhook: Could not find order for AWB", { awb });
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Update order's tracking status to DELIVERED
        await supabase
            .from("orders")
            .update({ tracking_status: currentStatus })
            .eq("id", order.id);

        // Notify if it's a COD order
        if (order.payment_method === 'cod') {
            // Find seller's telegram_chat_id
            const sellerData = order.sellers as unknown as { user_id: string } | { user_id: string }[];
            const sellerUserId = Array.isArray(sellerData) ? sellerData[0]?.user_id : sellerData?.user_id;

            if (sellerUserId) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("telegram_chat_id")
                    .eq("id", sellerUserId)
                    .single();

                if (profile?.telegram_chat_id) {
                    const amountFormatted = (order.amount / 100).toLocaleString('en-IN');
                    const message = `✅ *COD Delivery Successful!*\n\n💰 Amount to be remitted by Shiprocket: *₹${amountFormatted}*\n👤 Buyer: ${order.buyer_name}\n📦 Order ID: \`${order.id}\`\n\nThe shipment for this order has been successfully delivered.`;

                    await sendTelegramMessage(profile.telegram_chat_id, message);
                    logger.info("Sent Telegram notification", { chatId: profile.telegram_chat_id, orderId: order.id });
                }
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        logger.error("Webhook processing error", {}, error instanceof Error ? error : undefined);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
