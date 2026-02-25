import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Public label endpoint for Telegram bot (uses seller_id + order_id verification)
export async function GET(req: NextRequest) {
    try {
        const orderId = req.nextUrl.searchParams.get("order_id");
        const sellerId = req.nextUrl.searchParams.get("seller_id");

        if (!orderId || !sellerId) {
            return NextResponse.json({ error: "Missing params" }, { status: 400 });
        }

        const db = createServiceRoleClient();

        const { data: seller } = await db.from("sellers").select("id, business_name")
            .eq("id", sellerId).single();
        if (!seller) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const { data: order } = await db.from("orders")
            .select("*, products(name)")
            .eq("id", orderId)
            .eq("seller_id", sellerId)
            .single();

        if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

        const pdfBytes = await generateLabel(order, seller);

        return new NextResponse(Buffer.from(pdfBytes), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="label-${orderId.substring(0, 8)}.pdf"`,
            },
        });
    } catch (err) {
        console.error("Public label error:", err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateLabel(order: any, seller: any): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([288, 432]);
    const { width, height } = page.getSize();

    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

    const black = rgb(0, 0, 0);
    const gray = rgb(0.4, 0.4, 0.4);
    const blue = rgb(0.0, 0.44, 0.95);

    let y = height - 25;

    // Header
    page.drawRectangle({ x: 0, y: height - 50, width, height: 50, color: rgb(0.05, 0.05, 0.05) });
    page.drawText("ZAVVY", { x: 15, y: height - 35, size: 18, font: fontBold, color: blue });
    page.drawText("Shipping Label", { x: 15, y: height - 48, size: 8, font: fontRegular, color: rgb(0.6, 0.6, 0.6) });
    const shortId = order.id.substring(0, 8).toUpperCase();
    page.drawText(`#${shortId}`, {
        x: width - fontBold.widthOfTextAtSize(`#${shortId}`, 10) - 15,
        y: height - 35, size: 10, font: fontBold, color: rgb(1, 1, 1)
    });

    y = height - 70;

    // FROM
    page.drawText("FROM:", { x: 15, y, size: 7, font: fontBold, color: gray });
    y -= 14;
    page.drawText(seller.business_name || "Seller", { x: 15, y, size: 10, font: fontBold, color: black });
    y -= 20;

    page.drawLine({ start: { x: 15, y }, end: { x: width - 15, y }, thickness: 1.5, color: black });
    y -= 15;

    // TO
    page.drawText("SHIP TO:", { x: 15, y, size: 7, font: fontBold, color: gray });
    y -= 16;
    page.drawText(order.buyer_name || "Buyer", { x: 15, y, size: 13, font: fontBold, color: black });
    y -= 14;
    page.drawText(order.buyer_phone || "", { x: 15, y, size: 9, font: fontRegular, color: black });
    y -= 5;

    const address = order.buyer_address;
    if (address) {
        const lines: string[] = [];
        if (typeof address === 'string') { lines.push(address); }
        else {
            if (address.line1) lines.push(address.line1);
            if (address.line2) lines.push(address.line2);
            const cityLine = [address.city, address.state, address.pincode].filter(Boolean).join(", ");
            if (cityLine) lines.push(cityLine);
        }
        for (const line of lines) {
            y -= 13;
            const maxChars = 40;
            if (line.length > maxChars) {
                const mid = line.lastIndexOf(' ', maxChars);
                page.drawText(line.substring(0, mid > 0 ? mid : maxChars), { x: 15, y, size: 9, font: fontRegular, color: black });
                y -= 13;
                page.drawText(line.substring(mid > 0 ? mid + 1 : maxChars), { x: 15, y, size: 9, font: fontRegular, color: black });
            } else {
                page.drawText(line, { x: 15, y, size: 9, font: fontRegular, color: black });
            }
        }
    }

    y -= 20;
    page.drawLine({ start: { x: 15, y }, end: { x: width - 15, y }, thickness: 0.5, color: gray });
    y -= 18;

    // Details
    const productName = order.products?.name || "Product";
    const amount = `₹${(order.amount / 100).toFixed(2)}`;
    const method = order.payment_method === 'cod' ? 'COD' : 'PREPAID';

    page.drawText("PRODUCT:", { x: 15, y, size: 7, font: fontBold, color: gray });
    y -= 13;
    page.drawText(productName, { x: 15, y, size: 10, font: fontRegular, color: black });
    y -= 16;

    page.drawText("AMOUNT:", { x: 15, y, size: 7, font: fontBold, color: gray });
    page.drawText("PAYMENT:", { x: 150, y, size: 7, font: fontBold, color: gray });
    y -= 13;
    page.drawText(amount, { x: 15, y, size: 11, font: fontBold, color: black });
    page.drawText(method, { x: 150, y, size: 11, font: fontBold, color: method === 'COD' ? rgb(0.85, 0.5, 0) : rgb(0, 0.6, 0.3) });
    y -= 18;

    if (order.awb_code) {
        page.drawText("AWB:", { x: 15, y, size: 7, font: fontBold, color: gray });
        y -= 13;
        page.drawText(order.awb_code, { x: 15, y, size: 12, font: fontBold, color: black });
        y -= 14;
        if (order.courier_name) {
            page.drawText(`Courier: ${order.courier_name}`, { x: 15, y, size: 9, font: fontRegular, color: gray });
        }
    }

    // Footer
    page.drawRectangle({ x: 0, y: 0, width, height: 25, color: rgb(0.95, 0.95, 0.95) });
    const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    page.drawText(`Order Date: ${dateStr} | Powered by Zavvy`, { x: 15, y: 8, size: 7, font: fontRegular, color: gray });

    return doc.save();
}
