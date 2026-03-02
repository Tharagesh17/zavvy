"use client"

import * as React from "react"
import { motion, useMotionValue, useSpring, useTransform, HTMLMotionProps } from "framer-motion"
import { ShoppingCart, Heart, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface MagicLinkCardProps extends HTMLMotionProps<"div"> {
    image?: string
    title?: string
    description?: string
    price?: string
    rating?: number
    reviewCount?: number
    badge?: string
    features?: Array<{ label: string; value: string }>
    onBuyNow?: () => void
}

export function MagicLinkCard({
    image = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=1000&fit=crop",
    title = "Premium Wireless Headphones",
    description = "Experience studio-quality sound with advanced noise cancellation and 30-hour battery life.",
    price = "₹1,999",
    rating = 4.8,
    reviewCount = 124,
    badge = "Verified Seller",
    features = [
        { label: "Delivery", value: "Available" },
        { label: "Payment", value: "UPI / COD" }
    ],
    className,
    onBuyNow,
    ...props
}: MagicLinkCardProps) {
    const [isFavorite, setIsFavorite] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    const cardRef = React.useRef<HTMLDivElement>(null)

    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const xSpring = useSpring(x, { stiffness: 300, damping: 30 })
    const ySpring = useSpring(y, { stiffness: 300, damping: 30 })

    const rotateX = useTransform(ySpring, [-0.5, 0.5], ["5deg", "-5deg"])
    const rotateY = useTransform(xSpring, [-0.5, 0.5], ["-5deg", "5deg"])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        x.set(mouseX / rect.width - 0.5)
        y.set(mouseY / rect.height - 0.5)
    }

    const handleMouseLeave = () => {
        x.set(0)
        y.set(0)
        setIsHovered(false)
    }

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className={cn(
                "relative w-full max-w-sm rounded-2xl bg-card text-card-foreground overflow-hidden",
                "shadow-2xl hover:shadow-primary/20 transition-shadow duration-500",
                "border border-border/50",
                className
            )}
            {...props}
        >
            {/* Image section */}
            <div className="relative aspect-[4/5] overflow-hidden">
                <motion.img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover"
                    animate={{ scale: isHovered ? 1.05 : 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Badge */}
                {badge && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                            "absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase",
                            "bg-primary/90 backdrop-blur-md text-primary-foreground flex items-center gap-1"
                        )}
                    >
                        <ShieldCheck className="w-3 h-3" />
                        {badge}
                    </motion.div>
                )}

                <motion.button
                    onClick={() => setIsFavorite(!isFavorite)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                        "absolute bottom-4 right-4 p-3 rounded-full backdrop-blur-sm border border-white/20 z-20",
                        isFavorite
                            ? "bg-red-500 text-white"
                            : "bg-white/20 text-white hover:bg-white/30"
                    )}
                >
                    <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
                </motion.button>
            </div>

            {/* Content section */}
            <div className="relative p-6 space-y-4 bg-background/95 backdrop-blur-md border-t border-white/10">
                <div className="space-y-1">
                    <h3 className="text-2xl font-bold leading-tight tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                        {title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="flex items-center gap-3 py-2">
                    <span className="text-3xl font-bold text-primary">{price}</span>
                </div>

                {features && features.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 pb-2">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-muted/30 border border-muted-foreground/20 rounded-lg p-3 text-center">
                                <div className="font-semibold text-sm">{feature.label}</div>
                                <div className="text-xs text-muted-foreground mt-1">{feature.value}</div>
                            </div>
                        ))}
                    </div>
                )}

                <motion.button
                    onClick={onBuyNow}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                        "w-full h-14 rounded-xl font-semibold text-lg",
                        "bg-gradient-to-r from-primary to-emerald-400",
                        "text-primary-foreground",
                        "shadow-lg shadow-primary/25",
                        "flex items-center justify-center gap-2",
                        "transition-all duration-300"
                    )}
                >
                    <ShoppingCart className="w-5 h-5" />
                    Buy Now via UPI
                </motion.button>
            </div>
        </motion.div>
    )
}
