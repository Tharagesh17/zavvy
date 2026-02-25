"use client";

import { motion } from "framer-motion";
import { Link2, Layout, ShieldCheck, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
    {
        title: "The Magic Link",
        description: "One link to rule them all. Auto-generates high-converting WhatsApp marketing text and shortcodes.",
        icon: <Link2 className="w-6 h-6" />,
        className: "md:col-span-2 lg:col-span-2 bg-gradient-to-br from-blue-500/10 to-transparent",
        visual: (
            <div className="mt-4 p-4 rounded-lg bg-black/40 border border-white/10 font-mono text-xs text-blue-400">
                <p className="opacity-50 mb-2">{/* // Auto-generated text */}</p>
                <p>Hey! Check out our new collection:</p>
                <p>✨ Neon Cropped Hoodie - ₹999</p>
                <p className="mt-2 text-white underline">zavvy.co/l/Ab12Zz</p>
            </div>
        )
    },
    {
        title: "Studio Storefront",
        description: "Premium public pages that make your brand look like a million bucks.",
        icon: <Layout className="w-6 h-6" />,
        className: "md:col-span-1 lg:col-span-1",
    },
    {
        title: "Payment Trust",
        description: "Penny Drop verification & Direct UPI + Razorpay automation built-in.",
        icon: <ShieldCheck className="w-6 h-6" />,
        className: "md:col-span-1 lg:col-span-1",
    },
    {
        title: "Logistics Squad",
        description: "Shiprocket to AWB in 10 seconds. Payment → Label automation while you sleep.",
        icon: <Truck className="w-6 h-6" />,
        className: "md:col-span-2 lg:col-span-2 bg-gradient-to-bl from-indigo-500/10 to-transparent",
        visual: (
            <div className="mt-6 flex items-center justify-between gap-4">
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "100%" }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    />
                </div>
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest whitespace-nowrap">AWB Generated</div>
            </div>
        )
    }
];

export function LandingBentoGrid() {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="container px-4 mx-auto">
                <div className="mb-16 text-center lg:text-left lg:max-w-2xl">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 font-heading">
                        Built for the <span className="text-primary italic">Grind</span>
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Standard e-commerce is too slow for Instagram. Zavvy is built for speed, trust, and zero manual work.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className={cn(
                                "group relative p-8 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden transition-all hover:bg-white/[0.07] hover:border-white/20",
                                feature.className
                            )}
                        >
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-500 border border-primary/20">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3 font-heading text-white">{feature.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-6">{feature.description}</p>
                                <div className="mt-auto">
                                    {feature.visual}
                                </div>
                            </div>

                            {/* Background gradient flare */}
                            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/10 transition-colors" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
