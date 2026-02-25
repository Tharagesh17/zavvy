/**
 * TypeScript types for PLATFORM-NODAL Supabase schema.
 * Generated to match supabase/migrations/*.sql
 */

export type SellerTier = "basic" | "pro";

export interface PickupAddress {
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Profile {
  id: string; // References auth.users.id
  email: string;
  has_completed_onboarding: boolean;
  telegram_chat_id: number | null;
  trial_ends_at: string;
  is_pro: boolean;
  subscription_id: string | null;
  created_at: string;
}

export interface UpiToken {
  id: string;
  seller_id: string;
  encrypted_value: string;
  created_at: string;
}

export interface Seller {
  id: string;
  user_id: string;
  phone: string;
  business_name: string | null;
  tier: SellerTier;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_holder_name: string | null;
  is_bank_verified: boolean;
  pickup_address: PickupAddress | null;
  upi_token: string | null; // Reference to upi_tokens.id
  created_at: string;
}

export interface Collection {
  id: string;
  seller_id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  collection_id: string | null;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  images: ProductImage[];
  variants: Record<string, unknown>; // Legacy
  is_active: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  stock_count: number;
  price_override: number | null;
  created_at: string;
}

export type ProductImage = string | { url: string; alt?: string };

export interface ProductLink {
  id: string;
  seller_id: string;
  product_id: string;
  short_code: string;
  is_active: boolean;
  clicks: number;
  created_at: string;
}

export type PaymentMethod = "manual_upi" | "cod" | "smart_collect";

export interface BuyerAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  [key: string]: unknown;
}

export interface Order {
  id: string;
  seller_id: string;
  product_id: string;
  product_link_id: string | null;
  buyer_name: string;
  buyer_phone: string;
  buyer_address: BuyerAddress | null;
  amount: number;
  quantity: number;
  payment_method: PaymentMethod;
  payment_status: string | null;
  order_status: string | null;
  delivery_status: string | null;
  razorpay_order_id: string | null;
  virtual_account_id: string | null;
  virtual_vpa: string | null;
  screenshot_url: string | null;
  utr_number: string | null;
  verification_status: string | null; // Defaults to 'pending'
  seller_approved_at: string | null;
  wallet_transaction_id: string | null;
  created_at: string;
}

export type VirtualAccountStatus = "active" | "closed";

export interface VirtualAccount {
  id: string;
  razorpay_va_id: string;
  vpa_address: string;
  order_id: string;
  status: VirtualAccountStatus;
  created_at: string;
  expires_at: string | null;
}

export type WalletTransactionType = "credit" | "debit";
export type WalletBalanceType = "pending" | "available";

export interface WalletTransaction {
  id: string;
  seller_id: string;
  order_id: string | null;
  type: WalletTransactionType;
  amount: number;
  balance_type: WalletBalanceType;
  description: string | null;
  razorpay_payout_id: string | null;
  created_at: string;
}

export interface Payout {
  id: string;
  seller_id: string;
  amount: number;
  razorpay_payout_id: string | null;
  status: string | null;
  utr_number: string | null;
  processed_at: string | null;
  created_at: string;
}

export interface PlatformConfig {
  id: string;
  razorpay_merchant_id: string | null;
  nodal_account_number: string | null;
  commission_percent: number;
}

// Insert types (optional fields for create)
export type SellerInsert = Omit<Seller, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type ProductInsert = Omit<Product, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type ProductLinkInsert = Omit<ProductLink, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type OrderInsert = Omit<
  Order,
  "id" | "created_at" | "virtual_account_id" | "wallet_transaction_id"
> & {
  id?: string;
  created_at?: string;
  virtual_account_id?: string | null;
  wallet_transaction_id?: string | null;
};

export type VirtualAccountInsert = Omit<VirtualAccount, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type WalletTransactionInsert = Omit<
  WalletTransaction,
  "id" | "created_at"
> & {
  id?: string;
  created_at?: string;
};

export type PayoutInsert = Omit<Payout, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

export type PlatformConfigInsert = Omit<PlatformConfig, "id"> & { id?: string };

// Update types (partial)
export type SellerUpdate = Partial<Omit<Seller, "id" | "user_id" | "created_at">>;
export type ProductUpdate = Partial<Omit<Product, "id" | "seller_id" | "created_at">>;
export type ProductLinkUpdate = Partial<
  Omit<ProductLink, "id" | "seller_id" | "product_id" | "created_at">
>;
export type OrderUpdate = Partial<
  Omit<Order, "id" | "seller_id" | "product_id" | "created_at">
>;
export type VirtualAccountUpdate = Partial<
  Omit<VirtualAccount, "id" | "order_id" | "created_at">
>;
export type WalletTransactionUpdate = Partial<
  Omit<WalletTransaction, "id" | "created_at">
>;
export type PayoutUpdate = Partial<Omit<Payout, "id" | "seller_id" | "created_at">>;
export type PlatformConfigUpdate = Partial<Omit<PlatformConfig, "id">>;
