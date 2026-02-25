"use client";

import { submitOnboarding } from "@/app/actions/auth";
import { useFormState, useFormStatus } from "react-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Validating Bank Details (~15s)..." : "Validate & Activate Account"}
    </Button>
  );
}

export default function OnboardingPage() {
  const [state, formAction] = useFormState(submitOnboarding, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <Card className="w-full max-w-2xl shadow-lg border-t-4 border-t-primary">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-2xl">Complete Seller Profile</CardTitle>
            <Badge variant="secondary">Instant Setup</Badge>
          </div>
          <CardDescription>
            Join Zavvy and start selling in seconds. Enter your business details and UPI ID to receive payments directly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name <span className="text-destructive">*</span></Label>
                <Input
                  id="business_name"
                  name="business_name"
                  placeholder="e.g. Zavvy Fashion"
                  required
                />
              </div>

              <div className="space-y-4 rounded-lg bg-muted/40 p-4 border border-border/50">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">1</span>
                  Pickup Address
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="line1">Address Line 1 <span className="text-destructive">*</span></Label>
                  <Input id="line1" name="line1" placeholder="Building, Street" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                    <Input id="city" name="city" placeholder="City" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
                    <Input id="state" name="state" placeholder="State" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode <span className="text-destructive">*</span></Label>
                  <Input id="pincode" name="pincode" placeholder="560001" maxLength={6} required />
                </div>
              </div>

              <div className="space-y-4 rounded-lg bg-green-50/50 p-4 border border-green-100">
                <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-200 text-green-700 text-xs">2</span>
                  Payment Details (UPI)
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="upi_id">Your UPI ID <span className="text-destructive">*</span></Label>
                  <Input id="upi_id" name="upi_id" placeholder="e.g. yourname@okaxis" required />
                  <p className="text-xs text-green-700/70">Buyers will pay you directly to this UPI ID. Make sure it is correct.</p>
                </div>
              </div>
            </div>

            {state?.ok === false && "error" in state && state.error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                {state.error}
              </div>
            )}

            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
