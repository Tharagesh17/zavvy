# COD Implementation Plan

## 1. Database Changes

We need to update the database to support COD toggling for sellers and tracking COD status for orders.

### Schema Updates
Run the following SQL to update the tables:

```sql
-- 1. Add COD toggle to sellers
ALTER TABLE public.sellers 
ADD COLUMN IF NOT EXISTS cod_enabled boolean NOT NULL DEFAULT false;

-- 2. Add COD status to orders
-- payment_method can now be 'cod'
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS cod_status text CHECK (cod_status IN ('pending_approval', 'approved', 'rejected'));

-- Index for faster filtering in dashboard
CREATE INDEX IF NOT EXISTS idx_orders_cod_status ON public.orders(cod_status);
```

**Why no new tables?**
- `cod_enabled` is a simple preference.
- `cod_status` fits naturally on the `orders` lifecycle.
- We reuse the existing `orders` table to keep queries simple (O(1) lookups).

---

## 2. Backend Logic

### A. Order Creation (`createOrderFromLink`)
Logic path updates:
1. **Input**: Accept `payment_method` (UPI | COD).
2. **Validation**:
   - If `payment_method` is COD, verify `seller.cod_enabled` is true.
   - If disabled by seller, reject request.
3. **State**:
   - If COD: 
     - `payment_status` = "pending"
     - `cod_status` = "pending_approval"
     - `order_status` = "pending"
     - `delivery_status` = null
   - If UPI:
     - `payment_method` = "manual_upi"
     - Normal flow (payment_status = "pending")

### B. Seller Actions
We need new server actions for the seller dashboard.

1. **Approve COD** (`PATCH /api/orders/:id/approve-cod`)
   - **Check**: User owns the order.
   - **Update**: 
     - `cod_status` = 'approved'
     - `payment_status` = 'pending' (money not collected yet)
   - **Result**: Order is now eligible for "Create Shipment".

2. **Reject COD** (`PATCH /api/orders/:id/reject-cod`)
   - **Check**: User owns the order.
   - **Update**: 
     - `cod_status` = 'rejected'
     - `order_status` = 'cancelled'
   - **Result**: Notify buyer (mock/impl later).

### C. Shiprocket Integration (COD Specifics)
When user clicks "Create Shipment" for a COD order:
- **Payload**:
  - `payment_method`: "COD"
  - `order_id`: internal order ID
  - `collectable_amount`: `order.amount` (in Rupees)
- **Important**: Shiprocket will handle cash collection. We just track the status.

---

## 3. Frontend / UX

### A. Checkout Page (`CheckoutForm`)
- Fetch `cod_enabled` for the seller (via product -> seller relation).
- **If `cod_enabled` is true**:
  - Show Radio Group:
    - [x] **Pay via UPI** (Recommended)
    - [ ] **Cash on Delivery**
  - **If COD selected**:
    - Show warning: "Order will be confirmed after seller approval."
    - Hide "Pay Now" button, show "Place Order".
- **If `cod_enabled` is false**:
  - Auto-select UPI (hidden or just default UI).

### B. Seller Dashboard
- **Settings**: Add Toggle Switch for "Enable Cash on Delivery".
- **Orders List**:
  - Show "COD Pending" badge for unapproved orders.
  - Disable "Ship" button if `cod_status` is 'pending_approval'.
  - Add "Approve" / "Reject" actions for these orders.

---

## 4. API & Data Flow (Access Control)
- **Idempotency**: Approval actions checks if already approved.
- **Security**: Always verify `auth.uid() == seller_id` for approval/rejection.
- **Guardrails**:
  - Check `cod_enabled` *again* at the moment of order creation (prevent race conditions or manipulated clients).

