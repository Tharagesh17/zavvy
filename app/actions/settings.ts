"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleCod(sellerId: string, enabled: boolean) {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const supabase = createServiceRoleClient();

    // Verify ownership
    const { data: seller } = await supabase
        .from("sellers")
        .select("user_id")
        .eq("id", sellerId)
        .single();

    if (!seller || seller.user_id !== user.id) {
        throw new Error("Unauthorized to modify this seller");
    }

    // Update COD status
    const { error } = await supabase
        .from("sellers")
        .update({ cod_enabled: enabled })
        .eq("id", sellerId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/dashboard/settings");
    return { ok: true };
}

export async function updateUpiId(sellerId: string, upiId: string) {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Basic UPI ID validation
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(upiId)) {
        throw new Error("Invalid UPI ID format");
    }

    const supabase = createServiceRoleClient();

    // Verify ownership
    const { data: seller } = await supabase
        .from("sellers")
        .select("user_id")
        .eq("id", sellerId)
        .single();

    if (!seller || seller.user_id !== user.id) {
        throw new Error("Unauthorized to modify this seller");
    }

    // SECURITY: Use new encrypted UPI API instead of plaintext storage
    // This calls the /api/upi/save endpoint which handles encryption
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/upi/save`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ upi_id: upiId }),
        credentials: 'include', // Include cookies for auth
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save UPI ID');
    }

    revalidatePath("/dashboard/settings");
    return { ok: true };
}

export async function updateBusinessProfile(sellerId: string, formData: FormData) {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const businessName = formData.get("businessName") as string;
    const phone = formData.get("phone") as string;

    if (!businessName || businessName.length < 2) {
        throw new Error("Business name must be at least 2 characters");
    }
    if (!phone || phone.length < 10) {
        throw new Error("Invalid phone number");
    }

    const supabase = createServiceRoleClient();

    // Verify ownership
    const { data: seller } = await supabase
        .from("sellers")
        .select("user_id")
        .eq("id", sellerId)
        .single();

    if (!seller || seller.user_id !== user.id) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from("sellers")
        .update({
            business_name: businessName,
            phone: phone
        })
        .eq("id", sellerId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/dashboard/settings");
    return { ok: true };
}
