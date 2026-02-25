import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProductFormFields } from "../../product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return null;

  const db = createServiceRoleClient();
  const { data: seller } = await db
    .from("sellers")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!seller) return null;

  const { data: product } = await db
    .from("products")
    .select("id, name, description, price, stock, images, variants, is_active")
    .eq("id", id)
    .eq("seller_id", seller.id)
    .single();

  if (!product) notFound();


  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Edit Product</h2>
      <ProductFormFields mode="edit" product={product} />
    </div>
  );
}
