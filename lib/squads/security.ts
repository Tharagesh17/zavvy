import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export class SecuritySquad {
    private static readonly ALGORITHM = 'aes-256-gcm';
    private static readonly KEY_LENGTH = 32; // 256 bits
    private static readonly IV_LENGTH = 16;  // 128 bits for GCM (usually 12, but 16 is fine if consistent, node examples often use 16 or 12. NIST recommends 12 bytes (96 bits) for GCM for efficiency. Let's use 12.)
    // Actually, let's stick to standard 12 bytes IV for GCM as per NIST SP 800-38D.
    private static readonly RECOMMENDED_IV_LENGTH = 12;

    /**
     * Retrieves the encryption key from environment variables.
     * Throws if not found or invalid length.
     */
    private static getKey(): Buffer {
        const hexKey = process.env.ENCRYPTION_KEY;
        if (!hexKey) {
            throw new Error('SecuritySquad: ENCRYPTION_KEY not found in environment variables.');
        }
        const key = Buffer.from(hexKey, 'hex');
        if (key.length !== SecuritySquad.KEY_LENGTH) {
            throw new Error(`SecuritySquad: ENCRYPTION_KEY must be ${SecuritySquad.KEY_LENGTH} bytes (64 hex chars). Found ${key.length} bytes.`);
        }
        return key;
    }

    /**
     * Encrypts a text string explicitly.
     * Format: iv:authTag:encryptedText (all hex encoded)
     */
    static encrypt(text: string): string {
        const iv = randomBytes(SecuritySquad.RECOMMENDED_IV_LENGTH);
        const key = SecuritySquad.getKey();
        const cipher = createCipheriv(SecuritySquad.ALGORITHM, key, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();

        // Return as colon-separated hex strings
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }

    /**
     * Decrypts a text string.
     * Expects format: iv:authTag:encryptedText
     */
    static decrypt(encryptedText: string): string {
        const parts = encryptedText.split(':');
        if (parts.length !== 3) {
            throw new Error('SecuritySquad: Invalid encrypted text format.');
        }

        const [ivHex, authTagHex, contentHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const key = SecuritySquad.getKey();

        const decipher = createDecipheriv(SecuritySquad.ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(contentHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}
