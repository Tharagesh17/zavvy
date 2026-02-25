# Zavvy Backend API Documentation

Complete REST API reference for product management and Shiprocket integration.

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication

All endpoints (except public ones) require Supabase authentication via session cookies.

**How to authenticate**:
1. Sign in via the dashboard (`/dashboard`)
2. Copy session cookie from browser
3. Include in API requests

**Public Endpoints** (no auth required):
- `GET /api/products/[shortId]` - View product by short code

---

## Product Management APIs

### POST /api/products

Create a new product with automatic link generation.

**Auth**: Required (seller)

**Request Body**:
```json
{
  "name": "Premium Cotton T-Shirt",
  "description": "Comfortable 100% cotton t-shirt",
  "price": 99900,
  "stock": 50,
  "images": [
    "https://your-storage.com/image1.jpg",
    "https://your-storage.com/image2.jpg"
  ],
  "variants": {
    "size": "M",
    "color": "Blue"
  }
}
```

**Field Descriptions**:
- `name` (string, required): Product name
- `description` (string, optional): Product description
- `price` (number, required): Price in **paise** (e.g., 99900 = ₹999.00)
- `stock` (number, required): Available quantity
- `images` (array, optional): Array of image URLs
- `variants` (object, optional): Product variants (size, color, etc.)

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "seller_id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "Premium Cotton T-Shirt",
      "description": "Comfortable 100% cotton t-shirt",
      "price": 99900,
      "stock": 50,
      "images": ["https://your-storage.com/image1.jpg"],
      "variants": { "size": "M", "color": "Blue" },
      "is_active": true,
      "created_at": "2026-02-04T14:30:00Z"
    },
    "link": {
      "short_code": "a3b5c7d9",
      "url": "http://localhost:3000/l/a3b5c7d9"
    }
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Product name is required"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "Premium Cotton T-Shirt",
    "price": 99900,
    "stock": 50
  }'
```

---

### GET /api/products

List all products for the authenticated seller with pagination.

**Auth**: Required (seller)

**Query Parameters**:
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "seller_id": "660e8400-e29b-41d4-a716-446655440000",
        "name": "Premium Cotton T-Shirt",
        "price": 99900,
        "stock": 50,
        "images": ["https://your-storage.com/image1.jpg"],
        "is_active": true,
        "created_at": "2026-02-04T14:30:00Z",
        "product_links": [
          {
            "short_code": "a3b5c7d9",
            "clicks": 42
          }
        ]
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 20
  }
}
```

**cURL Example**:
```bash
curl http://localhost:3000/api/products?page=1&limit=20 \
  -H "Cookie: your-session-cookie"
```

---

### GET /api/products/[shortId]

**Public endpoint** - Fetch product details by short code (for buyers).

**Auth**: Not required

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Premium Cotton T-Shirt",
      "description": "Comfortable 100% cotton t-shirt",
      "price": 99900,
      "stock": 50,
      "images": ["https://your-storage.com/image1.jpg"],
      "variants": { "size": "M", "color": "Blue" },
      "is_active": true
    },
    "seller": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "business_name": "My Store",
      "phone": "+919876543210"
    },
    "link": {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "short_code": "a3b5c7d9",
      "clicks": 43,
      "is_active": true
    }
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "error": "Product not found"
}
```

**cURL Example**:
```bash
curl http://localhost:3000/api/products/a3b5c7d9
```

**Note**: This endpoint automatically increments the click counter for analytics.

---

### DELETE /api/products/[id]

Delete a product (must be owned by seller).

**Auth**: Required (seller)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

**Error Responses**:

404 Not Found:
```json
{
  "success": false,
  "error": "Product not found"
}
```

403 Forbidden:
```json
{
  "success": false,
  "error": "Unauthorized - You can only delete your own products"
}
```

**cURL Example**:
```bash
curl -X DELETE http://localhost:3000/api/products/550e8400-e29b-41d4-a716-446655440000 \
  -H "Cookie: your-session-cookie"
```

---

## Shiprocket Integration APIs

### POST /api/shiprocket/login

Connect seller's Shiprocket account using API key.

**Auth**: Required (seller)

**Request Body**:
```json
{
  "shiprocket_api_key": "your-shiprocket-api-key-here"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "connected": true
  }
}
```

**Error Responses**:

400 Bad Request:
```json
{
  "success": false,
  "error": "Shiprocket API key is required"
}
```

401 Unauthorized:
```json
{
  "success": false,
  "error": "Invalid API key. Please check your Shiprocket dashboard and try again."
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/shiprocket/login \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "shiprocket_api_key": "your-api-key"
  }'
```

**Security Notes**:
- API key is validated by calling Shiprocket API
- Token is encrypted using AES-256-GCM before storage
- Token is **never** returned to frontend
- Stored in `sellers.shiprocket_token` (encrypted)

---

### POST /api/shiprocket/create-shipment

Create shipment for an order using seller's Shiprocket account.

**Auth**: Required (seller)

**Request Body**:
```json
{
  "order_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "shipment_id": 123456789,
    "awb_code": "AWB123456789",
    "courier_name": "Delhivery",
    "tracking_url": "https://shiprocket.co/tracking/AWB123456789"
  }
}
```

**Error Responses**:

400 Bad Request (Shiprocket not connected):
```json
{
  "success": false,
  "error": "Connect your Shiprocket account first in Settings"
}
```

400 Bad Request (Missing address):
```json
{
  "success": false,
  "error": "Order is missing required buyer address fields"
}
```

403 Forbidden:
```json
{
  "success": false,
  "error": "Unauthorized - This order does not belong to you"
}
```

404 Not Found:
```json
{
  "success": false,
  "error": "Order not found"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/api/shiprocket/create-shipment \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "order_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Prerequisites**:
1. Seller must connect Shiprocket account via `/api/shiprocket/login`
2. Order must have complete buyer address
3. Seller must create "Primary" pickup location in Shiprocket dashboard

**What happens**:
1. Fetches order with product and buyer details
2. Verifies order belongs to seller (multi-tenant isolation)
3. Decrypts Shiprocket token in memory
4. Builds shipment payload from order data
5. Calls Shiprocket API to create shipment
6. Updates order with `shipment_id`, `awb_code`, `tracking_url`
7. Sets `order_status` to "shipped"

---

### GET /api/shiprocket/track/[orderId]

Track shipment status for an order.

**Auth**: Required (seller)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "tracking_data": {
      "track_status": 1,
      "shipment_status": "In Transit",
      "shipment_track": [
        {
          "current_status": "Picked Up",
          "date": "2026-02-04T10:00:00Z"
        },
        {
          "current_status": "In Transit",
          "date": "2026-02-04T14:00:00Z"
        }
      ],
      "shipment_track_activities": [
        {
          "date": "2026-02-04T10:00:00Z",
          "activity": "Shipment picked up",
          "location": "Mumbai"
        },
        {
          "date": "2026-02-04T14:00:00Z",
          "activity": "In transit to destination",
          "location": "Pune"
        }
      ]
    },
    "awb_code": "AWB123456789",
    "courier_name": "Delhivery"
  }
}
```

**Error Responses**:

400 Bad Request (No shipment):
```json
{
  "success": false,
  "error": "No shipment found for this order. Create a shipment first."
}
```

403 Forbidden:
```json
{
  "success": false,
  "error": "Unauthorized - This order does not belong to you"
}
```

**cURL Example**:
```bash
curl http://localhost:3000/api/shiprocket/track/550e8400-e29b-41d4-a716-446655440000 \
  -H "Cookie: your-session-cookie"
```

**Note**: This endpoint automatically updates the order's `tracking_status` field with the latest status from Shiprocket.

---

## Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Data Encryption (optional, recommended for production)
# If not set, falls back to SUPABASE_SERVICE_ROLE_KEY
DATA_ENCRYPTION_KEY=your-32-byte-hex-key-here

# Shiprocket API (optional, for reference)
SHIPROCKET_API_BASE_URL=https://apiv2.shiprocket.in/v1/external
```

**Generating DATA_ENCRYPTION_KEY**:
```bash
# Generate a secure 32-byte hex key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Error Handling

All endpoints return standardized JSON responses:

**Success**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error**:
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

**Common HTTP Status Codes**:
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input or missing required fields
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Authenticated but not authorized (e.g., accessing another seller's data)
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error (check logs)

**Security**: Error messages never expose:
- Database error details
- Stack traces
- Encryption keys
- Shiprocket tokens
- Internal system details

---

## Testing with Postman/Thunder Client

### 1. Get Session Cookie

1. Open your app in browser: `http://localhost:3000`
2. Sign in via dashboard
3. Open DevTools → Application → Cookies
4. Copy the cookie value (usually starts with `sb-`)

### 2. Import Collection

Create a new collection with these requests:

**Environment Variables**:
```
BASE_URL: http://localhost:3000
SESSION_COOKIE: [paste your cookie here]
```

**Headers** (add to all authenticated requests):
```
Cookie: {{SESSION_COOKIE}}
Content-Type: application/json
```

### 3. Example Test Flow

1. **Create Product**:
   - POST `{{BASE_URL}}/api/products`
   - Body: `{ "name": "Test Product", "price": 99900, "stock": 10 }`
   - Save `product.id` from response

2. **List Products**:
   - GET `{{BASE_URL}}/api/products`
   - Verify product appears in list

3. **View Product (Public)**:
   - GET `{{BASE_URL}}/api/products/[shortCode]`
   - No auth needed
   - Verify click counter increments

4. **Connect Shiprocket**:
   - POST `{{BASE_URL}}/api/shiprocket/login`
   - Body: `{ "shiprocket_api_key": "your-key" }`

5. **Create Shipment**:
   - POST `{{BASE_URL}}/api/shiprocket/create-shipment`
   - Body: `{ "order_id": "order-uuid" }`

6. **Track Shipment**:
   - GET `{{BASE_URL}}/api/shiprocket/track/[orderId]`

7. **Delete Product**:
   - DELETE `{{BASE_URL}}/api/products/[productId]`

---

## Security Best Practices

### Multi-Tenant Isolation

All seller-scoped endpoints verify ownership:
```typescript
// Example: Seller A cannot access Seller B's products
if (product.seller_id !== seller.id) {
  return apiError("Unauthorized", 403);
}
```

### Encryption

Sensitive data is encrypted at rest:
- Shiprocket API tokens (AES-256-GCM)
- Buyer addresses (if applicable)

Decryption happens **only in memory** and is never logged:
```typescript
const token = decrypt(encryptedToken); // Use immediately
// Token discarded after API call
```

### Rate Limiting

Consider adding rate limiting for production:
```typescript
// Example with Vercel Edge Config or Redis
import { ratelimit } from "@/lib/ratelimit";

const { success } = await ratelimit.limit(seller.id);
if (!success) {
  return apiError("Too many requests", 429);
}
```

### Input Validation

All inputs are validated before processing:
- Type checking
- Range validation (price > 0, stock >= 0)
- Required field checks
- SQL injection prevention (via Supabase client)

---

## Migration from Server Actions

If you're migrating from existing Server Actions:

### Before (Server Action):
```typescript
// app/actions/products.ts
"use server";
export async function createProduct(formData: FormData) {
  // ...
}
```

### After (Route Handler):
```typescript
// app/api/products/route.ts
export const POST = withSeller(async (request, { seller }) => {
  const body = await request.json();
  // ...
});
```

### Frontend Changes:

**Before**:
```typescript
import { createProduct } from "@/app/actions/products";
const result = await createProduct(formData);
```

**After**:
```typescript
const response = await fetch("/api/products", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(productData),
});
const result = await response.json();
```

---

## Support

For issues or questions:
1. Check error messages in response
2. Review server logs: `npm run dev`
3. Verify environment variables are set
4. Test with cURL to isolate frontend issues
5. Check Supabase logs for database errors
6. Verify Shiprocket API key in dashboard

**Common Issues**:
- **401 Unauthorized**: Session cookie expired or missing
- **403 Forbidden**: Trying to access another seller's data
- **500 Internal Server Error**: Check server logs for details
- **Shiprocket errors**: Verify API key and pickup location setup
