"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, MessageCircle, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface TelegramConnectProps {
    userId: string;
    initialChatId: number | null;
}

export function TelegramConnect({ userId, initialChatId }: TelegramConnectProps) {
    const [isConnected, setIsConnected] = useState(!!initialChatId);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const botUsername = "zavvyaibot";
    const deepLink = `https://t.me/${botUsername}?start=${userId}`;

    const handleConnect = () => {
        window.open(deepLink, "_blank");
        toast.info("If Telegram didn't open, use the 'Copy Link' button below and paste it in your browser.");
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(deepLink);
        setCopied(true);
        toast.success("Link copied! Paste it in your browser or Telegram.");
        setTimeout(() => setCopied(false), 2000);
    };

    const checkStatus = async () => {
        setLoading(true);
        const supabase = createClient();

        const { data } = await supabase
            .from("profiles")
            .select("telegram_chat_id")
            .eq("id", userId)
            .single();

        if (data?.telegram_chat_id) {
            setIsConnected(true);
            toast.success("Successfully connected to Telegram!");
        } else {
            toast.info("Not connected yet. Please click 'Start' in the Telegram bot.");
        }
        setLoading(false);
    };

    return (
        <Card className="w-full max-w-sm border-2 border-dashed">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                    Telegram Alerts
                </CardTitle>
                <CardDescription>
                    Receive instant order notifications and approve COD/UPI orders directly on Telegram.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center gap-4 py-4">
                    <div className={`rounded-full p-4 ${isConnected ? "bg-green-100" : "bg-blue-50"}`}>
                        <MessageCircle className={`h-8 w-8 ${isConnected ? "text-green-600" : "text-blue-500"}`} />
                    </div>
                    <div className="text-center font-medium">
                        {isConnected ? "✅ Connected" : "Not Connected"}
                    </div>
                    {!isConnected && (
                        <p className="text-xs text-muted-foreground text-center">
                            If the button doesn&apos;t work, open Telegram and search{" "}
                            <span className="font-mono font-bold text-foreground">@{botUsername}</span>
                        </p>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                {!isConnected ? (
                    <>
                        <Button onClick={handleConnect} className="w-full bg-[#24A1DE] hover:bg-[#24A1DE]/90">
                            Connect Telegram
                        </Button>
                        <Button variant="outline" onClick={handleCopy} className="w-full text-xs gap-2">
                            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            {copied ? "Copied!" : "Copy Link"}
                        </Button>
                        <Button variant="ghost" onClick={checkStatus} disabled={loading} className="w-full text-xs">
                            {loading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : "Check Status"}
                        </Button>
                    </>
                ) : (
                    <Button variant="outline" className="w-full" disabled>
                        Notifications Active
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
