"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Loader2, MessageCircle, Copy, Check, Unlink, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { disconnectTelegram } from "@/app/actions/telegram";

interface TelegramConnectProps {
    userId: string;
    initialChatId: number | null;
    variant?: "card" | "inline";
}

export function TelegramConnect({
    userId,
    initialChatId,
    variant = "card",
}: TelegramConnectProps) {
    const [isConnected, setIsConnected] = useState(!!initialChatId);
    const [loading, setLoading] = useState(false);
    const [polling, setPolling] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [copied, setCopied] = useState(false);
    const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollCountRef = useRef(0);

    const botUsername =
        process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "tharagesh_bot";
    const deepLink = `https://t.me/${botUsername}?start=${userId}`;

    const stopPolling = useCallback(() => {
        if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
        }
        setPolling(false);
        pollCountRef.current = 0;
    }, []);

    const checkConnection = useCallback(async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from("profiles")
            .select("telegram_chat_id")
            .eq("id", userId)
            .single();

        return !!data?.telegram_chat_id;
    }, [userId]);

    const startPolling = useCallback(() => {
        setPolling(true);
        pollCountRef.current = 0;

        pollTimerRef.current = setInterval(async () => {
            pollCountRef.current++;

            if (pollCountRef.current > 20) {
                stopPolling();
                toast.info(
                    "Didn't detect connection yet. Click 'Check Status' to retry."
                );
                return;
            }

            const connected = await checkConnection();
            if (connected) {
                setIsConnected(true);
                stopPolling();
                toast.success("Telegram connected successfully!");
            }
        }, 3000);
    }, [checkConnection, stopPolling]);

    useEffect(() => {
        return () => {
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
            }
        };
    }, []);

    const handleConnect = () => {
        window.open(deepLink, "_blank");
        startPolling();
        toast.info(
            'Click "Start" in Telegram to complete the connection. We\'ll detect it automatically.'
        );
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(deepLink);
        setCopied(true);
        toast.success("Link copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCheckStatus = async () => {
        setLoading(true);
        const connected = await checkConnection();
        if (connected) {
            setIsConnected(true);
            toast.success("Telegram is connected!");
        } else {
            toast.info(
                'Not connected yet. Open the bot and click "Start".'
            );
        }
        setLoading(false);
    };

    const handleDisconnect = async () => {
        const confirmed = window.confirm(
            "Disconnect Telegram? You'll stop receiving order notifications until you reconnect."
        );
        if (!confirmed) return;

        setDisconnecting(true);
        const result = await disconnectTelegram();

        if (result.ok) {
            setIsConnected(false);
            toast.success("Telegram disconnected.");
        } else {
            toast.error(result.error || "Failed to disconnect.");
        }
        setDisconnecting(false);
    };

    if (variant === "inline") {
        return (
            <div className="flex items-center gap-3">
                <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${isConnected
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {isConnected ? "Telegram Connected" : "Telegram Not Connected"}
                </div>
                {isConnected ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                    >
                        {disconnecting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Unlink className="h-3 w-3" />
                        )}
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleConnect}
                        className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300"
                    >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Connect
                    </Button>
                )}
            </div>
        );
    }

    return (
        <Card className="w-full max-w-sm border border-border surface-elevated">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <div
                        className={`p-1.5 rounded-lg ${isConnected ? "bg-emerald-500/10" : "bg-blue-500/10"
                            }`}
                    >
                        <MessageCircle
                            className={`h-4 w-4 ${isConnected ? "text-emerald-400" : "text-blue-400"
                                }`}
                        />
                    </div>
                    Telegram Alerts
                </CardTitle>
                <CardDescription>
                    {isConnected
                        ? "You're receiving instant order notifications on Telegram."
                        : "Connect Telegram to receive instant order alerts, approve payments, and manage orders."}
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className="flex flex-col items-center justify-center gap-3 py-3">
                    <div
                        className={`rounded-full p-3 transition-all duration-300 ${isConnected
                                ? "bg-emerald-500/10 ring-2 ring-emerald-500/20"
                                : "bg-white/[0.04] ring-2 ring-white/[0.06]"
                            }`}
                    >
                        <MessageCircle
                            className={`h-7 w-7 transition-colors ${isConnected ? "text-emerald-400" : "text-muted-foreground"
                                }`}
                        />
                    </div>

                    <div
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${isConnected
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-amber-500/10 text-amber-400"
                            }`}
                    >
                        <div
                            className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                                }`}
                        />
                        {isConnected ? "Connected" : "Not Connected"}
                    </div>

                    {polling && (
                        <p className="text-xs text-muted-foreground animate-pulse flex items-center gap-1.5">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Waiting for you to click &quot;Start&quot; in Telegram...
                        </p>
                    )}

                    {!isConnected && !polling && (
                        <p className="text-xs text-muted-foreground text-center">
                            Open Telegram and search{" "}
                            <span className="font-mono font-bold text-foreground">
                                @{botUsername}
                            </span>
                        </p>
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2">
                {isConnected ? (
                    <>
                        <div className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-400">
                            <Check className="h-3.5 w-3.5 flex-shrink-0" />
                            Notifications active — orders, payments, and stock alerts
                        </div>
                        <Button
                            variant="ghost"
                            onClick={handleDisconnect}
                            disabled={disconnecting}
                            className="w-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                            {disconnecting ? (
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            ) : (
                                <Unlink className="mr-2 h-3 w-3" />
                            )}
                            Disconnect Telegram
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            onClick={handleConnect}
                            className="w-full bg-[#2AABEE] hover:bg-[#2AABEE]/90 text-white font-medium"
                            disabled={polling}
                        >
                            {polling ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    Connect Telegram
                                </>
                            )}
                        </Button>
                        <div className="flex gap-2 w-full">
                            <Button
                                variant="outline"
                                onClick={handleCopy}
                                className="flex-1 text-xs gap-1.5"
                                size="sm"
                            >
                                {copied ? (
                                    <Check className="h-3 w-3" />
                                ) : (
                                    <Copy className="h-3 w-3" />
                                )}
                                {copied ? "Copied!" : "Copy Link"}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleCheckStatus}
                                disabled={loading || polling}
                                className="flex-1 text-xs gap-1.5"
                                size="sm"
                            >
                                {loading ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    "Check Status"
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </CardFooter>
        </Card>
    );
}
