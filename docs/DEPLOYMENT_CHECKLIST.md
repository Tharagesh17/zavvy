# Zavvy — Deployment Checklist & Production Safety

Pre-launch checklist for deploying Zavvy social commerce SaaS.

---

## 1. Environment Variables

### Required (minimum to run)

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Same |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only) | Same |
| `NEXT_PUBLIC_APP_URL` | App URL (e.g. `https://yoursite.com`) | Your domain |

### Recommended for production

| Variable | Description |
|----------|-------------|
| `DATA_ENCRYPTION_KEY` | 32-byte hex key for encrypting tokens (Shiprocket, UPI). Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `RAZORPAY_KEY_ID` | Razorpay key ID (Penny Drop / bank validation) |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `RAZORPAYX_VALIDATION_ACCOUNT_NUMBER` | RazorpayX customer identifier for Penny Drop |

### Optional (integrations)

| Variable | Description |
|----------|-------------|
| `SHIPROCKET_EMAIL` / `SHIPROCKET_PASSWORD` | If using platform-level Shiprocket (else sellers use their own) |
| `INTERAKT_API_KEY` / `INTERAKT_APP_ID` | WhatsApp Business API |

### Security

- Never commit `.env.local` or any file containing secrets.
- Use different keys for staging vs production.
- Backup `DATA_ENCRYPTION_KEY` securely; losing it makes encrypted data unreadable.

---

## 2. Pre-Deploy Checks

- [ ] `npm run build` succeeds locally
- [ ] `npm run lint` passes
- [ ] All required env vars set in deployment platform (Vercel, etc.)
- [ ] Supabase migrations applied to production DB
- [ ] Storage bucket `products` exists and has correct RLS policies
- [ ] Phone auth (Twilio) configured in Supabase for production
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain

---

## 3. Health Check

After deploy, verify:

```bash
curl https://your-domain.com/api/health
```

Expected (200): `{"status":"ok","timestamp":"..."}`

If `status: "degraded"` (503): required env vars are missing. In development, the response includes a `checks` object.

---

## 4. Production Safety Notes

### Multi-Tenant Isolation

- All seller-scoped queries use `seller_id` / `user_id` filters.
- RLS policies enforce row-level access.
- API routes use `withSeller` / `withAuth` to ensure authenticated sellers only access their data.

### Secrets

- `SUPABASE_SERVICE_ROLE_KEY` and `DATA_ENCRYPTION_KEY` must never be exposed to the client.
- Shiprocket and UPI tokens are stored encrypted in DB; decrypted only in memory for API calls.
- No payment or shipping tokens are logged.

### Error Handling

- API errors return structured `{ success: false, error: string }` responses.
- 4xx/5xx status codes used appropriately.
- Avoid logging stack traces or sensitive data in production.

### Performance

- Product fetch by short code uses `unstable_cache` (60s) for public links.
- Dashboard routes are dynamic; public product page can be cached at edge.

### Known Limitations (MVP)

- No payment gateway integration (manual UPI / COD).
- Shiprocket uses seller API keys; no platform-level keys required.
- Rate limits: OTP send limited to 3 per 5 minutes per phone.

---

## 5. Deployment Platforms

### Vercel

1. Connect repo.
2. Set env vars in Project Settings → Environment Variables.
3. Set `NEXT_PUBLIC_APP_URL` to `https://your-app.vercel.app` or custom domain.
4. Deploy.

### Other (Node)

```bash
npm run build
npm run start
```

Set `PORT` if needed. Ensure `NODE_ENV=production`.

---

## 6. Post-Launch

- [ ] Test login → onboarding → add product → generate link → place order flow
- [ ] Verify UPI link generation and mark-as-paid
- [ ] Verify Shiprocket connect, create shipment, track
- [ ] Check `/api/health` returns 200
- [ ] Monitor logs for missing env or decryption errors

---

## Phase Status (Reference)

| Phase | Status |
|-------|--------|
| 0 – Project Setup | ✅ |
| 1 – Architecture | ✅ |
| 2 – Auth + Seller Onboarding | ✅ |
| 3 – Product System | ✅ |
| 4 – Orders | ✅ |
| 5 – UPI Deep Link + Security | ✅ |
| 6 – Shiprocket | ✅ |
| 7 – UI/UX | ✅ |
| 8 – Security Hardening | ✅ |
| 9 – Pre-Launch | ✅ |
