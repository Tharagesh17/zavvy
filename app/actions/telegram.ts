"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function disconnectTelegram(): Promise<{ ok: boolean; error?: string }> {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
        return { ok: false, error: "Unauthorized" };
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase
        .from("profiles")
        .update({ telegram_chat_id: null })
        .eq("id", user.id);

    if (error) {
        return { ok: false, error: "Failed to disconnect Telegram." };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { ok: true };
}

export async function getTelegramStatus(): Promise<{ connected: boolean; chatId: number | null }> {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
        return { connected: false, chatId: null };
    }

    const supabase = createServiceRoleClient();
    const { data } = await supabase
        .from("profiles")
        .select("telegram_chat_id")
        .eq("id", user.id)
        .single();

    return {
        connected: !!data?.telegram_chat_id,
        chatId: data?.telegram_chat_id || null,
    };
}
