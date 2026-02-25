import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_PATH = "/login";
const VERIFY_OTP_PATH = "/verify-otp";
const ONBOARDING_PATH = "/onboarding";
const DASHBOARD_PATH = "/dashboard";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  const isDashboard = pathname === DASHBOARD_PATH || pathname.startsWith(`${DASHBOARD_PATH}/`);
  const isOnboarding = pathname === ONBOARDING_PATH;
  const isAuthPage = pathname === LOGIN_PATH || pathname === VERIFY_OTP_PATH;

  if (isDashboard) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = LOGIN_PATH;
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    const { data: seller } = await supabase
      .from("sellers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!seller) {
      const url = request.nextUrl.clone();
      url.pathname = ONBOARDING_PATH;
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (isOnboarding) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = LOGIN_PATH;
      return NextResponse.redirect(url);
    }
    const { data: seller } = await supabase
      .from("sellers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (seller) {
      const url = request.nextUrl.clone();
      url.pathname = DASHBOARD_PATH;
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (isAuthPage && user) {
    const { data: seller } = await supabase
      .from("sellers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (seller) {
      const url = request.nextUrl.clone();
      url.pathname = DASHBOARD_PATH;
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding",
    "/login",
    "/verify-otp",
  ],
};
