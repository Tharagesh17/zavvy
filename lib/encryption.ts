import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 16;
const TAG_LEN = 16;
const KEY_LEN = 32;

/**
 * Get encryption key from environment variables.
 * 
 * Security: Prioritizes DATA_ENCRYPTION_KEY for production use.
 * Falls back to SUPABASE_SERVICE_ROLE_KEY for backward compatibility.
 * 
 * IMPORTANT: If you change the encryption key, all existing encrypted data
 * (Shiprocket tokens, buyer addresses) will become unreadable.
 */
function getKey(): Buffer {
  const secret = process.env.DATA_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("DATA_ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY required for encryption");
  return scryptSync(secret, "zavvy-bank-salt", KEY_LEN);
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * 
 * Returns hex string containing: IV (16 bytes) + Auth Tag (16 bytes) + Ciphertext.
 * 
 * Security: Uses authenticated encryption to prevent tampering.
 * Never log the output or store it in plaintext logs.
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv, { authTagLength: TAG_LEN });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("hex");
}

/**
 * Decrypt hex string from encrypt().
 * 
 * Security: Decrypted value exists only in memory. Never log or persist it.
 * Use immediately and discard after use (e.g., for API calls).
 */
export function decrypt(hex: string): string {
  const key = getKey();
  const buf = Buffer.from(hex, "hex");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const encrypted = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv, { authTagLength: TAG_LEN });
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}
