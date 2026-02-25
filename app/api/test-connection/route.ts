
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const start = Date.now();
        const { data, error } = await supabase.auth.getUser();
        const end = Date.now();
        return NextResponse.json({ status: 'ok', duration: end - start, data, error });
    } catch (e: any) {
        return NextResponse.json({ status: 'error', message: e.message, stack: e.stack, cause: e.cause }, { status: 500 });
    }
}
