import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Hoist mocks so they can be used in factory AND tests
const dbMocks = vi.hoisted(() => {
    const select = vi.fn();
    const eq = vi.fn();
    const single = vi.fn();
    const update = vi.fn();
    const insert = vi.fn();

    // Create builder object
    const builder = {
        select,
        eq,
        single,
        update,
        insert
    };

    // Configure chaining
    // Note: we can't use .mockReturnValue(builder) here inside hoisted because 'builder' is defined in same scope?
    // Actually, we can just assign the return values now.
    select.mockReturnValue(builder);
    eq.mockReturnValue(builder);
    update.mockReturnValue(builder);
    insert.mockReturnValue(builder);

    return {
        select, eq, single, update, insert, builder
    };
});

// 2. Mock modules using hoisted variables
vi.mock('@/database.types', () => ({}));

vi.mock('./security', () => ({
    SecuritySquad: {
        decrypt: vi.fn((txt) => 'decrypted_' + txt)
    }
}));

vi.mock('../shiprocket', () => ({
    loginShiprocket: vi.fn().mockResolvedValue({ token: 'mock_token' }),
    createShipment: vi.fn().mockResolvedValue({
        shipment_id: 12345,
        order_id: 'sr_order_1',
        awb_code: 'AWB123',
        courier_name: 'BlueDart'
    })
}));

vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: () => dbMocks.builder
    })
}));

// 3. Import System Under Test (SUT) LAST
import { LogisticsSquad } from './logistics';

describe('LogisticsSquad', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Re-establish chaining just in case clearAllMocks wipes return values? 
        // clearAllMocks clears call history. mockReset clears implementations.
        // If we use mockReturnValue, it's an implementation.
        // Let's re-apply return values to be safe.
        dbMocks.select.mockReturnValue(dbMocks.builder);
        dbMocks.eq.mockReturnValue(dbMocks.builder);
        dbMocks.update.mockReturnValue(dbMocks.builder);
        dbMocks.insert.mockReturnValue(dbMocks.builder);
    });

    it('should BLOCK Free Tier if not verified', async () => {
        dbMocks.single.mockResolvedValueOnce({
            data: {
                id: 'order_1',
                tier: 'free',
                payment_method: 'upi_manual',
                payment_status: 'pending',
                buyer_name: 'Test Buyer',
                amount: 10000
            },
            error: null
        });

        await expect(LogisticsSquad.createShipment('order_1', 'seller_1'))
            .rejects
            .toThrow('Security Block: Free Tier orders must be manually verified');
    });

    it('should ALLOW Free Tier if manually verified', async () => {
        // 1. Order Query
        dbMocks.single.mockResolvedValueOnce({
            data: {
                id: 'order_1',
                tier: 'free',
                payment_method: 'upi_manual',
                payment_status: 'verified',
                buyer_name: 'Test Buyer',
                amount: 10000,
                created_at: new Date().toISOString()
            },
            error: null
        });

        // 2. Keys Query
        dbMocks.single.mockResolvedValueOnce({
            data: {
                encrypted_shiprocket_email: 'enc_email',
                encrypted_shiprocket_password: 'enc_pass'
            },
            error: null
        });

        // dbMocks.update return value is already builder (default), which is fine for void await
        dbMocks.insert.mockResolvedValueOnce({ error: null });

        const result = await LogisticsSquad.createShipment('order_1', 'seller_1');
        expect(result.awb_code).toBe('AWB123');
    });

    it('should ALLOW Pro Tier (Auto)', async () => {
        // 1. Order Query
        dbMocks.single.mockResolvedValueOnce({
            data: {
                id: 'order_2',
                tier: 'pro',
                payment_method: 'razorpay',
                // Pro tier check relies on tier='pro', payment status logic handled by caller/other checks usually, 
                // but LogisticsSquad does basic 'paid' check if implemented. 
                // My implementation only explicit blocks 'free' && 'upi_manual' && !verified.
                payment_status: 'pending',
                buyer_name: 'Pro Buyer',
                amount: 50000,
                created_at: new Date().toISOString()
            },
            error: null
        });

        // 2. Keys Query
        dbMocks.single.mockResolvedValueOnce({
            data: {
                encrypted_shiprocket_email: 'enc_email',
                encrypted_shiprocket_password: 'enc_pass'
            },
            error: null
        });

        await LogisticsSquad.createShipment('order_2', 'seller_1');
        expect(dbMocks.select).toHaveBeenCalled();
    });
});
