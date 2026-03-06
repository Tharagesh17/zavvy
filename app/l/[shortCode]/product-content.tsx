"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BadgeCheck } from "lucide-react";

interface ProductContentProps {
    product: {
        name: string;
        description: string | null;
        price: number;
        variants: Record<string, unknown> | null;
    };
    seller: {
        business_name: string | null;
        logo_url: string | null;
    } | null;
    shortCode: string;
}

function parseVariantValues(val: unknown): string[] {
    if (typeof val === "string") {
        return val.split(",").map(v => v.trim()).filter(Boolean);
    }
    if (Array.isArray(val)) return val.map(String);
    return [];
}

export function ProductContent({ product, seller, shortCode }: ProductContentProps) {
    const priceInr = product.price / 100;
    const sellerLogo = seller?.logo_url || null;
    const sellerName = seller?.business_name || "Store";

    // Parse variants: { "Size": "S, M, L", "Color": "Red, Blue" }
    const variantEntries = product.variants
        ? Object.entries(product.variants)
            .map(([key, val]) => ({ key, values: parseVariantValues(val) }))
            .filter(v => v.values.length > 0)
        : [];

    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        variantEntries.forEach(v => { initial[v.key] = v.values[0]; });
        return initial;
    });

    const checkoutUrl = (() => {
        const base = `/l/${shortCode}/checkout`;
        if (Object.keys(selectedVariants).length === 0) return base;
        const params = new URLSearchParams();
        Object.entries(selectedVariants).forEach(([k, v]) => params.set(`v_${k}`, v));
        return `${base}?${params.toString()}`;
    })();

    return (
        <div className="px-6 pb-6 pt-2 space-y-5">

            {/* Product Name */}
            <h1 className="text-[22px] font-bold text-white leading-tight tracking-tight">
                {product.name}
            </h1>

            {/* Price - Oversized */}
            <div className="flex items-baseline gap-3">
                <span
                    className="text-[42px] font-black tracking-tighter leading-none"
                    style={{
                        background: "linear-gradient(135deg, #ffffff 0%, #3B82F6 50%, #60a5fa 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}
                >
                    ₹{priceInr.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                </span>
            </div>

            {/* Description */}
            {product.description && (
                <p className="text-[14px] text-white/50 leading-relaxed font-normal">
                    {product.description}
                </p>
            )}

            {/* Variant Selectors */}
            {variantEntries.length > 0 && (
                <div className="space-y-4">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    {variantEntries.map(({ key, values }) => (
                        <div key={key} className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/40">
                                    {key}
                                </span>
                                <span className="text-xs text-primary/70 font-medium">
                                    {selectedVariants[key]}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {values.map((val) => {
                                    const isSelected = selectedVariants[key] === val;
                                    return (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setSelectedVariants(prev => ({ ...prev, [key]: val }))}
                                            className={cn(
                                                "px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                                "border",
                                                isSelected
                                                    ? "bg-primary/15 border-primary/40 text-white shadow-sm shadow-primary/10"
                                                    : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:bg-white/[0.06] hover:text-white/70 hover:border-white/15"
                                            )}
                                        >
                                            {val}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Seller info */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                {sellerLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={sellerLogo}
                        alt={sellerName}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20 ring-offset-2 ring-offset-[#080808]"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-blue-400/20 flex items-center justify-center ring-2 ring-primary/10 ring-offset-2 ring-offset-[#080808]">
                        <span className="text-sm font-bold text-primary">
                            {sellerName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white truncate">{sellerName}</span>
                        <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                    </div>
                    <span className="text-[11px] text-white/35 font-medium">Verified Seller</span>
                </div>
            </div>

            {/* Buy Now Button */}
            <Link
                href={checkoutUrl}
                className="group relative flex items-center justify-center w-full h-14 rounded-2xl font-semibold text-white text-[15px] tracking-wide overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
                <div
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{ background: "linear-gradient(135deg, #3B82F6 0%, #2563eb 50%, #1d4ed8 100%)" }}
                />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "linear-gradient(135deg, #60a5fa 0%, #3B82F6 50%, #2563eb 100%)" }}
                />
                <div
                    className="absolute -inset-1 rounded-2xl opacity-40 blur-xl -z-10"
                    style={{ background: "#3B82F6" }}
                />
                <span className="relative z-10 flex items-center gap-2">
                    Buy Now
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
                        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                    </svg>
                </span>
            </Link>
        </div>
    );
}
