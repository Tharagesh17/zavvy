"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ScreenshotUpload({ orderId }: { orderId: string }) {
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [done, setDone] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setUploading(true);

        const formData = new FormData(e.currentTarget);
        formData.append("order_id", orderId);

        try {
            const res = await fetch("/api/orders/upload-screenshot", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                setError(data.error || "Upload failed");
            } else {
                setDone(true);
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setUploading(false);
        }
    }

    if (done) {
        return (
            <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-medium text-center">
                Screenshot uploaded successfully!
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
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

            {error && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center">
                    {error}
                </div>
            )}

            <Button
                type="submit"
                className="w-full h-12 font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-all"
                disabled={uploading}
            >
                {uploading ? "Uploading..." : "Confirm Proof"}
            </Button>
        </form>
    );
}
