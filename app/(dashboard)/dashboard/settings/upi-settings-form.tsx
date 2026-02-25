"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertCircle } from "lucide-react";

interface UpiSettingsFormProps {
    hasUpi: boolean;
}

/**
 * UPI Settings Form - Client Component
 * 
 * Allows sellers to save/update their UPI ID.
 * UPI ID is encrypted before storage (never exposed to frontend).
 */
export function UpiSettingsForm({ hasUpi }: UpiSettingsFormProps) {
    const [upiId, setUpiId] = useState("");
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(hasUpi);
    const [error, setError] = useState("");

    const handleSave = async () => {
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/upi/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ upi_id: upiId }),
            });

            const data = await res.json();

            if (res.ok) {
                setSaved(true);
                setUpiId("");
                // Reload page to update hasUpi status
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setError(data.error || "Failed to save UPI ID");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {saved && !error && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-emerald-900">
                        UPI ID saved securely
                    </span>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-red-900">{error}</span>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="upi">UPI ID</Label>
                <Input
                    id="upi"
                    placeholder="yourname@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                    Example: 9876543210@paytm, username@ybl, merchant@icici
                </p>
            </div>

            <Button onClick={handleSave} disabled={loading || !upiId}>
                {loading ? "Saving..." : saved ? "Update UPI ID" : "Save UPI ID"}
            </Button>
        </div>
    );
}
