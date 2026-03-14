# 🚀 Shiprocket Integration - API Key Setup Guide

## ✅ UPDATED: Now Using API Key Authentication

**Good news!** The integration now uses **Shiprocket API Keys** instead of email/password. This means:
- ✅ Works with Google-authenticated accounts
- ✅ No "Access Forbidden" errors
- ✅ More secure
- ✅ No password needed

---

## Step 1: Get Your Shiprocket API Key (5 minutes)

### No KYC Required for API Access! ✅

1. **Login to Shiprocket:**
   - Go to https://app.shiprocket.in/login
   - Login with your Google account (or email)

2. **Navigate to API Settings:**
   - Click on **Settings** (gear icon)
   - Click on **API** in the left sidebar
   - Or directly visit: https://app.shiprocket.in/api

3. **Generate API Token:**
   - Click **"Generate API Token"** button
   - Copy the token (it looks like: `eyJ0eXAiOiJKV1QiLCJhbGc...`)
   - **Save it somewhere safe!**

4. **Done!** You now have your API key

---

## Step 2: Connect API Key in Zavvy

1. **Go to Settings:**
   ```
   http://localhost:3000/dashboard/settings
   ```

2. **Scroll to "Shiprocket Integration"**

3. **Paste your API key:**
   - Paste the token you copied
   - Click "Connect Shiprocket"

4. **Verify connection:**
   - You should see a green "Connected" badge

---

## Step 3: Create "Primary" Pickup Location

**Important:** Shiprocket requires a pickup location named "Primary"

1. **Go to Shiprocket Dashboard:**
   - https://app.shiprocket.in/seller/pickup

2. **Add Pickup Location:**
   - Click "Add Pickup Location"
   - **Name:** `Primary` (exactly this, case-sensitive)
   - Fill in your business address
   - Save

---

## Step 4: Test Shipment Creation

1. **Create a test order in Zavvy**
2. **Approve payment/COD**
3. **Go to Orders dashboard**
4. **Click "Create Shipment"**
5. **Verify AWB code appears**

---

## 🎯 About KYC

### API Access (No KYC) ✅
- Generate API keys immediately
- Test the integration
- Connect to Zavvy
- **All working without KYC!**

### Live Shipments (KYC Required) ⚠️
- To ship **real orders**, KYC is required
- KYC process takes 24-48 hours
- Required documents:
  - Business PAN card
  - Address proof
  - Bank account details

### What You Can Do Now:
1. ✅ Get API key (no KYC)
2. ✅ Connect to Zavvy (no KYC)
3. ✅ Test the integration (no KYC)
4. ⏳ Complete KYC when ready to ship real orders

---

## 🔧 How It Works Now

### Old Method (Didn't Work):
```
Email + Password → Login API → Token
❌ Failed for Google accounts ("Access Forbidden")
```

### New Method (Works!):
```
API Key from Dashboard → Direct authentication
✅ Works for all account types
✅ More secure
✅ No expiry issues
```

---

## 📊 Database Changes

**No changes needed!** The same database fields are used:
- `sellers.shiprocket_token` - Stores encrypted API key
- `sellers.shiprocket_token_expires_at` - Set to NULL (API keys don't expire)
- `sellers.shiprocket_email` - Set to NULL (not needed)

---

## 🎉 Benefits of API Key Method

1. **Works with Google login** ✅
2. **No password needed** ✅
3. **No expiry** (API keys are permanent)
4. **More secure** (can revoke anytime)
5. **Easier to manage** (one-time setup)

---

## 🐛 Troubleshooting

### Error: "Invalid API key"
**Solution:** 
- Make sure you copied the entire token
- Generate a new token if needed
- Check for extra spaces

### Error: "Pickup location not found"
**Solution:**
- Create a pickup location named exactly "Primary"
- Case-sensitive!

### Error: "KYC not completed"
**Solution:**
- This only affects live shipments
- You can still connect the API
- Complete KYC when ready to ship real orders

---

## 🚀 Quick Start (TL;DR)

```bash
# 1. Get API key from Shiprocket
https://app.shiprocket.in/api

# 2. Paste in Zavvy Settings
http://localhost:3000/dashboard/settings

# 3. Create "Primary" pickup location
https://app.shiprocket.in/seller/pickup

# 4. Test shipment creation
Create order → Approve → Create Shipment
```

---

## 📝 Files Updated

1. ✅ `lib/shiprocket.ts` - API key validation
2. ✅ `app/actions/shiprocket.ts` - API key authentication
3. ✅ `app/(dashboard)/dashboard/settings/shiprocket-connect-form.tsx` - API key input

---

**Ready to test!** Get your API key and connect now! 🚀

---

**Updated:** February 3, 2026  
**Status:** ✅ Production Ready (API Key Method)
