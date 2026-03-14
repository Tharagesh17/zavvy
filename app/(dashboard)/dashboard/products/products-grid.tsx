"use client";

import { createProductLink, deleteProduct, toggleProductStatus } from "@/app/actions/products";
import type { Product } from "@/types/database";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ShoppingCart, Package, AlertCircle } from "lucide-react";

type ProductRow = Pick<Product, "id" | "name" | "description" | "price" | "stock" | "images" | "is_active" | "created_at"> & {
  orders: { count: number }[];
};

export function ProductsGrid({ products }: { products: ProductRow[] }) {
  const router = useRouter();
  const [linkModal, setLinkModal] = useState<{
    productId: string;
    productName: string;
    price: number;
    url: string;
    shortCode: string;
  } | null>(null);
  const [linkLoadingId, setLinkLoadingId] = useState<string | null>(null);
  const [copyDone, setCopyDone] = useState(false);

  const onGenerateLink = useCallback(async (product: ProductRow) => {
    setLinkLoadingId(product.id);
    const result = await createProductLink(product.id);
    setLinkLoadingId(null);
    if (!result.ok) {
      alert(result.error);
      return;
    }
    const priceInr = product.price / 100;
    setLinkModal({
      productId: product.id,
      productName: product.name,
      price: priceInr,
      url: result.url || "",
      shortCode: result.shortCode || "",
    });
  }, []);

  const copyText = useCallback(() => {
    if (!linkModal) return;
    const text = `${linkModal.productName} - ₹${linkModal.price}\nBuy here: ${linkModal.url}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    });
  }, [linkModal]);

  const deleteOne = useCallback(async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    const result = await deleteProduct(id);
    if (result.ok) router.refresh();
    else alert(result.error);
  }, [router]);

  const onToggleActive = useCallback(async (id: string, current: boolean) => {
    const result = await toggleProductStatus(id, !current);
    if (result.ok) router.refresh();
    else alert(result.error);
  }, [router]);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-border rounded-xl surface-elevated">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <div className="h-8 w-8 bg-primary/20 rounded-full" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No products yet</h3>
        <p className="text-muted-foreground mb-6 text-center max-w-sm text-sm">
          Add your first product to start selling and generating payment links.
        </p>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
          <Link href="/dashboard/products/new">Add First Product</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p, index) => {
          const imgUrl = Array.isArray(p.images) && p.images.length > 0
            ? typeof p.images[0] === "string" ? p.images[0] : (p.images[0] as { url: string }).url
            : null;
          const priceInr = p.price / 100;
          return (
            <Card key={p.id} className={cn(
              "overflow-hidden group transition-all duration-300 border-border bg-card relative rounded-xl glow-hover",
              !p.is_active && "opacity-60 grayscale",
              "animate-fade-in-up opacity-0"
            )}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Image Container with Glassmorphism Overlay */}
              <div className="aspect-[3/4] relative bg-muted/20 overflow-hidden">
                {imgUrl ? (
                  <Image
                    src={imgUrl}
                    alt={p.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    sizes="(max-width: 640px) 100vw, 33vw"
                    unoptimized
                  />
                ) : (
                  <div className="flex flex-col h-full items-center justify-center text-muted-foreground gap-2">
                    <div className="h-12 w-12 border-2 border-border rounded-lg border-dashed" />
                    <span className="text-xs font-medium">No Image</span>
                  </div>
                )}

                {/* Floating Stock Badge */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {p.stock <= 5 && (
                    <Badge
                      variant={p.stock === 0 ? "destructive" : "secondary"}
                      className="shadow-sm bg-black/60 backdrop-blur-sm text-xs font-medium px-2 text-white border-0"
                    >
                      {p.stock === 0 ? "Sold Out" : `${p.stock} left`}
                    </Badge>
                  )}
                </div>

                {/* Glassmorphism Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[6px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                  <Button variant="secondary" size="icon" asChild className="rounded-full h-10 w-10 bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-lg hover:bg-white/20 hover:scale-110 transition-all">
                    <Link href={`/dashboard/products/${p.id}/edit`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                    </Link>
                  </Button>
                  <Button onClick={() => deleteOne(p.id, p.name)} size="icon" className="rounded-full h-10 w-10 bg-white/10 backdrop-blur-md text-red-400 border border-white/20 shadow-lg hover:bg-red-500/20 hover:scale-110 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                  </Button>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate text-base" title={p.name}>{p.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] flex items-center gap-1 border-primary/20 bg-primary/5 text-primary-foreground font-medium">
                        <ShoppingCart className="h-2.5 w-2.5" />
                        {p.orders?.[0]?.count || 0} orders
                      </Badge>
                      <Badge variant="outline" className={cn(
                        "h-5 px-1.5 text-[10px] flex items-center gap-1 border-muted bg-muted/5 font-medium",
                        p.stock <= 5 ? "text-amber-400 border-amber-400/30" : "text-muted-foreground"
                      )}>
                        <Package className="h-2.5 w-2.5" />
                        {p.stock} units
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <Switch
                      checked={p.is_active}
                      onCheckedChange={() => onToggleActive(p.id, p.is_active)}
                      className="data-[state=checked]:bg-primary h-5 w-9 scale-90"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="font-bold text-xl text-primary tabular-nums">
                    ₹{Math.floor(priceInr).toLocaleString()}
                  </p>
                  {!p.is_active && (
                    <Badge variant="outline" className="text-[10px] py-0 border-zinc-700 text-zinc-500 bg-transparent">
                      Inactive
                    </Badge>
                  )}
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button
                  onClick={() => onGenerateLink(p)}
                  disabled={linkLoadingId === p.id}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-10 rounded-lg transition-all"
                >
                  {linkLoadingId === p.id ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <>
                      Share Link <span className="ml-1">→</span>
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Link Modal Overlay — Glassmorphism */}
      {linkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setLinkModal(null)}>
          <Card
            className="w-full max-w-sm shadow-2xl surface-elevated animate-fade-in-up border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="pb-2">
              <CardContent className="p-0 text-center">
                <h3 className="text-lg font-bold text-foreground">Share Payment Link</h3>
                <p className="text-sm text-muted-foreground truncate">{linkModal.productName}</p>
              </CardContent>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex justify-center bg-white p-4 rounded-lg">
                <QRCodeSVG value={linkModal.url} size={180} level="M" />
              </div>

              <div className="space-y-2">
                <Label>Payment URL</Label>
                <div className="flex gap-2">
                  <Input readOnly value={linkModal.url} className="bg-muted/50 font-mono text-xs border-border" />
                  <Button size="icon" variant="outline" onClick={copyText} title="Copy Link" className="border-border hover:bg-white/[0.04]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-muted/30 border border-border p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">Pre-filled Message:</p>
                &quot;{linkModal.productName} - ₹{linkModal.price}<br />Buy here: {linkModal.url}&quot;
              </div>

              <Button
                onClick={copyText}
                className="w-full"
                variant={copyDone ? "secondary" : "default"}
              >
                {copyDone ? "Copied to Clipboard!" : "Copy Details to Share"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
