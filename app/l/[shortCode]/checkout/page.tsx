import { getProductByShortCode } from "@/app/actions/products";
import { notFound } from "next/navigation";
import { CheckoutForm } from "./checkout-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

export default async function LinkCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ shortCode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { shortCode } = await params;
  const sp = await searchParams;
  const data = await getProductByShortCode(shortCode);
  if (!data) notFound();

  const { product, seller } = data;
  const priceInr = product.price / 100;

  // Handle image for thumbnail
  const images = Array.isArray(product.images) ? product.images : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imgUrls = images.map((x: any) => (typeof x === "string" ? x : x?.url));
  const thumb = imgUrls.length > 0 ? imgUrls[0] : null;

  // Extract selected variants from URL params (v_Size=M, v_Color=Red)
  const selectedVariants: Record<string, string> = {};
  for (const [key, val] of Object.entries(sp)) {
    if (key.startsWith("v_") && typeof val === "string") {
      selectedVariants[key.slice(2)] = val;
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-lg space-y-6">

        {/* Order Summary Card */}
        <Card className="overflow-hidden border border-border shadow-sm">
          <CardContent className="p-4 flex gap-4 items-center">
            <div className="h-16 w-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
              {thumb && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt={product.name} className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">{product.name}</h3>
              {Object.keys(selectedVariants).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {Object.entries(selectedVariants).map(([key, val]) => (
                    <Badge key={key} variant="secondary" className="text-[10px] h-5 px-2 font-medium">
                      {key}: {val}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold text-lg text-primary">₹{priceInr.toFixed(2)}</p>
              <Badge variant="outline" className="text-xs border-border">Qty: 1</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">Checkout Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CheckoutForm
              key={JSON.stringify(selectedVariants)}
              shortCode={shortCode}
              codEnabled={!!seller.cod_enabled}
              product={product}
              initialVariants={selectedVariants}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          <span>Secure 256-bit SSL encrypted payment</span>
        </div>
      </div>
    </div>
  );
}
