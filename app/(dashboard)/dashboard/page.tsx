import {
  ArrowRight,
  Package,
  ShoppingCart,
  Settings,
  TrendingUp,
  AlertCircle,
  IndianRupee,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TelegramConnect } from "@/components/telegram-connect";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: seller } = await supabase
    .from("sellers")
    .select("id, business_name, upi_token")
    .eq("user_id", user.id)
    .single();

  if (!seller) {
    redirect("/onboarding");
  }

  // Run all independent queries in parallel (was sequential — 5 round-trips → 1)
  const [
    { data: profile },
    { count: productCount },
    { count: pendingOrders },
    { count: totalOrders },
    { data: paidOrders },
  ] = await Promise.all([
    supabase.from("profiles").select("telegram_chat_id").eq("id", user.id).single(),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("seller_id", seller.id),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("seller_id", seller.id).eq("payment_status", "pending"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("seller_id", seller.id),
    supabase.from("orders").select("amount").eq("seller_id", seller.id).in("payment_status", ["paid", "verified"]),
  ]);

  const totalRevenue = paidOrders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;


  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up stagger-1 opacity-0">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Welcome back
            {seller.business_name ? `, ${seller.business_name}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>

        {/* Telegram Connect Widget */}
        <div className="w-full md:w-auto">
          <TelegramConnect
            userId={user.id}
            initialChatId={profile?.telegram_chat_id || null}
          />
        </div>
      </div>

      {/* Onboarding Checklist */}
      <OnboardingChecklist />

      {/* UPI Alert */}
      {!seller.upi_token && (
        <div className="animate-fade-in-up stagger-2 opacity-0 flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-300">Complete your setup</p>
            <p className="text-sm text-amber-400/80 mt-0.5">
              Add your UPI ID to start accepting payments.{" "}
              <Link
                href="/dashboard/settings"
                className="font-medium underline underline-offset-2 hover:text-amber-300"
              >
                Go to Settings →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up stagger-3 opacity-0">
        {/* Products Card */}
        <div className="surface-elevated rounded-xl p-6 glow-hover group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Products
              </p>
              <p className="text-3xl font-semibold text-foreground mt-2 tabular-nums">
                {productCount || 0}
              </p>
            </div>
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Package className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Pending Orders Card */}
        <div className="surface-elevated rounded-xl p-6 glow-hover group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pending
              </p>
              <p className="text-3xl font-semibold text-foreground mt-2 tabular-nums">
                {pendingOrders || 0}
              </p>
            </div>
            <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
              <ShoppingCart className="h-5 w-5 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="surface-elevated rounded-xl p-6 glow-hover group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Orders
              </p>
              <p className="text-3xl font-semibold text-foreground mt-2 tabular-nums">
                {totalOrders || 0}
              </p>
            </div>
            <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="surface-elevated rounded-xl p-6 glow-hover group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Revenue
              </p>
              <p className="text-3xl font-semibold text-foreground mt-2 tabular-nums">
                ₹{(totalRevenue / 100).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <IndianRupee className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions — Bento Grid */}
      <div className="animate-fade-in-up stagger-4 opacity-0">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/products"
            className="group surface-elevated rounded-xl p-6 glow-hover"
          >
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-105 transition-all">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              Manage Products
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Upload products and generate payment links.
            </p>
          </Link>

          <Link
            href="/dashboard/orders"
            className="group surface-elevated rounded-xl p-6 glow-hover"
          >
            <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-500/20 group-hover:scale-105 transition-all">
              <ShoppingCart className="h-5 w-5 text-amber-400" />
            </div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              View Orders
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Review payments and create shipments.
            </p>
          </Link>

          <Link
            href="/dashboard/settings"
            className="group surface-elevated rounded-xl p-6 glow-hover"
          >
            <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 group-hover:scale-105 transition-all">
              <Settings className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              Settings
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Configure UPI, COD, and Shiprocket.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
