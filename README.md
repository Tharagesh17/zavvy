# Zavvy — Autonomous sales engine for Instagram sellers in India

Zavvy is an autonomous sales engine designed specifically for Instagram sellers in India, streamlining the entire journey from product listing to shipment generation.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Payments**: [Razorpay](https://razorpay.com/)
- **Logistics**: [Shiprocket](https://www.shiprocket.in/)
- **Communication**: [Telegram Bot API](https://core.telegram.org/bots/api)

## Core Loop

1. **Seller adds product**: Through the protected dashboard, including images and variants.
2. **Magic link**: System generates a unique, shareable magic link and QR code for the product.
3. **Buyer checks out**: Buyer visits the public link, reviews details, and completes checkout.
4. **Payment confirmed**: Secure payment processing via Razorpay.
5. **Telegram alert**: Real-time sales notification sent to the seller via Telegram.
6. **Shiprocket AWB generated**: Automated shipment creation and AWB generation in Shiprocket.

## Setup Instructions

### 1. Environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

### 2. Configure Variables

Edit `.env.local` and set the following:

| Service | Variables |
| :--- | :--- |
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Razorpay** | `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| **RazorpayX** | `RAZORPAYX_VALIDATION_ACCOUNT_NUMBER` (Penny Drop; used for bank validation) |
| **Shiprocket** | `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_API_URL` |
| **Interakt** | `INTERAKT_API_KEY`, `INTERAKT_APP_ID` |
| **App** | `NEXT_PUBLIC_APP_URL` |

### 3. Install dependencies

```bash
npm install
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Route Map

### Protected Routes (Dashboard)
- `/login` – Phone input, Send OTP (rate limited)
- `/verify-otp` – 6-digit OTP, auto-submit on 6th digit
- `/onboarding` – Business details, pickup address, bank validation (Penny Drop)
- `/dashboard` – Seller overview
- `/dashboard/products` – Product inventory and link management
- `/dashboard/products/new` – Product creation (Visuals, Variants, Stock)
- `/dashboard/products/[id]/edit` – Inventory updates

### Public Routes (Storefront)
- `/` – Landing page
- `/l/[shortCode]` – Magic link landing page for a product
- `/l/[shortCode]/checkout` – One-tap buyer checkout
- `/checkout/[orderId]` – Dynamic order status page

### Internal / API
- `/api/health` – System status check
- `/api/products` – Inventory management
- `/api/shiprocket` – Logistics integration
- `/api/telegram` – Notification webhooks

## Database Migrations

Migrations are stored in `/supabase/migrations/` and should be applied in chronological order using the Supabase CLI or Dashboard.

## Documentation

Extended documentation for specific features can be found in the `/docs` directory.
