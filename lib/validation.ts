/**
 * Centralized validation schemas and utilities
 * 
 * All user input validation happens here to ensure consistency
 * and security across the application.
 */

import { z } from "zod";

// Phone validation (Indian format)
export const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number is too long")
  .regex(/^[\d+\-\s()]+$/, "Invalid phone number format");

// Email validation
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(255, "Email is too long");

// UPI ID validation
export const upiSchema = z
  .string()
  .min(3, "UPI ID is too short")
  .max(50, "UPI ID is too long")
  .regex(/^[a-zA-Z0-9._-]+@[a-zA-Z]+$/, "Invalid UPI ID format (e.g., name@bank)");

// PIN code validation (Indian)
export const pincodeSchema = z
  .string()
  .regex(/^\d{6}$/, "PIN code must be exactly 6 digits");

// Business name validation
export const businessNameSchema = z
  .string()
  .min(2, "Business name must be at least 2 characters")
  .max(100, "Business name must be less than 100 characters")
  .regex(/^[a-zA-Z0-9\s&'-]+$/, "Business name contains invalid characters");

// Address validation
export const addressSchema = z.object({
  line1: z.string().min(5, "Address line 1 is required").max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(2, "City is required").max(50),
  state: z.string().min(2, "State is required").max(50),
  pincode: pincodeSchema,
});

// Order validation
export const orderSchema = z.object({
  buyer_name: z.string().min(2, "Name is required").max(100),
  buyer_phone: phoneSchema,
  buyer_address: addressSchema,
  quantity: z.number().int().min(1).max(100).default(1),
});

// Product validation
export const productSchema = z.object({
  name: z.string().min(2, "Product name is required").max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive("Price must be greater than 0").max(999999),
  stock: z.number().int().min(0).max(9999),
  is_active: z.boolean().default(true),
});

// Short code validation (for product links)
export const shortCodeSchema = z
  .string()
  .min(6, "Invalid link")
  .max(20, "Invalid link")
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid link format");

// UUID validation
export const uuidSchema = z
  .string()
  .uuid("Invalid identifier format");

// Shiprocket credentials
export const shiprocketCredentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

// Payment method validation
export const paymentMethodSchema = z.enum(["manual_upi", "cod", "online"]);

// File upload validation
export const fileUploadSchema = z.object({
  size: z.number().max(5 * 1024 * 1024, "File size must be less than 5MB"),
  type: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove < and > to prevent HTML injection
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .slice(0, 1000); // Limit length
}

/**
 * Sanitize HTML content (if needed for rich text)
 */
export function sanitizeHtml(input: string): string {
  // For now, just strip all HTML tags
  // In production, use a library like DOMPurify
  return input
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, 5000);
}

/**
 * Normalize phone number to E.164 format
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  
  // If already has country code
  if (digits.startsWith("91") && digits.length === 12) {
    return `+${digits}`;
  }
  
  // If 10 digits, assume Indian number
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  
  // Return as-is if already has + and valid length
  if (phone.startsWith("+") && digits.length >= 10) {
    return phone;
  }
  
  throw new Error("Invalid phone number format");
}

/**
 * Validate and parse request body
 */
export async function validateBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; errors: string[] }> {
  const result = schema.safeParse(body);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.issues.map((err) => `${String(err.path.join("."))}: ${err.message}`);
  return { success: false, errors };
}

/**
 * Create a validator function for common patterns
 */
export function createValidator<T>(schema: z.ZodSchema<T>) {
  return (data: unknown) => validateBody(data, schema);
}
