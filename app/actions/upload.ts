"use server";

import { createClient } from "@/lib/supabase/server";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

export type UploadImageResult = { ok: true; url: string } | { ok: false; error: string };

export async function uploadProductImage(
  _prev: UploadImageResult | null,
  formData: FormData
): Promise<UploadImageResult> {
  const file = formData.get("file") as File | null;
  if (!file?.size) return { ok: false, error: "No file." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!seller) return { ok: false, error: "Seller profile not found." };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const path = `${seller.id}/new/${nanoid()}.${safeExt}`;

  const { error } = await supabase.storage.from("products").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) return { ok: false, error: error.message };
  const { data: urlData } = supabase.storage.from("products").getPublicUrl(path);
  return { ok: true, url: urlData.publicUrl };
}
