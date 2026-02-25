"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ProductImageGalleryProps {
    images: string[];
    productName: string;
    stock: number;
}

export function ProductImageGallery({ images, productName, stock }: ProductImageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const activeImage = images[activeIndex];

    if (!images.length) {
        return (
            <div className="relative aspect-square bg-white/[0.03] flex items-center justify-center rounded-2xl border border-white/5">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                    </div>
                    <span className="text-sm text-white/30 font-medium">No preview available</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Main Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/[0.03] border border-white/5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={activeImage}
                            alt={productName}
                            className="w-full h-full object-cover"
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Gradient overlay at bottom for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                {/* Stock badge */}
                {stock <= 5 && stock > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Badge
                            variant="destructive"
                            className="absolute top-4 left-4 shadow-lg shadow-red-500/20 font-semibold px-3 py-1 text-xs"
                        >
                            Only {stock} left
                        </Badge>
                    </motion.div>
                )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-1">
                    {images.map((img, idx) => (
                        <motion.button
                            key={idx}
                            onClick={() => setActiveIndex(idx)}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                                "relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all duration-300",
                                "border-2",
                                activeIndex === idx
                                    ? "border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10 scale-105"
                                    : "border-white/10 opacity-60 hover:opacity-90 hover:border-white/20"
                            )}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={img}
                                alt={`${productName} ${idx + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </motion.button>
                    ))}
                </div>
            )}
        </div>
    );
}
