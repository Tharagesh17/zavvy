import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase
        .from('product_links')
        .select('*')
        .eq('is_active', true)
        .limit(1);

    if (error) {
        console.error("Error fetching link:", error);
        process.exit(1);
    }

    if (data && data.length > 0) {
        console.log("PUBLIC_LINK:", `http://localhost:3000/buy/${data[0].short_code}`);
    } else {
        console.log("No active product links found.");
    }
}
run();
