const fs = require('fs');
const content = `export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            orders: {
                Row: {
                    id: string
                    created_at: string
                    tier: 'free' | 'pro'
                    payment_method: 'upi_manual' | 'razorpay' | 'cod'
                    payment_status: 'pending' | 'needs_review' | 'verified' | 'paid' | 'failed' | 'refunded'
                    shipping_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
                    buyer_name: string
                    buyer_address: Json
                    buyer_phone: string
                    amount: number
                    quantity: number
                    // Products join
                    products?: {
                        id: string
                        name: string
                    } | null
                    // For inserts
                    product_id?: string
                    seller_id?: string
                }
                Insert: {
                    id?: string
                    seller_id: string
                    product_id: string
                    buyer_name: string
                    buyer_phone: string
                    amount: number
                    tier?: 'free' | 'pro'
                    payment_method?: 'upi_manual' | 'razorpay' | 'cod'
                    payment_status?: 'pending' | 'needs_review' | 'verified' | 'paid' | 'failed' | 'refunded'
                    cod_status?: 'pending_approval' | 'approved' | 'rejected' | null
                    order_status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
                    product_link_id?: string
                    buyer_address?: Json
                }
                Update: {
                    shipping_status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
                    shipment_id?: string
                    awb_code?: string
                    courier_name?: string
                    payment_status?: 'pending' | 'needs_review' | 'verified' | 'paid' | 'failed' | 'refunded'
                    payment_method?: 'upi_manual' | 'razorpay' | 'cod'
                    screenshot_url?: string
                }
            }
            sellers: {
                Row: {
                    id: string
                    user_id: string
                    phone: string
                    business_name: string | null
                    upi_id: string | null
                    tier: 'basic' | 'pro'
                    cod_enabled: boolean
                }
            }
            seller_keys: {
                Row: {
                    seller_id: string
                    encrypted_shiprocket_email: string
                    encrypted_shiprocket_password: string
                }
            }
            shipments: {
                Row: {
                    id: string
                    order_id: string
                    seller_id: string
                    awb_code: string | null
                    courier_name: string | null
                }
                Insert: {
                    order_id: string
                    seller_id: string
                    shiprocket_order_id: string
                    shiprocket_shipment_id: string
                    awb_code: string
                    courier_name: string
                    label_url?: string
                }
            }
        }
    }
}
`;

fs.writeFileSync('database.types.ts', content, { encoding: 'utf8' });
console.log('Successfully wrote database.types.ts with UTF-8 encoding');
