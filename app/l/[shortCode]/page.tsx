import { getProductByShortCode } from "@/app/actions/products";
import { notFound } from "next/navigation";
import { TrackClick } from "./track-click";
import { ProductImageGallery } from "./product-image-gallery";
import { ProductContent } from "./product-content";
import { ShieldCheck } from "lucide-react";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shortCode: string }>;
}): Promise<Metadata> {
  const { shortCode } = await params;
  const data = await getProductByShortCode(shortCode);
  if (!data) return { title: "Product Not Found" };

  const { product, seller } = data;
  const price = `₹${(product.price / 100).toLocaleString('en-IN')}`;
  const images = Array.isArray(product.images) ? product.images : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstImg = images.length > 0 ? (typeof images[0] === 'string' ? images[0] : (images[0] as any)?.url) : undefined;

  return {
    title: `${product.name} — ${price} | ${seller?.business_name || 'Zavvy'}`,
    description: product.description || `Buy ${product.name} for ${price}. Secure checkout powered by Zavvy.`,
    openGraph: {
      title: `${product.name} — ${price}`,
      description: product.description || `Buy ${product.name}. Secure checkout by Zavvy.`,
      type: 'website',
      ...(firstImg ? { images: [{ url: firstImg, width: 600, height: 600 }] } : {}),
    },
    twitter: {
      card: firstImg ? 'summary_large_image' : 'summary',
      title: `${product.name} — ${price}`,
      description: product.description || `Buy ${product.name}. Secure checkout by Zavvy.`,
      ...(firstImg ? { images: [firstImg] } : {}),
    },
  };
}
export default async function PublicProductPage({
  params,
}: {
  params: Promise<{ shortCode: string }>;
}) {
  const { shortCode } = await params;
  const data = await getProductByShortCode(shortCode);
  if (!data) notFound();

  const { product, seller } = data;
  const images = Array.isArray(product.images) ? product.images : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imgUrls = images.map((x: any) => (typeof x === "string" ? x : x?.url));

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#080808" }}>
      <TrackClick shortCode={shortCode} />

      {/* Radial gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-30 blur-[120px]"
          style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]"
          style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
        />
      </div>

      {/* Grid texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-8 sm:py-12">

        {/* Trust badge - top */}
        <div className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium tracking-wider uppercase text-white/50">
            Payment Secured by Zavvy
          </span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/60" />
        </div>

        {/* Product Card */}
        <div className="w-full max-w-[420px]">
          <div
            className="rounded-3xl overflow-hidden border border-white/[0.06] shadow-2xl shadow-black/50"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
              backdropFilter: "blur(40px)",
            }}
          >
            {/* Image Gallery */}
            <div className="p-3">
              <ProductImageGallery
                images={imgUrls}
                productName={product.name}
                stock={product.stock}
              />
            </div>

            {/* Content with Variant Selectors (Client Component) */}
            <ProductContent
              product={{
                name: product.name,
                description: product.description,
                price: product.price,
                variants: product.variants as Record<string, unknown> | null,
              }}
              seller={seller ? {
                business_name: seller.business_name,
                logo_url: seller.logo_url,
              } : null}
              shortCode={shortCode}
            />
          </div>
        </div>

        {/* Footer branding */}
        <p className="mt-10 text-[10px] font-medium tracking-[0.15em] uppercase text-white/[0.15]">
          Secured by Zavvy · Terms & Privacy
        </p>
      </div>
    </div>
  );
}
