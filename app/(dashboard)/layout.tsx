import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { LogOut, Package, ShoppingCart, Settings, Zap, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TelegramStatusBadge } from "@/components/dashboard/telegram-status-badge";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background midnight-grid grain-overlay">
      {/* Atmospheric Glow */}
      <div className="fixed inset-0 midnight-glow pointer-events-none z-0" />
      <TrialBanner />

      <header className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl px-6 py-3 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 group"
          >
            <div className="h-7 w-7 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="text-lg font-black tracking-tighter text-foreground">
              ZAVVY
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/dashboard/products"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-lg transition-all duration-200"
            >
              <Package className="h-4 w-4" />
              Products
            </Link>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-lg transition-all duration-200"
            >
              <ShoppingCart className="h-4 w-4" />
              Orders
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.04] rounded-lg transition-all duration-200"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <TelegramStatusBadge />
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </form>
        </div>
      </header>
      <main className="relative z-10 p-8 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}

async function TrialBanner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('is_pro, trial_ends_at').eq('id', user.id).single();
  if (!profile || profile.is_pro) return null;

  const now = new Date();
  const trialEnds = new Date(profile.trial_ends_at || now.toISOString());
  const diffTime = trialEnds.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return (
      <div className="bg-destructive/10 border-b border-destructive/20 text-destructive px-6 py-2 flex items-center justify-center gap-2 text-sm font-medium relative z-20">
        <AlertCircle className="h-4 w-4" />
        <span>Your 14-day trial has expired. Upgrade to Pro to continue selling.</span>
        <Link href="/dashboard/settings" className="ml-2 underline hover:text-destructive/80">Upgrade Now</Link>
      </div>
    );
  }

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-6 py-2 flex items-center justify-center gap-2 text-sm font-medium relative z-20">
      <Zap className="h-4 w-4 text-primary" />
      <span className="text-foreground">You have {diffDays} days left in your Pro trial.</span>
      <Link href="/dashboard/settings" className="ml-2 text-primary hover:text-primary/80 underline">Upgrade Early</Link>
    </div>
  );
}
