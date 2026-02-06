'use client';

import { useState } from 'react';
import { TrendingUp, Clock, Sparkles } from 'lucide-react';

export default function RevenueCalculator() {
    const [orders, setOrders] = useState(100);

    // Calculations
    const hoursPerOrder = 5 / 60; // 5 minutes per manual order
    const hoursSaved = Math.round(orders * hoursPerOrder * 10) / 10;
    const assistantCostPerHour = 150; // ₹150/hour for virtual assistant
    const moneySaved = Math.round(hoursSaved * assistantCostPerHour);

    return (
        <div className="w-full max-w-4xl mx-auto my-16 p-8 bg-gradient-to-br from-teal-50 via-white to-rose-50 rounded-3xl border border-slate-200 shadow-xl">
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-bold mb-4">
                    <Sparkles className="w-4 h-4" />
                    See Your Savings
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
                    How Much Time Will Zavvy Save You?
                </h2>
                <p className="text-slate-600">
                    Drag the slider to see your monthly savings
                </p>
            </div>

            {/* Slider */}
            <div className="mb-10">
                <label htmlFor="order-slider" className="block text-sm font-medium text-slate-700 mb-3">
                    Monthly Orders: <span className="text-2xl font-bold text-teal-600">{orders}</span>
                </label>
                <input
                    id="order-slider"
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={orders}
                    onChange={(e) => setOrders(Number(e.target.value))}
                    className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 hover:accent-teal-700 transition-all"
                    aria-label="Monthly order volume slider"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>10 orders</span>
                    <span>1,000 orders</span>
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Time Saved */}
                <div className="bg-white rounded-2xl p-6 shadow-md border border-teal-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Time Saved</p>
                            <p className="text-3xl font-extrabold text-teal-600">
                                {hoursSaved}h
                            </p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-600">
                        per month on manual order processing
                    </p>
                </div>

                {/* Money Saved */}
                <div className="bg-white rounded-2xl p-6 shadow-md border border-rose-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-rose-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Money Saved</p>
                            <p className="text-3xl font-extrabold text-rose-600">
                                ₹{moneySaved.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-600">
                        in assistant costs (₹150/hr rate)
                    </p>
                </div>
            </div>

            {/* Professional Credibility */}
            <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                <p className="text-center text-sm text-slate-700">
                    <span className="font-bold text-amber-700">Bonus:</span> Professional storefront + AI WhatsApp =
                    <span className="font-bold"> 3x higher customer trust</span> 🏆
                </p>
            </div>
        </div>
    );
}
