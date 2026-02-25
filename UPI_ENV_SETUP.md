# UPI Payment System - Environment Setup

## Required Environment Variables

Add the following to your `.env.local` file:

```bash
# ============================================
# DATA ENCRYPTION KEY (REQUIRED FOR UPI)
# ============================================

# Generate a secure 32+ character random string for encrypting UPI IDs
# Run this command to generate: openssl rand -base64 32
DATA_ENCRYPTION_KEY=your_secure_random_key_here

# Example generation (run in terminal):
# openssl rand -base64 32
# Output: 8xK9mP2vN5qL7wR3tY6uI1oA4sD8fG2hJ5kL9mN0pQ=

# ============================================
# EXISTING VARIABLES (NO CHANGES NEEDED)
# ============================================

# App URL for share links
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Shiprocket (optional)
SHIPROCKET_EMAIL=
SHIPROCKET_PASSWORD=
SHIPROCKET_API_URL=https://apiv2.shiprocket.in/v1/external
```

## Security Notes

### DATA_ENCRYPTION_KEY

- **Purpose**: Encrypts UPI IDs before storing in database
- **Format**: 32+ character random string (base64 recommended)
- **Security**: Never commit this to version control
- **Rotation**: If you change this key, all existing encrypted UPI IDs will become unreadable

### Fallback Behavior

If `DATA_ENCRYPTION_KEY` is not set, the system will fall back to `SUPABASE_SERVICE_ROLE_KEY` for backward compatibility with existing Shiprocket encryption. However, it's **strongly recommended** to set a dedicated `DATA_ENCRYPTION_KEY`.

## Setup Steps

1. **Generate encryption key**:
   ```bash
   openssl rand -base64 32
   ```

2. **Add to `.env.local`**:
   ```bash
   DATA_ENCRYPTION_KEY=<paste_generated_key_here>
   ```

3. **Run database migration**:
   - Open Supabase SQL Editor
   - Run `UPI_SCHEMA_UPDATE.sql`
   - Verify tables created successfully

4. **Restart development server**:
   ```bash
   npm run dev
   ```

5. **Test UPI setup**:
   - Login as seller
   - Go to Settings
   - Add UPI ID (e.g., `test@paytm`)
   - Verify "UPI ID saved securely" message

## Production Deployment

### Vercel / Netlify

Add `DATA_ENCRYPTION_KEY` to environment variables in your deployment platform:

1. Go to Project Settings → Environment Variables
2. Add `DATA_ENCRYPTION_KEY` with your generated key
3. Redeploy application

### Important

- Use different encryption keys for development and production
- Store production key securely (e.g., password manager, secrets vault)
- Never log or expose the encryption key in application code
- Rotate keys periodically (requires re-encrypting all UPI IDs)

## Troubleshooting

### "DATA_ENCRYPTION_KEY required" error

**Cause**: Environment variable not set or not loaded

**Solution**:
1. Verify `.env.local` contains `DATA_ENCRYPTION_KEY`
2. Restart development server
3. Check for typos in variable name

### "Invalid UPI ID format" error

**Cause**: UPI ID doesn't match expected format

**Solution**: Use format `username@bankcode` (e.g., `9876543210@paytm`, `merchant@icici`)

### UPI link generation fails

**Cause**: UPI ID not configured or encryption key mismatch

**Solution**:
1. Go to Settings → UPI Payment
2. Save UPI ID again
3. Verify `DATA_ENCRYPTION_KEY` hasn't changed
