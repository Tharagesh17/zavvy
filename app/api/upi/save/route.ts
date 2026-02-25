import { NextRequest, NextResponse } from "next/server";
import { encrypt, validateUpiId } from "@/lib/crypto";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * POST /api/upi/save
 * 
 * Save seller's UPI ID (encrypted).
 * 
 * Security:
 * - Validates UPI format before accepting
 * - Encrypts using AES-256-GCM before storage
 * - Never returns decrypted value
 * - Enforces seller ownership via auth check
 * 
 * Request body:
 * {
 *   "upi_id": "username@bankcode"
 * }
 * 
 * Response:
 * { "success": true } | { "error": "message" }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const upiId = body.upi_id?.trim();

        // Validate UPI format
        if (!upiId || !validateUpiId(upiId)) {
            return NextResponse.json(
                { error: "Invalid UPI ID format. Use format: username@bankcode" },
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

        // Get seller profile
        const { data: seller, error: sellerError } = await supabase
            .from("sellers")
            .select("id, upi_token")
            .eq("user_id", user.id)
            .single();

        if (sellerError || !seller) {
            return NextResponse.json(
                { error: "Seller profile not found" },
                { status: 404 }
            );
        }

        // Encrypt UPI ID
        const encryptedValue = encrypt(upiId);

        // Use service role client for privileged operations
        const admin = createServiceRoleClient();

        if (seller.upi_token) {
            // Update existing token
            const { error: updateError } = await admin
                .from("upi_tokens")
                .update({ encrypted_value: encryptedValue })
                .eq("id", seller.upi_token);

            if (updateError) {
                console.error("Failed to update UPI token:", updateError);
                return NextResponse.json(
                    { error: "Failed to update UPI ID" },
                    { status: 500 }
                );
            }

            // Also update plain UPI ID in sellers table for checkout display
            await admin
                .from("sellers")
                .update({ upi_id: upiId })
                .eq("id", seller.id);
        } else {
            // Create new token
            const { data: newToken, error: insertError } = await admin
                .from("upi_tokens")
                .insert({
                    seller_id: seller.id,
                    encrypted_value: encryptedValue,
                })
                .select("id")
                .single();

            if (insertError || !newToken) {
                console.error("Failed to create UPI token:", insertError);
                return NextResponse.json(
                    { error: "Failed to save UPI ID" },
                    { status: 500 }
                );
            }

            // Update seller with token reference AND plain UPI ID for checkout display
            const { error: sellerUpdateError } = await admin
                .from("sellers")
                .update({ upi_token: newToken.id, upi_id: upiId })
                .eq("id", seller.id);

            if (sellerUpdateError) {
                console.error("Failed to link UPI token to seller:", sellerUpdateError);
                return NextResponse.json(
                    { error: "Failed to save UPI ID" },
                    { status: 500 }
                );
            }
        }

        // SECURITY: Never return the UPI ID (encrypted or decrypted)
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("UPI save error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
