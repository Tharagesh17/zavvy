"use client";

import { useState, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateUpiId } from "@/app/actions/settings";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

export function UpdateUpiForm({ currentUpiId, sellerId }: { currentUpiId: string; sellerId: string }) {
    const [upiId, setUpiId] = useState(currentUpiId);
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess(false);

        startTransition(async () => {
            try {
                await updateUpiId(sellerId, upiId);
                setSuccess(true);
                router.refresh();
                setTimeout(() => setSuccess(false), 3000);
            } catch (error) {
                console.error("Failed to update UPI ID:", error);
            }
        });
    };

    const hasChanged = upiId !== currentUpiId;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="upi_id">UPI ID</Label>
                <Input
                    id="upi_id"
                    type="text"
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                    Example: myshop@paytm, seller@phonepe, business@gpay
                </p>
            </div>

            {hasChanged && (
                <Button
                    type="submit"
                    disabled={isPending || !upiId.trim()}
                    className="w-full sm:w-auto"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save UPI ID"
                    )}
                </Button>
            )}

            {success && (
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    UPI ID updated successfully!
                </div>
            )}
        </form>
    );
}
