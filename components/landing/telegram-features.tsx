import { Bot, Zap, BadgeIndianRupee, MessageSquare, ShieldCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function TelegramFeatures() {
    const features = [
        {
            name: "Snap to Ship (Smart Smart OCR)",
            description: "Just send a photo of the courier receipt. Zavvy auto-extracts the AWB number, matches the order, and notifies the buyer instantly.",
            icon: MessageSquare,
            className: "md:col-span-2 bg-gradient-to-br from-primary/10 to-transparent",
        },
        {
            name: "Instant Approvals",
            description: "Approve COD orders and verify manual UPI payments with a single tap. No need to open laptops or log into dashboards.",
            icon: BadgeIndianRupee,
            className: "md:col-span-1 bg-gradient-to-br from-emerald-500/10 to-transparent",
        },
        {
            name: "Create Products in Chat",
            description: "Send a photo, type the price, and your product is live. Managing your catalog has never been this effortless.",
            icon: Bot,
            className: "md:col-span-1 bg-gradient-to-br from-indigo-500/10 to-transparent",
        },
        {
            name: "Inventory & Alerts",
            description: "Get real-time 'Sold Out' alerts. Update prices or add stock using quick inline buttons directly inside Telegram.",
            icon: Zap,
            className: "md:col-span-2 bg-gradient-to-br from-orange-500/10 to-transparent",
        },
    ];

    return (
        <section className="py-24 relative overflow-hidden" id="features">
            <div className="container px-4 mx-auto">
                <div className="flex flex-col items-center text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                        <Zap className="w-4 h-4" />
                        Built for Social Sellers
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black font-heading tracking-tight text-white max-w-2xl">
                        Everything you need to <span className="text-primary italic">automate</span> your orders.
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-xl">
                        Zavvy handles the chaos so you can focus on growing your brand. 100% free to start.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {features.map((feature) => (
                        <div
                            key={feature.name}
                            className={cn(
                                "group relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-white/5",
                                feature.className
                            )}
                        >
                            <div className="absolute -right-10 -top-10 z-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-all group-hover:bg-primary/20" />

                            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                                <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                                    <feature.icon className="h-7 w-7 text-primary" />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold tracking-tight text-white">
                                        {feature.name}
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trust Indicators */}
                <div className="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-60">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" />
                        <span className="text-sm font-semibold tracking-wide">Bank-Grade Security</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        <span className="text-sm font-semibold tracking-wide">99.9% Uptime</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
