/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import { SecuritySquad } from './security';
import { loginShiprocket, createShipment as shiprocketCreate, ShipmentPayload, ShipmentResponse } from '../shiprocket';
import { Database } from '@/database.types.fixed';

// Initialize Supabase Admin Client (Service Role) for secure operations
const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class LogisticsSquad {

    /**
     * Main entry point to create a shipment.
     * securely retrieves credentials, validates tier rules, and calls Shiprocket.
     */
    static async createShipment(orderId: string, sellerId: string): Promise<ShipmentResponse> {
        console.log(`[LogisticsSquad] Processing shipment for Order: ${orderId}`);

        // 1. Fetch Order & Seller Details
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('*, products(*)')
            .eq('id', orderId)
            .single() as { data: any, error: any };

        if (orderError || !order) throw new Error(`Order not found: ${orderId}`);

        // 2. TIER ENFORCEMENT (CRITICAL)
        // Free Tier must be MANUALLY designated as ready.
        // We assume 'payment_status' of 'verified' means manual verification is done for Free tier.
        // For Pro tier, 'paid' (Razorpay) is sufficient.

        if (order.tier === 'free' && order.payment_method === 'upi_manual') {
            if (order.payment_status !== 'verified') {
                throw new Error("Security Block: Free Tier orders must be manually verified before shipping.");
            }
        }

        // 3. Fetch Encrypted Credentials
        const { data: keys, error: keyError } = await supabaseAdmin
            .from('seller_keys')
            .select('encrypted_shiprocket_email, encrypted_shiprocket_password')
            .eq('seller_id', sellerId)
            .single() as { data: any, error: any };

        if (keyError || !keys) throw new Error("Shiprocket credentials not found for seller.");

        // 4. Decrypt Credentials
        const email = SecuritySquad.decrypt(keys.encrypted_shiprocket_email!);
        const password = SecuritySquad.decrypt(keys.encrypted_shiprocket_password!);

        // 5. Login to Shiprocket
        const session = await loginShiprocket(email, password);

        // 6. Construct Payload
        // Note: In a real app, strict type mapping from Order -> ShipmentPayload is needed.
        // Simplified for MVP.
        const payload: ShipmentPayload = {
            order_id: order.id,
            order_date: new Date(order.created_at).toISOString(),
            pickup_location: "Primary", // Default pickup location name in Shiprocket
            billing_customer_name: order.buyer_name,
            billing_last_name: "",
            billing_address: order.buyer_address?.line1 || "Not Provided",
            billing_city: order.buyer_address?.city || "Unknown",
            billing_pincode: order.buyer_address?.pincode || "000000",
            billing_state: order.buyer_address?.state || "Unknown",
            billing_country: "India",
            billing_email: "buyer@example.com", // Placeholder if not collected
            billing_phone: order.buyer_phone,
            shipping_is_billing: true,
            order_items: [
                {
                    name: order.products?.name || "Product",
                    sku: order.products?.id || "SKU",
                    units: order.quantity,
                    selling_price: order.amount / 100, // Convert paise to rupees
                }
            ],
            payment_method: order.payment_method === 'cod' ? 'COD' : 'Prepaid',
            sub_total: order.amount / 100,
            length: 10, breadth: 10, height: 10, weight: 0.5 // Default dimensions
        };

        // 7. Call Shiprocket API
        const shipment = await shiprocketCreate(session.token, payload);

        // 8. Update Order Status in DB
        await supabaseAdmin
            .from('orders')
            // @ts-expect-error DB schema type mismatch with update payload
            .update({
                shipping_status: 'processing',
                shipment_id: shipment.shipment_id.toString(),
                awb_code: shipment.awb_code,
                courier_name: shipment.courier_name
            })
            .eq('id', orderId);

        // 9. Create Shipment Record
        await supabaseAdmin
            .from('shipments')
            // @ts-expect-error DB schema type mismatch with insert payload
            .insert({
                order_id: orderId,
                seller_id: sellerId,
                shiprocket_order_id: shipment.order_id,
                shiprocket_shipment_id: shipment.shipment_id.toString(),
                courier_name: shipment.courier_name,
                awb_code: shipment.awb_code,
                label_url: "pending_generation" // Separate API call needed usually
            });

        return shipment;
    }
}
