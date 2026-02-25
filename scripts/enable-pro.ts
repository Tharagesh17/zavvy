import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Manually parse .env.local
const envPath = path.resolve(".env.local");
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf8");
    envConfig.split("\n").forEach((line) => {
        const [key, value] = line.split("=");
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function enablePro() {
    const { data: sellers, error } = await supabase
        .from("sellers")
        .select("id, user_id, tier")
        .limit(1);

    if (error) {
        console.error("Error fetching sellers:", error);
        return;
    }

    if (!sellers || sellers.length === 0) {
        console.log("No sellers found to upgrade.");
        return;
    }

    const seller = sellers[0];
    console.log(`Upgrading seller ${seller.id} (user ${seller.user_id}) from '${seller.tier}' to 'pro'...`);

    const { error: updateError } = await supabase
        .from("sellers")
        .update({ tier: "pro" })
        .eq("id", seller.id);

    if (updateError) {
        console.error("Error updating seller:", updateError);
    } else {
        console.log("Seller upgraded to Pro successfully.");
    }
}

enablePro();
