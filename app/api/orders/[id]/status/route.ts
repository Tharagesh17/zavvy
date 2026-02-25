import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = createServiceRoleClient();

    const { data: order } = await supabase
        .from("orders")
        .select("cod_status, payment_status, order_status")
        .eq("id", id)
        .single();

    if (!order) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
        cod_status: order.cod_status,
        payment_status: order.payment_status,
        order_status: order.order_status,
    });
}
