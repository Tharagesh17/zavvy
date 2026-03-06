"use client";

import { useState, useRef } from "react";
import { uploadStoreLogo } from "@/app/actions/upload";
import { updateBusinessLogo } from "@/app/actions/settings";
import { toast } from "sonner";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";

export function LogoUpload({
    sellerId,
    initialUrl,
}: {
    sellerId: string;
    initialUrl: string | null;
}) {
    const [isUploading, setIsUploading] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string | null>(initialUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate size (e.g., max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Logo file must be smaller than 2MB.");
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await uploadStoreLogo(null, formData);

            if (!res.ok) {
                throw new Error(res.error);
            }

            await updateBusinessLogo(sellerId, res.url);
            setLogoUrl(res.url);
            toast.success("Store logo updated successfully!");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to upload logo.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }

    async function handleRemove() {
        setIsUploading(true);
        try {
            await updateBusinessLogo(sellerId, null);
            setLogoUrl(null);
            toast.success("Store logo removed.");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to remove logo.");
        } finally {
            setIsUploading(false);
        }
    }

    return (
        <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-4">
                {/* Preview Avatar */}
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                    {logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={logoUrl}
                            alt="Store Logo"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <ImageIcon className="h-6 w-6 text-slate-400" />
                    )}

                    {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            accept="image/jpeg,image/png,image/webp"
                            disabled={isUploading}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="inline-flex h-8 items-center justify-center rounded-md bg-white px-3 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload New
                        </button>

                        {logoUrl && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                disabled={isUploading}
                                className="inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                                <X className="mr-1.5 h-4 w-4" />
                                Remove
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-slate-500">
                        JPG, PNG or WebP. 2MB max. Recommended 1:1 ratio.
                    </p>
                </div>
            </div>
        </div>
    );
}
