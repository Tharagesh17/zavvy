
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { joinWaitlist } from '@/app/actions';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WaitlistForm({ proCount }: { proCount: number }) {
    const [tier, setTier] = useState<'free' | 'pro'>('free');
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const proMax = 50;
    const isSoldOut = proCount >= proMax;
    const spotsLeft = Math.max(0, proMax - proCount);

    async function handleSubmit(formData: FormData) {
        formData.append('tier', tier);

        startTransition(async () => {
            const result = await joinWaitlist(formData);

            if (result.success) {
                toast.success(result.message);
                router.push(`/success?tier=${tier}`);
            } else {
                toast.error(result.error);
            }
        });
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            {/* Tier Selection */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* FREE TIER */}
                <div
                    onClick={() => setTier('free')}
                    className={`cursor-pointer border-2 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg min-h-[48px] ${tier === 'free'
                            ? 'border-teal-500 bg-teal-50 ring-4 ring-teal-500/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Free Tier</h3>
                            <p className="text-slate-500 text-sm">For growing sellers</p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-slate-900">₹0</span>
                            <span className="text-slate-500 text-sm">/mo</span>
                        </div>
                    </div>
                    <ul className="space-y-3 text-sm text-slate-600 mb-6">
                        <li className="flex gap-2">
                            <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0" />
                            <span>50 Orders / month</span>
                        </li>
                        <li className="flex gap-2">
                            <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0" />
                            <span>Basic Automation</span>
                        </li>
                        <li className="flex gap-2">
                            <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0" />
                            <span>Community Access</span>
                        </li>
                    </ul>
                </div>

                {/* PRO TIER */}
                <div
                    onClick={() => !isSoldOut && setTier('pro')}
                    className={`relative cursor-pointer border-2 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 min-h-[48px] ${isSoldOut
                            ? 'border-slate-100 bg-slate-50 opacity-70 cursor-not-allowed'
                            : tier === 'pro'
                                ? 'border-rose-500 bg-gradient-to-br from-rose-50 to-orange-50 ring-4 ring-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                                : 'border-slate-200 hover:border-rose-300 hover:shadow-lg hover:shadow-rose-100'
                        }`}
                >
                    {isSoldOut && (
                        <div className="absolute -top-3 -right-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                            SOLD OUT
                        </div>
                    )}
                    {!isSoldOut && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse">
                            🔥 {spotsLeft} SPOTS LEFT
                        </div>
                    )}

                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Join the Top 1%</h3>
                            <p className="text-slate-500 text-sm">For brands ready to scale</p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-rose-600">₹300</span>
                            <span className="text-slate-500 text-sm line-through ml-1">₹499</span>
                        </div>
                    </div>
                    <ul className="space-y-3 text-sm text-slate-600 mb-6">
                        <li className="flex gap-2">
                            <CheckCircle2 className="w-5 h-5 text-rose-500 flex-shrink-0" />
                            <span>Unlimited Orders</span>
                        </li>
                        <li className="flex gap-2">
                            <CheckCircle2 className="w-5 h-5 text-rose-500 flex-shrink-0" />
                            <span>Priority Support</span>
                        </li>
                        <li className="flex gap-2">
                            <CheckCircle2 className="w-5 h-5 text-rose-500 flex-shrink-0" />
                            <span>Founder Badge 🏅</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Form */}
            <form action={handleSubmit} className="max-w-md mx-auto space-y-4">
                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-slate-700">
                        Email Address
                    </label>
                    <Input
                        type="email"
                        name="email"
                        placeholder="you@brand.com"
                        required
                        className="h-12 bg-white"
                    />
                </div>

                <div className="pt-2">
                    <Button
                        disabled={isPending || (tier === 'pro' && isSoldOut)}
                        className={`w-full h-14 text-lg font-bold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${tier === 'pro'
                                ? 'bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 shadow-rose-300'
                                : 'bg-teal-600 hover:bg-teal-700 shadow-teal-200'
                            }`}
                    >
                        {isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : tier === 'pro' ? (
                            isSoldOut ? 'Sold Out' : 'Claim My Founder Spot — ₹300'
                        ) : (
                            'Join Waitlist (Free)'
                        )}
                    </Button>
                </div>

                <p className="text-xs text-center text-slate-500">
                    By joining, you agree to receive product updates.
                    {tier === 'pro' && ' Founder rate locked for life.'}
                </p>
            </form>
        </div>
    );
}
