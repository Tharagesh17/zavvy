import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Health check for load balancers and monitoring.
 * Validates critical env vars (does not expose values).
 */
export async function GET() {
  const checks: Record<string, boolean> = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabase_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    app_url: !!process.env.NEXT_PUBLIC_APP_URL,
  };

  const allOk = Object.values(checks).every(Boolean);
  const status = allOk ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      checks: process.env.NODE_ENV === "development" ? checks : undefined,
    },
    { status: allOk ? 200 : 503 }
  );
}
