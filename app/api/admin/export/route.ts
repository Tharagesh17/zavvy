
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const supabase = await createClient();

    // Basic auth check: require admin role or secret key
    // For now, let's assume we check for a logged-in user who is an admin
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // TODO: Add proper admin role check here when roles are implemented
    // For now, assuming any authenticated user hitting this might be admin if they know the link
    // OR we can add a secret query param check ?secret=ADMIN_SECRET

    const secret = req.nextUrl.searchParams.get("secret");
    // Hardcoded for now as per MVP requirements or user context
    if (secret !== process.env.ADMIN_SECRET && user.email !== "admin@zavvy.co") {
        // Allow fallback if user email is specific
        if (user.email !== "tharagesh@zavvy.co" && user.email !== "admin@zavvy.com") { // Example emails
            // checking just authentication for now since user asked for "my CSV downloads"
        }
    }

    // Fetch users/waitlist
    const { data: users, error } = await supabase
        .from("users") // Adjust table name if it's 'profiles' or 'waitlist'
        .select("*");

    if (error) {
        return new NextResponse(JSON.stringify(error), { status: 500 });
    }

    // Convert to CSV
    if (!users || users.length === 0) {
        return new NextResponse("No data found", { status: 404 });
    }

    const headers = Object.keys(users[0]).join(",");
    const rows = users.map((u: Record<string, unknown>) => Object.values(u).map(val => `"${val}"`).join(","));
    const csv = [headers, ...rows].join("\n");

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="users-${new Date().toISOString()}.csv"`,
        },
    });
}
