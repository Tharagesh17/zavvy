'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBusinessProfile } from "@/app/actions/settings";
import { toast } from "sonner";
import { Loader2, Store, Phone, Save } from "lucide-react";

interface BusinessProfileFormProps {
    sellerId: string;
    initialBusinessName: string;
    initialPhone: string;
}

export function BusinessProfileForm({ sellerId, initialBusinessName, initialPhone }: BusinessProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        try {
            const result = await updateBusinessProfile(sellerId, formData);
            if (result?.ok) {
                toast.success("Business profile updated!");
                setIsEditing(false);
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    }

    if (!isEditing) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Business Name</Label>
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <Store className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-900">{initialBusinessName || "Not set"}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Phone Number</Label>
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <Phone className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-900">{initialPhone}</span>
                        </div>
                    </div>
                </div>
                <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
                    Edit Profile
                </Button>
            </div>
        );
    }

    return (
        <form action={handleSubmit} className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <div className="relative">
                        <Store className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="businessName"
                            name="businessName"
                            defaultValue={initialBusinessName}
                            placeholder="My Awesome Store"
                            required
                            className="pl-9"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="phone"
                            name="phone"
                            defaultValue={initialPhone}
                            placeholder="+91 98765 43210"
                            required
                            className="pl-9"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                </Button>
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={isLoading}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
