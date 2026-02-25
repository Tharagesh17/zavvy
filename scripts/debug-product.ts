import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    try {
        const shortCode = 'gg9hxx1u';
        console.log(`Searching for product with shortCode: ${shortCode}`);

        const { data: link, error: linkError } = await supabase
            .from("product_links")
            .select("product_id")
            .eq("short_code", shortCode)
            .single();

        if (linkError || !link) {
            console.error("Link Error:", linkError);
            return;
        }

        console.log(`Found Product ID: ${link.product_id}`);

        const { data: product, error: productError } = await supabase
            .from("products")
            .select("*")
            .eq("id", link.product_id)
            .single();

        if (productError) {
            console.error("Product Error:", productError);
            return;
        }

        const output = {
            product,
            variantsInfo: product.variants ? Object.entries(product.variants).map(([k, v]) => ({
                key: k,
                value: v,
                isArray: Array.isArray(v),
                type: Array.isArray(v) ? 'array' : typeof v
            })) : []
        };

        fs.writeFileSync('debug_output.json', JSON.stringify(output, null, 2));
        console.log("Debug output written to debug_output.json");

    } catch (err) {
        console.error("Script Error:", err);
        fs.writeFileSync('error.log', `Error: ${err}\n`);
    }
}

main().catch(err => {
    console.error("Top Level Error:", err);
    fs.writeFileSync('error.log', `Top Level Error: ${err}\n`);
});
