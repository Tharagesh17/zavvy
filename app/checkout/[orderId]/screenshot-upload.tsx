"use client";

import { useFormState, useFormStatus } from "react-dom";
import { uploadPaymentScreenshot } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud } from "lucide-react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button
            type="submit"
            className="w-full h-12 font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-all"
            disabled={pending}
        >
            {pending ? "Uploading..." : "Confirm Proof"}
        </Button>
    );
}

export function ScreenshotUpload({ orderId }: { orderId: string }) {
    const [state, formAction] = useFormState(uploadPaymentScreenshot, null);

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="order_id" value={orderId} />
            <div className="space-y-2">
                <Label htmlFor="screenshot" className="sr-only">Upload Screenshot</Label>
                <div className="relative group cursor-pointer">
                    <Input
                        id="screenshot"
                        name="screenshot"
                        type="file"
                        accept="image/*"
                        required
                        className="h-12 w-full cursor-pointer bg-white/5 border-white/10 border-dashed border-2 text-slate-400 file:bg-white/10 file:text-white file:border-0 file:rounded-md file:mr-4 file:px-4 file:h-full hover:bg-white/10 transition-colors"
                    />
                </div>
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
