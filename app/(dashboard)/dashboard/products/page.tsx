import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import { ProductsGrid } from "./products-grid";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

async function ProductsData() {
  // Auth only via cookie client
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return null;

  // Data fetching via service role (bypasses RLS)
  const db = createServiceRoleClient();
  const { data: seller } = await db
    .from("sellers")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!seller) return null;

  const { data: products } = await db
    .from("products")
    .select("id, name, description, price, stock, images, is_active, created_at")
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false });

  return <ProductsGrid products={products ?? []} />;
}

export default function ProductsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Products</h1>
          <p className="text-muted-foreground text-sm">Manage your product catalog</p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>
      <Suspense fallback={
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      }>
        <ProductsData />
      </Suspense>
    </div>
  );
}
