import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { withSeller, apiSuccess, apiError, parseJsonBody, isErrorResponse } from "@/lib/api-helpers";
import { createShipment } from "@/lib/shiprocket";
import { decrypt } from "@/lib/encryption";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * POST /api/shiprocket/create-shipment
 * Create shipment for an order using seller's Shiprocket account
 * 
 * Auth: Required (seller)
 * Body: { order_id: string }
 * Returns: { success: true, data: { shipment_id, awb_code, tracking_url } }
 * 
 * Security:
 * - Verifies order belongs to seller (multi-tenant isolation)
 * - Decrypts Shiprocket token in memory only
 * - Never logs decrypted token
 * - Updates order with shipment details atomically
 */
export const POST = withSeller(async (request: NextRequest, { seller }) => {
    const body = await parseJsonBody(request);
    if (isErrorResponse(body)) return body;

    const { order_id } = body;

    // Validate input
    if (!order_id || typeof order_id !== "string") {
        return apiError("Order ID is required", 400);
    }

    const admin = createServiceRoleClient();

    // Fetch order with product and seller details
    const { data: order, error: orderError } = await admin
        .from("orders")
        .select(`
      *,
      product:products(*),
      seller:sellers(*)
    `)
        .eq("id", order_id)
        .single();

    if (orderError || !order) {
        return apiError("Order not found", 404);
    }

    // Verify ownership (multi-tenant isolation)
    const orderSeller = order.seller as { id: string; shiprocket_token?: string | null };
    if (orderSeller.id !== seller.id) {
        return apiError("Unauthorized - This order does not belong to you", 403);
    }

    // Check if Shiprocket is connected
    if (!orderSeller.shiprocket_token) {
        return apiError("Connect your Shiprocket account first in Settings", 400);
    }

    // Decrypt token in memory (never log this)
    let decryptedToken: string;
    try {
        decryptedToken = decrypt(orderSeller.shiprocket_token);
    } catch {
        logger.error("Shiprocket decryption failed");
        return apiError("Failed to decrypt Shiprocket credentials. Please reconnect your account.", 500);
    }

    // Prepare shipment payload
    const product = order.product as { name: string; id: string };
    const buyerAddress = order.buyer_address as { line1?: string; city?: string; pincode?: string; state?: string } | null;

    if (!buyerAddress || !buyerAddress.line1 || !buyerAddress.city || !buyerAddress.pincode || !buyerAddress.state) {
        return apiError("Order is missing required buyer address fields", 400);
    }

    // Split buyer name into first and last
    const nameParts = order.buyer_name.trim().split(" ");
    const firstName = nameParts[0] || order.buyer_name;
    const lastName = nameParts.slice(1).join(" ") || ".";

    const shipmentPayload = {
        order_id: `ZAVVY_${order.id.substring(0, 8)}`,
        order_date: new Date().toISOString().split("T")[0],
        pickup_location: "Primary", // Sellers must create "Primary" location in Shiprocket
        billing_customer_name: firstName,
        billing_last_name: lastName,
        billing_address: buyerAddress.line1,
        billing_city: buyerAddress.city,
        billing_pincode: buyerAddress.pincode,
        billing_state: buyerAddress.state,
        billing_country: "India",
        billing_email: "buyer@zavvy.com", // Placeholder (Shiprocket requires email)
        billing_phone: order.buyer_phone,
        shipping_is_billing: true,
        order_items: [
            {
                name: product.name,
                sku: product.id.substring(0, 8),
                units: order.quantity || 1,
                selling_price: order.amount / 100, // Convert paise to rupees
            },
        ],
        payment_method: (order.payment_method === "cod" ? "COD" : "Prepaid") as "COD" | "Prepaid",
        sub_total: order.amount / 100,
        length: 10, // Default dimensions (cm)
        breadth: 10,
        height: 10,
        weight: 0.5, // Default weight (kg)
    };

    try {
        // Call Shiprocket API
        const shipment = await createShipment(decryptedToken, shipmentPayload);

        // Update order with shipment details
        const { error: updateError } = await admin
            .from("orders")
            .update({
                shipment_id: shipment.shipment_id.toString(),
                awb_code: shipment.awb_code,
                courier_name: shipment.courier_name,
                order_status: "shipped",
                tracking_url: `https://shiprocket.co/tracking/${shipment.awb_code}`,
            })
            .eq("id", order_id);

        if (updateError) {
            logger.error("Shipment created but DB update failed", { orderId: order_id, error: updateError.message });
            // Shipment created but DB update failed - log for manual recovery
            return apiError("Shipment created but failed to update order. Please contact support.", 500);
        }

        return apiSuccess({
            shipment_id: shipment.shipment_id,
            awb_code: shipment.awb_code,
            courier_name: shipment.courier_name,
            tracking_url: `https://shiprocket.co/tracking/${shipment.awb_code}`,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to create shipment";
        logger.error("Shiprocket shipment creation error", { error: message });
        return apiError(message, 500);
    }
});
