"use client";

import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const tiers = [
    {
        name: "Basic",
        price: "₹0",
        description: "Perfect for testing the waters.",
        features: [
            "100 Transaction Limit",
            "Direct UPI QR Flow",
            "Basic Analytics",
            "Manual Shipping",
            "Standard Storefront"
        ],
        cta: "Start for Free",
        popular: false
    },
    {
        name: "Pro",
        price: "₹299",
        description: "For serious brands ready to scale.",
        features: [
            "No Transaction Limits",
            "Razorpay Automation",
            "Advanced 'Studio' UI",
            "Shiprocket API Direct",
            "Founder Status Badge",
            "Priority Pincode Logic"
        ],
        cta: "Claim Founder Status",
        popular: true
    }
];

export function TierComparison() {
    return (
        <section id="pricing" className="py-24 bg-black/50">
            <div className="container px-4 mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 font-heading">Pick Your <span className="text-primary">Vibe</span></h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        Founder pricing is limited to the first 50 sellers. Lock it in for life.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {tiers.map((tier, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative p-8 rounded-[2.5rem] border ${tier.popular
                                    ? "border-primary bg-primary/5 shadow-2xl shadow-primary/20"
                                    : "border-white/10 bg-white/5"
                                } backdrop-blur-xl`}
                        >
                            {tier.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-black font-black text-[10px] uppercase tracking-[0.2em] px-6 py-2 rounded-full">
                                    Experimental Rate
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-2xl font-bold mb-2 font-heading">{tier.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black">{tier.price}</span>
                                    <span className="text-muted-foreground">/mo</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-4">{tier.description}</p>
                            </div>

                            <div className="space-y-4 mb-10">
                                {tier.features.map((feat, fIdx) => (
                                    <div key={fIdx} className="flex items-center gap-3">
                                        <div className={`p-1 rounded-full ${tier.popular ? "bg-primary text-black" : "bg-white/10 text-white"}`}>
                                            <Check className="w-3 h-3 stroke-[3px]" />
                                        </div>
                                        <span className="text-sm font-medium">{feat}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                variant={tier.popular ? "default" : "outline"}
                                className={`w-full h-14 rounded-2xl font-bold text-lg group ${tier.popular ? "shadow-lg shadow-primary/20" : "border-white/10 hover:bg-white/5"
                                    }`}
                            >
                                {tier.cta}
                                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
