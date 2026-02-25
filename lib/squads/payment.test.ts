import { PaymentSquad } from './payment';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// Hoist mocks
const dbMocks = vi.hoisted(() => {
    const select = vi.fn();
    const eq = vi.fn();
    const single = vi.fn();
    const update = vi.fn();
    const insert = vi.fn();

    const builder = { select, eq, single, update, insert };

    select.mockReturnValue(builder);
    eq.mockReturnValue(builder);
    update.mockReturnValue(builder);
    insert.mockReturnValue(builder);

    return { select, eq, single, update, insert, builder };
});

vi.mock('@/database.types', () => ({}));
vi.mock('./security', () => ({
    SecuritySquad: {
        decrypt: vi.fn(() => 'secret_ky_123') // Fixed decrypted secret
    }
}));

vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: () => dbMocks.builder
    })
}));

describe('PaymentSquad', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset chain return values
        dbMocks.select.mockReturnValue(dbMocks.builder);
        dbMocks.eq.mockReturnValue(dbMocks.builder);
        dbMocks.update.mockReturnValue(dbMocks.builder);
        dbMocks.insert.mockReturnValue(dbMocks.builder);
    });

    it('should validate VPA correctly', () => {
        expect(PaymentSquad.validateVPA('test@oksbi')).toBe(true);
        expect(PaymentSquad.validateVPA('invalid')).toBe(false);
    });

    it('should verify Razorpay signature successfully', async () => {
        const orderId = 'order_123';
        const payId = 'pay_123';
        const secret = 'secret_ky_123';

        // Generate valid signature
        const signature = crypto.createHmac('sha256', secret)
            .update(orderId + '|' + payId)
            .digest('hex');

        // Mock DB Key Fetch
        dbMocks.single.mockResolvedValueOnce({
            data: { encrypted_razorpay_key_secret: 'enc_secret' },
            error: null
        });

        // Mock Order Fetch (for recordSuccessfulPayment)
        dbMocks.select.mockReturnValue(dbMocks.builder); // for inner select
        dbMocks.single.mockResolvedValueOnce({ data: { amount: 500 } }); // for inner order fetch

        const isValid = await PaymentSquad.verifyRazorpay(
            'oid_1', 'sid_1', orderId, payId, signature
        );

        expect(isValid).toBe(true);
        expect(dbMocks.update).toHaveBeenCalledWith({
            payment_status: 'paid',
            payment_method: 'razorpay'
        });
    });

    it('should fail invalid signature', async () => {
        // Mock DB Key Fetch
        dbMocks.single.mockResolvedValueOnce({
            data: { encrypted_razorpay_key_secret: 'enc_secret' },
            error: null
        });

        const isValid = await PaymentSquad.verifyRazorpay(
            'oid_1', 'sid_1', 'razor_oid', 'razor_pay', 'wrong_sig'
        );

        expect(isValid).toBe(false);
    });

    it('should submit manual review correctly', async () => {
        // 1. Mock Order Update
        // dbMocks.update returns builder by default, safe for await.

        // 2. Mock Order Fetch (amount)
        dbMocks.single.mockResolvedValueOnce({
            data: { amount: 1000 },
            error: null
        });

        // 3. Mock Payment Insert
        dbMocks.insert.mockResolvedValueOnce({ error: null });

        await PaymentSquad.submitManualReview('oid_1', 'sid_1', 'http://screen.shot');

        expect(dbMocks.update).toHaveBeenCalledWith({
            payment_status: 'needs_review',
            payment_method: 'upi_manual'
        });

        // Verify insert called with correct status
        expect(dbMocks.insert).toHaveBeenCalledWith(expect.objectContaining({
            status: 'needs_review',
            screenshot_url: 'http://screen.shot'
        }));
    });
});
