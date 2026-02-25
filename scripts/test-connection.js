
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('Missing env vars');
    process.exit(1);
}

console.log(`Connecting to ${url}...`);

const supabase = createClient(url, key, {
    auth: {
        persistSession: false,
    },
});


async function testConnection() {
    try {
        const start = Date.now();
        // We expect this to return null user but NOT timeout
        console.log('Testing auth.getUser()...');
        const { data, error } = await supabase.auth.getUser();
        const end = Date.now();

        if (error) {
            console.log('Auth Error (Expected if no session, but check for timeout):', error.message);
            if (error.message.includes('fetch failed')) {
                console.error('CRITICAL: Fetch failed in Auth!');
            }
        } else {
            console.log(`Success! Auth check took ${end - start}ms`);
        }
    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

testConnection();
