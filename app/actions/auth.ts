"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { sanitizeString } from "@/lib/validation";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

/** Sign in with Google OAuth */
export async function signInWithGoogle() {
  const supabase = await createClient();
  const headersList = headers();
  const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/api/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    return redirect("/login?error=oauth_failed");
  }

  return redirect(data.url);
}


/** Dev only: skip OTP and log in with magic link. Set DEV_SKIP_AUTH=true in .env.local */
export type DevLoginResult = { ok: true; url: string } | { ok: false; error: string };

// Fixed dev password - must be consistent
const DEV_PASSWORD = "devpassword123";

export async function devLogin(): Promise<DevLoginResult> {
  const isDev = process.env.NODE_ENV === "development";

  // SECURITY: devLogin is ONLY available in development mode, never in production
  if (!isDev) {
    return { ok: false, error: "Dev login is only available in development mode." };
  }

  const headersList = headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  // Use environment variables for dev credentials
  const devEmail = process.env.DEV_EMAIL || "test@zavvy.local";
  const devPassword = process.env.DEV_PASSWORD || DEV_PASSWORD;
  const admin = createServiceRoleClient();

  const { data: createData, error: createErr } = await admin.auth.admin.createUser({
    email: devEmail,
    email_confirm: true,
    password: devPassword,
  });

  let userId = createData?.user?.id;

  if (!userId && createErr?.message?.includes("already been registered")) {
    // User exists - get their ID and update password
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 100 });
    const existingUser = list?.users?.find((u) => u.email === devEmail);
    userId = existingUser?.id ?? undefined;

    // Update password to ensure it matches dev password
    if (userId) {
      await admin.auth.admin.updateUserById(userId, {
        password: devPassword,
        email_confirm: true,
      });
    }
  } else if (createErr && !userId) {
    return { ok: false, error: createErr.message };
  }

  if (!userId) return { ok: false, error: "Could not get or create dev user." };

  const { data: seller } = await admin.from("sellers").select("id").eq("user_id", userId).single();

  if (!seller) {
    await admin.from("sellers").insert({
      user_id: userId,
      phone: process.env.DEV_PHONE || "+919999999999",
      business_name: process.env.DEV_BUSINESS_NAME || "Test Seller",
      tier: "pro",
      is_bank_verified: true,
      pickup_address: {
        line1: process.env.DEV_ADDRESS || "Test Address",
        city: process.env.DEV_CITY || "Mumbai",
        state: process.env.DEV_STATE || "Maharashtra",
        pincode: process.env.DEV_PINCODE || "400001"
      },
    });
  }

  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: devEmail,
    password: devPassword,
  });

  if (signInError) {
    return { ok: false, error: signInError.message };
  }

  const { data: existingSeller } = await admin.from("sellers").select("id").eq("user_id", userId).single();
  const target = existingSeller ? `${baseUrl}/dashboard` : `${baseUrl}/onboarding`;

  return { ok: true, url: target };
}



export type SendOtpResult = { ok: true; email?: string } | { ok: false; error: string };

export async function signInWithEmailOtp(
  _prev: SendOtpResult | null,
  formData: FormData
): Promise<SendOtpResult> {
  const requestId = logger.generateRequestId();

  try {
    const email = (formData.get("email") as string)?.trim().toLowerCase();

    if (!email) {
      return { ok: false, error: "Enter your email address." };
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(email, "otp");

    if (!rateLimitResult.success) {
      const minutes = Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / (60 * 1000));
      return {
        ok: false,
        error: `Too many attempts. Please try again in ${minutes} minute(s).`,
      };
    }

    const supabase = await createClient();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${baseUrl}/api/auth/callback`,
        shouldCreateUser: true,
      },
    });

    if (error) {
      logger.warn("Email OTP send failed", { email, error: error.message, requestId });
      return { ok: false, error: error.message };
    }

    logger.info("Email OTP sent successfully", { email, requestId });
    return { ok: true, email };
  } catch (error) {
    logger.error("Error in signInWithEmailOtp", {}, error as Error);
    return { ok: false, error: "An unexpected error occurred. Please try again." };
  }
}

export type VerifyOtpResult = { ok: true; needsOnboarding?: boolean } | { ok: false; error: string };

export async function verifyEmailOtp(
  _prev: VerifyOtpResult | null,
  formData: FormData
): Promise<VerifyOtpResult> {
  const requestId = logger.generateRequestId();

  try {
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const token = (formData.get("token") as string)?.trim();

    if (!email || !token) {
      return { ok: false, error: "Enter the verification code." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      logger.warn("Email OTP verification failed", { email, error: error.message, requestId });
      return { ok: false, error: error.message };
    }

    if (!data.session) {
      return { ok: false, error: "Verification failed. Please try again." };
    }

    const { user } = data.session;
    const { data: profile } = await supabase
      .from("profiles")
      .select("has_completed_onboarding")
      .eq("id", user.id)
      .single();

    logger.info("Email OTP verified successfully", { email, requestId });
    return {
      ok: true,
      needsOnboarding: profile ? !profile.has_completed_onboarding : true
    };
  } catch (error) {
    logger.error("Error in verifyEmailOtp", {}, error as Error);
    return { ok: false, error: "An unexpected error occurred. Please try again." };
  }
}

export type OnboardingResult = { ok: true } | { ok: false; error: string };

export async function submitOnboarding(
  _prev: OnboardingResult | null,
  formData: FormData
): Promise<OnboardingResult> {
  const requestId = logger.generateRequestId();

  try {
    const business_name = sanitizeString(formData.get("business_name") as string);
    const line1 = sanitizeString(formData.get("line1") as string);
    const city = sanitizeString(formData.get("city") as string);
    const state = sanitizeString(formData.get("state") as string);
    const pincode = (formData.get("pincode") as string)?.trim();
    const upi_id = (formData.get("upi_id") as string)?.trim().toLowerCase();

    // Validation
    if (!business_name || business_name.length < 2) {
      return { ok: false, error: "Business name is required (min 2 characters)." };
    }

    if (!line1 || !city || !state || !pincode) {
      return { ok: false, error: "Complete pickup address (line1, city, state, pincode)." };
    }

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return { ok: false, error: "PIN code must be exactly 6 digits." };
    }

    if (!upi_id) {
      return { ok: false, error: "UPI ID is required to receive payments." };
    }

    if (!upi_id.includes("@")) {
      return { ok: false, error: "Invalid UPI ID. Should be like: yourname@bank" };
    }

    // Validate UPI format
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/;
    if (!upiRegex.test(upi_id)) {
      return { ok: false, error: "Invalid UPI ID format." };
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, error: "You must be signed in to complete onboarding." };
    }

    const phone = (user.phone ?? user.user_metadata?.phone ?? "") as string;
    const supabaseAdmin = createServiceRoleClient();

    const { error: insertError } = await supabaseAdmin.from("sellers").insert({
      user_id: user.id,
      phone: phone || "",
      business_name,
      upi_id,
      is_bank_verified: true,
      pickup_address: { line1, city, state, pincode },
      cod_enabled: false,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return { ok: false, error: "Profile already exists. Redirecting..." };
      }
      logger.error("Onboarding insert failed", { error: insertError.code + ": " + insertError.message, userId: user.id, requestId });
      return { ok: false, error: "Failed to create profile. Please try again." };
    }

    // Update profile to mark onboarding as completed
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ has_completed_onboarding: true })
      .eq("id", user.id);

    if (profileError) {
      logger.error("Failed to update profile onboarding status", { error: profileError.message, userId: user.id, requestId });
      // We don't block the user if the profile update fails but seller creation succeeded
    }

    logger.info("Onboarding completed", { userId: user.id, requestId });
  } catch (error) {
    if ((error as Record<string, string>)?.digest?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    logger.error("Error in submitOnboarding", {}, error as Error);
    return { ok: false, error: "An unexpected error occurred. Please try again." };
  }

  redirect("/dashboard");
}

/** Logout: sign out and redirect to login page. */
export async function logout() {
  const requestId = logger.generateRequestId();

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error("Logout failed", { error: error.message, requestId });
    } else {
      logger.info("User logged out", { requestId });
    }
  } catch (error) {
    logger.error("Error in logout", {}, error as Error);
  }

  redirect("/login");
}
