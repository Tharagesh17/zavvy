"use client";

import { signInWithEmailOtp, signInWithGoogle, verifyEmailOtp } from "@/app/actions/auth";
import Link from "next/link";
import * as React from "react";
import { useFormState } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, ShieldCheck, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function LoginForm({
  redirectTo,
}: {
  redirectTo: string | null;
}) {
  const [phone, setPhone] = React.useState("");
  const [step, setStep] = React.useState<"phone" | "otp">("phone");
  const [loading, setLoading] = React.useState(false);
  const [attempts, setAttempts] = React.useState(0);
  const [countdown, setCountdown] = React.useState(0);
  const [errorState, setErrorState] = React.useState("");
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const [sendState, sendAction] = useFormState(signInWithEmailOtp, null);
  const [verifyState, verifyAction] = useFormState(verifyEmailOtp, null);

  // Auto-forward on sendSuccess
  React.useEffect(() => {
    if (sendState?.ok && sendState.email) {
      setStep("otp");
      setAttempts(prev => prev + 1);
      setErrorState("");
    } else if (sendState && !sendState.ok) {
      setErrorState(sendState.error);
      if (sendState.error.includes("Too many attempts")) {
        setCountdown(60);
        setAttempts(0);
      }
    }
    setLoading(false);
  }, [sendState]);

  // Handle Verify success
  React.useEffect(() => {
    if (verifyState?.ok) {
      const redirectUrl = redirectTo || (verifyState.needsOnboarding ? "/onboarding" : "/dashboard");
      window.location.href = redirectUrl;
    } else if (verifyState && !verifyState.ok) {
      setErrorState(verifyState.error);
      setLoading(false);
    }
  }, [verifyState, redirectTo]);


  // Handle countdown timer
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);


  const handleSendForm = (formData: FormData) => {
    if (phone.length < 10) {
      setErrorState("Please enter a valid 10-digit number");
      return;
    }

    if (attempts >= 3) {
      setErrorState("Too many attempts. Please wait.");
      setCountdown(60); // 60 seconds lockout
      setAttempts(0);
      return;
    }

    setLoading(true);
    // Transform phone to dummy email for magic links as zavvy is phone only currently,
    // assuming backend requires email for magic links we format it securely.
    const emailStr = `+91${phone.replace(/\D/g, '').slice(0, 10)}@zavvymobile.local`;
    formData.set("email", emailStr);
    sendAction(formData);
  }

  const handleVerifyForm = (formData: FormData) => {
    const otp = formData.get("token") as string;
    if (!otp || otp.length < 6) {
      setErrorState("Please enter a 6-digit OTP");
      return;
    }
    setLoading(true);
    const emailStr = `+91${phone.replace(/\D/g, '').slice(0, 10)}@zavvymobile.local`;
    formData.set("email", emailStr);
    verifyAction(formData);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden grain-overlay">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none" />

      <div className="w-full max-w-md px-4 relative z-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tighter text-foreground mb-2 drop-shadow-sm">
            Zavvy<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium tracking-tight">
            Founder-to-Founder Storefronts
          </p>
        </div>

        <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)] relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4 border border-primary/20 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {step === "phone" ? "Welcome back" : "Verify your number"}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {step === "phone"
                  ? "Secure login to your Zavvy storefront."
                  : `We sent a code to +91 ${phone}`}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {step === "phone" ? (
                <motion.div
                  key="phone-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Google OAuth Button */}
                  <form action={async () => { setGoogleLoading(true); await signInWithGoogle(); }}>
                    <button
                      type="submit"
                      disabled={googleLoading || loading || countdown > 0}
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

                  <form action={handleSendForm} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Enter 10-digit number"
                          className="pl-10 h-12 text-lg bg-background/50 border-white/10 focus-visible:ring-primary/50"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                            setErrorState("");
                          }}
                          disabled={loading || countdown > 0}
                        />
                      </div>
                    </div>

                    {errorState && <p className="text-sm text-destructive font-medium">{errorState}</p>}

                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={loading || countdown > 0 || phone.length < 10}
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : countdown > 0 ? (
                        `Try again in ${countdown}s`
                      ) : (
                        <>
                          Send Secure OTP
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </motion.div>
              ) : (
                <motion.form
                  key="otp-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  action={handleVerifyForm}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="token">One-Time Password</Label>
                    <Input
                      id="token"
                      name="token"
                      type="text"
                      inputMode="numeric"
                      placeholder="••••••"
                      className="h-14 text-center text-2xl tracking-[0.5em] font-medium bg-background/50 border-white/10 focus-visible:ring-primary/50"
                      onChange={() => setErrorState("")}
                      disabled={loading}
                    />
                  </div>

                  {errorState && <p className="text-sm text-destructive font-medium text-center">{errorState}</p>}

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Verify and Login"
                    )}
                  </Button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("phone");
                        setErrorState("");
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      disabled={loading}
                    >
                      Change phone number
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
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
