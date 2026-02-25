import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Custom fetch with 8s timeout (balances reliability vs. responsiveness)
// Custom fetch with retry logic & timeout for robust Supabase connections
// Fixes "read ECONNRESET" errors on unstable networks (IPv6 issues)
const fetchWithRetry: typeof fetch = async (input, init) => {
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (true) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(input, {
        ...init,
        signal: init?.signal ?? controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Retry on network errors or timeouts (ECONNRESET, ETIMEDOUT, fetch failed)
      const isRetryable =
        attempt < MAX_RETRIES &&
        (error.name === "AbortError" || // Timeout
          error.message.includes("fetch failed") ||
          error.cause?.code === "ECONNRESET" ||
          error.cause?.code === "ETIMEDOUT");

      if (!isRetryable) throw error;

      console.warn(`[Supabase] Network error (attempt ${attempt}/${MAX_RETRIES}): ${error.message}. Retrying in ${attempt * 500}ms...`);
      await new Promise((r) => setTimeout(r, attempt * 500));
    }
  }
};


export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: fetchWithRetry },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component; ignore
          }
        },
      },
    }
  );
}

/** Service role client for admin/backend (e.g. rate limit table, insert seller). */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
  }
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
    global: { fetch: fetchWithRetry },
  });
}
