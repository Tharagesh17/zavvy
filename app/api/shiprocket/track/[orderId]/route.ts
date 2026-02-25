import { NextRequest } from "next/server";
import { withSeller, apiSuccess, apiError } from "@/lib/api-helpers";
import { trackShipment } from "@/lib/shiprocket";
import { decrypt } from "@/lib/encryption";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * GET /api/shiprocket/track/[orderId]
 * Track shipment status for an order
 * 
 * Auth: Required (seller)
 * Returns: { success: true, data: { tracking_data, awb_code, courier_name } }
 * 
 * Security:
 * - Verifies order belongs to seller
 * - Decrypts Shiprocket token in memory only
 * - Updates order with latest tracking status
 */
export const GET = withSeller(async (
    request: NextRequest,
    { seller, params }
) => {
    const { orderId } = params as { orderId: string };

    if (!orderId) {
        return apiError("Order ID is required", 400);
    }

    const admin = createServiceRoleClient();

    // Fetch order with seller details
    const { data: order, error: orderError } = await admin
        .from("orders")
        .select(`
      id,
      awb_code,
      courier_name,
      seller:sellers(id, shiprocket_token)
    `)
        .eq("id", orderId)
        .single();

    if (orderError || !order) {
        return apiError("Order not found", 404);
    }

    // Verify ownership (Supabase join can return object or array)
    const rawSeller = order.seller;
    const orderSeller = (Array.isArray(rawSeller) ? rawSeller[0] : rawSeller) as { id: string; shiprocket_token?: string | null } | undefined;
    if (!orderSeller || orderSeller.id !== seller.id) {
        return apiError("Unauthorized - This order does not belong to you", 403);
    }

    // Check if shipment exists
    if (!order.awb_code) {
        return apiError("No shipment found for this order. Create a shipment first.", 400);
    }

    // Check if Shiprocket is connected
    if (!orderSeller.shiprocket_token) {
        return apiError("Shiprocket account not connected", 400);
    }

    // Decrypt token in memory
    let decryptedToken: string;
    try {
        decryptedToken = decrypt(orderSeller.shiprocket_token);
    } catch {
        console.error("[GET /api/shiprocket/track] Decryption failed");
        return apiError("Failed to decrypt Shiprocket credentials. Please reconnect your account.", 500);
    }

    try {
        // Fetch tracking data from Shiprocket
        const tracking = await trackShipment(decryptedToken, order.awb_code);

        // Update order with latest tracking status
        const trackingStatus = tracking.tracking_data?.shipment_status || "unknown";
        await admin
            .from("orders")
            .update({ tracking_status: trackingStatus })
            .eq("id", orderId);

        return apiSuccess({
            tracking_data: tracking.tracking_data,
            awb_code: order.awb_code,
            courier_name: order.courier_name,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to fetch tracking information";
        console.error("[GET /api/shiprocket/track] Tracking error:", message);
        return apiError(message, 500);
    }
});
