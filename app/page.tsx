import { cookies } from "next/headers";
import {
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LandingBentoGrid } from "@/components/landing/landing-bento-grid";
import { TelegramFeatures } from "@/components/landing/telegram-features";
import { QrPreview } from "@/components/landing/qr-preview";

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
        <section className="relative py-20 lg:py-40">
          {/* Geometric background */}
          <div className="absolute inset-0 -z-10 bg-grid-slate-200/50 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
          <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2" />

          <div className="container px-4 mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-left space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest">
                <Sparkles className="w-4 h-4" />
                Next-Gen Storefront for 2026
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-heading tracking-tight leading-[0.9] text-white">
                Turn your Instagram DMs into a <span className="text-primary italic">High-End</span> Brand.
              </h1>

              <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
                Zavvy bridges the gap between social selling and professional e-commerce.
                Automate your payments, inventory, and Shiprocket logistics in one &ldquo;Magic&rdquo; link.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Button asChild size="lg" className="h-16 px-10 rounded-2xl text-xl font-black shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-primary/50 transition-all group">
                  <Link href="/login">
                    Get Started <ArrowRight className="ml-3 w-6 h-6 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center font-bold text-xs ring-4 ring-black">
                        {i}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm font-bold">Joined by 1.2k+ sellers</span>
                </div>
              </div>

              {/* High-lighted features list */}
              <div className="grid grid-cols-2 gap-6 pt-10">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-widest opacity-60 italic">Pincode Lookup Address</span>
                </div>
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-orange-500" />
                  <span className="text-xs font-black uppercase tracking-widest opacity-60 italic">20m Ghost Reservation</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <QrPreview />
            </div>
          </div>
        </section>

        <TelegramFeatures />

        {/* Closing CTA */}
        <section className="py-40 relative">
          <div className="absolute inset-0 bg-primary/5 -z-10 skew-y-3" />
          <div className="container px-4 mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-black font-heading mb-10 max-w-3xl mx-auto">
              Stop answering &ldquo;Price?&rdquo; and start building your <span className="text-primary">Empire</span>.
            </h2>
            <Button asChild size="lg" className="h-20 px-16 rounded-[2rem] text-2xl font-black shadow-2xl shadow-primary/40 hover:scale-105 transition-transform">
              <Link href="/login">Start Scaling Now</Link>
            </Button>
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

// Minimal placeholder for the high-lighted features icons
function Activity(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}
