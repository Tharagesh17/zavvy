"use client";

import { createOrderFromLinkWrapper } from "@/app/actions/orders";
import { useFormState, useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Banknote, ShieldCheck, Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function PlaceOrderButton({ isCod, totalAmount }: { isCod: boolean; totalAmount: number }) {
  const { pending } = useFormStatus();
  const text = isCod ? `Place Request (Pay ₹${totalAmount})` : `Pay ₹${totalAmount} (UPI)`;
  return (
    <Button type="submit" className="w-full text-base py-6" size="lg" disabled={pending}>
      {pending ? "Processing..." : text}
    </Button>
  );
}

interface Product {
  id: string;
  name: string;
  price: number;
  variants: Record<string, string[]> | null;
}

interface CartItem {
  id: string; // unique id for UI key
  variant: Record<string, string>;
  quantity: number;
}

// Indian States List
const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

export function CheckoutForm({ shortCode, codEnabled, product, initialVariants = {} }: { shortCode: string; codEnabled: boolean; product: Product; initialVariants?: Record<string, string> }) {
  const [state, formAction] = useFormState(createOrderFromLinkWrapper, null);
  const [paymentMethod, setPaymentMethod] = useState<"manual_upi" | "cod">("manual_upi");

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { id: "init", variant: initialVariants, quantity: 1 }
  ]);

  const [totalAmount, setTotalAmount] = useState(product.price);

  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + (item.quantity * product.price), 0);
    setTotalAmount(total / 100); // price is in paise
  }, [cartItems, product.price]);

  const addCartItem = () => {
    // Default to first option for each variant key
    const defaultVariant: Record<string, string> = {};
    Object.entries(product.variants).forEach(([key, paramValues]) => {
      let options: string[] = [];
      if (Array.isArray(paramValues)) {
        options = paramValues;
      } else if (typeof paramValues === "string") {
        options = (paramValues as string).split(",").map((s) => s.trim());
      }

      if (options.length > 0) {
        defaultVariant[key] = options[0];
      }
    });
    setCartItems([...cartItems, { id: Math.random().toString(36).substr(2, 9), variant: defaultVariant, quantity: 1 }]);
  };

  const removeCartItem = (id: string) => {
    if (cartItems.length > 1) {
      setCartItems(cartItems.filter(item => item.id !== id));
    }
  };

  const updateCartItem = (id: string, updates: Partial<CartItem>) => {
    setCartItems(cartItems.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const updateItemVariant = (id: string, key: string, val: string) => {
    setCartItems(cartItems.map(item => {
      if (item.id === id) {
        return { ...item, variant: { ...item.variant, [key]: val } };
      }
      return item;
    }));
  };

  const hasVariants = product.variants && Object.keys(product.variants).length > 0;

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="short_code" value={shortCode} />
      <input type="hidden" name="payment_method" value={paymentMethod} />
      <input type="hidden" name="items" value={JSON.stringify(cartItems)} />

      {/* Buyer Details Section */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-foreground border-b pb-2">Your Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="buyer_name">Full Name <span className="text-destructive">*</span></Label>
            <Input id="buyer_name" name="buyer_name" placeholder="e.g. John Doe" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buyer_phone">Phone Number <span className="text-destructive">*</span></Label>
            <Input
              id="buyer_phone"
              name="buyer_phone"
              type="tel"
              placeholder="+91 9876543210"
              pattern="^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$"
              title="Please enter a valid Indian phone number"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="buyer_email">Email Address <span className="text-muted-foreground text-xs">(Optional)</span></Label>
          <Input id="buyer_email" name="buyer_email" type="email" placeholder="john@example.com" />
        </div>
      </div>

      {/* Shipping Address Section */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-foreground border-b pb-2">Shipping Address</h3>

        <div className="space-y-2">
          <Label htmlFor="line1">Address Line 1 <span className="text-destructive">*</span></Label>
          <Input id="line1" name="line1" placeholder="Flat, House no., Building, Apartment" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="line2">Address Line 2 <span className="text-muted-foreground text-xs">(Optional)</span></Label>
          <Input id="line2" name="line2" placeholder="Area, Colony, Street, Sector" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
            <Input id="city" name="city" placeholder="City" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
            <Select name="state" required>
              <SelectTrigger>
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pincode">Pincode <span className="text-destructive">*</span></Label>
          <Input
            id="pincode"
            name="pincode"
            placeholder="110001"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            title="Pincode must be exactly 6 digits"
            required
          />
        </div>
      </div>

      {/* Product Variants Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="font-semibold text-lg text-foreground">Order Items</h3>
          {hasVariants && (
            <Button type="button" variant="outline" size="sm" onClick={addCartItem} className="h-8 gap-1">
              <Plus className="h-3.5 w-3.5" /> Add Another
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {cartItems.map((item, index) => (
            <div key={item.id} className="p-4 border rounded-lg bg-card/50 relative group">
              <div className="flex flex-wrap gap-4 items-end">
                {hasVariants ? (
                  Object.entries(product.variants || {}).map(([vKey, vVal]) => {
                    const vOptions = Array.isArray(vVal)
                      ? vVal
                      : typeof vVal === "string"
                        ? (vVal as string).split(",").map((s) => s.trim())
                        : [];

                    if (vOptions.length === 0) return null;

                    return (
                      <div key={vKey} className="space-y-1.5 min-w-[120px]">
                        <Label className="text-xs text-muted-foreground font-medium">{vKey}</Label>
                        <Select
                          value={item.variant[vKey] || ""}
                          onValueChange={(val: string) => updateItemVariant(item.id, vKey, val)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder={`Select ${vKey}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {vOptions.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm font-medium pt-2">Default Product</div>
                )}

                <div className="space-y-1.5 w-24">
                  <Label className="text-xs text-muted-foreground font-medium">Qty</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    className="h-9"
                    value={item.quantity}
                    onChange={(e) => updateCartItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>

                {cartItems.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive/90" onClick={() => removeCartItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-2 text-sm">
          <span className="text-muted-foreground">Total Items: {cartItems.reduce((acc, i) => acc + i.quantity, 0)}</span>
          <span className="font-bold text-lg">Total: ₹{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <Label className="text-base font-semibold">Payment Method</Label>

        {!codEnabled ? (
          <div className="flex items-center gap-3 p-4 border rounded-lg bg-emerald-50 border-emerald-100">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-900">Secure UPI Payment</p>
              <p className="text-xs text-emerald-700">Scan QR or use any UPI app</p>
            </div>
          </div>
        ) : (
          <RadioGroup
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v as "manual_upi" | "cod")}
            className="gap-3"
          >
            <div className={`flex items-center space-x-2 border p-4 rounded-lg transition-all ${paymentMethod === 'manual_upi' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200'
              }`}>
              <RadioGroupItem value="manual_upi" id="pm_upi" />
              <Label htmlFor="pm_upi" className="flex-1 cursor-pointer flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="font-semibold">Pay via UPI</div>
                  <div className="text-xs text-muted-foreground">Fastest confirmation</div>
                </div>
              </Label>
            </div>

            <div className={`flex items-center space-x-2 border p-4 rounded-lg transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200'
              }`}>
              <RadioGroupItem value="cod" id="pm_cod" />
              <Label htmlFor="pm_cod" className="flex-1 cursor-pointer flex items-center gap-2">
                <Banknote className="w-4 h-4 text-orange-600" />
                <div>
                  <div className="font-semibold">Cash on Delivery</div>
                  <div className="text-xs text-muted-foreground">Requires seller approval</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        )}

        {paymentMethod === "cod" && (
          <div className="flex gap-2 p-3 bg-amber-50 text-amber-800 text-sm rounded-md border border-amber-100 items-start">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              Your order will be confirmed only after the seller reviews and approves it.
            </p>
          </div>
        )}
      </div>

      {state?.ok === false && "error" in state && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
          {state.error}
        </div>
      )}

      <div className="pt-2">
        <PlaceOrderButton isCod={paymentMethod === "cod"} totalAmount={totalAmount} />
      </div>
    </form>
  );
}
