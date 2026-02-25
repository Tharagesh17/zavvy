"use client";

import { useState, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toggleCod } from "@/app/actions/settings";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function CodToggle({ currentStatus, sellerId }: { currentStatus: boolean; sellerId: string }) {
    const [enabled, setEnabled] = useState(currentStatus);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleToggle = async (checked: boolean) => {
        setEnabled(checked);
        startTransition(async () => {
            try {
                await toggleCod(sellerId, checked);
                router.refresh();
            } catch (error) {
                // Revert on error
                setEnabled(!checked);
                console.error("Failed to toggle COD:", error);
            }
        });
    };

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
            <div className="space-y-0.5">
                <Label htmlFor="cod-toggle" className="text-base font-semibold cursor-pointer">
                    Enable Cash on Delivery
                </Label>
                <p className="text-sm text-muted-foreground">
                    {enabled
                        ? "COD is enabled. Buyers can choose to pay on delivery."
                        : "COD is disabled. Only UPI payments are accepted."}
                </p>
            </div>
            <div className="flex items-center gap-2">
                {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <Switch
                    id="cod-toggle"
                    checked={enabled}
                    onCheckedChange={handleToggle}
                    disabled={isPending}
                />
            </div>
        </div>
    );
}
