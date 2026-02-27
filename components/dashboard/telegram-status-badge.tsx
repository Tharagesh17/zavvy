"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function TelegramStatusBadge() {
    const [connected, setConnected] = useState<boolean | null>(null);

    useEffect(() => {
        async function check() {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("profiles")
                .select("telegram_chat_id")
                .eq("id", user.id)
                .single();

            setConnected(!!data?.telegram_chat_id);
        }
        check();
    }, []);

    if (connected === null) return null;

    if (connected) {
        return (
            <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 transition-all"
                title="Telegram connected — receiving notifications"
            >
                <div className="relative">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                <span className="hidden sm:inline">Telegram</span>
            </div>
        );
    }

    return (
        <Link
            href="/dashboard/settings#integrations"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-all"
            title="Telegram not connected — click to set up"
        >
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Connect TG</span>
        </Link>
    );
}
