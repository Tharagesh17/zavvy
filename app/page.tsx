import { cookies } from "next/headers";
import {
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Check,
  X,
  Package,
  CreditCard,
  Truck,
  Bot,
  ScanLine,
  Link2,
  MessageSquare,
  Star,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MagicLinkCard } from "@/components/landing/magic-link-card";

export default async function Home() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const isLoggedIn = allCookies.some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  return (
    <div className="flex min-h-screen flex-col font-sans bg-[#09090b] text-white selection:bg-emerald-500/20">

      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center gap-2.5 font-black text-xl tracking-tighter">
            <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <Zap className="h-4 w-4 stroke-[3px]" fill="currentColor" />
            </div>
            <span className="text-white">ZAVVY</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {["Features", "How it Works", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400 hover:text-white transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button asChild size="sm" className="rounded-lg font-bold bg-emerald-500 hover:bg-emerald-400 text-black">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-white font-semibold">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="rounded-lg font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                  <Link href="/login">Get Started Free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">

        {/* ─── EARLY ACCESS BANNER ─────────────────────────────────────────── */}
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 py-2.5 text-center">
          <p className="text-sm text-emerald-400 font-semibold">
            🎉 <span className="font-bold">Free for Early Sellers</span> — Join the waitlist and get lifetime access.{" "}
            <Link href="/login" className="underline underline-offset-2 hover:text-emerald-300">Claim your spot →</Link>
          </p>
        </div>

        {/* ─── HERO ────────────────────────────────────────────────────────── */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          {/* Gradient BG */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.12),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_80%_50%,rgba(79,70,229,0.08),transparent)]" />
          </div>

          <div className="container px-4 mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-left space-y-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Social Commerce · India
              </div>

              <div className="space-y-3">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.92]">
                  Stop Chasing DMs.{" "}
                  <br />
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                    Let AI Run Your
                  </span>
                  <br />
                  Instagram Store.
                </h1>
                <p className="text-lg text-zinc-400 max-w-xl leading-relaxed pt-2">
                  Zavvy is an AI-powered social commerce agent that automates orders, payments, and shipping for Instagram sellers. No more DM chaos.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-3">
                <Button asChild size="lg" className="h-14 px-8 rounded-xl text-base font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all hover:shadow-[0_0_50px_rgba(16,185,129,0.4)] hover:scale-[1.02]">
                  <Link href="/login">
                    Create Your Free Store
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-xl text-base font-semibold border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20">
                  <a href="#features">
                    See How It Works
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </a>
                </Button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex -space-x-2">
                  {[
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=rohan",
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=anita",
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=arjun",
                  ].map((src, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#09090b] bg-zinc-700 overflow-hidden">
                      <img src={src} alt="" className="w-full h-full" />
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <span className="text-white font-bold">500+</span>
                  <span className="text-zinc-500"> Indian sellers already live</span>
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="flex justify-center lg:justify-end items-center relative">
              <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] rounded-full" />
              <div className="relative z-10">
                <MagicLinkCard
                  className="max-w-[300px] lg:max-w-xs"
                  title="Nike Air Jordan 1 Retro"
                  description="Mid-top retro basketball shoes. Size 10. Brand new in box."
                  price="₹4,999"
                  badge="Verified Seller"
                />

                {/* Floating Telegram notification */}
                <div className="absolute -left-8 md:-left-20 top-8 bg-[#17212b] border border-white/10 rounded-2xl p-3.5 shadow-2xl z-30 flex items-start gap-3 max-w-[240px] animate-bounce">
                  <div className="w-9 h-9 rounded-full bg-[#2AABEE] flex items-center justify-center shrink-0 text-white font-bold text-xs">Z</div>
                  <div>
                    <p className="text-xs font-bold text-white mb-0.5">Zavvy Bot</p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">✅ Payment Received · ₹4,999. Order Confirmed! Shipment booked.</p>
                  </div>
                </div>

                {/* UPI payment chip */}
                <div className="absolute -right-4 md:-right-12 bottom-16 bg-[#1a1a1a] border border-emerald-500/30 rounded-xl p-3 shadow-xl z-30">
                  <p className="text-[10px] text-zinc-500 mb-1 font-semibold">PAYMENT</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-sm font-bold text-white">UPI Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── PROBLEM ─────────────────────────────────────────────────────── */}
        <section className="py-20 border-y border-white/5 bg-black/40">
          <div className="container px-4 mx-auto max-w-5xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">The Problem</p>
            <h2 className="text-3xl md:text-5xl font-black mb-14 leading-tight">
              Selling on Instagram is{" "}
              <span className="text-red-400">chaotic.</span>
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
              {[
                { text: "Answering \"Price?\" messages repeatedly", detail: "You spend hours in DMs instead of growing your brand." },
                { text: "Collecting payment screenshots", detail: "Buyers screenshot and forget. You chase, they ghost." },
                { text: "Manually verifying UPI payments", detail: "No way to confirm if money actually landed in your account." },
                { text: "Booking shipments separately", detail: "Log into Shiprocket, fill 15 fields, repeat for every order." },
                { text: "Updating buyers about delivery", detail: "\"Where is my order?\" — you type this 20 times per day." },
                { text: "Missing orders while you sleep", detail: "International time zones? Night sales? Missed completely." },
              ].map(({ text, detail }) => (
                <div key={text} className="flex gap-3 p-5 rounded-2xl bg-red-500/5 border border-red-500/10 group hover:border-red-500/20 transition-colors">
                  <div className="shrink-0 mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                      <X className="w-3 h-3 text-red-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">{text}</p>
                    <p className="text-xs text-zinc-500 leading-relaxed">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SOLUTION ────────────────────────────────────────────────────── */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(16,185,129,0.05),transparent)]" />
          <div className="container px-4 mx-auto max-w-6xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-4">The Solution</p>
            <h2 className="text-3xl md:text-5xl font-black mb-5 leading-tight">
              Meet Zavvy —{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Your AI Co-Founder</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-16 leading-relaxed">
              An autonomous commerce agent that handles your entire sales operation, so you can focus on what you do best — creating.
            </p>

            {/* Feature Grid */}
            <div id="features" className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

              {/* AWB Scanner — Hero Feature */}
              <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-[#09090b] to-[#09090b] p-8 text-left group hover:border-emerald-500/40 transition-all">
                <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/15 transition-all" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-5">
                    ✨ Killer Feature
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mb-5">
                    <ScanLine className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-black mb-3 text-white">AWB Auto Scanner</h3>
                  <p className="text-zinc-400 leading-relaxed mb-6 max-w-lg">
                    Snap a photo of your courier receipt in Telegram. Zavvy&apos;s AI vision model reads the AWB tracking number, matches it to the right order, and automatically notifies your buyer with tracking details — all in 5 seconds.
                  </p>
                  {/* Visual flow */}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {[
                      "📸 Upload receipt",
                      "🤖 AI scans AWB",
                      "🔗 Matches order",
                      "📩 Buyer notified",
                    ].map((step, i, arr) => (
                      <div key={step} className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300">{step}</span>
                        {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Smart Storefront */}
              <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03] p-8 text-left group hover:border-white/15 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center mb-5">
                  <Link2 className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-xl font-black mb-3 text-white">Smart Storefront</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  Create a professional link-in-bio store in seconds. Products, prices, and checkout — all in one shareable link. Drop it in your Instagram bio and let orders come to you.
                </p>
              </div>

              {/* UPI Payment */}
              <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03] p-8 text-left group hover:border-emerald-500/20 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mb-5">
                  <CreditCard className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-xl font-black mb-3 text-white">UPI Payment Automation</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  Customers pay instantly through Google Pay, PhonePe, or Paytm via 1-click deep links. Auto-verification on payment. Zero screenshot chasing. Instant cash confirmation.
                </p>
              </div>

              {/* Shipping */}
              <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03] p-8 text-left group hover:border-orange-500/20 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center mb-5">
                  <Truck className="w-7 h-7 text-orange-400" />
                </div>
                <h3 className="text-xl font-black mb-3 text-white">Shipping Automation</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  Generate Shiprocket waybills with one click the moment an order is approved. Tracking links go straight to your buyer. No manual booking portals ever again.
                </p>
              </div>

              {/* Telegram Bot */}
              <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03] p-8 text-left group hover:border-blue-500/20 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mb-5">
                  <Bot className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-black mb-3 text-white">Telegram AI Bot</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  Manage your entire store from Telegram. Approve/reject COD, verify payments, add products, check sales — all via a chat bot that never sleeps, never forgets.
                </p>
              </div>

              {/* Order Automation */}
              <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03] p-8 text-left group hover:border-purple-500/20 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center mb-5">
                  <Package className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-xl font-black mb-3 text-white">AI Order Management</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  Every order gets tracked, every payment gets verified, every buyer gets updates — automatically. Real-time Telegram alerts, morning briefings, and sales summaries built-in.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─────────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-24 border-y border-white/5 bg-black/40">
          <div className="container px-4 mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">How It Works</p>
              <h2 className="text-3xl md:text-5xl font-black">
                From <span className="text-zinc-500">&quot;Price?&quot;</span> to{" "}
                <span className="text-emerald-400">Delivered</span> in 5 steps.
              </h2>
            </div>

            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent md:left-1/2 md:-translate-x-px hidden sm:block" />

              <div className="space-y-8">
                {[
                  { step: 1, title: "Add your products", desc: "Log in with Phone OTP. Add products with photos, prices, and stock. Generates a beautiful product page instantly.", color: "emerald" },
                  { step: 2, title: "Share Zavvy store link in Instagram bio", desc: "Drop your zavvyai.shop/l/xyz link in your Instagram, YouTube, or WhatsApp bio. No app download needed for buyers.", color: "indigo" },
                  { step: 3, title: "Customers buy instantly", desc: "Buyers tap, fill name + address, and buy. The entire checkout takes under 60 seconds. Mobile-first, no account needed.", color: "blue" },
                  { step: 4, title: "Zavvy verifies payment and manages shipping", desc: "UPI payments auto-verified. Manual payments confirmed via Telegram. Shiprocket waybill generated automatically.", color: "orange" },
                  { step: 5, title: "Buyers receive tracking automatically", desc: "Tracking link sent to buyer's phone. AWB scanned from receipt via AI. Order closed. You earned.", color: "emerald" },
                ].map(({ step, title, desc, color }) => (
                  <div key={step} className="relative flex gap-6 items-start">
                    <div className={`shrink-0 w-12 h-12 rounded-full border-2 border-${color}-500/50 bg-${color}-500/10 text-${color}-400 flex items-center justify-center font-black text-lg z-10`}>
                      {step}
                    </div>
                    <div className="flex-1 pb-2">
                      <h3 className="font-bold text-lg text-white mb-1">{title}</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── TELEGRAM WALKTHROUGH ─────────────────────────────────────────── */}
        <section className="py-24">
          <div className="container px-4 mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-4">The Bot That Never Sleeps</p>
                <h2 className="text-3xl md:text-4xl font-black mb-6 leading-tight">
                  Your entire store,<br />inside <span className="text-[#2AABEE]">Telegram</span>.
                </h2>
                <p className="text-zinc-400 leading-relaxed mb-8">
                  No dashboards. No laptops. Zavvy&apos;s Telegram bot is your command center. Get instant alerts, approve orders, and manage inventory from any phone, anywhere.
                </p>
                <ul className="space-y-4">
                  {[
                    { icon: "💸", text: "Tap to approve UPI payments" },
                    { icon: "🚚", text: "One-tap COD order approval" },
                    { icon: "📦", text: "Scan receipt → AWB extracted → buyer notified" },
                    { icon: "📸", text: "Add products directly by sending a photo" },
                    { icon: "⚠️", text: "Sold-out alerts with restocking actions" },
                    { icon: "☀️", text: "Daily morning briefing with pending tasks" },
                  ].map(({ icon, text }) => (
                    <li key={text} className="flex items-center gap-3">
                      <span className="text-xl">{icon}</span>
                      <span className="text-sm font-medium text-zinc-300">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Telegram Chat Mockup */}
              <div className="relative">
                <div className="bg-[#17212b] rounded-3xl border border-white/10 overflow-hidden shadow-2xl max-w-sm mx-auto">
                  {/* Telegram Header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#1c2a3a]">
                    <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center font-black text-black text-sm">Z</div>
                    <div>
                      <p className="text-sm font-bold text-white">Zavvy Bot</p>
                      <p className="text-[11px] text-zinc-500">Online</p>
                    </div>
                  </div>
                  {/* Messages */}
                  <div className="p-4 space-y-3 text-[12px]">
                    {/* Incoming */}
                    <div className="bg-[#2b5278] rounded-xl rounded-tl-sm px-3 py-2.5 max-w-[85%]">
                      <p className="font-bold text-white mb-1">📦 New Order!</p>
                      <p className="text-blue-200">Product: Air Jordan 1 Retro</p>
                      <p className="text-blue-200">Buyer: Rohan Sharma</p>
                      <p className="text-blue-200">Amount: ₹4,999</p>
                      <p className="text-blue-200">Method: 🚚 Cash on Delivery</p>
                    </div>
                    {/* Buttons */}
                    <div className="flex gap-2">
                      <div className="flex-1 bg-emerald-600 rounded-lg px-3 py-2 text-center font-bold text-white text-[11px]">✅ Approve COD</div>
                      <div className="flex-1 bg-red-600/80 rounded-lg px-3 py-2 text-center font-bold text-white text-[11px]">❌ Reject</div>
                    </div>
                    {/* Incoming */}
                    <div className="ml-auto bg-[#2b5278] rounded-xl rounded-tr-sm px-3 py-2.5 max-w-[78%]">
                      <p className="font-bold text-emerald-300 mb-1">🔍 Receipt Scanned!</p>
                      <p className="text-blue-100">AWB: 1234567890</p>
                      <p className="text-blue-100">Courier: Delhivery</p>
                      <p className="text-blue-100">Match: Rohan (87%)</p>
                    </div>
                    {/* Confirm Button */}
                    <div className="bg-emerald-600 rounded-lg px-3 py-2 text-center font-bold text-white text-[11px] max-w-[80%] mx-auto">✅ Yes, Ship It!</div>
                    {/* Final */}
                    <div className="bg-[#1e2936] border border-white/5 rounded-xl px-3 py-2.5 text-center">
                      <p className="text-emerald-400 font-bold">✅ Shipped! Buyer notified.</p>
                    </div>
                  </div>
                </div>
                {/* Glow behind mockup */}
                <div className="absolute inset-0 bg-blue-500/10 blur-3xl -z-10 rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* ─── TRUST SECTION ────────────────────────────────────────────────── */}
        <section className="py-24 border-y border-white/5 bg-black/40">
          <div className="container px-4 mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Enterprise Security</p>
                <h2 className="text-3xl md:text-5xl font-black mb-5 leading-tight">
                  Bank-Grade Security for Your Peace of Mind.
                </h2>
                <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
                  Handling money is serious. Every credential, payment, and session is protected by enterprise-level security infrastructure.
                </p>
                <ul className="space-y-5">
                  {[
                    { title: "AES-256-GCM Encryption", desc: "All sensitive data stored encrypted. UPI IDs, bank accounts, tokens — none stored in plaintext." },
                    { title: "Row-Level Database Security", desc: "Supabase RLS policies ensure each seller can only see and access their own data." },
                    { title: "OTP-Based Authentication", desc: "Phone OTP login with rate-limiting (3 OTPs per 5 min). No passwords. No phishing." },
                    { title: "Zero-Trust Payments", desc: "Your money routes directly to you via UPI. Zavvy only verifies receipt — never touches funds." },
                  ].map(({ title, desc }) => (
                    <li key={title} className="flex gap-4">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm mb-0.5">{title}</p>
                        <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Security visual */}
              <div className="flex justify-center">
                <div className="relative w-72 h-72">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/10 animate-spin" style={{ animationDuration: '20s' }} />
                  <div className="absolute inset-8 rounded-full border-2 border-dashed border-emerald-500/20 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.15)]">
                      <ShieldCheck className="w-12 h-12 text-emerald-400" />
                    </div>
                  </div>
                  {/* Orbiting nodes */}
                  {[0, 72, 144, 216, 288].map((deg) => (
                    <div
                      key={deg}
                      className="absolute w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                      style={{
                        top: `calc(50% + ${Math.sin((deg * Math.PI) / 180) * 120}px - 8px)`,
                        left: `calc(50% + ${Math.cos((deg * Math.PI) / 180) * 120}px - 8px)`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── PRICING ─────────────────────────────────────────────────────── */}
        <section id="pricing" className="py-24">
          <div className="container px-4 mx-auto max-w-5xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Pricing</p>
            <h2 className="text-3xl md:text-5xl font-black mb-5">Simple, honest pricing.</h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-14">
              Start for free. Scale when you&apos;re ready. No credit card required.
            </p>

            <div className="grid md:grid-cols-3 gap-5">
              {/* Starter */}
              <div className="relative rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/10 to-transparent p-8 text-left flex flex-col">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-5 self-start">
                  🎉 Early Access — Free
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Starter</h3>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-5xl font-black text-white">₹0</span>
                  <span className="text-zinc-400 mb-2">/month</span>
                </div>
                <p className="text-zinc-400 text-sm mb-6">Everything you need to start selling. Free forever for early sellers.</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "Unlimited products",
                    "Smart storefront link",
                    "UPI payment links",
                    "Telegram bot",
                    "AWB receipt scanner",
                    "Shiprocket integration",
                    "Real-time order alerts",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full rounded-xl h-12 font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <Link href="/login">Get Started Free</Link>
                </Button>
              </div>

              {/* Growth */}
              <div className="relative rounded-3xl border border-white/8 bg-white/[0.03] p-8 text-left flex flex-col">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-5">Coming Soon</div>
                <h3 className="text-2xl font-black text-white mb-2">Growth</h3>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-5xl font-black text-zinc-600">???</span>
                  <span className="text-zinc-600 mb-2">/month</span>
                </div>
                <p className="text-zinc-500 text-sm mb-6">Advanced analytics, multi-store management, and priority support.</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "Everything in Starter",
                    "Analytics dashboard",
                    "Multi-product campaigns",
                    "Instagram auto-reply (DM)",
                    "Comment-to-order automation",
                    "Priority support",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-600">
                      <Check className="w-4 h-4 text-zinc-600 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button disabled className="w-full rounded-xl h-12 font-bold bg-zinc-800 text-zinc-500 cursor-not-allowed">
                  Coming Soon
                </Button>
              </div>

              {/* Pro */}
              <div className="relative rounded-3xl border border-white/8 bg-white/[0.03] p-8 text-left flex flex-col">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-5">Coming Soon</div>
                <h3 className="text-2xl font-black text-white mb-2">Pro</h3>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-5xl font-black text-zinc-600">???</span>
                  <span className="text-zinc-600 mb-2">/month</span>
                </div>
                <p className="text-zinc-500 text-sm mb-6">For power sellers and brands needing white-label and API access.</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "Everything in Growth",
                    "White-label storefront",
                    "API access",
                    "Custom domain",
                    "Team management",
                    "Dedicated account manager",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-600">
                      <Check className="w-4 h-4 text-zinc-600 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button disabled className="w-full rounded-xl h-12 font-bold bg-zinc-800 text-zinc-500 cursor-not-allowed">
                  Coming Soon
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FINAL CTA ───────────────────────────────────────────────────── */}
        <section className="py-32 relative overflow-hidden border-t border-white/5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(16,185,129,0.1),transparent)] -z-10" />
          <div className="container px-4 mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              Free for Early Sellers
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              Ready to automate your social sales?
            </h2>
            <p className="text-zinc-400 text-xl mb-10 leading-relaxed">
              Join 500+ Indian sellers who traded DM chaos for a fully automated store. Free to start. Live in minutes.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="h-14 px-10 rounded-xl text-base font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_50px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.4)] hover:scale-[1.02] transition-all">
                <Link href="/login">
                  Create Your Free Store
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-10 rounded-xl text-base font-semibold border-white/10 bg-white/5 text-white hover:bg-white/10">
                <a href="#features">
                  <MessageSquare className="mr-2 w-4 h-4" />
                  See Features
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 bg-black/80">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2 font-black text-lg tracking-tighter">
              <div className="h-7 w-7 rounded-md bg-emerald-500 flex items-center justify-center text-black">
                <Zap className="h-4 w-4 stroke-[3px]" fill="currentColor" />
              </div>
              <span className="text-white/40">ZAVVY</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-700">© 2026 Zavvy · Built for Indian Sellers</p>
            <div className="flex gap-8">
              <Link href="#" className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Terms</Link>
              <a href="mailto:support@zavvyai.shop" className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Contact: support@zavvyai.shop</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
