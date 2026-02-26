
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const start = Date.now();
        const { data, error } = await supabase.auth.getUser();
        const end = Date.now();
        return NextResponse.json({ status: 'ok', duration: end - start, data, error });
    } catch (e: unknown) {
        const err = e instanceof Error ? e : new Error(String(e));
        return NextResponse.json({ status: 'error', message: err.message, stack: err.stack }, { status: 500 });
    }
}
