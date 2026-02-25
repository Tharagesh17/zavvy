# Environment Variables - Backend API Setup

This document lists all required and optional environment variables for the Zavvy backend APIs.

## Required Variables

These must be set for the application to function:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### How to get Supabase credentials:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

---

## Optional Variables

### Data Encryption Key (Recommended for Production)

```bash
DATA_ENCRYPTION_KEY=your-32-byte-hex-key-here
```

**Purpose**: Encrypts sensitive data (Shiprocket tokens, buyer addresses)

**Default**: Falls back to `SUPABASE_SERVICE_ROLE_KEY` if not set

**Generate a secure key**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**⚠️ IMPORTANT**:
- Store this key securely (use environment variable manager)
- Never commit to Git
- If you change this key, all existing encrypted data becomes unreadable
- Backup this key before production deployment

---

### Shiprocket API Base URL

```bash
SHIPROCKET_API_BASE_URL=https://apiv2.shiprocket.in/v1/external
```

**Purpose**: Base URL for Shiprocket API calls

**Default**: Hardcoded in `lib/shiprocket.ts` if not set

**When to change**: Only if Shiprocket changes their API endpoint

---

## Complete .env.local Example

Create a `.env.local` file in your project root:

```bash
# ============================================
# SUPABASE CONFIGURATION (Required)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjE2MTYxNiwiZXhwIjoxOTMxNzM3NjE2fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHgiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MTYxNjE2LCJleHAiOjE5MzE3Mzc2MTZ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# DATA ENCRYPTION (Optional but Recommended)
# ============================================
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
DATA_ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

# ============================================
# SHIPROCKET API (Optional)
# ============================================
SHIPROCKET_API_BASE_URL=https://apiv2.shiprocket.in/v1/external
```

---

## Security Best Practices

### 1. Never Commit Secrets to Git

Add to `.gitignore`:
```
.env.local
.env*.local
```

### 2. Use Different Keys for Different Environments

```bash
# Development
DATA_ENCRYPTION_KEY=dev-key-here

# Staging
DATA_ENCRYPTION_KEY=staging-key-here

# Production
DATA_ENCRYPTION_KEY=production-key-here
```

### 3. Rotate Keys Periodically

**⚠️ WARNING**: Rotating `DATA_ENCRYPTION_KEY` requires re-encrypting all data:

1. Export all encrypted data
2. Decrypt with old key
3. Update `DATA_ENCRYPTION_KEY`
4. Re-encrypt with new key
5. Update database

**Recommendation**: Only rotate if compromised. Plan carefully.

### 4. Use Environment Variable Managers

**Vercel**:
1. Go to Project Settings → Environment Variables
2. Add variables for each environment (Production, Preview, Development)

**Other platforms**:
- Netlify: Site Settings → Build & Deploy → Environment
- Railway: Project Settings → Variables
- AWS: Systems Manager → Parameter Store

---

## Verification

After setting up environment variables, verify they're loaded:

```bash
# Start dev server
npm run dev

# Check if variables are loaded (in a route handler)
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Encryption key set:", !!process.env.DATA_ENCRYPTION_KEY);
```

**Expected output**:
```
Supabase URL: https://xxxxxxxxxxxxx.supabase.co
Encryption key set: true
```

---

## Troubleshooting

### Error: "SUPABASE_SERVICE_ROLE_KEY required for encryption"

**Cause**: Missing both `DATA_ENCRYPTION_KEY` and `SUPABASE_SERVICE_ROLE_KEY`

**Fix**: Add at least `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`

### Error: "Failed to decrypt Shiprocket credentials"

**Cause**: `DATA_ENCRYPTION_KEY` changed after data was encrypted

**Fix**: 
1. Restore original encryption key, OR
2. Ask sellers to reconnect Shiprocket accounts

### Environment variables not loading

**Cause**: Next.js caches environment variables

**Fix**:
```bash
# Stop dev server (Ctrl+C)
# Delete .next folder
rm -rf .next
# Restart
npm run dev
```

---

## Production Deployment Checklist

- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` (production Supabase project)
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production anon key)
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` (production service role key)
- [ ] Generate and set `DATA_ENCRYPTION_KEY` (unique for production)
- [ ] Backup `DATA_ENCRYPTION_KEY` securely
- [ ] Verify all variables in deployment platform
- [ ] Test API endpoints in production
- [ ] Monitor logs for missing variable errors

---

## Support

If you encounter issues with environment variables:
1. Check spelling and formatting
2. Verify no extra spaces or quotes
3. Restart dev server after changes
4. Check deployment platform documentation
5. Review Next.js environment variables docs: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
