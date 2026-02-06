
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Star } from 'lucide-react';

export default function SuccessPage({ searchParams }: { searchParams: { tier?: string } }) {
    const isPro = searchParams.tier === 'pro';

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 animate-bounce ${isPro ? 'bg-rose-100 text-rose-600' : 'bg-teal-100 text-teal-600'}`}>
                    {isPro ? <Star className="w-10 h-10 fill-current" /> : <CheckCircle2 className="w-10 h-10" />}
                </div>

                <h1 className="text-3xl font-extrabold text-slate-900">
                    {isPro ? "You're a Zavvy Founder! 🚀" : "You're on the list! 🎉"}
                </h1>

                <p className="text-lg text-slate-600">
                    {isPro
                        ? "Congratulations! You've secured the ₹300 early-bird rate. We sent a confirmation email with your Founder details."
                        : "Thanks for joining. We've sent a welcome email to your inbox."
                    }
                </p>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-8">
                    <p className="font-semibold text-slate-900 mb-2">Check your email</p>
                    <p className="text-sm text-slate-500 mb-4">
                        If you don't see it, check your spam or promotions folder.
                    </p>
                    <p className="text-xs text-slate-400">
                        From: jayasukuv11@gmail.com
                    </p>
                </div>

                <div className="pt-8">
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/">Back to Home</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
