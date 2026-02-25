import { NextRequest } from "next/server";
import { withSeller, apiSuccess, apiError } from "@/lib/api-helpers";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * GET /api/products/[identifier]
 * Public endpoint to fetch product by short code OR UUID
 * 
 * Auth: Not required for GET (public)
 * Returns: { success: true, data: { product, seller, link } }
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { identifier: string } }
) {
    const { identifier } = params;

    if (!identifier) {
        return apiError("Product identifier is required", 400);
    }

    // Check if identifier is a UUID (for direct product access) or short code
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    // Use service role client to bypass RLS for public access
    const supabase = createServiceRoleClient();

    if (isUuid) {
        // Direct product access by UUID (less common, but supported)
        const { data: product, error } = await supabase
            .from("products")
            .select(`
                *,
                seller:sellers (
                    id,
                    business_name,
                    phone
                )
            `)
            .eq("id", identifier)
            .single();

        if (error || !product) {
            return apiError("Product not found", 404);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const seller = (product as any).seller;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (product as any).seller;

        return apiSuccess({
            product,
            seller,
            link: null,
        });
    }

    // Fetch product by short code (most common case)
    const { data: link, error } = await supabase
        .from("product_links")
        .select(`
            *,
            product:products (
                *,
                seller:sellers (
                    id,
                    business_name,
                    phone
                )
            )
        `)
        .eq("short_code", identifier)
        .eq("is_active", true)
        .single();

    if (error || !link || !link.product) {
        console.error("[GET /api/products/[identifier]] Product not found:", identifier);
        return apiError("Product not found", 404);
    }

    // Increment click counter atomically
    try {
        await supabase.rpc("increment_link_clicks", { link_short_code: identifier });
    } catch {
        // Fallback: direct update (less optimal but still atomic)
        await supabase
            .from("product_links")
            .update({ clicks: (link.clicks || 0) + 1 })
            .eq("id", link.id);
    }

    // Extract nested data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = link.product as any;
    const seller = product.seller;

    // Clean up response (remove nested references)
    delete product.seller;
    const cleanLink = { ...link, product: undefined };

    return apiSuccess({
        product,
        seller,
        link: cleanLink,
    });
}

/**
 * DELETE /api/products/[identifier]
 * Delete a product (must be owned by seller)
 * 
 * Auth: Required (seller)
 * Returns: { success: true, data: { deleted: true } }
 */
export const DELETE = withSeller(async (
    request: NextRequest,
    { seller, params }
) => {
    const { identifier } = params as { identifier: string };

    if (!identifier) {
        return apiError("Product ID is required", 400);
    }

    // DELETE only works with UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    if (!isUuid) {
        return apiError("Invalid product ID format", 400);
    }

    const supabase = await createClient();

    // Verify product ownership before deletion
    const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("id, seller_id")
        .eq("id", identifier)
        .single();

    if (fetchError || !product) {
        return apiError("Product not found", 404);
    }

    if (product.seller_id !== seller.id) {
        return apiError("Unauthorized - You can only delete your own products", 403);
    }

    // Delete product (cascades to product_links via FK)
    const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", identifier);

    if (deleteError) {
        console.error("[DELETE /api/products/[identifier]] Error deleting product:", deleteError);
        return apiError("Failed to delete product", 500);
    }

    return apiSuccess({ deleted: true });
});
