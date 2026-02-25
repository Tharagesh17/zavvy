import { SecuritySquad } from './security';
import { randomBytes } from 'crypto';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('SecuritySquad (Encryption Service)', () => {
    // Setup environment variable for test
    const originalEnv = process.env;

    beforeAll(() => {
        // Generate a valid 32-byte key (64 hex chars)
        process.env.ENCRYPTION_KEY = randomBytes(32).toString('hex');
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should encrypt and decrypt a string correctly', () => {
        const secret = 'super_secret_api_key_123';
        const encrypted = SecuritySquad.encrypt(secret);

        expect(encrypted).not.toBe(secret);
        expect(encrypted).toContain(':'); // Should have IV and Tag separator

        const decrypted = SecuritySquad.decrypt(encrypted);
        expect(decrypted).toBe(secret);
    });

    it('should produce different outputs for same input (random IV)', () => {
        const secret = 'static_secret';
        const enc1 = SecuritySquad.encrypt(secret);
        const enc2 = SecuritySquad.encrypt(secret);

        expect(enc1).not.toBe(enc2);
        expect(SecuritySquad.decrypt(enc1)).toBe(secret);
        expect(SecuritySquad.decrypt(enc2)).toBe(secret);
    });

    it('should throw error if key is missing', () => {
        delete process.env.ENCRYPTION_KEY;
        expect(() => {
            SecuritySquad.encrypt('fail');
        }).toThrow('ENCRYPTION_KEY not found');

        // Restore key for other tests if needed (though existing suite structure is fine)
        process.env.ENCRYPTION_KEY = randomBytes(32).toString('hex');
    });

    it('should throw error if key is invalid length', () => {
        process.env.ENCRYPTION_KEY = 'short_key';
        expect(() => {
            SecuritySquad.encrypt('fail');
        }).toThrow('must be 32 bytes');

        process.env.ENCRYPTION_KEY = randomBytes(32).toString('hex');
    });
});
