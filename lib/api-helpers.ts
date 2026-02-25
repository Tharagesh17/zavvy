import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";
import { applySecurityHeaders } from "./security";

/**
 * Standard API response format
 */
export type ApiResponse<T = unknown> = {
  success: true;
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
  };
} | {
  success: false;
  error: string;
  code?: string;
  meta?: {
    requestId: string;
    timestamp: string;
  };
};

/**
 * Create metadata for responses
 */
function createMeta(requestId: string) {
  return {
    requestId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a successful API response
 */
export function apiSuccess<T>(
  data: T, 
  status: number = 200,
  requestId?: string
): NextResponse {
  const response = NextResponse.json(
    { 
      success: true, 
      data,
      meta: createMeta(requestId || logger.generateRequestId()),
    }, 
    { status }
  );
  
  applySecurityHeaders(response.headers);
  return response;
}

/**
 * Create an error API response
 */
export function apiError(
  error: string, 
  status: number = 400,
  code?: string,
  requestId?: string
): NextResponse {
  const response = NextResponse.json(
    { 
      success: false, 
      error,
      code,
      meta: createMeta(requestId || logger.generateRequestId()),
    }, 
    { status }
  );
  
  applySecurityHeaders(response.headers);
  return response;
}

/**
 * Get authenticated user from Supabase session
 * Returns user or null if not authenticated
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getAuthUser(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get seller profile for authenticated user
 * Returns seller or null if not found
 */
export async function getSellerProfile(userId: string) {
  const supabase = await createClient();
  const { data: seller, error } = await supabase
    .from("sellers")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !seller) {
    return null;
  }

  return seller;
}

/**
 * Higher-order function to protect routes with authentication
 * Usage: export const GET = withAuth(async (request, { user }) => { ... })
 */
export function withAuth(
  handler: (
    request: NextRequest,
    context: { user: { id: string }; params?: Record<string, string> }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    const user = await getAuthUser(request);

    if (!user) {
      return apiError("Unauthorized - Please sign in", 401, "AUTH_REQUIRED");
    }

    return handler(request, { user, params: context?.params });
  };
}

/**
 * Higher-order function to protect routes with seller authentication
 * Usage: export const GET = withSeller(async (request, { user, seller }) => { ... })
 */
export function withSeller(
  handler: (
    request: NextRequest,
    context: { user: { id: string }; seller: { id: string }; params?: Record<string, string> }
  ) => Promise<NextResponse>
) {
  return withAuth(async (request, { user, params }) => {
    const seller = await getSellerProfile(user.id);

    if (!seller) {
      return apiError("Seller profile not found", 404, "SELLER_NOT_FOUND");
    }

    return handler(request, { user, seller, params });
  });
}

/**
 * Validate required fields in request body
 * Returns error response if validation fails, null if valid
 */
export function validateRequired(
  body: Record<string, unknown>,
  fields: string[]
): NextResponse | null {
  const missing = fields.filter(field => !body[field]);

  if (missing.length > 0) {
    return apiError(
      `Missing required fields: ${missing.join(", ")}`, 
      400,
      "VALIDATION_ERROR"
    );
  }

  return null;
}

/**
 * Parse JSON body safely
 * Returns parsed body or error response
 */
export async function parseJsonBody(request: NextRequest): Promise<Record<string, unknown> | NextResponse> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError("Invalid JSON body", 400, "INVALID_JSON");
  }
}

/**
 * Check if response is an error response
 */
export function isErrorResponse(response: unknown): response is NextResponse {
  return response instanceof NextResponse;
}

/**
 * Wrap API handlers with standard middleware
 * - Logging
 * - Error handling
 * - Security headers
 * - Request timing
 */
export function withApiHandler(
  handler: (request: NextRequest, context?: { params?: Record<string, string> }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    const startTime = Date.now();
    const requestId = logger.generateRequestId();
    
    logger.setRequestId(requestId);
    logger.logRequestStart(request.method, request.url, {
      requestId,
      path: request.url,
      method: request.method,
    });

    try {
      const response = await handler(request, context);
      
      const duration = Date.now() - startTime;
      logger.logRequestEnd(
        request.method,
        request.url,
        response.status,
        duration,
        { requestId }
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error("API handler error", {
        requestId,
        path: request.url,
        method: request.method,
        duration,
      }, error as Error);

      return apiError(
        "Internal server error",
        500,
        "INTERNAL_ERROR",
        requestId
      );
    }
  };
}
