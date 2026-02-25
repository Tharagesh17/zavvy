/**
 * Security utilities and helpers
 * 
 * Provides security-focused functions for authentication,
 * authorization, and data protection.
 */

import { createServiceRoleClient } from "./supabase/server";
import { decrypt } from "./encryption";

export interface AuthContext {
  userId: string;
  sellerId?: string;
  sessionId?: string;
}

export interface SellerData {
  id: string;
  user_id: string;
  business_name: string;
  tier: string;
  upi_id?: string;
  cod_enabled?: boolean;
  shiprocket_token?: string;
  shiprocket_token_expires_at?: string;
}

/**
 * Verify that the current user owns a specific seller record
 */
export async function verifySellerOwnership(
  userId: string,
  sellerId: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  
  const { data, error } = await supabase
    .from("sellers")
    .select("id")
    .eq("id", sellerId)
    .eq("user_id", userId)
    .single();
  
  if (error || !data) {
    return false;
  }
  
  return true;
}

/**
 * Verify that the current user owns a specific order
 */
export async function verifyOrderOwnership(
  userId: string,
  orderId: string
): Promise<{ success: boolean; order?: { seller_id: string; payment_status: string } }> {
  const supabase = createServiceRoleClient();
  
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      seller_id,
      payment_status,
      sellers!inner(user_id)
    `)
    .eq("id", orderId)
    .single();
  
  if (error || !data) {
    return { success: false };
  }
  
  // Type assertion needed due to Supabase join types
  const orderData = data as unknown as {
    id: string;
    seller_id: string;
    payment_status: string;
    sellers: { user_id: string };
  };
  
  if (orderData.sellers.user_id !== userId) {
    return { success: false };
  }
  
  return {
    success: true,
    order: {
      seller_id: orderData.seller_id,
      payment_status: orderData.payment_status,
    },
  };
}

/**
 * Get decrypted Shiprocket token for a seller
 */
export async function getShiprocketToken(
  sellerId: string
): Promise<{ success: true; token: string; expiresAt: Date } | { success: false; error: string }> {
  const supabase = createServiceRoleClient();
  
  const { data, error } = await supabase
    .from("sellers")
    .select("shiprocket_token, shiprocket_token_expires_at")
    .eq("id", sellerId)
    .single();
  
  if (error || !data?.shiprocket_token) {
    return { success: false, error: "Shiprocket not connected" };
  }
  
  // Check if token is expired
  const expiresAt = data.shiprocket_token_expires_at 
    ? new Date(data.shiprocket_token_expires_at)
    : null;
    
  if (expiresAt && expiresAt <= new Date()) {
    return { success: false, error: "Shiprocket token expired. Please reconnect." };
  }
  
  try {
    const token = decrypt(data.shiprocket_token);
    return {
      success: true,
      token,
      expiresAt: expiresAt || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    };
  } catch (err) {
    console.error("Failed to decrypt Shiprocket token:", err);
    return { success: false, error: "Invalid token. Please reconnect." };
  }
}

/**
 * Check if user is authenticated and return user ID
 */
export async function requireAuth(): Promise<{ userId: string } | { error: string; status: number }> {
  const { createClient } = await import("./supabase/server");
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { error: "Unauthorized", status: 401 };
  }
  
  return { userId: user.id };
}

/**
 * Check if user is a seller and return seller data
 */
export async function requireSeller(): Promise<
  | { seller: SellerData; userId: string }
  | { error: string; status: number }
> {
  const authResult = await requireAuth();
  
  if ("error" in authResult) {
    return authResult;
  }
  
  const { createClient } = await import("./supabase/server");
  const supabase = await createClient();
  
  const { data: seller, error } = await supabase
    .from("sellers")
    .select("*")
    .eq("user_id", authResult.userId)
    .single();
  
  if (error || !seller) {
    return { error: "Seller profile not found", status: 404 };
  }
  
  return { seller: seller as SellerData, userId: authResult.userId };
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Hash sensitive data for comparison (one-way)
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Rate limit key generator
 */
export function generateRateLimitKey(identifier: string, action: string): string {
  return `rate_limit:${action}:${identifier}`;
}

/**
 * Security headers for API responses
 */
export const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co;",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

/**
 * Apply security headers to a Headers object
 */
export function applySecurityHeaders(headers: Headers): void {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
}
