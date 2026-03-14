"use client";

import { createProduct, updateProduct } from "@/app/actions/products";
import { uploadProductImage } from "@/app/actions/upload";
import imageCompression from "browser-image-compression";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImagePlus, Trash2, Plus, AlertCircle, Package, Tag, Layers } from "lucide-react";

const MAX_IMAGE_PX = 800;
const MAX_IMAGES = 10;

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  images: string[] | { url: string }[];
  variants: Record<string, unknown>;
};

function parseVariants(v: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v)) {
    out[k] = typeof val === "string" ? val : String(val ?? "");
  }
  return out;
}

function imageUrls(images: string[] | { url: string }[]): string[] {
  if (!Array.isArray(images)) return [];
  return images.map((x) => (typeof x === "string" ? x : x?.url ?? "")).filter(Boolean);
}

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="relative h-12 px-8 rounded-xl font-semibold text-white text-sm tracking-wide overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      style={{
        background: "linear-gradient(135deg, #3B82F6 0%, #2563eb 50%, #1d4ed8 100%)",
      }}
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Saving...
        </span>
      ) : (
        mode === "create" ? "Create Product" : "Save Changes"
      )}
    </button>
  );
}

export function ProductFormFields({
  mode,
  product,
}: {
  mode: "create" | "edit";
  product?: ProductRow | null;
}) {
  const [images, setImages] = useState<string[]>(product ? imageUrls(product.images) : []);
  const [variants, setVariants] = useState<Record<string, string>>(
    product?.variants ? parseVariants(product.variants as Record<string, unknown>) : { "Size": "S, M, L", "Color": "Red, Blue" }
  );
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ ok: boolean; error?: string } | null>(null);

  type FormState = { ok: boolean; error?: string; id?: string } | null;
  const action = (prev: FormState, fd: FormData) =>
    mode === "create"
      ? createProduct(prev as { ok: true; id: string } | { ok: false; error: string } | null, fd)
      : updateProduct(prev as { ok: true } | { ok: false; error: string } | null, fd);

  const [state, formAction] = useFormState(action, null);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;

      setUploading(true);
      setUploadMessage(null);

      // We use a local count to track images across the loop
      // because state updates are asynchronous.
      let currentCount = images.length;

      if (currentCount >= MAX_IMAGES) {
        setUploadMessage({ ok: false, error: `Maximum ${MAX_IMAGES} photos allowed. Remove some to add more.` });
        setUploading(false);
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;

        if (currentCount >= MAX_IMAGES) {
          setUploadMessage({ ok: false, error: `Maximum ${MAX_IMAGES} photos allowed. Remove some to add more.` });
          break;
        }

        try {
          const compressed = await imageCompression(file, { maxWidthOrHeight: MAX_IMAGE_PX });
          const fd = new FormData();
          fd.set("file", compressed);
          const result = await uploadProductImage(null, fd);

          if (!result.ok) {
            setUploadMessage({ ok: false, error: result.error });
          } else {
            setImages((prev) => [...prev, result.url]);
            currentCount++; // Update local count for the next iteration
            setUploadMessage({ ok: true });
          }
        } catch {
          setUploadMessage({ ok: false, error: "Compression failed" });
        }
      }
      setUploading(false);
      e.target.value = "";
    },
    [images.length] // Re-calculate if current images change
  );

  const removeImage = useCallback((url: string) => {
    setImages((prev) => prev.filter((u) => u !== url));
  }, []);

  const updateVariantKey = (oldKey: string, newKey: string) => {
    setVariants(prev => {
      const next: Record<string, string> = {};
      Object.keys(prev).forEach(k => {
        if (k === oldKey) next[newKey] = prev[k];
        else next[k] = prev[k];
      });
      return next;
    });
  };

  const updateVariantValue = (key: string, val: string) => {
    setVariants(prev => ({ ...prev, [key]: val }));
  };

  const removeVariant = (key: string) => {
    setVariants(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const priceInr = product ? product.price / 100 : "";

  return (
    <div
      className="max-w-3xl rounded-3xl overflow-hidden border border-white/[0.06]"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
        backdropFilter: "blur(40px)",
      }}
    >
      {/* Header */}
      <div className="px-8 py-7 border-b border-white/[0.06]" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.06) 0%, transparent 100%)" }}>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {mode === "create" ? "New Product" : "Edit Product"}
        </h2>
        <p className="text-sm text-white/40 mt-1 font-medium">
          Add details, images, and pricing for your drop.
        </p>
      </div>

      <div className="p-8">
        <form action={formAction} className="space-y-8">

          {/* Section: Basics */}
          <div className="space-y-5">
            <SectionHeader icon={Package} label="The Basics" />

            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/70 font-semibold text-sm">Product Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={product?.name}
                placeholder="e.g. Neon cropped hoodie"
                required
                className="h-12 text-base bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl focus:border-primary focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white/70 font-semibold text-sm">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={product?.description ?? ""}
                placeholder="Tell the story. Fit, feel, and fabric."
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white ring-offset-background focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all resize-none placeholder:text-white/20"
              />
            </div>
          </div>

          {/* Section: Numbers */}
          <div className="space-y-5">
            <SectionHeader icon={Tag} label="Pricing & Stock" />

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-white/70 font-semibold text-sm">Price</Label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-bold group-focus-within:text-primary transition-colors text-lg">₹</span>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={priceInr}
                    placeholder="0.00"
                    required
                    className="pl-9 h-12 bg-white/[0.04] border-white/[0.08] rounded-xl font-mono text-lg font-bold text-white focus:bg-white/[0.06] transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-white/70 font-semibold text-sm">Stock</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  defaultValue={product?.stock ?? 10}
                  className="h-12 bg-white/[0.04] border-white/[0.08] rounded-xl font-mono text-lg font-bold text-white focus:bg-white/[0.06] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section: Images */}
          <div className="space-y-5">
            <SectionHeader icon={ImagePlus} label="Visuals" badge={`${images.length} / ${MAX_IMAGES}`} />

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {images.map((url) => (
                <div key={url} className="relative aspect-[3/4] rounded-xl border border-white/[0.06] overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="bg-white/10 text-white rounded-full p-2.5 hover:bg-destructive hover:scale-110 transition-all border border-white/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Upload zone — hidden when limit reached */}
              {images.length < MAX_IMAGES && (
                <div className="relative aspect-[3/4] rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center hover:bg-white/[0.03] hover:border-primary/40 transition-all cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onFileChange}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                  />
                  <div className="text-center p-2 group-hover:scale-110 transition-transform duration-300">
                    {uploading ? (
                      <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                    ) : (
                      <>
                        <div className="h-9 w-9 bg-white/[0.05] rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
                          <Plus className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/25 group-hover:text-primary/70">
                          Add
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {uploadMessage?.ok === false && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {uploadMessage.error}
              </div>
            )}
            <input type="hidden" name="images_json" value={JSON.stringify(images)} />
          </div>

          {/* Section: Variants */}
          <div className="space-y-5">
            <SectionHeader icon={Layers} label="Variants" />

            <div className="space-y-3 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              {Object.entries(variants).map(([key, value], idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <Input
                    type="text"
                    placeholder="Option (e.g. Size)"
                    value={key}
                    onChange={(e) => updateVariantKey(key, e.target.value)}
                    className="w-1/3 bg-white/[0.04] border-white/[0.08] rounded-xl h-11 text-white font-semibold text-sm"
                  />
                  <Input
                    type="text"
                    placeholder="Values (S, M, L)"
                    value={value}
                    onChange={(e) => updateVariantValue(key, e.target.value)}
                    className="flex-1 bg-white/[0.04] border-white/[0.08] rounded-xl h-11 text-white text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVariant(key)}
                    className="text-white/20 hover:text-destructive hover:bg-destructive/10 rounded-xl h-11 w-11 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVariants((prev) => ({ ...prev, [`Option ${Object.keys(prev).length + 1}`]: "" }))}
                className="mt-2 text-xs font-semibold uppercase tracking-wider rounded-xl border-dashed border-white/10 text-white/40 hover:border-primary hover:text-primary hover:bg-primary/5 h-10 px-5"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Variant
              </Button>
            </div>
            <input type="hidden" name="variants_json" value={JSON.stringify(variants)} />
            {mode === "edit" && product && <input type="hidden" name="id" value={product.id} />}
          </div>

          {/* Error */}
          {state?.ok === false && state.error && (
            <div className="flex items-center gap-3 p-4 bg-destructive/[0.08] border border-destructive/15 text-destructive rounded-2xl text-sm font-medium">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {state.error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
            <SubmitButton mode={mode} />
            <Button
              variant="ghost"
              asChild
              className="rounded-xl h-12 px-6 font-medium text-white/30 hover:text-white hover:bg-white/5"
            >
              <Link href="/dashboard/products">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, label, badge }: { icon: React.ComponentType<{ className?: string }>; label: string; badge?: string }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 flex items-center gap-3">
      <Icon className="w-4 h-4 text-primary/50" />
      {label}
      {badge && (
        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 normal-case tracking-normal">
          {badge}
        </span>
      )}
      <span className="flex-1 h-px bg-gradient-to-r from-primary/10 to-transparent" />
    </h3>
  );
}
