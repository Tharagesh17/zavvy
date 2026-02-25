import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 1. Recent orders
const { data: orders } = await supabase
    .from('orders')
    .select('id, seller_id, payment_method, cod_status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

console.log('\n📦 Recent Orders:');
console.log(JSON.stringify(orders, null, 2));

// 2. Profiles with Telegram linked
const { data: profiles } = await supabase
    .from('profiles')
    .select('id, telegram_chat_id')
    .not('telegram_chat_id', 'is', null);

console.log('\n📱 Profiles with Telegram linked:');
console.log(JSON.stringify(profiles, null, 2));

// 3. For each recent order, trace the full lookup chain
if (orders?.length > 0) {
    const order = orders[0];
    console.log(`\n🔍 Tracing notification chain for latest order: ${order.id}`);

    const { data: seller } = await supabase
        .from('sellers')
        .select('user_id, business_name')
        .eq('id', order.seller_id)
        .single();

    console.log('  Seller:', seller);

    if (seller) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('telegram_chat_id')
            .eq('id', seller.user_id)
            .single();

        console.log('  Profile telegram_chat_id:', profile?.telegram_chat_id ?? 'NULL ❌ (not linked!)');
    }
}
