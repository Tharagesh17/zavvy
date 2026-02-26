import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { LogisticsSquad } from '@/lib/squads/logistics';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/database.types.fixed';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Missing requried fields: orderId' }, { status: 400 });
        }

        // Initialize Admin Client to fetch seller_id
        const supabaseAdmin = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch order to get seller_id
        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select('seller_id')
            .eq('id', orderId)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .single() as { data: any, error: any };

        if (error || !order || !order.seller_id) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }


        // Trigger Logistics for ALL orders (No more tier checking)
        let shipment = null;
        try {
            shipment = await LogisticsSquad.createShipment(orderId, order.seller_id);
            logger.info('Shipment triggered for order', { orderId });
        } catch (shipError: unknown) {
            logger.error('Auto-shipment failed', { orderId }, shipError instanceof Error ? shipError : undefined);
        }

        return NextResponse.json({ success: true, shipment });

    } catch (err: unknown) {
        logger.error('Verification Error', {}, err instanceof Error ? err : undefined);
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 });
    }
}
