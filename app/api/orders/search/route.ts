import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    try {
        const query = req.nextUrl.searchParams.get("q");

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ orders: [] });
        }

        // Auth: get the logged-in user
        const authClient = await createClient();
        const { data: { user }, error: authErr } = await authClient.auth.getUser();

        if (!user || authErr) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = createServiceRoleClient();

        // Get seller ID
        const { data: seller } = await db
            .from("sellers")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!seller) {
            return NextResponse.json({ error: "Seller not found" }, { status: 404 });
        }

        // Call the search RPC
        const { data, error } = await db.rpc("search_orders", {
            p_seller_id: seller.id,
            p_query: query.trim(),
            p_limit: 20,
        });

        if (error) {
            console.error("Search error:", error);
            return NextResponse.json({ error: "Search failed" }, { status: 500 });
        }

        return NextResponse.json({ orders: data || [] });
    } catch (err) {
        console.error("Search API error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
