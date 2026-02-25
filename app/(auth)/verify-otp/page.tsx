"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { verifyEmailOtp } from "@/app/actions/auth";

const DIGIT_COUNT = 6;

function VerifyOtpForm({ email }: { email: string }) {
  const [digits, setDigits] = useState<string[]>(Array(DIGIT_COUNT).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const [state, formAction] = useFormState(verifyEmailOtp, null);

  useEffect(() => {
    if (state?.ok) {
      if (state.needsOnboarding) {
        router.replace("/onboarding");
      } else {
        router.replace("/dashboard");
      }
      router.refresh();
    }
  }, [state, router]);

  const setDigit = (index: number, value: string) => {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    if (v && index < DIGIT_COUNT - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (v && index === DIGIT_COUNT - 1) {
      const code = next.join("");
      if (code.length === 6) {
        const form = document.getElementById("verify-form") as HTMLFormElement;
        const input = document.getElementById("token-input") as HTMLInputElement;
        if (input) input.value = code;
        form?.requestSubmit();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, DIGIT_COUNT);
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    for (let i = pasted.length; i < DIGIT_COUNT; i++) next[i] = "";
    setDigits(next);
    const focusIndex = Math.min(pasted.length, DIGIT_COUNT - 1);
    inputRefs.current[focusIndex]?.focus();
    if (pasted.length === 6) {
      const form = document.getElementById("verify-form") as HTMLFormElement;
      const input = document.getElementById("token-input") as HTMLInputElement;
      if (input) input.value = pasted;
      form?.requestSubmit();
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden grain-overlay">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none" />

      <div className="w-full max-w-md px-4 relative z-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tighter text-foreground mb-2 drop-shadow-sm">
            Zavvy<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium tracking-tight">
            Security Protocol • Identity Verification
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(59,130,246,0.15)]">
          <h2 className="text-2xl font-semibold mb-2 text-foreground tracking-tight">Verify Identity</h2>
          <p className="text-muted-foreground text-[13px] mb-8 leading-relaxed">
            We have transmitted a secure code to: <br />
            <span className="text-primary/80 font-mono tracking-tight">{email}</span>
          </p>

          <form id="verify-form" action={formAction} className="space-y-8">
            <input type="hidden" name="email" value={email} />
            <input
              id="token-input"
              name="token"
              type="hidden"
              value={digits.join("")}
            />

            <div className="flex gap-3 justify-center" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <div key={i} className="relative group">
                  <input
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-10 h-10 text-center text-xl font-mono rounded-lg border border-white/10 bg-white/5 text-foreground transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50"
                    aria-label={`Digit ${i + 1}`}
                  />
                  {!d && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3 h-[1px] bg-muted-foreground/30 group-focus-within:bg-primary/50 transition-colors" />
                  )}
                </div>
              ))}
            </div>

            {state?.ok === false && "error" in state && state.error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                <p className="text-xs text-destructive font-medium text-center">{state.error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              Authorize Access
            </button>
          </form>

          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/40 font-mono tracking-widest uppercase border border-white/5 py-1 px-3 rounded-full bg-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-pulse" />
              System Live
            </div>
          </div>
        </div>

        <Link
          href="/login"
          className="mt-8 block text-center text-[13px] text-muted-foreground hover:text-primary transition-colors font-medium tracking-tight"
        >
          ← Return to authentication
        </Link>
      </div>
    </div>
  );
}

export default function VerifyOtpPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams?.email;

  if (!email) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-muted-foreground text-sm">Missing email info.</p>
        <Link href="/login" className="mt-4 block text-sm text-primary hover:underline">
          ← Back to login
        </Link>
      </div>
    );
  }

  return <VerifyOtpForm email={decodeURIComponent(email)} />;
}
