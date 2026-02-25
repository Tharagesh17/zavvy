"use client";

import { signInWithEmailOtp, signInWithGoogle } from "@/app/actions/auth";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";

function LoginForm({
  redirectTo,
}: {
  redirectTo: string | null;
}) {
  const [email, setEmail] = useState("");
  const [state, formAction] = useFormState(signInWithEmailOtp, null);
  const [cooldown, setCooldown] = useState(0);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (state?.ok && state.email) {
      const params = new URLSearchParams({ email: state.email });
      if (redirectTo) params.set("redirect", redirectTo);
      window.location.href = `/verify-otp?${params.toString()}`;
    }
  }, [state, redirectTo]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (formData: FormData) => {
    if (cooldown > 0) return;
    setCooldown(60);
    formAction(formData);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden grain-overlay">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none" />

      <div className="w-full max-w-md px-4 relative z-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tighter text-foreground mb-2 drop-shadow-sm">
            Zavvy<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium tracking-tight">
            IDE-Core Architecture • High Precision
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(59,130,246,0.15)]">
          <h2 className="text-2xl font-semibold mb-2 text-foreground tracking-tight">Identity Access</h2>
          <p className="text-muted-foreground text-[13px] mb-6 leading-relaxed">
            Sign in to your seller dashboard.
          </p>

          {/* Google OAuth Button */}
          <form action={async () => { setGoogleLoading(true); await signInWithGoogle(); }}>
            <button
              type="submit"
              disabled={googleLoading}
              className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-foreground hover:bg-white/10 hover:border-white/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-3 mb-6"
            >
              {googleLoading ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              {googleLoading ? "Redirecting..." : "Continue with Google"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] text-muted-foreground/50 font-mono uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Email OTP Form */}
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">
                Email Address
              </label>
              <div className="relative group">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 placeholder:text-muted-foreground/30 font-mono"
                  required
                />
                <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-500" />
              </div>
            </div>

            {state?.ok === false && "error" in state && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                <p className="text-xs text-destructive font-medium text-center">{state.error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={cooldown > 0}
              className="w-full h-12 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:grayscale disabled:scale-100 flex items-center justify-center gap-2"
            >
              {cooldown > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-primary-foreground/50 animate-pulse" />
                  Code Locked ({cooldown}s)
                </>
              ) : (
                "Send Login Code"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[11px] text-muted-foreground/40 font-mono tracking-widest uppercase">
            Protocol v4.0 • Zero Trust Active
          </p>
        </div>

        <Link
          href="/"
          className="mt-8 block text-center text-[13px] text-muted-foreground hover:text-primary transition-colors font-medium tracking-tight"
        >
          ← Return to origin
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; error?: string };
}) {
  return <LoginForm redirectTo={searchParams?.redirect ?? null} />;
}
