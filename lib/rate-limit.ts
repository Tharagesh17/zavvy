/**
 * Rate limiting implementation
 * 
 * Provides flexible rate limiting for different actions:
 * - OTP sends (3 per 5 minutes)
 * - API calls (100 per minute)
 * - Login attempts (5 per minute)
 */

import { createServiceRoleClient } from "./supabase/server";

export interface RateLimitConfig {
  windowMs: number;     // Time window in milliseconds
  maxRequests: number;  // Maximum requests in window
}

// Default rate limits
export const RATE_LIMITS = {
  otp: { windowMs: 5 * 60 * 1000, maxRequests: 3 },           // 3 per 5 minutes
  login: { windowMs: 60 * 1000, maxRequests: 5 },             // 5 per minute
  api: { windowMs: 60 * 1000, maxRequests: 100 },             // 100 per minute
  upload: { windowMs: 60 * 1000, maxRequests: 10 },           // 10 uploads per minute
  shiprocket: { windowMs: 60 * 1000, maxRequests: 20 },       // 20 Shiprocket calls per minute
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

/**
 * Check if request is within rate limit
 * Uses Supabase table for rate limiting (works across multiple server instances)
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType
): Promise<RateLimitResult> {
  const supabase = createServiceRoleClient();
  const config = RATE_LIMITS[type];
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  try {
    // Count recent attempts
    const { count, error: countError } = await supabase
      .from("otp_send_attempts")
      .select("*", { count: "exact", head: true })
      .eq("identifier", identifier)
      .eq("action", type)
      .gte("attempted_at", windowStart.toISOString());

    if (countError) {
      console.error("Rate limit check failed:", countError);
      // Fail open - allow request if we can't check
      return {
        success: true,
        remaining: 0,
        resetAt: new Date(now.getTime() + config.windowMs),
        limit: config.maxRequests,
      };
    }

    const currentCount = count || 0;
    const remaining = Math.max(0, config.maxRequests - currentCount);
    const resetAt = new Date(now.getTime() + config.windowMs);

    if (currentCount >= config.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetAt,
        limit: config.maxRequests,
      };
    }

    // Log this attempt
    await supabase.from("otp_send_attempts").insert({
      identifier,
      action: type,
      attempted_at: now.toISOString(),
    });

    return {
      success: true,
      remaining: remaining - 1,
      resetAt,
      limit: config.maxRequests,
    };
  } catch (error) {
    console.error("Rate limit error:", error);
    // Fail open
    return {
      success: true,
      remaining: 0,
      resetAt: new Date(now.getTime() + config.windowMs),
      limit: config.maxRequests,
    };
  }
}

/**
 * Rate limit middleware for API routes
 * Returns null if allowed, or a Response if rate limited
 */
export async function rateLimitMiddleware(
  identifier: string,
  type: RateLimitType
): Promise<{ allowed: true } | { allowed: false; response: Response }> {
  const result = await checkRateLimit(identifier, type);

  if (result.success) {
    return { allowed: true };
  }

  const response = new Response(
    JSON.stringify({
      success: false,
      error: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt.getTime() / 1000)),
        "Retry-After": String(Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)),
      },
    }
  );

  return { allowed: false, response };
}

/**
 * Get client identifier from request
 * Uses IP address or user ID for identification
 */
export function getClientIdentifier(
  request: Request,
  userId?: string
): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Get IP from various headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() ||
    realIp ||
    "unknown";

  return `ip:${ip}`;
}

/**
 * Clean up old rate limit entries (run periodically)
 */
export async function cleanupRateLimits(): Promise<void> {
  const supabase = createServiceRoleClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  const { error } = await supabase
    .from("rate_limit_logs")
    .delete()
    .lt("attempted_at", cutoff.toISOString());

  if (error) {
    console.error("Failed to cleanup rate limits:", error);
  }
}
