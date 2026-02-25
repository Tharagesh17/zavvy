import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// Get the latest COD order and manually send the notification
const { data: orders } = await supabase
    .from('orders')
    .select('id, seller_id, product_id, payment_method, cod_status, amount, buyer_name, buyer_phone, buyer_address, created_at')
    .eq('payment_method', 'cod')
    .order('created_at', { ascending: false })
    .limit(3);

console.log('Recent COD orders:', JSON.stringify(orders, null, 2));

if (!orders || orders.length === 0) {
    console.log('❌ No COD orders found!');
    process.exit(0);
}

const order = orders[0];
console.log(`\n🔍 Processing order: ${order.id}`);

// Get seller
const { data: seller } = await supabase
    .from('sellers')
    .select('user_id, business_name')
    .eq('id', order.seller_id)
    .single();

console.log('Seller:', seller);

// Get profile
const { data: profile } = await supabase
    .from('profiles')
    .select('telegram_chat_id')
    .eq('id', seller.user_id)
    .single();

console.log('Profile telegram_chat_id:', profile?.telegram_chat_id);

if (!profile?.telegram_chat_id) {
    console.log('❌ No telegram_chat_id! Account not linked.');
    process.exit(1);
}

// Get product
const { data: product } = await supabase
    .from('products')
    .select('name')
    .eq('id', order.product_id)
    .single();

const chatId = profile.telegram_chat_id;
const productName = product?.name || 'Unknown Product';
const amount = (order.amount / 100).toLocaleString('en-IN');
const address = order.buyer_address
    ? `${order.buyer_address.line1}, ${order.buyer_address.city}, ${order.buyer_address.state} - ${order.buyer_address.pincode}`
    : 'N/A';

console.log(`\n📤 Sending test notification to chat ${chatId}...`);

try {
    await bot.sendMessage(chatId,
        `🚚 *New COD Order!* (Manual Test)\n\n` +
        `🛍 *Product:* ${productName}\n` +
        `💰 *Amount:* ₹${amount}\n` +
        `👤 *Buyer:* ${order.buyer_name}\n` +
        `📞 *Phone:* ${order.buyer_phone}\n` +
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
    console.log('✅ Notification sent successfully!');
} catch (err) {
    console.error('❌ Failed to send:', err.message);
}
