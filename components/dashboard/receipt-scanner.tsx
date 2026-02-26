"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ScanLine, X, Check, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { OcrExtractionResult } from "@/lib/gemini";

interface ReceiptScannerProps {
    orderId: string;
    buyerName: string;
}

export function ReceiptScanner({ orderId, buyerName }: ReceiptScannerProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [isScanning, setIsScanning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [scanResult, setScanResult] = useState<OcrExtractionResult | null>(null);

    // Editable form state after scan
    const [awb, setAwb] = useState("");
    const [courier, setCourier] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            // Reset previous state
            setScanResult(null);
            setAwb("");
            setCourier("");
        }
    };

    const handleScan = async () => {
        if (!file) return;

        setIsScanning(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/ocr", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            const data = (await res.json()) as OcrExtractionResult;
            setScanResult(data);

            if (data.metadata.extraction_status === "SUCCESS") {
                setAwb(data.order_details.awb_number);
                setCourier(data.order_details.courier_name);
                toast.success("Receipt scanned successfully!");
            } else {
                toast.error("Could not read receipt clearly. Please enter details manually.");
            }
        } catch (error: unknown) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to scan receipt");
        } finally {
            setIsScanning(false);
        }
    };

    const handleSave = async () => {
        if (!awb) {
            toast.error("Tracking number (AWB) is required");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`/api/orders/${orderId}/actions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "update_tracking",
                    awb_number: awb,
                    courier_name: courier,
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Tracking updated and order marked as shipped");
                setIsOpen(false);
                router.refresh();
            } else {
                toast.error(data.error || "Failed to save tracking");
            }
        } catch {
            toast.error("Network error saving tracking");
        } finally {
            setIsSaving(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPreviewUrl(null);
        setScanResult(null);
        setAwb("");
        setCourier("");
    };

    // WhatsApp Intent Generator
    const generateWhatsAppMessage = () => {
        const text = `Hi ${buyerName},\n\nYour order has been shipped!\nCourier: ${courier || "Our Delivery Partner"}\nTracking ID (AWB): ${awb}\n\nTrack your package here:\n${courier.toLowerCase().includes("shiprocket")
            ? `https://shiprocket.co/tracking/${awb}`
            : "Check tracking on courier website."
            }`;
        return encodeURIComponent(text);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) reset();
        }}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800">
                    <ScanLine className="h-4 w-4" />
                    Scan Receipt
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Scan Shipping Receipt</DialogTitle>
                    <DialogDescription>
                        Upload a photo of the courier receipt (e.g., DTDC, India Post) to auto-extract tracking details.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {!previewUrl ? (
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <ScanLine className="w-8 h-8 mb-3 text-slate-400" />
                                    <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
                                </div>
                                <input id="dropzone-file" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative rounded-md overflow-hidden bg-slate-100 flex justify-center items-center h-48 border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={previewUrl} alt="Receipt preview" className="max-h-full object-contain" />
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6 rounded-full"
                                    onClick={reset}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>

                            {!scanResult ? (
                                <Button className="w-full" onClick={handleScan} disabled={isScanning}>
                                    {isScanning ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing Receipt with AI...</>
                                    ) : (
                                        <><ScanLine className="mr-2 h-4 w-4" /> Extract Tracking Data</>
                                    )}
                                </Button>
                            ) : (
                                <div className="space-y-3 bg-slate-50 p-3 rounded-lg border">
                                    <div className="flex items-center gap-2 mb-2">
                                        {scanResult.metadata.extraction_status === "SUCCESS" ? (
                                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">
                                                <Check className="h-3 w-3 mr-1" /> Confidence: {Math.round(scanResult.metadata.confidence_score * 100)}%
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive">Extraction Failed (Enter Manually)</Badge>
                                        )}
                                        {scanResult.metadata.is_handwritten && (
                                            <Badge variant="outline" className="text-xs">Handwritten</Badge>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="awb">AWB / Tracking Number *</Label>
                                        <Input id="awb" value={awb} onChange={(e) => setAwb(e.target.value)} placeholder="e.g. YT2345678" />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="courier">Courier Name</Label>
                                        <Input id="courier" value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="e.g. DTDC, India Post" />
                                    </div>

                                    <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSave} disabled={isSaving || !awb}>
                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Save & Mark fully Shipped
                                    </Button>

                                    {/* Optional quick notify immediately after editing */}
                                    <Button
                                        variant="outline"
                                        className="w-full mt-2 text-green-600 border-green-200 hover:bg-green-50"
                                        disabled={!awb}
                                        onClick={() => window.open(`https://wa.me/?text=${generateWhatsAppMessage()}`, '_blank')}
                                    >
                                        Notify Buyer via WhatsApp
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Temporary Badge component inline until proper import is sorted or if it needs distinct styling inside modal
function Badge({ children, className, variant }: { children: React.ReactNode; className?: string; variant?: string }) {
    const cn = variant === "destructive" ? "bg-red-500 text-white" : variant === "outline" ? "border" : "";
    return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cn} ${className || ""}`}>{children}</span>;
}
