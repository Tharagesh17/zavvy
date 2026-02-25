"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Circle, MessageCircle, CreditCard, Package, Share2 } from "lucide-react";
import Link from "next/link";

interface ChecklistStep {
    id: string;
    label: string;
    description: string;
    completed: boolean;
    href?: string;
    icon: React.ReactNode;
}

export function OnboardingChecklist() {
    const [steps, setSteps] = useState<ChecklistStep[]>([]);
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if dismissed
        if (typeof window !== 'undefined' && localStorage.getItem('zavvy-onboarding-dismissed') === 'true') {
            setDismissed(true);
            setLoading(false);
            return;
        }

        checkProgress();
    }, []);

    async function checkProgress() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: profile } = await supabase
            .from('profiles')
            .select('telegram_chat_id')
            .eq('id', user.id)
            .single();

        const { data: seller } = await supabase
            .from('sellers')
            .select('id, upi_id')
            .eq('user_id', user.id)
            .single();

        let hasProducts = false;
        let hasLinks = false;

        if (seller) {
            const { count: productCount } = await supabase
                .from('products')
                .select('id', { count: 'exact', head: true })
                .eq('seller_id', seller.id);
            hasProducts = (productCount || 0) > 0;

            const { count: linkCount } = await supabase
                .from('product_links')
                .select('id', { count: 'exact', head: true })
                .eq('seller_id', seller.id);
            hasLinks = (linkCount || 0) > 0;
        }

        const checklist: ChecklistStep[] = [
            {
                id: 'telegram',
                label: 'Connect Telegram',
                description: 'Link your Telegram to receive order notifications',
                completed: !!profile?.telegram_chat_id,
                href: '/dashboard/settings',
                icon: <MessageCircle className="h-4 w-4" />,
            },
            {
                id: 'upi',
                label: 'Set UPI ID',
                description: 'Add your UPI ID to accept payments',
                completed: !!seller?.upi_id,
                href: '/dashboard/settings',
                icon: <CreditCard className="h-4 w-4" />,
            },
            {
                id: 'product',
                label: 'Add a Product',
                description: 'Create your first product listing',
                completed: hasProducts,
                href: '/dashboard/products',
                icon: <Package className="h-4 w-4" />,
            },
            {
                id: 'link',
                label: 'Share a Link',
                description: 'Generate and share your first checkout link',
                completed: hasLinks,
                href: '/dashboard/products',
                icon: <Share2 className="h-4 w-4" />,
            },
        ];

        setSteps(checklist);
        setLoading(false);

        // Auto-dismiss if all complete
        if (checklist.every(s => s.completed)) {
            setTimeout(() => {
                localStorage.setItem('zavvy-onboarding-dismissed', 'true');
                setDismissed(true);
            }, 5000);
        }
    }

    const handleDismiss = () => {
        localStorage.setItem('zavvy-onboarding-dismissed', 'true');
        setDismissed(true);
    };

    if (loading || dismissed) return null;

    const completedCount = steps.filter(s => s.completed).length;
    const allDone = completedCount === steps.length;
    const progress = (completedCount / steps.length) * 100;

    return (
        <div className="rounded-xl border border-border bg-white/[0.02] p-5 mb-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-bold text-foreground text-sm">
                        {allDone ? '🎉 All Set!' : '🚀 Getting Started'}
                    </h3>
                    <p className="text-muted-foreground text-xs mt-0.5">
                        {allDone
                            ? 'Your store is ready to accept orders!'
                            : `${completedCount} of ${steps.length} steps completed`}
                    </p>
                </div>
                <button
                    onClick={handleDismiss}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    Dismiss
                </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-white/[0.05] rounded-full mb-4 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                        width: `${progress}%`,
                        background: allDone
                            ? 'linear-gradient(to right, #10b981, #059669)'
                            : 'linear-gradient(to right, #0070f3, #6366f1)',
                    }}
                />
            </div>

            {/* Steps */}
            <div className="space-y-2">
                {steps.map((step) => (
                    <Link
                        key={step.id}
                        href={step.href || '#'}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${step.completed
                                ? 'bg-white/[0.02] opacity-60'
                                : 'bg-white/[0.03] hover:bg-white/[0.06] border border-transparent hover:border-white/10'
                            }`}
                    >
                        <div className={`flex-shrink-0 ${step.completed ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                            {step.completed
                                ? <CheckCircle2 className="h-5 w-5" />
                                : <Circle className="h-5 w-5" />
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${step.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {step.label}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                        </div>
                        <div className="flex-shrink-0 text-muted-foreground">
                            {step.icon}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
