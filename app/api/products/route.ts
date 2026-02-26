import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { withSeller, apiSuccess, apiError, parseJsonBody, isErrorResponse } from "@/lib/api-helpers";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

/**
 * Generate unique short code for product links
 */
function generateShortCode(length: number = 8): string {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
    let result = "";
    const bytes = randomBytes(length);
    for (let i = 0; i < length; i++) {
        result += chars[bytes[i] % chars.length];
    }
    return result;
}

/**
 * POST /api/products
 * Create a new product with image upload
 * 
 * Auth: Required (seller)
 * Body: { name, description?, price, stock, images?, variants? }
 * Returns: { success: true, data: { product, link } }
 */
export const POST = withSeller(async (request: NextRequest, { seller }) => {
    const body = await parseJsonBody(request);
    if (isErrorResponse(body)) return body;

    const { name, description, price, stock, images, variants } = body;

    // Validate required fields
    if (!name || typeof name !== "string") {
        return apiError("Product name is required", 400);
    }
    if (typeof price !== "number" || price <= 0) {
        return apiError("Valid price is required (in paise)", 400);
    }
    if (typeof stock !== "number" || stock < 0) {
        return apiError("Valid stock quantity is required", 400);
    }

    const descValue = typeof description === "string" ? description.trim() || null : null;

    const supabase = await createClient();

    // Insert product
    const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
            seller_id: seller.id,
            name: name.trim(),
            description: descValue,
            price: Math.round(price), // Ensure integer (paise)
            stock: Math.floor(stock),
            images: Array.isArray(images) ? images : [],
            variants: variants && typeof variants === "object" ? variants : {},
            is_active: true,
        })
        .select()
        .single();

    if (productError) {
        logger.error("Error creating product", { error: productError.message });
        return apiError("Failed to create product", 500);
    }

    // Generate product link
    const shortCode = generateShortCode(8);
    const { error: linkError } = await supabase
        .from("product_links")
        .insert({
            seller_id: seller.id,
            product_id: product.id,
            short_code: shortCode,
            is_active: true,
        });

    if (linkError) {
        logger.error("Error creating product link", { error: linkError.message });
        // Product created but link failed - still return success
    }

    // Build public URL
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const publicUrl = `${protocol}://${host}/l/${shortCode}`;

    return apiSuccess(
        {
            product,
            link: {
                short_code: shortCode,
                url: publicUrl,
            },
        },
        201
    );
});

/**
 * GET /api/products
 * List all products for the authenticated seller
 * 
 * Auth: Required (seller)
 * Query: ?page=1&limit=20
 * Returns: { success: true, data: { products, total, page, limit } }
 */
export const GET = withSeller(async (request: NextRequest, { seller }) => {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    // Fetch products with pagination
    const { data: products, error, count } = await supabase
        .from("products")
        .select("*, product_links(short_code, clicks)", { count: "exact" })
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        logger.error("Error fetching products", { error: error.message });
        return apiError("Failed to fetch products", 500);
    }

    return apiSuccess({
        products: products || [],
        total: count || 0,
        page,
        limit,
    });
});
