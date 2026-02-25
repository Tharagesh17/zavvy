import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * POST /api/orders/[id]/mark-paid
 * 
 * Seller manually confirms payment received for an order.
 * 
 * Security:
 * - Validates order ownership
 * - Only seller can mark their own orders as paid
 * - Updates payment status and timestamp
 * 
 * Response:
 * { "success": true } | { "error": "message" }
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const orderId = params.id;

        if (!orderId) {
            return NextResponse.json(
                { error: "Order ID required" },
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

        // Fetch order with seller details
        const admin = createServiceRoleClient();
        const { data: order, error: orderError } = await admin
            .from("orders")
            .select(
                `
        id,
        seller_id,
        payment_status,
        seller:sellers(id, user_id)
      `
            )
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // SECURITY: Verify ownership
        // @ts-expect-error - Supabase join types
        if (order.seller.user_id !== user.id) {
            return NextResponse.json(
                { error: "Unauthorized - not your order" },
                { status: 403 }
            );
        }

        // Check if already paid
        if (order.payment_status === "paid") {
            return NextResponse.json(
                { error: "Order already marked as paid" },
                { status: 400 }
            );
        }

        // Update order status
        const { error: updateError } = await admin
            .from("orders")
            .update({
                payment_status: "paid",
                seller_approved_at: new Date().toISOString(),
            })
            .eq("id", orderId);

        if (updateError) {
            console.error("Failed to mark order as paid:", updateError);
            return NextResponse.json(
                { error: "Failed to update order" },
                { status: 500 }
            );
        }

        // Revalidate orders page cache
        revalidatePath("/dashboard/orders");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Mark paid error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
