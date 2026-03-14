# 🚀 Quick Start Guide - Testing COD & UPI Features

## Prerequisites
- Supabase project set up
- Database migrations run (SUPABASE_SETUP.sql + COD_SCHEMA_UPDATE.sql)
- npm dependencies installed

## Step-by-Step Testing Guide

### 1. **Setup Seller Account**

1. **Login as Seller:**
   ```
   Navigate to: /login
   Use phone OTP or Dev mode
   ```

2. **Configure Settings:**
   ```
   Navigate to: /dashboard/settings
   
   Actions:
   - Set UPI ID (e.g., seller@paytm)
   - Enable "Cash on Delivery" toggle
   - Note the risk warnings
   ```

### 2. **Create a Product**

1. **Add Product:**
   ```
   Navigate to: /dashboard/products/new
   
   Fill in:
   - Name: "Test Product"
   - Price: 50000 (₹500.00)
   - Upload image
   - Save
   ```

2. **Generate Link:**
   ```
   Click "Generate Link" button
   Copy the short link (e.g., /l/abc123)
   ```

### 3. **Test UPI Payment Flow (Buyer)**

1. **Open Product Link:**
   ```
   Navigate to: /l/{shortCode}
   Click "Buy Now"
   ```

2. **Fill Checkout Form:**
   ```
   Name: John Doe
   Phone: 9876543210
   Address: Complete address
   Payment Method: Select "Pay via UPI"
   Click "Pay Now (UPI)"
   ```

3. **Payment Page:**
   ```
   You should see:
   - QR Code for UPI payment
   - UPI ID displayed
   - "Open UPI App" button
   - Screenshot upload section
   ```

4. **Upload Screenshot:**
   ```
   Upload any image as "payment proof"
   Status changes to "Proof Submitted"
   ```

5. **Seller Approves:**
   ```
   Go to: /dashboard/orders
   Find order with "Verify Proof" badge
   Click "View Proof" to see screenshot
   Click "Approve" button
   Status changes to "Paid"
   ```

### 4. **Test COD Flow (Buyer)**

1. **Open Product Link:**
   ```
   Navigate to: /l/{shortCode}
   Click "Buy Now"
   ```

2. **Fill Checkout Form:**
   ```
   Name: Jane Smith
   Phone: 9123456789
   Address: Complete address
   Payment Method: Select "Cash on Delivery"
   Note the warning: "Requires seller approval"
   Click "Place Request (Pay on Delivery)"
   ```

3. **COD Pending Page:**
   ```
   You should see:
   - Orange card with "COD Order Placed!"
   - Message: "Awaiting seller approval"
   - Order details with "Pay cash on delivery"
   ```

4. **Seller Dashboard:**
   ```
   Go to: /dashboard/orders
   
   You should see:
   - "COD Pending" badge with count
   - Order row with:
     - Payment: "COD" badge (amber)
     - Status: "Needs Approval" badge (orange)
     - Actions: "Approve" and "Reject" buttons
   ```

5. **Approve COD Order:**
   ```
   Click "Approve" button (green)
   Status changes to "Approved" (blue badge)
   ```

6. **Buyer Sees Approval:**
   ```
   Refresh: /checkout/{orderId}
   
   You should see:
   - Green card with "Order Approved!"
   - Message: "Will be shipped soon. Pay cash on delivery."
   ```

### 5. **Test COD Rejection**

1. **Create Another COD Order**
   (Follow steps 4.1 - 4.4)

2. **Reject Order:**
   ```
   In /dashboard/orders
   Click "Reject" button (red)
   Status changes to "Rejected" (red badge)
   ```

3. **Buyer Sees Rejection:**
   ```
   Refresh: /checkout/{orderId}
   
   You should see:
   - Red card with "Order Declined"
   - Message explaining rejection
   ```

### 6. **Test COD Disabled**

1. **Disable COD:**
   ```
   Navigate to: /dashboard/settings
   Toggle OFF "Enable Cash on Delivery"
   ```

2. **Buyer Checkout:**
   ```
   Navigate to: /l/{shortCode}/checkout
   
   You should see:
   - Only UPI payment option
   - No COD radio button
   - Green "Secure UPI Payment" card
   ```

3. **Try to Force COD:**
   ```
   If buyer tries to submit COD via API manipulation:
   Error: "Cash on Delivery is currently disabled by the seller"
   ```

---

## 🎯 Expected Behavior Summary

### Seller Dashboard (`/dashboard/orders`)

**Badges:**
- Total orders count
- "Pending Proof" count (UPI screenshots awaiting approval)
- "COD Pending" count (COD orders awaiting approval)

**Table Columns:**
1. Order / Product - Product name + Order ID
2. Buyer - Name + Phone
3. Amount - Price in ₹
4. Payment - Badge: "UPI" (green) or "COD" (amber)
5. Status - Badge showing current state:
   - 🟠 "Needs Approval" (COD pending)
   - 🔴 "Rejected" (COD rejected)
   - 🔵 "Approved" (COD approved)
   - 🟠 "Verify Proof" (UPI screenshot pending)
   - 🟢 "Paid" (UPI confirmed)
   - ⚪ "Pending" (awaiting payment)
6. Actions:
   - "View Proof" (for UPI with screenshot)
   - "Approve" + "Reject" (for COD pending)
   - "Approve" (for UPI screenshot pending)

### Settings Page (`/dashboard/settings`)

**Sections:**
1. **Business Information** - Display only (name, phone, plan)
2. **UPI Payment Settings** - Editable UPI ID with validation
3. **Cash on Delivery** - Toggle with risk warnings
4. **Shiprocket Integration** - Coming soon (disabled)

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module '@radix-ui/react-switch'"
**Solution:**
```bash
npm install @radix-ui/react-switch
```

### Issue: COD toggle not working
**Solution:**
- Check browser console for errors
- Verify `cod_enabled` column exists in database
- Run `COD_SCHEMA_UPDATE.sql` migration

### Issue: Orders not showing COD status
**Solution:**
- Verify `cod_status` column exists
- Check that order was created with `payment_method = 'cod'`
- Refresh page to see updated status

### Issue: UPI QR code not showing
**Solution:**
- Verify seller has set `upi_id` in settings
- Check network tab for QR API call
- Ensure UPI ID format is valid (name@provider)

---

## 📊 Database Verification

**Check COD is enabled:**
```sql
SELECT id, business_name, cod_enabled, upi_id 
FROM sellers;
```

**Check COD orders:**
```sql
SELECT id, buyer_name, amount, payment_method, cod_status, payment_status
FROM orders
WHERE payment_method = 'cod'
ORDER BY created_at DESC;
```

**Check pending approvals:**
```sql
SELECT COUNT(*) as pending_cod
FROM orders
WHERE cod_status = 'pending_approval';
```

---

## ✅ Success Criteria

- [x] Seller can enable/disable COD from settings
- [x] Buyer sees COD option only when enabled
- [x] COD orders require seller approval
- [x] Seller can approve/reject COD orders
- [x] UPI payment with QR code works
- [x] Screenshot upload and approval works
- [x] Order status updates in real-time
- [x] Mobile-responsive on all pages
- [x] No errors in browser console
- [x] Database constraints prevent invalid states

---

## 🎉 You're Done!

If all tests pass, your COD + UPI system is fully functional and ready for production use.

**Next Steps:**
1. Add Shiprocket integration for shipping
2. Implement WhatsApp notifications
3. Add analytics dashboard
4. Deploy to production

---

**Need Help?** Check `IMPLEMENTATION_COMPLETE.md` for full technical documentation.
