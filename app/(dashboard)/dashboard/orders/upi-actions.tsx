"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link2, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface UpiActionsProps {
    orderId: string;
    paymentStatus: string;
    paymentMethod: string;
}

/**
 * UPI Actions Component
 * 
 * Provides UPI-specific actions for orders:
 * - Generate UPI deep link (for pending UPI orders)
 * - Mark as paid (manual confirmation)
 */
export function UpiActions({ orderId, paymentStatus, paymentMethod }: UpiActionsProps) {
    const [generatingLink, setGeneratingLink] = useState(false);
    const [markingPaid, setMarkingPaid] = useState(false);
    const router = useRouter();

    // Only show for UPI orders
    if (paymentMethod !== "manual_upi") {
        return null;
    }

    const handleGenerateLink = async () => {
        setGeneratingLink(true);
        try {
            const res = await fetch(`/api/upi/link?orderId=${orderId}`);
            const data = await res.json();

            if (res.ok && data.link) {
                // Copy to clipboard
                await navigator.clipboard.writeText(data.link);
                alert("✅ UPI link copied to clipboard! Share it with the buyer.");
            } else {
                alert(`❌ ${data.error || "Failed to generate UPI link"}`);
            }
        } catch {
            alert("❌ Network error. Please try again.");
        } finally {
            setGeneratingLink(false);
        }
    };

    const handleMarkPaid = async () => {
        if (!confirm("Confirm that you have received the payment?")) {
            return;
        }

        setMarkingPaid(true);
        try {
            const res = await fetch(`/api/orders/${orderId}/mark-paid`, {
                method: "POST",
            });

            if (res.ok) {
                alert("✅ Order marked as paid!");
                router.refresh();
            } else {
                const data = await res.json();
                alert(`❌ ${data.error || "Failed to mark as paid"}`);
            }
        } catch {
            alert("❌ Network error. Please try again.");
        } finally {
            setMarkingPaid(false);
        }
    };

    return (
        <>
            {paymentStatus === "pending" && (
                <>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-[11px] font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        onClick={handleGenerateLink}
                        disabled={generatingLink}
                    >
                        {generatingLink ? (
                            <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Link2 className="mr-1 h-3 w-3" />
                                UPI Link
                            </>
                        )}
                    </Button>

                    <Button
                        size="sm"
                        className="h-8 text-[11px] font-black uppercase tracking-wider bg-slate-900 hover:bg-black text-white px-4"
                        onClick={handleMarkPaid}
                        disabled={markingPaid}
                    >
                        {markingPaid ? (
                            <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                Marking...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Mark Paid
                            </>
                        )}
                    </Button>
                </>
            )}
        </>
    );
}
