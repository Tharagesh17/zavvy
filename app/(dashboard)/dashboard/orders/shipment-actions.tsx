"use client";

import { createShipmentForOrder } from "@/app/actions/shiprocket";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, ExternalLink, Loader2, Banknote, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReceiptScanner } from "@/components/dashboard/receipt-scanner";

interface Order {
    id: string;
    payment_status: string;
    payment_method?: string;
    cod_status?: string;
    awb_code?: string;
    courier_name?: string;
    tracking_url?: string;
    order_status?: string;
    awb_number?: string;
    buyer_name: string;
}

export function ShipmentActions({ order }: { order: Order }) {
    const [creating, setCreating] = useState(false);
    const router = useRouter();

    const isCod = order.payment_method === 'cod';
    const codApproved = order.cod_status === 'approved';
    const isPaid = order.payment_status === 'paid';

    const handleCreateShipment = async () => {
        if (!confirm("Create shipment for this order?")) return;

        setCreating(true);
        const result = await createShipmentForOrder(order.id);
        setCreating(false);

        if (result.ok) {
            alert("Shipment created successfully!");
            router.refresh();
        } else {
            alert(`Error: ${result.error}`);
        }
    };

    // Show "Create Shipment" button if:
    // - UPI order is paid and no shipment exists, OR
    // - COD order is approved and no shipment exists
    const canCreateShipment = !order.awb_code && !order.awb_number && (isPaid || (isCod && codApproved));

    if (canCreateShipment) {
        return (
            <div className="flex flex-col items-center gap-2">
                <Button
                    size="sm"
                    onClick={handleCreateShipment}
                    disabled={creating}
                    className="gap-2 w-full"
                >
                    {creating ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <Package className="h-4 w-4" />
                            Create Shipment
                        </>
                    )}
                </Button>
                {/* Inject OCR Scanner Component next to standard flow */}
                <div className="mt-2 text-center text-xs text-muted-foreground flex w-full flex-col gap-2">
                    <span className="w-full text-center">or</span>
                    <ReceiptScanner orderId={order.id} buyerName={order.buyer_name} />
                </div>
            </div>
        );
    }

    // Show AWB code and tracking button if shipment exists
    const displayAwb = order.awb_code || order.awb_number;

    // Adjust logic to use manually updated OCR AWB or Shiprocket AWB
    if (displayAwb) {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                        <Truck className="h-3 w-3 mr-1" />
                        AWB: {displayAwb}
                    </Badge>
                </div>
                {order.courier_name && (
                    <p className="text-xs text-muted-foreground">
                        via {order.courier_name}
                    </p>
                )}
                {/* COD Collection Status */}
                {isCod && (
                    <div className="mt-1">
                        {order.payment_status === 'paid' ? (
                            <Badge className="bg-green-500 hover:bg-green-600 border-0 text-[10px] font-black tracking-wide uppercase px-2 py-0.5">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                COD Collected
                            </Badge>
                        ) : order.order_status === 'delivered' ? (
                            <Badge className="bg-orange-500 hover:bg-orange-600 border-0 text-[10px] font-black tracking-wide uppercase px-2 py-0.5">
                                <Clock className="mr-1 h-3 w-3" />
                                Awaiting Remittance
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5 border-amber-300 text-amber-600">
                                <Banknote className="mr-1 h-3 w-3" />
                                COD Pending
                            </Badge>
                        )}
                    </div>
                )}
                {order.tracking_url && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(order.tracking_url, "_blank")}
                        className="gap-2"
                    >
                        <ExternalLink className="h-3 w-3" />
                        Track Shipment
                    </Button>
                )}
            </div>
        );
    }

    return null;
}
