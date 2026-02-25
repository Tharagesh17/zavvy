import { createServiceRoleClient } from "@/lib/supabase/server";
import { fetchTracking } from "@/app/actions/shiprocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, CheckCircle2, MapPin, Clock } from "lucide-react";
import { notFound } from "next/navigation";

export default async function TrackingPage({
    params,
}: {
    params: Promise<{ orderId: string }>;
}) {
    const { orderId } = await params;

    const admin = createServiceRoleClient();
    const { data: order } = await admin
        .from("orders")
        .select("*, product:products(name)")
        .eq("id", orderId)
        .single();

    if (!order) notFound();

    let tracking = null;
    let trackingError = null;

    if (order.awb_code) {
        try {
            tracking = await fetchTracking(orderId);
        } catch (err: unknown) {
            trackingError = err instanceof Error ? err.message : "Tracking fetch failed";
            console.error("Tracking fetch failed:", err);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Order Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Order Tracking
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Order ID</p>
                                <p className="font-mono font-semibold">{order.id.substring(0, 8)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Product</p>
                                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                                {/* @ts-ignore */}
                                <p className="font-semibold">{order.product.name}</p>
                            </div>
                            {order.awb_code && (
                                <>
                                    <div>
                                        <p className="text-muted-foreground">AWB Code</p>
                                        <p className="font-mono font-semibold">{order.awb_code}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Courier</p>
                                        <p className="font-semibold">{order.courier_name || "N/A"}</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {order.tracking_status && (
                            <Badge variant="default" className="text-sm">
                                {order.tracking_status}
                            </Badge>
                        )}
                    </CardContent>
                </Card>

                {/* Tracking Timeline */}
                {tracking && tracking.tracking_data && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5" />
                                Tracking Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {tracking.tracking_data.shipment_track_activities?.map(
                                    (activity: { activity?: string; location?: string; date?: string }, index: number) => (
                                        <div key={index} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    {index === 0 ? (
                                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                                    ) : (
                                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                                {index < tracking.tracking_data.shipment_track_activities.length - 1 && (
                                                    <div className="w-0.5 h-12 bg-border" />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <p className="font-semibold text-sm">{activity.activity}</p>
                                                <p className="text-xs text-muted-foreground">{activity.location}</p>
                                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {activity.date ? new Date(activity.date).toLocaleString() : "—"}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* No Shipment Created */}
                {!order.awb_code && (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                                Shipment not created yet. Please wait for seller to ship your order.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Tracking Error */}
                {trackingError && order.awb_code && (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <Package className="h-12 w-12 mx-auto text-orange-500 mb-4" />
                            <p className="text-muted-foreground mb-2">
                                Unable to fetch tracking details at the moment.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                AWB: {order.awb_code}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
