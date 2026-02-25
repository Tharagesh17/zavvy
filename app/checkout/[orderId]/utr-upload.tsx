"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitUtrNumber } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button
            type="submit"
            className="w-full h-12 font-bold bg-electric hover:bg-electric/90 text-white shadow-[0_0_15px_rgba(0,112,243,0.3)] transition-all"
            disabled={pending}
        >
            {pending ? "Verifying..." : "Confirm Payment"}
        </Button>
    );
}

export function UtrUpload({ orderId }: { orderId: string }) {
    const [state, formAction] = useFormState(submitUtrNumber, null);

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="order_id" value={orderId} />
            <div className="space-y-2">
                <Label htmlFor="utr_number" className="sr-only">UPI Transaction ID</Label>
                <div className="relative group">
                    <Input
                        id="utr_number"
                        name="utr_number"
                        type="text"
                        pattern="\d{12}"
                        maxLength={12}
                        placeholder="Enter 12-digit UPI Transaction ID"
                        required
                        className="h-12 w-full bg-black/40 border-white/10 text-white placeholder:text-slate-500 font-mono text-center tracking-widest focus:ring-electric focus:border-electric transition-colors"
                    />
                </div>
                <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest mt-2">
                    Found in your UPI app&apos;s transaction history after payment
                </p>
            </div>

            {state?.ok === false && "error" in state && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center">
                    {state.error}
                </div>
            )}

            <SubmitButton />
        </form>
    );
}
