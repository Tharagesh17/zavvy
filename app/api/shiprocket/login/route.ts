import { NextRequest } from "next/server";
import { withSeller, apiSuccess, apiError, parseJsonBody, isErrorResponse } from "@/lib/api-helpers";
import { loginShiprocket } from "@/lib/shiprocket";
import { encrypt } from "@/lib/encryption";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * POST /api/shiprocket/login
 * Connect seller's Shiprocket account using email + password
 *
 * Auth: Required (seller)
 * Body: { email: string, password: string }
 * Returns: { success: true, data: { connected: true } }
 *
 * Security:
 * - Calls Shiprocket auth/login to get JWT (never stores password)
 * - Encrypts token using AES-256-GCM before storage
 * - Never returns token to frontend
 */
export const POST = withSeller(async (request: NextRequest, { seller }) => {
    const body = await parseJsonBody(request);
    if (isErrorResponse(body)) return body;

    const { email, password } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
        return apiError("Valid email is required", 400);
    }
    if (!password || typeof password !== "string") {
        return apiError("Password is required", 400);
    }

    try {
        const { token, expiresAt } = await loginShiprocket(email, password);

        const encryptedToken = encrypt(token);
        const admin = createServiceRoleClient();
        const { error } = await admin
            .from("sellers")
            .update({
                shiprocket_token: encryptedToken,
                shiprocket_token_expires_at: expiresAt.toISOString(),
                shiprocket_email: email.trim().toLowerCase(),
            })
            .eq("id", seller.id);

        if (error) {
            console.error("[POST /api/shiprocket/login] Database error:", error);
            return apiError("Failed to save Shiprocket connection", 500);
        }

        return apiSuccess({ connected: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Connection failed";
        console.error("[POST /api/shiprocket/login] Error:", message);
        return apiError(message, 500);
    }
});
