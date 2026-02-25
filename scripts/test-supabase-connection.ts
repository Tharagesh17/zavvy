
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('Missing env vars. Ensure .env.local exists and has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
}

console.log(`Testing connection to Supabase URL: ${url}`);

const supabase = createClient(url, key, {
    auth: {
        persistSession: false,
    },
});

async function testConnection() {
    try {
        console.log('Attempting to fetch data...');
        const start = Date.now();
        // detailed error info
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).timeout(5000);
        const end = Date.now();

        if (error) {
            console.error('Supabase Error:', error);
            if (error.message.includes('fetch failed')) {
                console.error('Fetch failed details:', error);
            }
        } else {
            console.log(`Success! Connection took ${end - start}ms`);
        }
    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

testConnection();
