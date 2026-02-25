"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Loader2 } from "lucide-react";

export function PaymentStatusPoller({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
    const [status, setStatus] = useState(currentStatus);

    useEffect(() => {
        // Already approved
        if (status === 'paid' || status === 'verified') return;

        const supabase = createClient();

        // Realtime subscription — instant updates
        const channel = supabase
            .channel(`order-status-${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`,
                },
                (payload) => {
                    const newStatus = payload.new.payment_status;
                    if (newStatus === 'paid' || newStatus === 'verified') {
                        setStatus(newStatus);
                    }
                    // Also check for rejected
                    if (payload.new.cod_status === 'rejected') {
                        setStatus('rejected');
                    }
                }
            )
            .subscribe();

        // Polling fallback — every 8 seconds
        const poll = setInterval(async () => {
            const { data } = await supabase
                .from('orders')
                .select('payment_status, cod_status')
                .eq('id', orderId)
                .single();

            if (data) {
                if (data.payment_status === 'paid' || data.payment_status === 'verified') {
                    setStatus(data.payment_status);
                    clearInterval(poll);
                }
                if (data.cod_status === 'rejected') {
                    setStatus('rejected');
                    clearInterval(poll);
                }
            }
        }, 8000);

        return () => {
            channel.unsubscribe();
            clearInterval(poll);
        };
    }, [orderId, status]);

    // Payment approved!
    if (status === 'paid' || status === 'verified') {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 py-8 animate-fade-in-up">
                <div className="relative">
                    <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                    <CheckCircle2 className="h-20 w-20 text-green-500 relative z-10" />
                </div>
                <div className="text-center space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Payment Confirmed! ✅</h2>
                    <p className="text-slate-400">Your order is being processed.</p>
                    <p className="text-slate-500 text-sm mt-2">You&apos;ll receive a shipping update via email.</p>
                </div>
                <div className="text-xs text-slate-600 font-mono">Order #{orderId.substring(0, 8)}</div>
            </div>
        );
    }

    // Rejected
    if (status === 'rejected') {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 py-8 animate-fade-in-up">
                <div className="text-center space-y-1">
                    <h2 className="text-2xl font-bold text-red-400 tracking-tight">Payment Not Approved</h2>
                    <p className="text-slate-400">The seller could not verify your payment.</p>
                    <p className="text-slate-500 text-sm mt-2">Please contact the seller or try again.</p>
                </div>
            </div>
        );
    }

    // Waiting state
    return (
        <div className="flex flex-col items-center justify-center space-y-4 py-6">
            <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                <Loader2 className="h-12 w-12 text-electric relative z-10 animate-spin" />
            </div>
            <div className="text-center space-y-1">
                <h2 className="text-lg font-bold text-white">Verifying your payment...</h2>
                <p className="text-slate-400 text-sm">This page updates automatically.</p>
                <p className="text-slate-600 text-xs mt-2">Don&apos;t close this page.</p>
            </div>
        </div>
    );
}
