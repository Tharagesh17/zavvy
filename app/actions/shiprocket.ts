"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { loginShiprocket, createShipment, trackShipment, isTokenExpired } from "@/lib/shiprocket";
import { encrypt, decrypt } from "@/lib/encryption";
import { revalidatePath } from "next/cache";

export type ConnectShiprocketResult = { ok: true } | { ok: false; error: string };

/**
 * Connect seller's Shiprocket account using email + password.
 * Calls Shiprocket auth/login, stores encrypted JWT (never stores password).
 */
export async function connectShiprocket(
    _prev: ConnectShiprocketResult | null,
    formData: FormData
): Promise<ConnectShiprocketResult> {
    const email = (formData.get("shiprocket_email") as string)?.trim();
    const password = formData.get("shiprocket_password") as string;

    if (!email || !email.includes("@")) {
        return { ok: false, error: "Valid email is required" };
    }
    if (!password) {
        return { ok: false, error: "Password is required" };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not signed in" };

    const { data: seller } = await supabase
        .from("sellers")
        .select("id")
        .eq("user_id", user.id)
        .single();
    if (!seller) return { ok: false, error: "Seller profile not found" };

    try {
        const { token, expiresAt } = await loginShiprocket(email, password);
        const encryptedToken = encrypt(token);

        const admin = createServiceRoleClient();
        const { error } = await admin
            .from("sellers")
            .update({
                shiprocket_token: encryptedToken,
                shiprocket_token_expires_at: expiresAt.toISOString(),
                shiprocket_email: email.toLowerCase(),
            })
            .eq("id", seller.id);

        if (error) throw new Error(error.message);

        revalidatePath("/dashboard/settings");
        return { ok: true };
    } catch (error: unknown) {
        return { ok: false, error: (error as Error).message || "Connection failed" };
    }
}

/**
 * Disconnect Shiprocket account
 */
export async function disconnectShiprocket(): Promise<{ ok: boolean }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");

    const { data: seller } = await supabase
        .from("sellers")
        .select("id")
        .eq("user_id", user.id)
        .single();
    if (!seller) throw new Error("Seller profile not found");

    const admin = createServiceRoleClient();
    await admin
        .from("sellers")
        .update({
            shiprocket_token: null,
            shiprocket_token_expires_at: null,
            shiprocket_email: null,
        })
        .eq("id", seller.id);

    revalidatePath("/dashboard/settings");
    return { ok: true };
}

/**
 * Create shipment for an order
 */
export async function createShipmentForOrder(orderId: string): Promise<{ ok: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");

    const admin = createServiceRoleClient();

    // Fetch order with seller and product details
    const { data: order } = await admin
        .from("orders")
        .select(`
      *,
      seller:sellers(*),
      product:products(*)
    `)
        .eq("id", orderId)
        .single();

    if (!order) return { ok: false, error: "Order not found" };

    // Verify ownership
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (order.seller.user_id !== user.id) {
        return { ok: false, error: "Unauthorized" };
    }

    // Check if seller has Shiprocket connected
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (!order.seller.shiprocket_token) {
        return { ok: false, error: "Connect Shiprocket account first in Settings" };
    }

    // Decrypt token (API key)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const token = decrypt(order.seller.shiprocket_token);

    // Prepare shipment payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buyerAddress = order.buyer_address as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    const _pickupAddress = order.seller.pickup_address as any;

    // Split buyer name into first and last
    const nameParts = order.buyer_name.trim().split(" ");
    const firstName = nameParts[0] || order.buyer_name;
    const lastName = nameParts.slice(1).join(" ") || ".";

    const payload = {
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
        billing_email: "buyer@zavvy.com", // Placeholder
        billing_phone: order.buyer_phone,
        shipping_is_billing: true,
        order_items: [
            {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                name: order.product.name,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                sku: order.product.id.substring(0, 8),
                units: order.quantity,
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
        const shipment = await createShipment(token, payload);

        // Update order with shipment details
        await admin
            .from("orders")
            .update({
                shipment_id: shipment.shipment_id.toString(),
                awb_code: shipment.awb_code,
                courier_name: shipment.courier_name,
                order_status: "shipped",
                tracking_url: `https://shiprocket.co/tracking/${shipment.awb_code}`,
            })
            .eq("id", orderId);

        revalidatePath("/dashboard/orders");
        return { ok: true };
    } catch (error: unknown) {
        return { ok: false, error: (error as Error).message || "Shipment creation failed" };
    }
}

/**
 * Fetch tracking info for an order
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchTracking(orderId: string): Promise<any> {
    const admin = createServiceRoleClient();

    const { data: order } = await admin
        .from("orders")
        .select("awb_code, seller:sellers(shiprocket_token, shiprocket_token_expires_at)")
        .eq("id", orderId)
        .single();

    if (!order || !order.awb_code) {
        throw new Error("No tracking available");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seller = order.seller as any;
    if (!seller.shiprocket_token) {
        throw new Error("Shiprocket not connected");
    }

    if (isTokenExpired(seller.shiprocket_token_expires_at)) {
        throw new Error("Shiprocket token expired");
    }

    const token = decrypt(seller.shiprocket_token);
    const tracking = await trackShipment(token, order.awb_code);

    // Update order with latest tracking status
    await admin
        .from("orders")
        .update({
            tracking_status: tracking.tracking_data.shipment_status,
        })
        .eq("id", orderId);

    return tracking;
}
