"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface CodStatusPollerProps {
    orderId: string;
    currentCodStatus: string;
}

export function CodStatusPoller({ orderId, currentCodStatus }: CodStatusPollerProps) {
    const router = useRouter();

    useEffect(() => {
        // Only poll if still pending
        if (currentCodStatus !== "pending_approval") return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/orders/${orderId}/status`);
                if (!res.ok) return;
                const { cod_status } = await res.json();

                // If status changed, refresh the page to show new state
                if (cod_status !== currentCodStatus) {
                    router.refresh();
                }
            } catch {
                // Silently ignore network errors
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [orderId, currentCodStatus, router]);

    return null; // Invisible component
}
