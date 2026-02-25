"use server";

import { unstable_cache } from "next/cache";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);
import { createServiceRoleClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { v4 as uuidv4 } from "uuid";

interface AddProductParams {
  sellerId: string;
  name: string;
  description?: string;
  price: number; // in paise
  collectionId?: string | null;
  variants: { size?: string | null; color?: string | null; stock_count: number; price_override?: number | null }[];
  // We accept base64 instead of Buffer to be perfectly compatible across Next.js Edge/Node and external scripts
  imageFilesBase64?: { base64: string; mimeType: string; name: string }[];
  preUploadedImages?: string[];
}

export async function checkSellerStatus(sellerId: string) {
  const supabase = createServiceRoleClient();

  const { data: seller } = await supabase.from("sellers").select("user_id, tier").eq("id", sellerId).single();
  if (!seller) throw new Error("Seller not found");

  // In the current schema, if they have a seller profile, they can add products.
  // We can eventually add tier limits here (e.g. tier === 'free' max 5 products).
  return true;
}

export async function addProduct(params: AddProductParams) {
  const requestId = logger.generateRequestId();
  const supabase = createServiceRoleClient();

  try {
    await checkSellerStatus(params.sellerId);

    const imageUrls: string[] = params.preUploadedImages || [];

    if (params.imageFilesBase64 && params.imageFilesBase64.length > 0) {
      for (const img of params.imageFilesBase64) {
        const ext = img.name.split('.').pop() || 'jpg';
        const fileName = `products/${params.sellerId}/${uuidv4()}.${ext}`;
        const buffer = Buffer.from(img.base64, 'base64');

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(fileName, buffer, { contentType: img.mimeType });

        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(fileName);
        imageUrls.push(publicUrl);
      }
    }

    const totalStock = params.variants.reduce((acc, v) => acc + v.stock_count, 0);

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        seller_id: params.sellerId,
        name: params.name,
        description: params.description || null,
        price: params.price,
        stock: totalStock, // Base stock calculation
        images: imageUrls.length > 0 ? imageUrls : null,
        collection_id: params.collectionId || null,
        is_active: true
      })
      .select("id")
      .single();

    if (productError || !product) throw new Error(`Failed to create product: ${productError?.message}`);

    if (params.variants.length > 0) {
      const variantsToInsert = params.variants.map(v => ({
        product_id: product.id,
        size: v.size || null,
        color: v.color || null,
        stock_count: v.stock_count,
        price_override: v.price_override || null
      }));

      const { error: variantError } = await supabase
        .from("product_variants")
        .insert(variantsToInsert);

      if (variantError) {
        logger.error("Failed to insert variants", { error: variantError.message, productId: product.id, requestId });
      }
    }

    logger.info("Product created successfully", { productId: product.id, sellerId: params.sellerId, requestId });
    return { success: true, productId: product.id };

  } catch (error: unknown) {
    const errObj = error instanceof Error ? error : new Error(String(error));
    logger.error("Error in addProduct", { error: errObj.message, sellerId: params.sellerId, requestId });
    return { success: false, error: errObj.message };
  }
}

export async function addStockToVariant(variantId: string, quantityToAdd: number) {
  const supabase = createServiceRoleClient();

  // In a real high-concurrency environment, you should use an RPC procedure to do:
  // UPDATE product_variants SET stock_count = stock_count + quantityToAdd WHERE id = variantId
  // Because we might not have the RPC right now, we'll fetch and update, 
  // BUT we must remind the developer to write the RPC for ultimate safety.

  // Use the RPC if it exists, otherwise fallback to read/write
  const { error: rpcError } = await supabase.rpc('increment_variant_stock', {
    v_id: variantId,
    v_qty: quantityToAdd
  });

  if (rpcError) {
    // Fallback
    const { data } = await supabase.from("product_variants").select("stock_count").eq("id", variantId).single();
    if (data) {
      await supabase.from("product_variants").update({ stock_count: data.stock_count + quantityToAdd }).eq("id", variantId);
    }
  }

  return { success: true };
}

// ─── NEXT.JS FORM ACTIONS ───────────────────────────────────────────────────

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProduct(prev: any, fd: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const { data: seller } = await supabase.from("sellers").select("id").eq("user_id", user.id).single();
    if (!seller) return { ok: false, error: "Seller profile not found." };

    const name = fd.get("name") as string;
    const description = fd.get("description") as string;
    const price = Math.round(parseFloat(fd.get("price") as string) * 100);
    const stockStr = fd.get("stock") as string;
    const totalStock = parseInt(stockStr, 10);
    const imagesJson = fd.get("images_json") as string;
    const variantsJson = fd.get("variants_json") as string;

    let imageUrls: string[] = [];
    try { imageUrls = JSON.parse(imagesJson || "[]") } catch (e) { }

    let variantsObj: Record<string, string> = {};
    try { variantsObj = JSON.parse(variantsJson || "{}") } catch (e) { }

    let sizeOptions: string[] = [];
    let colorOptions: string[] = [];

    for (const [key, val] of Object.entries(variantsObj)) {
      if (key.toLowerCase().includes("size")) {
        sizeOptions = val.split(",").map(s => s.trim()).filter(Boolean);
      }
      if (key.toLowerCase().includes("color")) {
        colorOptions = val.split(",").map(c => c.trim()).filter(Boolean);
      }
    }

    const variantsArray: any[] = [];
    if (sizeOptions.length === 0 && colorOptions.length === 0) {
      variantsArray.push({ size: null, color: null, stock_count: totalStock, price_override: null });
    } else {
      const sizes = sizeOptions.length > 0 ? sizeOptions : [null];
      const colors = colorOptions.length > 0 ? colorOptions : [null];

      let stockPerVariant = 0;
      const totalCombinations = sizes.length * colors.length;
      if (totalCombinations > 0) {
        stockPerVariant = Math.floor(totalStock / totalCombinations);
      }

      for (const size of sizes) {
        for (const color of colors) {
          variantsArray.push({ size, color, stock_count: stockPerVariant, price_override: null });
        }
      }
    }

    const result = await addProduct({
      sellerId: seller.id,
      name,
      description,
      price,
      preUploadedImages: imageUrls,
      variants: variantsArray
    });

    if (!result.success) {
      return { ok: false, error: result.error };
    }

    revalidatePath("/dashboard/products");
    return { ok: true, id: result.productId };
  } catch (e: any) {
    return { ok: false, error: e.message || "An error occurred." };
  }
}

export async function updateProduct(prev: any, fd: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const { data: seller } = await supabase.from("sellers").select("id").eq("user_id", user.id).single();
    if (!seller) return { ok: false, error: "Seller profile not found." };

    const productId = fd.get("id") as string;
    const name = fd.get("name") as string;
    const description = fd.get("description") as string;
    const price = Math.round(parseFloat(fd.get("price") as string) * 100);
    const imagesJson = fd.get("images_json") as string;
    const variantsJson = fd.get("variants_json") as string;

    let imageUrls: string[] = [];
    try { imageUrls = JSON.parse(imagesJson || "[]") } catch (e) { }

    const { error: updateError } = await supabase
      .from("products")
      .update({
        name,
        description,
        price,
        images: imageUrls,
        variants: variantsJson ? JSON.parse(variantsJson) : null // Persist legacy meta format for displaying in grid
      })
      .eq("id", productId)
      .eq("seller_id", seller.id); // Security check

    if (updateError) throw new Error(updateError.message);

    revalidatePath("/dashboard/products");
    revalidatePath(`/products/${productId}`);
    return { ok: true, id: productId };
  } catch (e: any) {
    return { ok: false, error: e.message || "An error occurred." };
  }
}

export const getProductByShortCode = unstable_cache(
  async (shortCode: string) => {
    const supabase = createServiceRoleClient();

    const { data: link, error: linkError } = await supabase
      .from("product_links")
      .select(`
        *,
        product:products (
          *,
          seller:sellers (
            *
          )
        )
      `)
      .eq("short_code", shortCode)
      .eq("is_active", true)
      .single();

    if (linkError || !link) return null;
    if (!link.product || !link.product.is_active) return null;

    return {
      product: link.product,
      seller: link.product.seller,
      link: link
    };
  },
  ["product-lookup"],
  { revalidate: 60, tags: ["products"] }
);

export async function createProductLink(productId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const { data: seller } = await supabase.from("sellers").select("id").eq("user_id", user.id).single();
    if (!seller) return { ok: false, error: "Seller profile not found." };

    // Check if the product belongs to the seller
    const { data: product } = await supabase.from("products").select("id").eq("id", productId).eq("seller_id", seller.id).single();
    if (!product) return { ok: false, error: "Product not found or access denied." };

    // Check if link already exists
    const { data: existingLink } = await supabase
      .from("product_links")
      .select("short_code")
      .eq("product_id", productId)
      .eq("seller_id", seller.id)
      .single();

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (existingLink) {
      const url = `${baseUrl}/l/${existingLink.short_code}`;
      return { ok: true, shortCode: existingLink.short_code, url };
    }

    // Generate new short code
    const shortCode = nanoid();
    const { error } = await supabase.from("product_links").insert({
      seller_id: seller.id,
      product_id: productId,
      short_code: shortCode,
    });

    if (error) throw new Error(error.message);

    const url = `${baseUrl}/l/${shortCode}`;
    return { ok: true, shortCode, url };
  } catch (e: any) {
    return { ok: false, error: e.message || "Failed to create link" };
  }
}

export async function deleteProduct(productId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Unauthorized" };

    const { data: seller } = await supabase.from("sellers").select("id").eq("user_id", user.id).single();
    if (!seller) return { ok: false, error: "Seller profile not found." };

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("seller_id", seller.id);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/products");
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message || "Failed to delete product" };
  }
}

export async function incrementLinkClicks(shortCode: string) {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.rpc('increment_link_clicks', {
      link_code: shortCode
    });

    if (error) {
      // Fallback
      const { data } = await supabase.from("product_links").select("clicks").eq("short_code", shortCode).single();
      if (data) {
        await supabase.from("product_links").update({ clicks: data.clicks + 1 }).eq("short_code", shortCode);
      }
    }
  } catch (e) {
    logger.warn(`Failed to increment link clicks for code: ${shortCode}`, { error: e });
  }
}
