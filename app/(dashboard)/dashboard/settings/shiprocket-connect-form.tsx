"use client";

import { connectShiprocket, disconnectShiprocket } from "@/app/actions/shiprocket";
import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { useState } from "react";

function SubmitButton({ isConnected }: { isConnected: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                </>
            ) :             isConnected ? (
                "Reconnect"
            ) : (
                "Connect Shiprocket"
            )}
        </Button>
    );
}

export function ShiprocketConnectForm({
    isConnected,
}: {
    isConnected: boolean;
}) {
    const [state, formAction] = useFormState(connectShiprocket, null);
    const [disconnecting, setDisconnecting] = useState(false);

    const handleDisconnect = async () => {
        if (confirm("Are you sure you want to disconnect Shiprocket?")) {
            setDisconnecting(true);
            await disconnectShiprocket();
            setDisconnecting(false);
        }
    };

    if (isConnected) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-900 rounded-lg border border-green-200">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-sm">Connected to Shiprocket</p>
                        <p className="text-xs text-green-700">Using Email + Password (token valid ~10 days)</p>
                    </div>
                </div>

                <form action={formAction} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="shiprocket_email">Email</Label>
                        <Input
                            id="shiprocket_email"
                            name="shiprocket_email"
                            type="email"
                            placeholder="Shiprocket API user email"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="shiprocket_password">Password</Label>
                        <Input
                            id="shiprocket_password"
                            name="shiprocket_password"
                            type="password"
                            placeholder="Shiprocket API user password"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Use your Shiprocket API user credentials (Settings → API → Create API user)
                        </p>
                    </div>
                    {state?.ok === false && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 text-red-900 text-sm rounded-lg border border-red-200">
                            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <p>{state.error}</p>
                        </div>
                    )}
                    {state?.ok === true && (
                        <div className="flex items-start gap-2 p-3 bg-green-50 text-green-900 text-sm rounded-lg border border-green-200">
                            <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <p>Successfully reconnected to Shiprocket!</p>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <SubmitButton isConnected={isConnected} />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleDisconnect}
                            disabled={disconnecting}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                            {disconnecting ? "Disconnecting..." : "Disconnect"}
                        </Button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <form action={formAction} className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-blue-900">Connect with Shiprocket Email + Password</p>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Login to Shiprocket</li>
                    <li>Go to Settings → API → Configure</li>
                    <li>Create an API user (unique email + password)</li>
                    <li>Use that email and password below</li>
                </ol>
                <a
                    href="https://app.shiprocket.in/settings/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline font-medium"
                >
                    Open Shiprocket API Settings
                    <ExternalLink className="h-3 w-3" />
                </a>
            </div>

            <div className="space-y-2">
                <Label htmlFor="shiprocket_email">Shiprocket API User Email</Label>
                <Input
                    id="shiprocket_email"
                    name="shiprocket_email"
                    type="email"
                    placeholder="e.g. api@yourstore.com"
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="shiprocket_password">Shiprocket API User Password</Label>
                <Input
                    id="shiprocket_password"
                    name="shiprocket_password"
                    type="password"
                    placeholder="Password for API user"
                    required
                />
                <p className="text-xs text-muted-foreground">
                    Your password is never stored. Only the login token (~10-day validity) is encrypted and saved.
                </p>
            </div>
            {state?.ok === false && (
                <div className="flex items-start gap-2 p-3 bg-red-50 text-red-900 text-sm rounded-lg border border-red-200">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <p>{state.error}</p>
                </div>
            )}
            {state?.ok === true && (
                <div className="flex items-start gap-2 p-3 bg-green-50 text-green-900 text-sm rounded-lg border border-green-200">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <p>Successfully connected to Shiprocket! Token valid ~10 days.</p>
                </div>
            )}
            <SubmitButton isConnected={isConnected} />
        </form>
    );
}
