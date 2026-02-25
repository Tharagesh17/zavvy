# Zavvy

Next.js 14 project with TypeScript, Tailwind CSS, App Router, and shadcn/ui (neutral base).

## Tech stack

- **Next.js 14** – App Router
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** – neutral base color, CSS variables

## Folder structure

```
app/
  (dashboard)/     # Dashboard route group → /dashboard
  (auth)/          # Auth route group → /login, etc.
  api/             # API routes
components/
  ui/              # shadcn/ui components
lib/               # Utilities (e.g. utils.ts, API clients)
types/             # Shared TypeScript types
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:

| Service     | Variables |
|------------|-----------|
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Razorpay** | `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| **RazorpayX** | `RAZORPAYX_VALIDATION_ACCOUNT_NUMBER` (Penny Drop; from Dashboard → Banking → Customer Identifier) |
| **Shiprocket** | `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_API_URL` |
| **Interakt** | `INTERAKT_API_KEY`, `INTERAKT_APP_ID` |
| **App** | `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000` or your domain; used for share link URLs) |

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Phone auth (Supabase + Twilio, India)

1. In **Supabase Dashboard**: Authentication → Providers → **Phone** → Enable.
2. Under Phone, choose **Twilio** and add your Twilio Account SID, Auth Token, and (for India) Messaging Service SID or phone number. See [Supabase Phone Login](https://supabase.com/docs/guides/auth/phone-login).
3. Apply migrations (including `sellers`, `otp_send_attempts`, `pickup_address`, SmartCollect migration that drops `personal_upi` and sets tier default to `pro`).

Flow: `/login` (phone → Send OTP) → `/verify-otp` (6-digit code, auto-submit) → `/onboarding` (business, pickup address, bank details) → Penny Drop validation → `/dashboard`. Rate limit: 3 OTP sends per 5 minutes per number.

### 4b. SmartCollect onboarding (bank validation)

- **Razorpay** keys (`NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) are used for RazorpayX Fund Account Validation (Penny Drop).
- Set **`RAZORPAYX_VALIDATION_ACCOUNT_NUMBER`** to your RazorpayX customer identifier (Dashboard → My Account & Settings → Banking → Customer Identifier). This is the account from which the penny drop is deducted.
- Optional: **`ENCRYPTION_KEY`** for encrypting bank account numbers (defaults to `SUPABASE_SERVICE_ROLE_KEY`).
- IP allowlisting may be required for RazorpayX Account Validation APIs.

### 5. Product management and shareable links

- **Storage:** Run migration `20250131000014_storage_products_bucket.sql` to create the `products` bucket and policies (or create bucket "products" as public in Supabase Dashboard → Storage).
- **Dashboard → Products:** `/dashboard/products` – grid of products, "Add Product" → `/dashboard/products/new`. Edit/delete and "Generate Link" (nanoid short code, QR code, copy text: product name + price + URL).
- **Public link:** `/l/[shortCode]` – no auth; product details from `product_links` join; clicks incremented on visit; "Buy Now" → `/l/[shortCode]/checkout` (buyer name, phone, address) → create order → redirect to `/checkout/[orderId]`.
- **Images:** Upload to Supabase Storage bucket `products`; client-side compression with `browser-image-compression` (max 800px). Variants stored as JSON (e.g. size, color).

### 6. Add shadcn/ui components (optional)

Components are configured with neutral base. Add components with:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
# etc.
```

## Scripts

- `npm run dev` – Start dev server
- `npm run build` – Production build
- `npm run start` – Start production server
- `npm run lint` – Run ESLint

## Routes

- `/` – Home
- `/login` – Phone input, Send OTP (rate limited)
- `/verify-otp` – 6-digit OTP, auto-submit on 6th digit
- `/onboarding` – Business name, pickup address, bank details (Penny Drop validation); tier=pro
- `/dashboard` – Protected; requires auth + completed onboarding
- `/dashboard/products` – Product grid; Add Product, Generate Link, Edit, Delete
- `/dashboard/products/new` – New product form (name, description, price, stock, images, variants)
- `/dashboard/products/[id]/edit` – Edit product
- `/l/[shortCode]` – Public product page (no auth); click tracking; Buy Now → checkout
- `/l/[shortCode]/checkout` – Buyer details; place order → `/checkout/[orderId]`
- `/checkout/[orderId]` – Order confirmation
- `/api/health` – Health check API
