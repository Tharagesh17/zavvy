import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { decrypt } from "@/lib/crypto";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * GET /api/upi/link?orderId=xxx
 * 
 * Generate UPI deep link for an order.
 * 
 * Security:
 * - Decrypts UPI only in memory (never logged or stored)
 * - Validates order ownership
 * - Returns link only (no sensitive data exposed)
 * - Multi-tenant isolation enforced
 * 
 * Query params:
 * - orderId: UUID of the order
 * 
 * Response:
 * { "link": "upi://pay?pa=..." } | { "error": "message" }
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const orderId = searchParams.get("orderId");

        if (!orderId) {
            return NextResponse.json(
                { error: "orderId parameter required" },
                { status: 400 }
            );
        }

        // Authenticate user
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch order with seller and product details
        const admin = createServiceRoleClient();
        const { data: order, error: orderError } = await admin
            .from("orders")
            .select(
                `
        id,
        amount,
        seller_id,
        seller:sellers(id, user_id, business_name, upi_token),
        product:products(name)
      `
            )
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // SECURITY: Verify ownership (multi-tenant isolation)
        const seller = order.seller as { user_id?: string; upi_token?: string; business_name?: string } | null;
        if (!seller || seller.user_id !== user.id) {
            return NextResponse.json(
                { error: "Unauthorized - not your order" },
                { status: 403 }
            );
        }

        // Check if UPI is configured
        if (!seller.upi_token) {
            return NextResponse.json(
                {
                    error:
                        "UPI not configured. Please add your UPI ID in Settings first.",
                },
                { status: 400 }
            );
        }

        // Fetch encrypted UPI token
        const { data: token, error: tokenError } = await admin
            .from("upi_tokens")
            .select("encrypted_value")
            .eq("id", seller.upi_token)
            .single();

        if (tokenError || !token) {
            return NextResponse.json(
                { error: "UPI configuration error" },
                { status: 500 }
            );
        }

        // SECURITY: Decrypt in memory only (never log this!)
        const upiId = decrypt(token.encrypted_value);

        // Generate UPI deep link
        const shopName = seller.business_name || "Shop";
        const amount = (order.amount / 100).toFixed(2); // Convert paise to rupees
        const transactionNote = `Order ${order.id.substring(0, 8)}`;

        // UPI URI format: upi://pay?pa=<UPI>&pn=<Name>&am=<Amount>&tn=<Note>&cu=<Currency>
        const link = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
            shopName
        )}&am=${amount}&tn=${encodeURIComponent(transactionNote)}&cu=INR`;

        // SECURITY: Return only the link, never the decrypted UPI
        return NextResponse.json({ link });
    } catch (error) {
        console.error("UPI link generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate UPI link" },
            { status: 500 }
        );
    }
}
