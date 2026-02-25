"use client";

import { Button } from "@/components/ui/button";
import { ShieldCheck, Smartphone, Copy, Check } from "lucide-react";
import { CountdownTimer } from "./countdown-timer";
import { UtrUpload } from "./utr-upload";
import { useIsMobile } from "./use-is-mobile";
import { useState } from "react";

interface UpiPaymentSectionProps {
    upiUrl: string;
    upiId: string;
    qrUrl: string;
    orderId: string;
    displayAmount: string;
}

export function UpiPaymentSection({ upiUrl, upiId, qrUrl, orderId, displayAmount }: UpiPaymentSectionProps) {
    const isMobile = useIsMobile();
    const [showUpi, setShowUpi] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(upiId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePayIntent = () => {
        window.location.href = upiUrl;
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white/10 text-white flex items-center justify-center">
                        <span className="text-xs font-bold">UPI</span>
                    </div>
                    <h3 className="font-bold text-lg">
                        {isMobile ? "Pay via UPI" : "Scan & Pay"}
                    </h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold uppercase tracking-wider">
                    Zero Fees
                </div>
            </div>

            <div className="flex flex-col items-center space-y-6">

                {/* Countdown Timer */}
                <CountdownTimer durationMinutes={15} />

                {/* Amount Display */}
                <div className="w-full p-4 bg-black/30 rounded-xl border border-white/5 text-center">
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">
                        Pay Exactly
                    </p>
                    <p className="text-3xl font-black text-white tracking-tight">
                        ₹{displayAmount}
                    </p>
                    <p className="text-slate-600 text-[10px] mt-1">
                        Exact amount required for verification
                    </p>
                </div>

                {isMobile ? (
                    /* Mobile: UPI Intent Button */
                    <Button
                        onClick={handlePayIntent}
                        className="w-full h-14 text-base font-bold bg-gradient-to-r from-[#0070f3] to-[#0050d0] hover:from-[#0060e0] hover:to-[#0040c0] text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/40"
                    >
                        <Smartphone className="mr-2 h-5 w-5" />
                        Pay ₹{displayAmount} via UPI App
                    </Button>
                ) : (
                    /* Desktop: QR Code */
                    <div className="relative p-4 bg-white rounded-2xl shadow-2xl shadow-black/50 group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#0070f3]/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrUrl} alt="UPI QR" className="h-52 w-52 relative z-10" />
                    </div>
                )}

                {/* UPI ID — Hidden by default, toggle to show */}
                <div className="w-full">
                    <button
                        onClick={() => setShowUpi(!showUpi)}
                        className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors py-2"
                    >
                        {showUpi ? 'Hide UPI ID' : 'Need UPI ID for manual payment? Tap to reveal'}
                    </button>
                    {showUpi && (
                        <div className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/5 mt-2">
                            <code className="text-sm text-slate-300 font-mono">{upiId}</code>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-[#0070f3] hover:text-white hover:bg-[#0070f3]/20"
                                onClick={handleCopy}
                            >
                                {copied ? (
                                    <><Check className="mr-1 h-3 w-3" /> Copied!</>
                                ) : (
                                    <><Copy className="mr-1 h-3 w-3" /> Copy</>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* UTR Section */}
                <div className="w-full space-y-3 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                            Submit UPI Transaction ID to Verify
                        </span>
                    </div>
                    <UtrUpload orderId={orderId} />
                </div>
            </div>
        </div>
    );
}
