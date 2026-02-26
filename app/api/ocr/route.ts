import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractReceiptData } from "@/lib/gemini";

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No image file provided" }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "Image size exceeds 5MB limit" }, { status: 400 });
        }

        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "File must be an image" }, { status: 400 });
        }

        // Convert file to buffer for Gemini
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Call Gemini Vision OCR Utility
        const result = await extractReceiptData(buffer, file.type);

        return NextResponse.json(result);
    } catch (error: unknown) {
        console.error("OCR API Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
