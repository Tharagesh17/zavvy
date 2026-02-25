import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { OrdersTable } from "@/components/dashboard/orders-table";
import { TableSkeleton } from "@/components/ui/skeleton";

async function OrdersData() {
    // Use cookie client only for auth (get user ID)
    const authClient = await createClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (!user || authError) {
        console.error("[Orders] Auth failed:", authError?.message);
        return <OrdersTable orders={[]} />;
    }

    // Use service role client for fast data fetching (no RLS overhead)
    const db = createServiceRoleClient();

    const { data: seller, error: sellerError } = await db
        .from("sellers")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!seller || sellerError) {
        console.error("[Orders] Seller lookup failed for user", user.id, sellerError?.message);
        return <OrdersTable orders={[]} />;
    }

    const { data: orders, error: ordersError } = await db
        .from("orders")
        .select(`*, products (name)`)
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false });

    if (ordersError) {
        console.error("[Orders] Orders query failed:", ordersError.message);
    }

    return <OrdersTable orders={orders || []} />;
}


export default function OrdersPage() {
    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Orders Management
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Verify payments, review proofs, and ship products.
                    </p>
                </div>
            </div>

            <Suspense fallback={<TableSkeleton rows={6} />}>
                <OrdersData />
            </Suspense>
        </div>
    );
}
