import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Settings2,
    Package,
    LayoutDashboard,
    Wallet,
    Zap,
    Store,
    ShieldCheck,
    MessageCircle,
} from "lucide-react";
import { CodToggle } from "./cod-toggle";
import { UpdateUpiForm } from "./update-upi-form";
import { ShiprocketConnectForm } from "./shiprocket-connect-form";
import { BusinessProfileForm } from "./business-profile-form";
import { TelegramConnect } from "@/components/telegram-connect";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) redirect("/login");

    const db = createServiceRoleClient();
    const [{ data: seller }, { data: profile }] = await Promise.all([
        db.from("sellers").select("*").eq("user_id", user.id).single(),
        db.from("profiles").select("telegram_chat_id").eq("id", user.id).single(),
    ]);

    if (!seller) redirect("/onboarding");


    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <div className="relative overflow-hidden pb-12 pt-4">
                <div className="relative max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground animate-fade-in-up opacity-0 stagger-1">
                        Studio Settings
                    </h1>
                    <p className="mt-2 text-muted-foreground max-w-2xl animate-fade-in-up opacity-0 stagger-2">
                        Manage your digital storefront, payment gateways, and logistics partners.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Navigation Sidebar */}
                    <div className="hidden lg:block lg:col-span-3 animate-fade-in-up opacity-0 stagger-3">
                        <nav className="sticky top-24 space-y-1">
                            <a href="#general" className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-primary/10 text-primary transition-all">
                                <LayoutDashboard className="mr-3 h-4 w-4 flex-shrink-0" />
                                <span className="truncate">General</span>
                            </a>
                            <a href="#integrations" className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all">
                                <MessageCircle className="mr-3 h-4 w-4 flex-shrink-0" />
                                <span className="truncate">Integrations</span>
                            </a>
                            <a href="#payments" className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all">
                                <Wallet className="mr-3 h-4 w-4 flex-shrink-0" />
                                <span className="truncate">Payments</span>
                            </a>
                            <a href="#shipping" className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all">
                                <Package className="mr-3 h-4 w-4 flex-shrink-0" />
                                <span className="truncate">Shipping</span>
                            </a>
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-9 space-y-12">

                        {/* General Section */}
                        <section id="general" className="space-y-6 animate-fade-in-up opacity-0 stagger-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Settings2 className="h-5 w-5 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold">General</h2>
                            </div>

                            <div className="grid gap-6">


                                <Card className="surface-elevated border-border glow-hover transition-all duration-300">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Business Profile</CardTitle>
                                        <CardDescription>Public details visible to your customers.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <BusinessProfileForm
                                            sellerId={seller.id}
                                            initialBusinessName={seller.business_name}
                                            initialPhone={seller.phone}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Divider */}
                        <div className="border-t border-border" />

                        {/* Integrations Section */}
                        <section id="integrations" className="space-y-6 animate-fade-in-up opacity-0 stagger-5">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[#2AABEE]/10 rounded-lg">
                                    <MessageCircle className="h-5 w-5 text-[#2AABEE]" />
                                </div>
                                <h2 className="text-xl font-bold">Integrations</h2>
                            </div>

                            <Card className="surface-elevated border-border glow-hover transition-all duration-300">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg">Telegram Bot</CardTitle>
                                            <CardDescription>Manage orders, approve payments, and get instant alerts directly on Telegram.</CardDescription>
                                        </div>
                                        {profile?.telegram_chat_id && (
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                                <ShieldCheck className="w-3 h-3" /> Connected
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <TelegramConnect
                                        userId={user.id}
                                        initialChatId={profile?.telegram_chat_id || null}
                                        variant="inline"
                                    />
                                </CardContent>
                            </Card>
                        </section>

                        {/* Divider */}
                        <div className="border-t border-border" />

                        {/* Payments Section */}
                        <section id="payments" className="space-y-6 animate-fade-in-up opacity-0 stagger-5">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Wallet className="h-5 w-5 text-emerald-400" />
                                </div>
                                <h2 className="text-xl font-bold">Payments</h2>
                            </div>

                            <div className="grid gap-6">


                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* UPI */}
                                    <Card className="surface-elevated border-border glow-hover transition-all duration-300">
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <Zap className="h-5 w-5 text-emerald-400" />
                                                <CardTitle className="text-base">UPI Integration</CardTitle>
                                            </div>
                                            <CardDescription>Direct-to-bank instant transfers.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <UpdateUpiForm currentUpiId={seller.upi_id || ""} sellerId={seller.id} />
                                        </CardContent>
                                    </Card>

                                    {/* COD */}
                                    <Card className="surface-elevated border-border glow-hover transition-all duration-300">
                                        <CardHeader>
                                            <div className="flex items-center gap-3">
                                                <Store className="h-5 w-5 text-amber-400" />
                                                <CardTitle className="text-base">Cash on Delivery</CardTitle>
                                            </div>
                                            <CardDescription>Manage COD availability.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <CodToggle currentStatus={seller.cod_enabled || false} sellerId={seller.id} />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </section>

                        {/* Divider */}
                        <div className="border-t border-border" />

                        {/* Shipping Section */}
                        <section id="shipping" className="space-y-6 animate-fade-in-up opacity-0 stagger-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Package className="h-5 w-5 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold">Shipping</h2>
                            </div>

                            <Card className="surface-elevated border-border glow-hover transition-all duration-300">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-white/[0.04] rounded-xl flex items-center justify-center border border-border">
                                            <Package className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg">Shiprocket</CardTitle>
                                                {seller.shiprocket_token && (
                                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                                                        <ShieldCheck className="w-3 h-3" /> Active
                                                    </div>
                                                )}
                                            </div>
                                            <CardDescription>Automated shipping labels and tracking updates.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ShiprocketConnectForm isConnected={!!seller.shiprocket_token} />
                                </CardContent>
                            </Card>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
