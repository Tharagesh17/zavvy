import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
// @ts-ignore
import { createClient } from '@supabase/supabase-js';
import { extractReceiptData } from '../lib/gemini';
import { findMatchingOrders, getBestMatch } from '../lib/fuzzy-match';
import { sendShipmentEmail } from '../lib/resend';
import cron from 'node-cron';

dotenv.config({ path: '.env.local' });

const token = process.env.TELEGRAM_BOT_TOKEN;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!token || !supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing env vars: TELEGRAM_BOT_TOKEN, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const bot = new TelegramBot(token, { polling: true });

console.log("🤖 Zavvy Engine Starting...");

// ─── Persistent Reply Keyboard ───────────────────────────────────────────────
const MAIN_KEYBOARD = {
    reply_markup: {
        keyboard: [
            [{ text: '🆕 Add Product' }, { text: '📋 Active Orders' }],
            [{ text: '📈 My Sales' }, { text: '⚙️ Store Settings' }]
        ],
        resize_keyboard: true,
        is_persistent: true
    }
};

bot.getMe().then((me: any) => {
    console.log(`✅ Bot Connected! @${me.username}`);
}).catch((err: any) => {
    console.error("❌ Failed to connect to Telegram:", err.message);
    process.exit(1);
});

// ─── Security Gate ────────────────────────────────────────────────────────────

async function isAuthorizedSeller(chatId: number): Promise<boolean> {
    const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('telegram_chat_id', chatId)
        .single();
    return !!data;
}

// ─── Onboarding: /start <SELLER_UUID> ────────────────────────────────────────

bot.onText(/\/start (.+)/, async (msg: any, match: any) => {
    const chatId = msg.chat.id;
    const startParam = match?.[1]?.trim();

    if (!startParam) {
        bot.sendMessage(chatId, "👋 Welcome to Zavvy! Use the link from your dashboard to connect your account.");
        return;
    }

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(startParam)) {
        bot.sendMessage(chatId, "⚠️ Invalid link format. Please use the link from your Zavvy dashboard.");
        return;
    }

    console.log(`🔗 Linking Chat ID ${chatId} → User ${startParam}`);

    const { data, error } = await supabase
        .from('profiles')
        .update({ telegram_chat_id: chatId })
        .eq('id', startParam)
        .select('id')
        .single();

    if (error || !data) {
        console.error("Link Error:", error);
        bot.sendMessage(chatId, "❌ Could not link account. Make sure you used the correct link from your dashboard.");
        return;
    }

    // Fetch seller's business name for a personal greeting
    const { data: seller } = await supabase
        .from('sellers')
        .select('business_name')
        .eq('user_id', startParam)
        .single();

    const name = seller?.business_name || "Seller";

    bot.sendMessage(chatId,
        `⚡ *Zavvy Linked!*\n\nHey ${name}! You'll now receive instant alerts here for:\n\n` +
        `📦 New orders\n💸 Payment screenshots\n🚚 COD approvals\n\n` +
        `Use the buttons below to manage your store. 📸 Send a receipt photo anytime to ship an order instantly.`,
        { parse_mode: 'Markdown', ...MAIN_KEYBOARD }
    );

    console.log(`✅ Linked Chat ID ${chatId} → User ${startParam}`);
});

// ─── /start with no param ────────────────────────────────────────────────────

bot.onText(/^\/start$/, async (msg: any) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "👋 Welcome to Zavvy! Please use the link from your dashboard to connect your account.");
});

// ─── Button Callbacks (Approve / Reject) ─────────────────────────────────────

bot.on('callback_query', async (query: any) => {
    const chatId = query.message?.chat.id;
    const messageId = query.message?.message_id;
    const data = query.data;

    if (!chatId || !data) return;

    // Security: only linked sellers can interact
    const authorized = await isAuthorizedSeller(chatId);
    if (!authorized) {
        bot.answerCallbackQuery(query.id, { text: "⛔ Unauthorized." });
        return;
    }

    const parts = data.split(':');
    const action = parts[0];

    try {
        if (action === 'add_stock') {
            const variantId = parts[1];
            const qty = parseInt(parts[2], 10);

            const { error } = await supabase.rpc('increment_variant_stock', {
                v_id: variantId,
                v_qty: qty
            });

            if (!error) {
                bot.answerCallbackQuery(query.id, { text: `✅ Added ${qty} stock!` });
                bot.editMessageText(
                    query.message.text + `\n\n✅ *Added ${qty} items to stock.*`,
                    { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown' }
                );
            } else {
                bot.answerCallbackQuery(query.id, { text: "❌ Failed to add stock." });
            }
        } else if (action === 'approve_upi') {
            const orderId = parts[1];
            const { error: appUpiErr } = await supabase
                .from('orders')
                .update({
                    payment_status: 'paid',
                    order_status: 'confirmed',
                    seller_approved_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            if (!appUpiErr) {
                bot.answerCallbackQuery(query.id, { text: "✅ Payment Approved!" });
                bot.editMessageText(
                    query.message.text + "\n\n✅ *Payment Approved* — Order confirmed.",
                    { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown' }
                );

                // Send approval email to buyer
                try {
                    const { sendPaymentApprovalEmail } = await import('../lib/resend');
                    const { data: ord } = await supabase.from('orders')
                        .select('buyer_email, buyer_name, amount, product_id, seller_id')
                        .eq('id', orderId).single();
                    if (ord?.buyer_email) {
                        const { data: prod } = await supabase.from('products').select('name').eq('id', ord.product_id).single();
                        const { data: slr } = await supabase.from('sellers').select('business_name').eq('id', ord.seller_id).single();
                        await sendPaymentApprovalEmail({
                            buyerEmail: ord.buyer_email,
                            buyerName: ord.buyer_name,
                            productName: prod?.name,
                            orderAmount: ord.amount,
                            sellerName: slr?.business_name,
                            orderId,
                        });
                    }
                } catch (emailErr) {
                    console.error('Approval email error:', emailErr);
                }
            } else {
                bot.answerCallbackQuery(query.id, { text: "❌ Failed to approve." });
            }

        } else if (action === 'reject_upi') {
            const orderId = parts[1];
            const { error: rejUpiErr } = await supabase
                .from('orders')
                .update({
                    payment_status: 'failed',
                    order_status: 'cancelled',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            if (!rejUpiErr) {
                bot.answerCallbackQuery(query.id, { text: "❌ Payment Rejected." });
                bot.editMessageText(
                    query.message.text + "\n\n❌ *Payment Rejected* — Order cancelled.",
                    { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown' }
                );
            } else {
                bot.answerCallbackQuery(query.id, { text: "❌ Failed to reject." });
            }

        } else if (action === 'approve_cod') {
            const orderId = parts[1];
            const { error: appCodErr } = await supabase
                .from('orders')
                .update({
                    cod_status: 'approved',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            if (!appCodErr) {
                bot.answerCallbackQuery(query.id, { text: "✅ COD Order Approved!" });
                bot.editMessageText(
                    query.message.text + "\n\n✅ *COD Approved* — Proceed with shipment.",
                    { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown' }
                );
            } else {
                bot.answerCallbackQuery(query.id, { text: "❌ Failed to approve." });
            }

        } else if (action === 'reject_cod') {
            const orderId = parts[1];
            const { error: rejCodErr } = await supabase
                .from('orders')
                .update({
                    cod_status: 'rejected',
                    order_status: 'cancelled',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);

            if (!rejCodErr) {
                bot.answerCallbackQuery(query.id, { text: "❌ COD Order Rejected." });
                bot.editMessageText(
                    query.message.text + "\n\n❌ *COD Rejected* — Order cancelled.",
                    { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown' }
                );
            } else {
                bot.answerCallbackQuery(query.id, { text: "❌ Failed to reject." });
            }
        } else if (action === 'view_order') {
            const orderId = parts[1];
            const { data: order, error } = await supabase
                .from('orders')
                .select(`
                    id, amount, buyer_name, buyer_phone, payment_method, payment_status, cod_status, created_at,
                    buyer_address,
                    product:products(name)
                `)
                .eq('id', orderId)
                .single();

            if (error || !order) {
                bot.answerCallbackQuery(query.id, { text: "❌ Order not found." });
                return;
            }

            const productData = order.product as { name: string } | { name: string }[] | null;
            const productName = Array.isArray(productData) ? productData[0]?.name : productData?.name;
            const method = order.payment_method === 'cod' ? '🚚 Cash on Delivery' : '💳 Manual UPI';
            const formattedAmount = (order.amount / 100).toLocaleString('en-IN');

            let addrStr = "No address provided.";
            if (order.buyer_address && typeof order.buyer_address === 'object') {
                const a = order.buyer_address as Record<string, string>;
                addrStr = `${a.line1}${a.line2 ? ', ' + a.line2 : ''}\n${a.city}, ${a.state} - ${a.pincode}`;
            }

            let detailMsg = `📋 *Order Details*\n\n`;
            detailMsg += `🆔 *ID:* \`${order.id}\`\n`;
            detailMsg += `👤 *Buyer:* ${order.buyer_name}\n`;
            detailMsg += `📞 *Phone:* ${order.buyer_phone}\n`;
            detailMsg += `🧵 *Product:* ${productName}\n`;
            detailMsg += `💰 *Amount:* ₹${formattedAmount}\n`;
            detailMsg += `💳 *Method:* ${method}\n\n`;
            detailMsg += `📍 *Address:*\n${addrStr}\n`;

            const buttons = [];

            if (order.payment_method === 'cod') {
                if (order.cod_status === 'pending_approval') {
                    buttons.push([
                        { text: "✅ Approve COD", callback_data: `approve_cod:${order.id}` },
                        { text: "❌ Reject", callback_data: `reject_cod:${order.id}` }
                    ]);
                } else if (order.cod_status === 'approved') {
                    detailMsg += `\n✨ *Status:* COD Approved (Ready to ship)`;
                }
            } else {
                if (order.payment_status === 'pending' || order.payment_status === 'needs_review' || order.payment_status === 'awaiting_approval') {
                    buttons.push([
                        { text: "✅ Verify Payment", callback_data: `approve_upi:${order.id}` }
                    ]);
                } else if (order.payment_status === 'verified' || order.payment_status === 'paid') {
                    detailMsg += `\n✨ *Status:* Payment Verified (Ready to ship)`;
                }
            }

            bot.answerCallbackQuery(query.id);
            bot.editMessageText(detailMsg, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: buttons
                }
            });
        } else if (action === 'confirm_ship') {
            // Single-Tap Fulfillment: OCR Confirm → Ship → Email
            const orderId = parts[1];
            const awbNumber = parts[2];
            const courierName = parts.slice(3).join(':'); // courier name may contain colons

            // Update order
            await supabase.from('orders').update({
                awb_number: awbNumber,
                courier_name: courierName,
                order_status: 'shipped',
                updated_at: new Date().toISOString()
            }).eq('id', orderId);

            // Fetch order + product details for email
            const { data: shipOrder } = await supabase
                .from('orders')
                .select('buyer_name, buyer_phone, buyer_email, amount, product_id, seller_id')
                .eq('id', orderId)
                .single();

            let productName = 'your order';
            let sellerName = 'the seller';
            if (shipOrder) {
                const { data: prod } = await supabase.from('products').select('name').eq('id', shipOrder.product_id).single();
                productName = prod?.name || productName;
                const { data: selr } = await supabase.from('sellers').select('business_name').eq('id', shipOrder.seller_id).single();
                sellerName = selr?.business_name || sellerName;

                // Send email via Resend
                await sendShipmentEmail({
                    buyerEmail: shipOrder.buyer_email,
                    buyerName: shipOrder.buyer_name,
                    buyerPhone: shipOrder.buyer_phone,
                    awbNumber,
                    courierName,
                    productName,
                    orderAmount: shipOrder.amount,
                    sellerName,
                });
            }

            bot.answerCallbackQuery(query.id, { text: '✅ Order shipped!' });
            bot.editMessageText(
                query.message.text + `\n\n✅ *Shipped!* Order updated, buyer notified.`,
                { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown' }
            );

            // Send forwardable buyer message
            const buyerMsg = `Hi ${shipOrder?.buyer_name || 'there'},\n\nYour ${productName} has been shipped! 🚚\nCourier: ${courierName}\nTracking: ${awbNumber}\n\nThank you for shopping with ${sellerName}!`;
            bot.sendMessage(chatId, `📱 *Forward this to the buyer:*`, { parse_mode: 'Markdown' });
            bot.sendMessage(chatId, buyerMsg);

        } else if (action === 'reject_ship') {
            bot.answerCallbackQuery(query.id, { text: '❌ Shipment cancelled.' });
            bot.editMessageText(
                query.message.text + `\n\n❌ *Cancelled.* Please scan the correct receipt.`,
                { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown' }
            );
        } else if (action === 'prod_detail') {
            const productId = parts[1];
            const { data: prod } = await supabase.from('products')
                .select('id, name, price, stock, is_active, description')
                .eq('id', productId).single();

            if (!prod) { bot.answerCallbackQuery(query.id, { text: 'Product not found.' }); return; }

            // Get shareable link
            const { data: link } = await supabase.from('product_links')
                .select('short_code').eq('product_id', productId).eq('is_active', true).limit(1).single();

            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const shareLink = link ? `${baseUrl}/l/${link.short_code}` : 'No link created';

            const status = prod.is_active ? '🟢 Active' : '🔴 Inactive';
            const detail = `📦 *${prod.name}*\n\n` +
                `${status}\n` +
                `💲 Price: ₹${(prod.price / 100).toFixed(2)}\n` +
                `📦 Stock: ${prod.stock}\n` +
                `📝 ${prod.description || 'No description'}\n\n` +
                `🔗 Link: ${shareLink}`;

            bot.answerCallbackQuery(query.id);
            bot.editMessageText(detail, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '💲 Edit Price', callback_data: `edit_price:${productId}` },
                            { text: '📦 Edit Stock', callback_data: `edit_stock:${productId}` }
                        ],
                        [
                            { text: prod.is_active ? '🔴 Deactivate' : '🟢 Activate', callback_data: `toggle_product:${productId}` }
                        ]
                    ]
                }
            });

        } else if (action === 'edit_price') {
            const productId = parts[1];
            uploadStates.set(chatId, { step: 'AWAITING_EDIT_PRICE', productId } as any);
            bot.answerCallbackQuery(query.id);
            bot.sendMessage(chatId, '💲 Type the new price in rupees (e.g. `299`):', { parse_mode: 'Markdown' });

        } else if (action === 'edit_stock') {
            const productId = parts[1];
            uploadStates.set(chatId, { step: 'AWAITING_EDIT_STOCK', productId } as any);
            bot.answerCallbackQuery(query.id);
            bot.sendMessage(chatId, '📦 Type the new stock quantity (e.g. `50`):', { parse_mode: 'Markdown' });

        } else if (action === 'ship_manual') {
            const orderId = parts[1];
            uploadStates.set(chatId, { step: 'AWAITING_AWB', orderId } as any);
            bot.answerCallbackQuery(query.id);
            bot.sendMessage(chatId, '✏️ Type the AWB/Tracking number:', { parse_mode: 'Markdown' });

        } else if (action === 'toggle_product') {
            const productId = parts[1];
            const { data: prod } = await supabase.from('products').select('is_active, name').eq('id', productId).single();
            if (!prod) return;

            const newStatus = !prod.is_active;
            await supabase.from('products').update({ is_active: newStatus }).eq('id', productId);

            bot.answerCallbackQuery(query.id, { text: newStatus ? '🟢 Activated!' : '🔴 Deactivated!' });
            bot.editMessageText(
                `${newStatus ? '🟢' : '🔴'} *${prod.name}* is now ${newStatus ? 'active' : 'inactive'}.`,
                { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown' }
            );
        } else if (action === 'gen_label') {
            const orderId = parts[1];
            bot.answerCallbackQuery(query.id, { text: '📄 Generating label...' });

            // Get seller ID for this chat
            const { data: prof } = await supabase.from('profiles').select('id').eq('telegram_chat_id', chatId).single();
            if (!prof) return;
            const { data: slr } = await supabase.from('sellers').select('id').eq('user_id', prof.id).single();
            if (!slr) return;

            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const labelUrl = `${baseUrl}/api/labels?order_id=${orderId}&seller_id=${slr.id}`;

            try {
                const response = await fetch(labelUrl);
                if (!response.ok) throw new Error('Label fetch failed');
                const pdfBuffer = Buffer.from(await response.arrayBuffer());

                await bot.sendDocument(chatId, pdfBuffer, {
                    caption: `📄 Shipping label for order #${orderId.substring(0, 8)}`,
                }, { filename: `label-${orderId.substring(0, 8)}.pdf`, contentType: 'application/pdf' });
            } catch (labelErr) {
                console.error('Label generation error:', labelErr);
                bot.sendMessage(chatId, '⚠️ Failed to generate label. Try again.');
            }

        } else if (action === 'view_order') {
            const orderId = parts[1];
            const { data: ord } = await supabase.from('orders')
                .select('*, products(name)')
                .eq('id', orderId).single();

            if (!ord) { bot.answerCallbackQuery(query.id, { text: 'Order not found.' }); return; }

            const amount = (ord.amount / 100).toFixed(2);
            const status = ord.order_status || 'pending';
            const payStatus = ord.payment_status || 'pending';
            const date = new Date(ord.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const productName = ord.products?.name || 'Product';

            // Build address string
            let addrStr = '';
            if (ord.buyer_address) {
                const a = ord.buyer_address;
                if (typeof a === 'string') addrStr = a;
                else addrStr = [a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ');
            }

            let detail = `📋 *Order #${orderId.substring(0, 8)}*\n\n`;
            detail += `📦 *Product:* ${productName}\n`;
            detail += `💰 *Amount:* ₹${amount}\n`;
            detail += `📊 *Status:* ${status}\n`;
            detail += `💳 *Payment:* ${payStatus}\n`;
            detail += `👤 *Buyer:* ${ord.buyer_name}\n`;
            detail += `📞 *Phone:* ${ord.buyer_phone}\n`;
            if (addrStr) detail += `📍 *Address:* ${addrStr}\n`;
            if (ord.awb_code) detail += `🔗 *AWB:* \`${ord.awb_code}\`\n`;
            if (ord.courier_name) detail += `🚚 *Courier:* ${ord.courier_name}\n`;
            detail += `📅 *Date:* ${date}`;

            const buttons: any[][] = [[
                { text: '📄 Label', callback_data: `gen_label:${orderId}` }
            ]];
            if (!ord.awb_code && ['confirmed', 'processing', 'pending'].includes(status)) {
                buttons[0].unshift({ text: '🚚 Ship', callback_data: `ship_manual:${orderId}` });
            }

            bot.answerCallbackQuery(query.id);
            bot.sendMessage(chatId, detail, {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: buttons }
            });
        }
    } catch (err) {
        console.error("Callback Error:", err);
        bot.answerCallbackQuery(query.id, { text: "⚠️ Error processing request." });
    }
});

// ─── Realtime: New Order → Notify Seller ─────────────────────────────────────

supabase
    .channel('orders-telegram-alert')
    .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload: any) => {
            const order = payload.new;
            console.log(`📦 New Order: ${order.id} | Seller: ${order.seller_id} | Method: ${order.payment_method}`);

            try {
                // 1. Get seller's user_id
                const { data: seller, error: sellerErr } = await supabase
                    .from('sellers')
                    .select('user_id, business_name')
                    .eq('id', order.seller_id)
                    .single();

                if (sellerErr || !seller) {
                    console.error(`Seller not found for order ${order.id}`);
                    return;
                }

                // 2. Get seller's Telegram chat_id
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('telegram_chat_id')
                    .eq('id', seller.user_id)
                    .single();

                if (!profile?.telegram_chat_id) {
                    console.log(`No Telegram linked for seller ${seller.user_id}. Skipping.`);
                    return;
                }

                const chatId = profile.telegram_chat_id;

                // 3. Get product name
                const { data: product } = await supabase
                    .from('products')
                    .select('name')
                    .eq('id', order.product_id)
                    .single();

                const productName = product?.name || "Unknown Product";
                const amount = (order.amount / 100).toLocaleString('en-IN');
                const buyerName = order.buyer_name || "Unknown";
                const buyerPhone = order.buyer_phone || "N/A";
                const address = order.buyer_address
                    ? `${order.buyer_address.line1}, ${order.buyer_address.city}, ${order.buyer_address.state} - ${order.buyer_address.pincode}`
                    : "N/A";

                // Format Items List
                let itemsList = "";
                if (order.items && Array.isArray(order.items) && order.items.length > 0) {
                    itemsList = order.items.map((item: any) => {
                        let variantDetails = "";
                        if (item.variant) {
                            variantDetails = Object.entries(item.variant)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(", ");
                        }
                        return `• ${item.quantity}x ${productName} ${variantDetails ? `(${variantDetails})` : ""}`;
                    }).join("\n");
                } else {
                    // Fallback for old orders or simple orders
                    itemsList = `• ${order.quantity || 1}x ${productName}`;
                }

                // 4. Build and send notification based on payment method
                if (order.payment_method === 'manual_upi') {
                    // UPI order — just notify, buttons come after buyer submits Transaction ID
                    await bot.sendMessage(chatId,
                        `💸 *New UPI Order!*\n\n` +
                        `🛒 *Items:*\n${itemsList}\n\n` +
                        `💰 *Amount:* ₹${amount}\n` +
                        `👤 *Buyer:* ${buyerName}\n` +
                        `📞 *Phone:* ${buyerPhone}\n` +
                        `📍 *Address:* ${address}\n\n` +
                        `📩 Buyer is completing payment. You'll get a notification once they submit the UPI Transaction ID.`,
                        { parse_mode: 'Markdown' }
                    );

                } else if (order.payment_method === 'cod') {
                    // COD order — needs approval
                    await bot.sendMessage(chatId,
                        `🚚 *New COD Order!*\n\n` +
                        `🛍 *Items:*\n${itemsList}\n\n` +
                        `💰 *Amount:* ₹${amount}\n` +
                        `👤 *Buyer:* ${buyerName}\n` +
                        `📞 *Phone:* ${buyerPhone}\n` +
                        `📍 *Address:* ${address}\n\n` +
                        `⚠️ Approve to confirm shipment, or reject to cancel.`,
                        {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [[
                                    { text: "✅ Approve COD", callback_data: `approve_cod:${order.id}` },
                                    { text: "❌ Reject", callback_data: `reject_cod:${order.id}` }
                                ]]
                            }
                        }
                    );

                } else {
                    // Razorpay or other — just notify
                    await bot.sendMessage(chatId,
                        `📦 *New Order Received!*\n\n` +
                        `🛍 *Items:*\n${itemsList}\n\n` +
                        `💰 *Amount:* ₹${amount}\n` +
                        `👤 *Buyer:* ${buyerName}\n` +
                        `📞 *Phone:* ${buyerPhone}\n` +
                        `📍 *Address:* ${address}\n` +
                        `💳 *Method:* ${order.payment_method}`,
                        { parse_mode: 'Markdown' }
                    );
                }

                console.log(`✅ Notified seller ${seller.user_id} for order ${order.id}`);

            } catch (err) {
                console.error("Realtime Notification Error:", err);
            }
        }
    )
    .subscribe((status: string) => {
        console.log(`🔌 Supabase Realtime Orders: ${status}`);
        if (status === 'SUBSCRIBED') {
            console.log("✅ Listening for new orders...");
        }
    });

// ─── Realtime: Order Update Sync (Web → Telegram) ────────────────────────────

const recentBotUpdates = new Set<string>(); // dedup: skip bot-initiated updates

supabase
    .channel('orders-update-sync')
    .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        async (payload: any) => {
            const oldOrder = payload.old;
            const newOrder = payload.new;

            // Skip if bot recently updated this order (dedup)
            if (recentBotUpdates.has(newOrder.id)) {
                recentBotUpdates.delete(newOrder.id);
                return;
            }

            try {
                // Detect meaningful status changes
                const statusChanged = oldOrder.order_status !== newOrder.order_status;
                const paymentChanged = oldOrder.payment_status !== newOrder.payment_status;

                if (!statusChanged && !paymentChanged) return;

                // Get seller's Telegram chatId
                const { data: seller } = await supabase.from('sellers')
                    .select('user_id, business_name').eq('id', newOrder.seller_id).single();
                if (!seller) return;

                const { data: profile } = await supabase.from('profiles')
                    .select('telegram_chat_id').eq('id', seller.user_id).single();
                if (!profile?.telegram_chat_id) return;

                const tgChatId = profile.telegram_chat_id;
                const { data: prod } = await supabase.from('products')
                    .select('name').eq('id', newOrder.product_id).single();
                const productName = prod?.name || 'Order';
                const amount = (newOrder.amount / 100).toFixed(2);

                // Shipped notification
                if (newOrder.order_status === 'shipped' && oldOrder.order_status !== 'shipped') {
                    bot.sendMessage(tgChatId,
                        `🚚 *Order Shipped (from Dashboard)*\n\n` +
                        `📦 *${productName}*\n` +
                        `👤 *Buyer:* ${newOrder.buyer_name}\n` +
                        `💰 *Amount:* ₹${amount}\n` +
                        (newOrder.awb_code ? `🔗 *AWB:* \`${newOrder.awb_code}\`\n` : '') +
                        `\n✅ Order synced from web dashboard.`,
                        { parse_mode: 'Markdown', ...MAIN_KEYBOARD }
                    );
                }

                // Payment approved notification
                if ((newOrder.payment_status === 'paid' || newOrder.payment_status === 'verified') &&
                    oldOrder.payment_status !== 'paid' && oldOrder.payment_status !== 'verified') {
                    bot.sendMessage(tgChatId,
                        `✅ *Payment Approved (from Dashboard)*\n\n` +
                        `📦 *${productName}* → ${newOrder.buyer_name}\n` +
                        `💰 ₹${amount} confirmed.`,
                        { parse_mode: 'Markdown', ...MAIN_KEYBOARD }
                    );
                }
            } catch (err) {
                console.error('Realtime Update Sync Error:', err);
            }
        }
    )
    .subscribe((status: string) => {
        console.log(`🔌 Supabase Realtime Order Sync: ${status}`);
    });

// ─── Realtime: Low Stock / Sold Out Alerts ────────────────────────────────────

supabase
    .channel('stock-alerts')
    .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'product_variants' },
        async (payload: any) => {
            const variantId = payload.new.id;
            const newStock = payload.new.stock_count;
            const oldStock = payload.old.stock_count;

            // Alert if stock hits 0
            if (newStock === 0 && oldStock > 0) {
                try {
                    // Fetch product details
                    const { data: variant } = await supabase
                        .from('product_variants')
                        .select('product_id, size, color')
                        .eq('id', variantId)
                        .single();

                    if (!variant) return;

                    const { data: product } = await supabase
                        .from('products')
                        .select('seller_id, name')
                        .eq('id', variant.product_id)
                        .single();

                    if (!product) return;

                    const { data: seller } = await supabase.from('sellers').select('user_id').eq('id', product.seller_id).single();
                    if (!seller) return;

                    const { data: profile } = await supabase.from('profiles').select('telegram_chat_id').eq('id', seller.user_id).single();
                    if (!profile?.telegram_chat_id) return;

                    const properties = [variant.size, variant.color].filter(Boolean).join(" / ");
                    const variantTitle = properties ? `${product.name} (${properties})` : product.name;

                    await bot.sendMessage(profile.telegram_chat_id,
                        `⚠️ *SOLD OUT ALERT*\n\nYour product *${variantTitle}* has reached 0 stock!\nBuyers can no longer purchase this item until restocked.`,
                        {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [[
                                    { text: "📦 Add +5 Stock", callback_data: `add_stock:${variantId}:5` },
                                    { text: "📦 Add +10 Stock", callback_data: `add_stock:${variantId}:10` }
                                ]]
                            }
                        }
                    );
                } catch (err) {
                    console.error("Stock Alert Error:", err);
                }
            }
        }
    )
    .subscribe((status: string) => {
        console.log(`🔌 Supabase Realtime Stock: ${status}`);
    });

// ─── Polling Fallback (every 30s) ────────────────────────────────────────────
// Catches orders that Realtime misses (e.g. if table isn't in the publication)

const notifiedOrders = new Set<string>();

// Wrap top-level await in IIFE for CJS compatibility (tsx default)
(async () => {
    // Pre-populate with existing orders so we don't spam on startup
    const { data: existingOrders } = await supabase
        .from('orders')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(50);

    existingOrders?.forEach((o: any) => notifiedOrders.add(o.id));
    console.log(`📋 Pre-loaded ${notifiedOrders.size} existing orders (won't re-notify).`);

    // Poll every 30 seconds
    setInterval(pollNewOrders, 30000);
    console.log("⏱️  Polling fallback active (every 30s).");
})();

async function pollNewOrders() {
    try {
        // Get orders from the last 2 minutes that we haven't notified about
        const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        const { data: newOrders } = await supabase
            .from('orders')
            .select('id, seller_id, product_id, payment_method, amount, buyer_name, buyer_phone, buyer_address, items, quantity')
            .gte('created_at', since);

        if (!newOrders) return;

        for (const order of newOrders) {
            if (notifiedOrders.has(order.id)) continue;
            notifiedOrders.add(order.id);

            console.log(`🔔 [Poll] New order detected: ${order.id}`);

            // Reuse same notification logic
            try {
                const { data: seller } = await supabase
                    .from('sellers')
                    .select('user_id, business_name')
                    .eq('id', order.seller_id)
                    .single();

                if (!seller) continue;

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('telegram_chat_id')
                    .eq('id', seller.user_id)
                    .single();

                if (!profile?.telegram_chat_id) {
                    console.log(`No Telegram linked for seller ${seller.user_id}`);
                    continue;
                }

                const chatId = profile.telegram_chat_id;

                const { data: product } = await supabase
                    .from('products')
                    .select('name')
                    .eq('id', order.product_id)
                    .single();

                const productName = product?.name || 'Unknown Product';
                const amount = (order.amount / 100).toLocaleString('en-IN');
                const buyerName = order.buyer_name || 'Unknown';
                const buyerPhone = order.buyer_phone || 'N/A';
                const address = order.buyer_address
                    ? `${order.buyer_address.line1}, ${order.buyer_address.city}, ${order.buyer_address.state} - ${order.buyer_address.pincode}`
                    : 'N/A';

                // Format Items List
                let itemsList = "";
                if (order.items && Array.isArray(order.items) && order.items.length > 0) {
                    itemsList = order.items.map((item: any) => {
                        let variantDetails = "";
                        if (item.variant) {
                            variantDetails = Object.entries(item.variant)
                                .map(([key, value]) => `${key}: ${value}`)
                                .join(", ");
                        }
                        return `• ${item.quantity}x ${productName} ${variantDetails ? `(${variantDetails})` : ""}`;
                    }).join("\n");
                } else {
                    // Fallback for old orders
                    itemsList = `• ${order.quantity || 1}x ${productName}`;
                }

                if (order.payment_method === 'cod') {
                    await bot.sendMessage(chatId,
                        `🚚 *New COD Order!*\n\n` +
                        `🛍 *Items:*\n${itemsList}\n\n` +
                        `💰 *Amount:* ₹${amount}\n` +
                        `👤 *Buyer:* ${buyerName}\n` +
                        `📞 *Phone:* ${buyerPhone}\n` +
                        `📍 *Address:* ${address}\n\n` +
                        `⚠️ Approve to confirm shipment, or reject to cancel.`,
                        {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [[
                                    { text: "✅ Approve COD", callback_data: `approve_cod:${order.id}` },
                                    { text: "❌ Reject", callback_data: `reject_cod:${order.id}` }
                                ]]
                            }
                        }
                    );
                } else if (order.payment_method === 'manual_upi') {
                    await bot.sendMessage(chatId,
                        `💸 *New UPI Order!*\n\n` +
                        `🛒 *Items:*\n${itemsList}\n\n` +
                        `💰 *Amount:* ₹${amount}\n` +
                        `👤 *Buyer:* ${buyerName}\n` +
                        `📞 *Phone:* ${buyerPhone}\n` +
                        `📍 *Address:* ${address}\n\n` +
                        `📩 Buyer is completing payment. You'll get a notification once they submit the UPI Transaction ID.`,
                        { parse_mode: 'Markdown' }
                    );
                } else {
                    await bot.sendMessage(chatId,
                        `📦 *New Order!*\n\n` +
                        `🛍 *Items:*\n${itemsList}\n\n` +
                        `💰 *Amount:* ₹${amount}\n` +
                        `👤 *Buyer:* ${buyerName}\n` +
                        `📞 *Phone:* ${buyerPhone}\n` +
                        `💳 *Method:* ${order.payment_method}`,
                        { parse_mode: 'Markdown' }
                    );
                }

                console.log(`✅ [Poll] Notified seller for order ${order.id}`);
            } catch (err) {
                console.error(`[Poll] Error notifying for order ${order.id}:`, err);
            }
        }
    } catch (err) {
        console.error('[Poll] Error:', err);
    }
}

// ─── Pending Orders: /pending ────────────────────────────────────────────────

bot.onText(/^\/pending$/, async (msg: any) => {
    const chatId = msg.chat.id;

    // Check auth
    const { data: profile } = await supabase.from('profiles').select('id').eq('telegram_chat_id', chatId).single();
    if (!profile) {
        bot.sendMessage(chatId, "⛔ You must link your account first using /start <uuid> from your dashboard.");
        return;
    }

    const { data: seller } = await supabase.from('sellers').select('id, business_name').eq('user_id', profile.id).single();
    if (!seller) {
        bot.sendMessage(chatId, "⛔ Seller profile not found.");
        return;
    }

    // Fetch pending orders
    const { data: pendingOrders, error: fetchErr } = await supabase
        .from('orders')
        .select(`
            id, amount, buyer_name, payment_method, payment_status, cod_status, created_at,
            product:products(name)
        `)
        .eq('seller_id', seller.id)
        .or('payment_status.eq.pending,payment_status.eq.needs_review,cod_status.eq.pending_approval,payment_status.eq.awaiting_approval')
        .order('created_at', { ascending: false })
        .limit(10); // Limit to 10 for neatness

    if (fetchErr || !pendingOrders || pendingOrders.length === 0) {
        bot.sendMessage(chatId, "🎉 *No pending orders right now!*", { parse_mode: 'Markdown' });
        return;
    }

    let messageText = `📦 *Your Pending Orders (${pendingOrders.length})*\n\n`;

    // Map them into a summary string
    pendingOrders.forEach((o: any, index: number) => {
        const productName = Array.isArray(o.product) ? o.product[0]?.name : o.product?.name;
        const method = o.payment_method === 'cod' ? '🚚 COD' : '💳 UPI';
        const formattedAmount = (o.amount / 100).toLocaleString('en-IN');
        messageText += `${index + 1}. **#${o.id.substring(0, 8)} - ${o.buyer_name}** (${productName})\n`;
        messageText += `💰 ₹${formattedAmount} | ${method}\n\n`;
    });

    messageText += `*Tap an order button below for details or to approve.*`;

    // Create inline buttons (chunked into rows of 2 or 3 for layout)
    const inlineKeyboard = [];
    let currentRow = [];
    for (let i = 0; i < pendingOrders.length; i++) {
        currentRow.push({
            text: `[ #${pendingOrders[i].id.substring(0, 6)} ]`,
            callback_data: `view_order:${pendingOrders[i].id}`
        });
        if (currentRow.length === 2 || i === pendingOrders.length - 1) { // 2 buttons per row max
            inlineKeyboard.push(currentRow);
            currentRow = [];
        }
    }

    bot.sendMessage(chatId, messageText, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: inlineKeyboard
        }
    });
});

// ─── Conversational UI: Add Product ──────────────────────────────────────────

type ProductUploadState = {
    step: 'IDLE' | 'AWAITING_NAME' | 'AWAITING_PRICE' | 'AWAITING_STOCK' | 'AWAITING_IMAGE';
    sellerId?: string;
    name?: string;
    price?: number; // paise
    stock_count?: number;
    imageFilesBase64?: { base64: string; mimeType: string; name: string }[];
};

const uploadStates = new Map<number, ProductUploadState>();

// ─── /myproducts ─────────────────────────────────────────────────────────────

bot.onText(/^\/myproducts$/, async (msg: any) => {
    const chatId = msg.chat.id;
    const authorized = await isAuthorizedSeller(chatId);
    if (!authorized) { bot.sendMessage(chatId, '⛔ Link your account first.'); return; }

    const { data: prof } = await supabase.from('profiles').select('id').eq('telegram_chat_id', chatId).single();
    if (!prof) return;
    const { data: seller } = await supabase.from('sellers').select('id, business_name').eq('user_id', prof.id).single();
    if (!seller) return;

    const { data: products } = await supabase
        .from('products')
        .select('id, name, price, stock, is_active')
        .eq('seller_id', seller.id)
        .order('created_at', { ascending: false });

    if (!products || products.length === 0) {
        bot.sendMessage(chatId, '📦 No products yet. Tap "🆕 Add Product" to create one!', MAIN_KEYBOARD);
        return;
    }

    let msg_text = `📋 *${seller.business_name} — Products (${products.length})*\n\n`;
    const buttons: any[][] = [];

    products.forEach((p: any, i: number) => {
        const status = p.is_active ? '🟢' : '🔴';
        const price = (p.price / 100).toLocaleString('en-IN');
        msg_text += `${i + 1}. ${status} *${p.name}*\n   💲₹${price} · 📦 Stock: ${p.stock}\n\n`;
        buttons.push([{ text: `📝 ${p.name}`, callback_data: `prod_detail:${p.id}` }]);
    });

    msg_text += `_Tap a product to manage it._`;

    bot.sendMessage(chatId, msg_text, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons }
    });
});

// ─── /shiporder ──────────────────────────────────────────────────────────────

bot.onText(/^\/shiporder$/, async (msg: any) => {
    const chatId = msg.chat.id;
    const authorized = await isAuthorizedSeller(chatId);
    if (!authorized) { bot.sendMessage(chatId, '⛔ Link your account first.'); return; }

    const { data: prof } = await supabase.from('profiles').select('id').eq('telegram_chat_id', chatId).single();
    if (!prof) return;
    const { data: seller } = await supabase.from('sellers').select('id').eq('user_id', prof.id).single();
    if (!seller) return;

    // Orders that are paid/approved but not yet shipped (no AWB)
    const { data: orders } = await supabase
        .from('orders')
        .select('id, buyer_name, amount, product_id, created_at')
        .eq('seller_id', seller.id)
        .in('order_status', ['confirmed', 'processing', 'pending'])
        .is('awb_number', null)
        .in('payment_status', ['verified', 'paid', 'pending'])
        .order('created_at', { ascending: true })
        .limit(10);

    if (!orders || orders.length === 0) {
        bot.sendMessage(chatId, '✅ No orders waiting to be shipped! All caught up.', MAIN_KEYBOARD);
        return;
    }

    let msg_text = `🚚 *Orders Ready to Ship (${orders.length})*\n\n`;
    const buttons: any[][] = [];

    for (const o of orders) {
        const { data: prod } = await supabase.from('products').select('name').eq('id', o.product_id).single();
        const pName = prod?.name || 'Product';
        const amount = (o.amount / 100).toFixed(2);
        msg_text += `📦 *${pName}* → ${o.buyer_name}\n   ₹${amount}\n\n`;
        buttons.push([
            { text: `✏️ Enter AWB for ${o.buyer_name}`, callback_data: `ship_manual:${o.id}` }
        ]);
    }

    msg_text += `_Tap to enter tracking number, or 📸 send a receipt photo to auto-ship._`;

    bot.sendMessage(chatId, msg_text, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons }
    });
});

// ─── /editproduct ────────────────────────────────────────────────────────────

bot.onText(/^\/editproduct$/, async (msg: any) => {
    const chatId = msg.chat.id;
    const authorized = await isAuthorizedSeller(chatId);
    if (!authorized) { bot.sendMessage(chatId, '⛔ Link your account first.'); return; }

    const { data: prof } = await supabase.from('profiles').select('id').eq('telegram_chat_id', chatId).single();
    if (!prof) return;
    const { data: seller } = await supabase.from('sellers').select('id').eq('user_id', prof.id).single();
    if (!seller) return;

    const { data: products } = await supabase
        .from('products')
        .select('id, name, price, stock')
        .eq('seller_id', seller.id)
        .order('created_at', { ascending: false });

    if (!products || products.length === 0) {
        bot.sendMessage(chatId, '📦 No products to edit. Create one first!', MAIN_KEYBOARD);
        return;
    }

    const buttons = products.map((p: any) => ([
        { text: `💲 ${p.name} — ₹${(p.price / 100).toFixed(0)}`, callback_data: `edit_price:${p.id}` },
        { text: `📦 Stock: ${p.stock}`, callback_data: `edit_stock:${p.id}` }
    ]));

    bot.sendMessage(chatId, `📝 *Edit Product*\n\nTap 💲 to change price or 📦 to change stock:`, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons }
    });
});

// ─── /updateupi ──────────────────────────────────────────────────────────────

bot.onText(/^\/updateupi$/, async (msg: any) => {
    const chatId = msg.chat.id;
    const authorized = await isAuthorizedSeller(chatId);
    if (!authorized) { bot.sendMessage(chatId, '⛔ Link your account first.'); return; }

    const { data: prof } = await supabase.from('profiles').select('id').eq('telegram_chat_id', chatId).single();
    if (!prof) return;
    const { data: seller } = await supabase.from('sellers').select('id, upi_id').eq('user_id', prof.id).single();
    if (!seller) return;

    const currentUpi = seller.upi_id || 'Not set';
    uploadStates.set(chatId, { step: 'AWAITING_UPI', sellerId: seller.id } as any);

    bot.sendMessage(chatId,
        `💳 *Update UPI ID*\n\n` +
        `Current: \`${currentUpi}\`\n\n` +
        `Type your new UPI ID (e.g. \`yourname@upi\`):`,
        { parse_mode: 'Markdown' }
    );
});

// ─── /search [query] ─────────────────────────────────────────────────────────

bot.onText(/^\/search (.+)/, async (msg: any, match: any) => {
    const chatId = msg.chat.id;
    const query = match[1]?.trim();

    if (!query || query.length < 2) {
        bot.sendMessage(chatId, '⚠️ Usage: `/search Rahul` or `/search 9876543210`', { parse_mode: 'Markdown' });
        return;
    }

    const authorized = await isAuthorizedSeller(chatId);
    if (!authorized) { bot.sendMessage(chatId, '⛔ Link your account first.'); return; }

    const { data: prof } = await supabase.from('profiles').select('id').eq('telegram_chat_id', chatId).single();
    if (!prof) return;
    const { data: seller } = await supabase.from('sellers').select('id').eq('user_id', prof.id).single();
    if (!seller) return;

    bot.sendMessage(chatId, `🔍 Searching for "${query}"...`);

    const { data: results, error } = await supabase.rpc('search_orders', {
        p_seller_id: seller.id,
        p_query: query,
        p_limit: 10,
    });

    if (error || !results || results.length === 0) {
        bot.sendMessage(chatId, `❌ No orders found for "${query}".`, MAIN_KEYBOARD);
        return;
    }

    // Build order cards
    let msg_text = `🔎 *${results.length} result${results.length > 1 ? 's' : ''} for "${query}":*\n\n`;
    const allButtons: any[][] = [];

    for (const order of results) {
        const amount = (order.amount / 100).toFixed(2);
        const status = order.order_status || 'pending';
        const statusEmoji = status === 'shipped' ? '🚚' : status === 'delivered' ? '✅' : '⏳';
        const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

        msg_text += `${statusEmoji} *${order.buyer_name}* · ₹${amount}\n`;
        msg_text += `   📦 ${order.product_name || 'Product'} · ${date}\n`;
        if (order.awb_code) msg_text += `   🔗 AWB: \`${order.awb_code}\`\n`;
        msg_text += `\n`;

        const buttons: any[] = [
            { text: `👁 ${order.buyer_name}`, callback_data: `view_order:${order.id}` }
        ];
        if (!order.awb_code && ['confirmed', 'processing', 'pending'].includes(status)) {
            buttons.push({ text: '🚚 Ship', callback_data: `ship_manual:${order.id}` });
        }
        buttons.push({ text: '📄 Label', callback_data: `gen_label:${order.id}` });
        allButtons.push(buttons);
    }

    // Add dashboard link if multiple results
    if (results.length > 1) {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        allButtons.push([{ text: '📱 View All in Dashboard', url: `${baseUrl}/dashboard/orders` }]);
    }

    bot.sendMessage(chatId, msg_text, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: allButtons }
    });
});

bot.onText(/^\/search$/, (msg: any) => {
    bot.sendMessage(msg.chat.id, '⚠️ Usage: `/search Rahul` or `/search 9876543210`', { parse_mode: 'Markdown' });
});

bot.onText(/^\/cancel$/, (msg: any) => {
    const chatId = msg.chat.id;
    if (uploadStates.has(chatId)) {
        uploadStates.delete(chatId);
        bot.sendMessage(chatId, "❌ Cancelled.", MAIN_KEYBOARD);
    }
});

bot.onText(/^\/addproduct$/, async (msg: any) => {
    const chatId = msg.chat.id;

    // Check auth - Only check for profile existence linked to telegram
    const { data: profile } = await supabase.from('profiles').select('id').eq('telegram_chat_id', chatId).single();
    if (!profile) {
        bot.sendMessage(chatId, "⛔ You must link your account first using /start <uuid> from your dashboard.");
        return;
    }

    const { data: seller } = await supabase.from('sellers').select('id, tier').eq('user_id', profile.id).single();
    if (!seller) {
        bot.sendMessage(chatId, "⛔ Seller profile not found.");
        return;
    }

    uploadStates.set(chatId, { step: 'AWAITING_NAME', sellerId: seller.id, imageFilesBase64: [] });
    bot.sendMessage(chatId, "🛍 *Let's add a new product!*\n\nWhat is the *Name* of the product?\n*(Send /cancel at any time to abort)*", { parse_mode: 'Markdown' });
});

bot.onText(/^\/done$/, async (msg: any) => {
    const chatId = msg.chat.id;
    const state = uploadStates.get(chatId);

    if (!state || state.step !== 'AWAITING_IMAGE') return;

    if (state.imageFilesBase64!.length === 0) {
        bot.sendMessage(chatId, "⚠️ Please upload at least one image before finishing, or /cancel.");
        return;
    }

    bot.sendMessage(chatId, "⏳ *Creating your product...*", { parse_mode: 'Markdown' });

    try {
        const imageUrls: string[] = [];
        for (const img of state.imageFilesBase64!) {
            const buffer = Buffer.from(img.base64, 'base64');
            const fileName = `products/${state.sellerId}/${Date.now()}_${img.name}`;
            const { error: uploadError } = await supabase.storage.from("products").upload(fileName, buffer, { contentType: img.mimeType });

            if (!uploadError) {
                const { data } = supabase.storage.from("products").getPublicUrl(fileName);
                imageUrls.push(data.publicUrl);
            }
        }

        const { data: product, error: productError } = await supabase.from('products').insert({
            seller_id: state.sellerId,
            name: state.name,
            price: state.price,
            stock: state.stock_count,
            images: imageUrls,
            is_active: true
        }).select('id').single();

        if (productError || !product) throw new Error(productError?.message || "Failed to create product");

        await supabase.from('product_variants').insert({
            product_id: product.id,
            stock_count: state.stock_count
        });

        // Generate Shortcode URL
        const { customAlphabet } = await import('nanoid');
        const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);
        const shortCode = nanoid();

        await supabase.from("product_links").insert({
            seller_id: state.sellerId,
            product_id: product.id,
            short_code: shortCode,
        });

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const url = `${baseUrl}/l/${shortCode}`;

        bot.sendMessage(chatId, `✅ *Product Added Successfully!*\n\n*${state.name}*\nPrice: ₹${(state.price! / 100).toLocaleString('en-IN')}\nStock: ${state.stock_count}\n\n🔗 *Share Link:* ${url}\n\nIt is now live on your store.`, { parse_mode: 'Markdown' });

    } catch (err: any) {
        console.error("Add Product Error:", err);
        bot.sendMessage(chatId, "❌ Failed to create product. Please try again.");
    } finally {
        uploadStates.delete(chatId);
    }
});

// Generic text/photo handler for state machine
bot.on('message', async (msg: any) => {
    const chatId = msg.chat.id;
    const state = uploadStates.get(chatId);
    // Ignore commands here, they are handled separately
    if (msg.text && msg.text.startsWith('/')) return;

    // --- Reply Keyboard Button Routing ---
    if (!state && msg.text) {
        const text = msg.text.trim();
        if (text === '🆕 Add Product') {
            // Simulate /addproduct command
            bot.processUpdate({ message: { ...msg, text: '/addproduct' }, update_id: Date.now() });
            return;
        }
        if (text === '📋 Active Orders') {
            bot.processUpdate({ message: { ...msg, text: '/pending' }, update_id: Date.now() });
            return;
        }
        if (text === '📈 My Sales') {
            // Quick sales summary
            const authorized = await isAuthorizedSeller(chatId);
            if (!authorized) { bot.sendMessage(chatId, '⛔ Link your account first.'); return; }
            const { data: prof } = await supabase.from('profiles').select('id').eq('telegram_chat_id', chatId).single();
            if (!prof) return;
            const { data: sel } = await supabase.from('sellers').select('id, business_name').eq('user_id', prof.id).single();
            if (!sel) return;
            const { data: stats } = await supabase.from('orders').select('amount, order_status').eq('seller_id', sel.id);
            const total = stats?.reduce((s: number, o: any) => s + (o.amount || 0), 0) || 0;
            const shipped = stats?.filter((o: any) => o.order_status === 'shipped' || o.order_status === 'delivered').length || 0;
            const pending = stats?.filter((o: any) => ['pending', 'confirmed', 'processing'].includes(o.order_status)).length || 0;
            bot.sendMessage(chatId, `📈 *${sel.business_name} — Sales Summary*\n\n💰 Total Revenue: ₹${(total / 100).toLocaleString('en-IN')}\n📦 Shipped/Delivered: ${shipped}\n⏳ Pending: ${pending}\n📊 Total Orders: ${stats?.length || 0}`, { parse_mode: 'Markdown', ...MAIN_KEYBOARD });
            return;
        }
        if (text === '⚙️ Store Settings') {
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            bot.sendMessage(chatId, `⚙️ *Store Settings*\n\nManage your store from the dashboard:\n🔗 ${baseUrl}/dashboard/settings`, { parse_mode: 'Markdown', ...MAIN_KEYBOARD });
            return;
        }
    }

    // --- Smart OCR Receipt Scanner (Fuzzy Match + Confirm) ---
    if (!state && msg.photo) {
        bot.sendMessage(chatId, '🔍 Scanning receipt image using AI...');

        const authorized = await isAuthorizedSeller(chatId);
        if (!authorized) return;

        try {
            const largestPhoto = msg.photo[msg.photo.length - 1];
            const fileLink = await bot.getFileLink(largestPhoto.file_id);
            const tgResponse = await fetch(fileLink);
            const arrayBuffer = await tgResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const result = await extractReceiptData(buffer, 'image/jpeg');

            if (result.metadata.extraction_status === 'SUCCESS') {
                const { awb_number, courier_name, buyer_name, product_name } = result.order_details;

                const { data: profile } = await supabase.from('profiles').select('id').eq('telegram_chat_id', chatId).single();
                if (!profile) { bot.sendMessage(chatId, '⛔ Link your account first.'); return; }
                const { data: seller } = await supabase.from('sellers').select('id').eq('user_id', profile.id).single();
                if (!seller) return;

                // Fuzzy match buyer_name + product_name against pending orders
                const matches = await findMatchingOrders(seller.id, buyer_name, product_name);
                const bestMatch = getBestMatch(matches, 0.35);

                if (bestMatch) {
                    // Single-Tap Confirmation: Don't auto-ship, ask seller to confirm
                    const confidence = Math.round(bestMatch.combined_score * 100);
                    bot.sendMessage(chatId,
                        `📋 *Receipt Scanned!*\n\n` +
                        `📦 AWB: \`${awb_number}\`\n` +
                        `🚚 Courier: ${courier_name}\n` +
                        `👤 Buyer: ${bestMatch.buyer_name}\n` +
                        `🧵 Product: ${bestMatch.product_name || 'N/A'}\n` +
                        `🎯 Match Confidence: ${confidence}%\n\n` +
                        `*Confirm to ship this order?*`,
                        {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [[
                                    { text: '✅ Yes, Ship it!', callback_data: `confirm_ship:${bestMatch.order_id}:${awb_number}:${courier_name}` },
                                    { text: '❌ Wrong Order', callback_data: `reject_ship:${bestMatch.order_id}` }
                                ]]
                            }
                        }
                    );
                } else {
                    // No confident match — show what was extracted
                    bot.sendMessage(chatId,
                        `⚠️ *Could not match this receipt to an order.*\n\n` +
                        `Extracted:\n` +
                        `📦 AWB: \`${awb_number}\`\n` +
                        `👤 Name: ${buyer_name}\n` +
                        `🧵 Product: ${product_name || 'N/A'}\n` +
                        `🚚 Courier: ${courier_name}\n\n` +
                        `Please update tracking manually from the dashboard.`,
                        { parse_mode: 'Markdown', ...MAIN_KEYBOARD }
                    );
                }
            } else {
                bot.sendMessage(chatId, '❌ Couldn\'t read the receipt clearly. Please try a clearer photo or update manually.', MAIN_KEYBOARD);
            }
        } catch (e) {
            console.error('Telegram OCR Err:', e);
            bot.sendMessage(chatId, '⚠️ Error processing image. Please try again.', MAIN_KEYBOARD);
        }
        return;
    }

    if (!state) return;

    // ─── Inline Edit States (from /editproduct, /updateupi, /shiporder) ───────
    if ((state as any).step === 'AWAITING_UPI' && msg.text) {
        const upiId = msg.text.trim();
        if (!upiId.includes('@')) {
            bot.sendMessage(chatId, '⚠️ Invalid UPI ID. Must contain @ (e.g. `name@upi`). Try again:', { parse_mode: 'Markdown' });
            return;
        }
        await supabase.from('sellers').update({ upi_id: upiId }).eq('id', (state as any).sellerId);
        uploadStates.delete(chatId);
        bot.sendMessage(chatId, `✅ UPI ID updated to \`${upiId}\``, { parse_mode: 'Markdown', ...MAIN_KEYBOARD });
        return;
    }

    if ((state as any).step === 'AWAITING_EDIT_PRICE' && msg.text) {
        const priceRupees = parseFloat(msg.text.trim().replace(/[^0-9.]/g, ''));
        if (isNaN(priceRupees) || priceRupees <= 0) {
            bot.sendMessage(chatId, '⚠️ Invalid price. Enter a number (e.g. `299`):');
            return;
        }
        const pricePaise = Math.round(priceRupees * 100);
        await supabase.from('products').update({ price: pricePaise }).eq('id', (state as any).productId);
        uploadStates.delete(chatId);
        bot.sendMessage(chatId, `✅ Price updated to ₹${priceRupees.toFixed(2)}`, MAIN_KEYBOARD);
        return;
    }

    if ((state as any).step === 'AWAITING_EDIT_STOCK' && msg.text) {
        const stock = parseInt(msg.text.trim().replace(/[^0-9]/g, ''), 10);
        if (isNaN(stock) || stock < 0) {
            bot.sendMessage(chatId, '⚠️ Invalid stock. Enter a number (e.g. `50`):');
            return;
        }
        await supabase.from('products').update({ stock }).eq('id', (state as any).productId);
        uploadStates.delete(chatId);
        bot.sendMessage(chatId, `✅ Stock updated to ${stock}`, MAIN_KEYBOARD);
        return;
    }

    if ((state as any).step === 'AWAITING_AWB' && msg.text) {
        const awb = msg.text.trim();
        if (awb.length < 5) {
            bot.sendMessage(chatId, '⚠️ AWB seems too short. Please enter a valid tracking number:');
            return;
        }

        // Ask for courier name
        uploadStates.set(chatId, { step: 'AWAITING_COURIER', orderId: (state as any).orderId, awb } as any);
        bot.sendMessage(chatId, '🚚 Which courier? (e.g. Delhivery, BlueDart, DTDC, India Post):');
        return;
    }

    if ((state as any).step === 'AWAITING_COURIER' && msg.text) {
        const courier = msg.text.trim();
        const orderId = (state as any).orderId;
        const awb = (state as any).awb;

        await supabase.from('orders').update({
            awb_number: awb,
            courier_name: courier,
            order_status: 'shipped',
            updated_at: new Date().toISOString()
        }).eq('id', orderId);

        uploadStates.delete(chatId);
        bot.sendMessage(chatId, `✅ *Shipped!*\n\nAWB: \`${awb}\`\nCourier: ${courier}\n\nOrder marked as shipped.`, { parse_mode: 'Markdown', ...MAIN_KEYBOARD });
        return;
    }

    // ─── Product Creation States (from /addproduct) ──────────────────────────

    if (state.step === 'AWAITING_NAME' && msg.text) {
        state.name = msg.text.trim();
        state.step = 'AWAITING_PRICE';
        bot.sendMessage(chatId, `Great! Now, what is the *Price* in Rupees? (e.g., 999)`, { parse_mode: 'Markdown' });
        return;
    }

    if (state.step === 'AWAITING_PRICE' && msg.text) {
        const priceRupees = parseFloat(msg.text.trim().replace(/[^0-9.]/g, ''));
        if (isNaN(priceRupees) || priceRupees <= 0) {
            bot.sendMessage(chatId, "⚠️ Invalid price. Please enter a valid number (e.g., 999).");
            return;
        }
        state.price = Math.round(priceRupees * 100); // converting to paise
        state.step = 'AWAITING_STOCK';
        bot.sendMessage(chatId, `Got it. How many items are in *Stock*?`, { parse_mode: 'Markdown' });
        return;
    }

    if (state.step === 'AWAITING_STOCK' && msg.text) {
        const stock = parseInt(msg.text.trim().replace(/[^0-9]/g, ''), 10);
        if (isNaN(stock) || stock < 0) {
            bot.sendMessage(chatId, "⚠️ Invalid stock count. Please enter a valid number.");
            return;
        }
        state.stock_count = stock;
        state.step = 'AWAITING_IMAGE';
        bot.sendMessage(chatId, `Awesome. Finally, please upload one or more *Photos* of the product.\n\nWhen you are done uploading, tap or type /done.`, { parse_mode: 'Markdown' });
        return;
    }

    if (state.step === 'AWAITING_IMAGE' && msg.photo) {
        // Telegram arrays photos by size, we take the largest one
        const largestPhoto = msg.photo[msg.photo.length - 1];
        const fileId = largestPhoto.file_id;

        try {
            const fileLink = await bot.getFileLink(fileId);
            const tgResponse = await fetch(fileLink);
            const arrayBuffer = await tgResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString('base64');

            state.imageFilesBase64!.push({
                base64,
                mimeType: 'image/jpeg',
                name: `tg_${Date.now()}.jpg`
            });

            bot.sendMessage(chatId, `📷 Image received (${state.imageFilesBase64!.length} total). Send more or type /done to finish.`);
        } catch (err) {
            console.error("Telegram Image Download Error:", err);
            bot.sendMessage(chatId, "⚠️ Failed to receive image. Try sending it again.");
        }
        return;
    }
});

// ─── Zavvy Intelligence: Morning Brief (9:00 AM IST Daily) ───────────────────

cron.schedule('30 3 * * *', async () => {
    // 3:30 UTC = 9:00 AM IST
    console.log('☀️ Running Morning Brief...');

    try {
        // Get all linked sellers
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, telegram_chat_id')
            .not('telegram_chat_id', 'is', null);

        if (!profiles) return;

        for (const profile of profiles) {
            try {
                const { data: seller } = await supabase
                    .from('sellers')
                    .select('id, business_name')
                    .eq('user_id', profile.id)
                    .single();

                if (!seller) continue;
                const chatId = profile.telegram_chat_id;

                // Query: Orders needing shipping labels
                const { data: needsShipping } = await supabase
                    .from('orders')
                    .select('id')
                    .eq('seller_id', seller.id)
                    .in('order_status', ['confirmed', 'processing'])
                    .is('awb_number', null);

                // Query: UPI payments awaiting approval
                const { data: needsApproval } = await supabase
                    .from('orders')
                    .select('id, amount')
                    .eq('seller_id', seller.id)
                    .in('payment_status', ['awaiting_approval', 'needs_review']);

                const approvalAmount = needsApproval?.reduce((s: number, o: any) => s + (o.amount || 0), 0) || 0;

                // Query: Out-of-stock variants
                const { data: outOfStock } = await supabase
                    .from('product_variants')
                    .select('id, size, color, product_id, products(name)')
                    .eq('stock_count', 0)
                    .in('product_id', await getSellerProductIds(seller.id));

                // Build morning brief
                const shippingCount = needsShipping?.length || 0;
                const approvalCount = needsApproval?.length || 0;
                const oosCount = outOfStock?.length || 0;

                // Only send if there's something actionable
                if (shippingCount === 0 && approvalCount === 0 && oosCount === 0) continue;

                let brief = `☀️ *Good Morning, ${seller.business_name}!*\n\nHere is your plan for today:\n\n`;

                if (shippingCount > 0) {
                    brief += `📦 *${shippingCount} order${shippingCount > 1 ? 's' : ''}* need shipping labels.\n`;
                }
                if (approvalCount > 0) {
                    brief += `💰 *₹${(approvalAmount / 100).toLocaleString('en-IN')}* in UPI payments need your approval.\n`;
                }
                if (oosCount > 0) {
                    const oosItems = outOfStock!.map((v: any) => {
                        const pName = Array.isArray(v.products) ? v.products[0]?.name : v.products?.name;
                        const variant = [v.size, v.color].filter(Boolean).join('/');
                        return variant ? `${pName} (${variant})` : pName;
                    }).slice(0, 3);
                    brief += `⚠️ *Out of stock:* ${oosItems.join(', ')}${oosCount > 3 ? ` +${oosCount - 3} more` : ''}\n`;
                }

                brief += `\n📸 _Send a receipt photo to ship instantly!_`;

                await bot.sendMessage(chatId, brief, {
                    parse_mode: 'Markdown',
                    ...MAIN_KEYBOARD,
                });

                console.log(`☀️ Morning Brief sent to ${seller.business_name}`);
            } catch (sellerErr) {
                console.error('Morning Brief seller error:', sellerErr);
            }
        }
    } catch (err) {
        console.error('Morning Brief error:', err);
    }
});

async function getSellerProductIds(sellerId: string): Promise<string[]> {
    const { data } = await supabase.from('products').select('id').eq('seller_id', sellerId);
    return data?.map((p: any) => p.id) || [];
}

console.log('⏰ Morning Brief scheduled for 9:00 AM IST daily.');

// Minimal HTTP server for Render Free Web Service health checks
import http from 'http';
const PORT = process.env.PORT || 3000;
http.createServer((_, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Zavvy Telegram Bot is running');
}).listen(PORT, () => {
    console.log(`🌐 Health server listening on port ${PORT}`);
});

