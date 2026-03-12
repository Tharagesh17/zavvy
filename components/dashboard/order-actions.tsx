"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Truck, Eye, Check, X, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReceiptScanner } from "./receipt-scanner";
import { Badge } from "@/components/ui/badge";

interface OrderActionsProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    order: any;
}

export function OrderActions({ order }: OrderActionsProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    const isPaid = order.payment_status === 'paid' || order.payment_status === 'verified';
    const isNeedsReview = order.payment_status === 'needs_review' || order.payment_status === 'awaiting_approval';
    const isShipped = order.shipping_status === 'shipped' || !!order.awb_code || !!order.awb_number;

    const handleShip = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/orders/${order.id}/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'ship_now' })
            });
            const data = await res.json();

            if (data.success) {
                toast.success("Shipment Created Successfully!");
                router.refresh();
            } else {
                toast.error(data.error || "Failed to create shipment");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleApprovePayment = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/orders/${order.id}/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve_payment' })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Payment Approved!");
                setIsReviewOpen(false);
                router.refresh();
            } else {
                toast.error(data.error);
            }
        } catch {
            toast.error("Error approving payment");
        } finally {
            setLoading(false);
        }
    };

    const handleApproveCod = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/orders/${order.id}/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve_cod' })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("COD Order Approved!");
                router.refresh();
            } else {
                toast.error(data.error);
            }
        } catch {
            toast.error("Error approving COD order");
        } finally {
            setLoading(false);
        }
    };

    const handleRejectCod = async () => {
        if (!confirm("Are you sure you want to reject this COD order?")) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/orders/${order.id}/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject_cod' })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("COD Order Rejected");
                router.refresh();
            } else {
                toast.error(data.error);
            }
        } catch {
            toast.error("Error rejecting COD order");
        } finally {
            setLoading(false);
        }
    };

    if (isShipped) {
        const awb = order.awb_code || order.awb_number;
        return (
            <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                    {order.tracking_url ? (
                        <Button variant="outline" size="sm" asChild>
                            <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                                <Truck className="mr-2 h-3 w-3" />
                                Track
                            </a>
                        </Button>
                    ) : (
                        <Badge variant="outline" className="font-mono text-[10px] bg-slate-50">
                            AWB: {awb}
                        </Badge>
                    )}
                    {order.tracking_url && (
                        <Button variant="outline" size="sm" asChild>
                            <a href={`/api/orders/${order.id}/label`} target="_blank" rel="noopener noreferrer">
                                📄 Label
                            </a>
                        </Button>
                    )}
                </div>
                {order.courier_name && (
                    <span className="text-[10px] text-muted-foreground">via {order.courier_name}</span>
                )}
            </div>
        );
    }

    if (isPaid) {
        return (
            <div className="flex flex-col gap-2 min-w-[140px]">
                <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white w-full"
                    onClick={handleShip}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Package className="mr-2 h-3 w-3" />}
                    Shiprocket
                </Button>
                <ReceiptScanner 
                    orderId={order.id} 
                    buyerName={order.buyer_name} 
                    buyerPhone={order.buyer_phone}
                />
            </div>
        );
    }

    if (isNeedsReview) {
        return (
            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" variant="secondary" className="text-blue-600 bg-blue-50 hover:bg-blue-100">
                        <Eye className="mr-2 h-3 w-3" />
                        Review Proof
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verify Payment Proof</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="border rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center p-2">
                            {order.screenshot_url ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={order.screenshot_url} alt="Proof" className="max-h-[400px] object-contain" />
                            ) : (
                                <p className="text-sm text-muted-foreground p-8">No screenshot available</p>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleApprovePayment} disabled={loading}>
                                <Check className="mr-2 h-4 w-4" />
                                Approve Payment
                            </Button>
                            <Button variant="destructive" className="flex-1" disabled={loading}>
                                <X className="mr-2 h-4 w-4" />
                                Reject
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (order.payment_method === 'cod' && order.cod_status === 'pending_approval') {
        return (
            <div className="flex gap-2">
                <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleApproveCod}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="mr-2 h-3 w-3" />}
                    Approve COD
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleRejectCod}
                    disabled={loading}
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>
        );
    }

    return <span className="text-muted-foreground text-xs">-</span>;
}
