import { cookies } from "next/headers";
import {
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MagicLinkCard } from "@/components/landing/magic-link-card";
import { TelegramFeatures } from "@/components/landing/telegram-features";

export default async function Home() {
  // Read session cookie directly — no Supabase network call needed just to check login state
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const isLoggedIn = allCookies.some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  return (
    <div className="flex min-h-screen flex-col font-sans bg-background text-foreground selection:bg-primary/20 grain-overlay">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl tracking-tighter italic font-heading">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-black shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              <Zap className="h-6 w-6 stroke-[2.5px]" fill="currentColor" />
            </div>
            <span>ZAVVY</span>
          </Link>

          <nav className="hidden md:flex items-center gap-10">
            <Link href="#features" className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">
              Features
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Button asChild variant="default" className="rounded-2xl px-8 font-bold shadow-lg shadow-primary/20">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild variant="ghost" className="rounded-2xl px-8 font-bold text-muted-foreground hover:text-white hover:bg-white/5">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pt-32">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary/20 via-background to-background" />

          <div className="container px-4 mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-left space-y-8 animate-fade-in z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest">
                <Sparkles className="w-4 h-4" />
                For Indian D2C Brands
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-heading tracking-tight leading-[0.9] text-foreground">
                Stop Chasing DMs. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Start Scaling Sales.</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
                The all-in-one autonomous agent for Indian Instagram sellers. From UPI deep-links to Shiprocket tracking—Zavvy handles the chaos so you can focus on your craft.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button asChild size="lg" className="h-16 px-10 rounded-2xl text-xl font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all">
                  <Link href="/login">Launch My Storefront (Free)</Link>
                </Button>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end relative z-10 animate-fade-in-up">
              <div className="relative">
                {/* Decorative glow behind the card */}
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
                <MagicLinkCard className="max-w-[320px] lg:max-w-sm relative z-20" />

                {/* Telegram notification mockup */}
                <div className="absolute -right-6 -bottom-6 bg-[#1c242f] border border-white/10 rounded-2xl p-4 shadow-2xl z-30 flex items-start gap-4 animate-bounce max-w-[280px]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Zavvy Bot</h4>
                    <p className="text-xs text-blue-100/70">Payment Received - ₹1,999. Order Confirmed!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Showdown (3 Big Wins) */}
        <section id="features" className="py-24 relative overflow-hidden bg-muted/30 border-y border-white/5">
          <div className="container px-4 mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-black font-heading mb-6">Built by founders, for founders. Let the bots do the heavy lifting.</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-background border border-white/5 shadow-xl relative group hover:border-primary/50 transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-4">The Payment Specialist</h3>
                <h4 className="text-sm text-primary font-bold uppercase tracking-wider mb-2">Instant UPI verification. Zero screenshots.</h4>
                <p className="text-muted-foreground leading-relaxed">
                  No more asking customers, &quot;Please send screenshot.&quot; Zavvy generates a 1-click UPI Deep-Link (PhonePe, GPay, Paytm). The second the payment hits your Razorpay X account, Zavvy auto-verifies it.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-background border border-white/5 shadow-xl relative group hover:border-secondary/50 transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-6">
                  <Zap className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-4">The Bot that Never Sleeps</h3>
                <h4 className="text-sm text-secondary font-bold uppercase tracking-wider mb-2">Your entire store inside your chat app.</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Meet your new AI assistant. With our dedicated Telegram bot, you can manage your inventory, approve COD orders, and track shipments directly from your phone. You sleep. The bot replies.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-background border border-white/5 shadow-xl relative group hover:border-emerald-500/50 transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
                  <ArrowRight className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-4">Logistics on Autopilot</h3>
                <h4 className="text-sm text-emerald-500 font-bold uppercase tracking-wider mb-2">Click, ship, and relax.</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Fulfillment shouldn&apos;t take all afternoon. Integrated natively with Shiprocket, Zavvy generates Automatic Waybills (AWB) the moment an order is approved. Real-time tracking links instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        <TelegramFeatures />

        {/* Visual Flow / Steps */}
        <section className="py-24">
          <div className="container px-4 mx-auto max-w-5xl">
            <h2 className="text-3xl md:text-5xl font-black font-heading text-center mb-16">From &quot;Price?&quot; to Delivered in 3 easy steps.</h2>

            <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
              {/* Step 1 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-secondary text-white font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow shadow-secondary/50">1</div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-muted/20 border border-white/5 mx-4">
                  <h3 className="font-bold text-xl mb-2">Setup & Secure</h3>
                  <p className="text-muted-foreground">Log in with a secure Phone OTP. Link your Bank & Shiprocket in 2 minutes. Your command center is ready.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-white font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow shadow-primary/50">2</div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-muted/20 border border-white/5 mx-4">
                  <h3 className="font-bold text-xl mb-2">Share the Magic Link</h3>
                  <p className="text-muted-foreground">Drop your <code className="text-primary bg-primary/10 px-1 py-0.5 rounded">zavvyai.shop/l/xyz</code> Magic Link on your Instagram Stories or Bio. No app downloads required.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-emerald-500 text-white font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow shadow-emerald-500/50">3</div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-muted/20 border border-white/5 mx-4">
                  <h3 className="font-bold text-xl mb-2">Auto-Magic Fulfillment</h3>
                  <p className="text-muted-foreground">Buyer clicks, buys, and pays via UPI. Zavvy verifies the ID, generates the shipping label, and pings your Telegram.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Safety & Security */}
        <section className="py-24 bg-black/50 border-y border-white/5">
          <div className="container px-4 mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-black font-heading mb-6">Bank-Grade Security for Your Peace of Mind.</h2>
                <p className="text-xl text-muted-foreground mb-8">Handling money is serious. That&apos;s why your data is locked down.</p>
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
                    <div>
                      <h4 className="font-bold">Secure Sessions</h4>
                      <p className="text-muted-foreground text-sm">AES-256-GCM encrypted tokens and HttpOnly cookies.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
                    <div>
                      <h4 className="font-bold">Rate-Limited Authentication</h4>
                      <p className="text-muted-foreground text-sm">Military-grade Phone OTP logins to stop spam and protect your storefront.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
                    <div>
                      <h4 className="font-bold">Zero-Trust Model</h4>
                      <p className="text-muted-foreground text-sm">Your payments route directly to you. We simply verify the receipt.</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-md aspect-square rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                  <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse-glow" />
                  <ShieldCheck className="w-32 h-32 text-primary opacity-80" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-32 relative text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 max-w-2xl h-64 bg-primary/20 blur-[120px] rounded-full -z-10" />
          <div className="container px-4 mx-auto">
            <h2 className="text-4xl md:text-6xl font-black font-heading mb-6 max-w-4xl mx-auto">
              Ready to automate your social sales?
            </h2>
            <p className="text-xl text-muted-foreground mb-10">Join 1,200+ Indian boutique owners who traded chaos for clarity.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="h-16 px-12 rounded-2xl text-xl font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/20">
                <Link href="/login">Launch My Storefront (Free)</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-20 bg-black/80 backdrop-blur-xl">
        <div className="container px-4 mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter italic font-heading opacity-50">
            <Zap className="h-6 w-6 stroke-[2.5px]" fill="currentColor" />
            <span>ZAVVY</span>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.3em] opacity-30">© 2026 Zavvy Architecture · India</p>
          <div className="flex gap-10">
            <Link href="#" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Privacy</Link>
            <Link href="#" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
