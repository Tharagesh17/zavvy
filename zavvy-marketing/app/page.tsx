
import { getProCount } from './actions';
import WaitlistForm from '@/components/waitlist-form';
import RevenueCalculator from '@/components/revenue-calculator';
import { Store, Zap, Trophy } from 'lucide-react';

export const revalidate = 0; // Disable static caching so counter is fresh

export default async function Home() {
    const proCount = await getProCount();

    return (
        <main className="min-h-screen bg-slate-50 selection:bg-teal-100 selection:text-teal-900">
            {/* Hero */}
            <div className="relative overflow-hidden pt-12 pb-20 lg:pt-20">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <span className="inline-block py-1 px-3 rounded-full bg-teal-100 text-teal-700 text-xs font-bold tracking-wide uppercase mb-6">
                            Coming Soon to India 🇮🇳
                        </span>
                        <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.1]">
                            Your Instagram Business, <span className="text-teal-600">Now on Autopilot</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
                            Professional storefronts, AI-powered WhatsApp, and 1-click shipping for the modern Indian creator.
                        </p>
                    </div>

                    <RevenueCalculator />

                    <WaitlistForm proCount={proCount} />

                    {/* Social Proof / Trust */}
                    <div className="mt-20 pt-10 border-t border-slate-200 grid md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center mb-4 text-teal-600">
                                <Store className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-900">24/7 Professional Storefront</h3>
                            <p className="text-sm text-slate-500">Never miss a sale, even while you sleep</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-4 text-rose-600">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-900">Zero Manual Work</h3>
                            <p className="text-sm text-slate-500">AI handles orders, payments, shipping</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-4 text-amber-600">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-900">Join the Top 1%</h3>
                            <p className="text-sm text-slate-500">Elite Instagram seller community</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
