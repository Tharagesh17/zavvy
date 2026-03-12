import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface MatchedOrder {
    order_id: string;
    buyer_name: string;
    product_name: string;
    name_similarity: number;
    product_similarity: number;
    combined_score: number;
}

/**
 * Fuzzy-match OCR-extracted buyer_name and product_name against pending orders.
 * Uses PostgreSQL pg_trgm similarity via an RPC function.
 * 
 * @param sellerId - The seller's UUID
 * @param buyerName - Extracted buyer name from the receipt
 * @param productName - Extracted product name from the receipt (optional)
 * @returns Top matching orders sorted by combined similarity score
 */
export async function findMatchingOrders(
    sellerId: string,
    buyerName: string,
    productName?: string
): Promise<MatchedOrder[]> {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.rpc('find_matching_order', {
        p_seller_id: sellerId,
        p_buyer_name: buyerName || '',
        p_product_name: productName || '',
    });

    if (error) {
        console.error("Fuzzy match error:", error);
        return [];
    }

    return (data || []) as MatchedOrder[];
}

/**
 * Get the best single match above a quality threshold.
 * Returns null if no confident match is found.
 */
export function getBestMatch(
    matches: MatchedOrder[],
    minScore: number = 0.4
): MatchedOrder | null {
    if (!matches.length) return null;

    const best = matches[0];
    if (best.combined_score >= minScore) {
        return best;
    }

    return null;
}
