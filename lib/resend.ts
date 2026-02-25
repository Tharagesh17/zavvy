import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Use sandbox in dev, custom domain in production
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

interface ShipmentEmailParams {
    buyerEmail?: string;
    buyerName: string;
    buyerPhone?: string;
    awbNumber: string;
    courierName: string;
    productName?: string;
    orderAmount?: number; // in paise
    sellerName?: string;
}

/**
 * Send a shipment notification email to the buyer.
 * Falls back gracefully if Resend is not configured.
 */
export async function sendShipmentEmail(params: ShipmentEmailParams): Promise<{ ok: boolean; error?: string }> {
    if (!resend) {
        console.warn("Resend not configured (RESEND_API_KEY missing). Skipping email.");
        return { ok: false, error: "Email not configured" };
    }

    if (!params.buyerEmail) {
        console.warn("No buyer email available. Skipping shipment email.");
        return { ok: false, error: "No buyer email" };
    }

    const trackingUrl = getTrackingUrl(params.courierName, params.awbNumber);
    const amountDisplay = params.orderAmount ? `₹${(params.orderAmount / 100).toLocaleString('en-IN')}` : '';

    try {
        const { error } = await resend.emails.send({
            from: `Zavvy <${FROM_EMAIL}>`,
            to: params.buyerEmail,
            subject: `🚚 Your order has been shipped! — Tracking: ${params.awbNumber}`,
            html: buildShipmentEmailHtml({
                ...params,
                trackingUrl,
                amountDisplay,
            }),
        });

        if (error) {
            console.error("Resend send error:", error);
            return { ok: false, error: error.message };
        }

        return { ok: true };
    } catch (err: any) {
        console.error("Resend error:", err);
        return { ok: false, error: err.message };
    }
}

interface ApprovalEmailParams {
    buyerEmail?: string;
    buyerName: string;
    productName?: string;
    orderAmount?: number; // in paise
    sellerName?: string;
    orderId: string;
}

/**
 * Send a payment confirmation email to the buyer when seller approves.
 */
export async function sendPaymentApprovalEmail(params: ApprovalEmailParams): Promise<{ ok: boolean; error?: string }> {
    if (!resend) {
        return { ok: false, error: "Email not configured" };
    }
    if (!params.buyerEmail) {
        return { ok: false, error: "No buyer email" };
    }

    const amountDisplay = params.orderAmount ? `₹${(params.orderAmount / 100).toLocaleString('en-IN')}` : '';

    try {
        const { error } = await resend.emails.send({
            from: `Zavvy <${FROM_EMAIL}>`,
            to: params.buyerEmail,
            subject: `✅ Payment Confirmed — Your order is being processed!`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#141414;border-radius:16px;border:1px solid #222;overflow:hidden;">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:32px 24px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:8px;padding:6px 10px;margin-bottom:12px;">
        <span style="color:#fff;font-weight:800;font-size:14px;letter-spacing:1px;">ZAVVY</span>
    </div>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:8px 0 4px;">Payment Confirmed! ✅</h1>
    <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0;">Your order is being processed</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:28px 24px;">
    <p style="color:#aaa;font-size:13px;margin:0 0 20px;">Hi <strong style="color:#fff;">${params.buyerName}</strong>,</p>
    <p style="color:#aaa;font-size:13px;line-height:1.6;margin:0 0 24px;">
        Great news! Your payment${params.productName ? ` for <strong style="color:#fff;">${params.productName}</strong>` : ''} has been verified by ${params.sellerName || 'the seller'}.
    </p>

    <!-- Order Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;margin-bottom:24px;">
    <tr><td style="padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td style="padding-bottom:12px;border-bottom:1px solid #2a2a2a;">
                <span style="color:#666;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Order ID</span><br>
                <span style="color:#0070f3;font-size:16px;font-weight:700;font-family:monospace;">#${params.orderId.substring(0, 8).toUpperCase()}</span>
            </td>
        </tr>
        ${amountDisplay ? `<tr><td style="padding-top:12px;">
            <span style="color:#666;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Amount Paid</span><br>
            <span style="color:#10b981;font-size:18px;font-weight:700;">${amountDisplay}</span>
        </td></tr>` : ''}
        </table>
    </td></tr>
    </table>

    <p style="color:#666;font-size:12px;text-align:center;">📦 You'll receive a shipping update with tracking details once your order ships.</p>
</td></tr>

<!-- Footer -->
<tr><td style="padding:20px 24px;border-top:1px solid #222;text-align:center;">
    <p style="color:#555;font-size:11px;margin:0;">Powered by <strong style="color:#666;">Zavvy</strong></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`,
        });

        if (error) {
            console.error("Approval email error:", error);
            return { ok: false, error: error.message };
        }
        return { ok: true };
    } catch (err: any) {
        console.error("Approval email error:", err);
        return { ok: false, error: err.message };
    }
}

function getTrackingUrl(courier: string, awb: string): string {
    const c = courier.toLowerCase();
    if (c.includes('delhivery')) return `https://www.delhivery.com/track/package/${awb}`;
    if (c.includes('bluedart') || c.includes('blue dart')) return `https://www.bluedart.com/tracking/${awb}`;
    if (c.includes('dtdc')) return `https://www.dtdc.in/tracking/shipment-tracking.asp?strCnno=${awb}`;
    if (c.includes('india post')) return `https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx?cnsgnmntNo=${awb}`;
    if (c.includes('ekart')) return `https://ekartlogistics.com/shipmenttrack/${awb}`;
    if (c.includes('shiprocket')) return `https://shiprocket.co/tracking/${awb}`;
    if (c.includes('xpressbees')) return `https://www.xpressbees.com/track?trackingId=${awb}`;
    return `https://www.google.com/search?q=track+${encodeURIComponent(courier)}+${awb}`;
}

function buildShipmentEmailHtml(params: ShipmentEmailParams & { trackingUrl: string; amountDisplay: string }): string {
    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#141414;border-radius:16px;border:1px solid #222;overflow:hidden;">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#0070f3,#7c3aed);padding:32px 24px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:8px;padding:6px 10px;margin-bottom:12px;">
        <span style="color:#fff;font-weight:800;font-size:14px;letter-spacing:1px;">ZAVVY</span>
    </div>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:8px 0 4px;">Your order is on its way! 🚚</h1>
    <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0;">Shipped by ${params.sellerName || 'the seller'}</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:28px 24px;">
    <p style="color:#aaa;font-size:13px;margin:0 0 20px;">Hi <strong style="color:#fff;">${params.buyerName}</strong>,</p>
    <p style="color:#aaa;font-size:13px;line-height:1.6;margin:0 0 24px;">Great news! Your${params.productName ? ` <strong style="color:#fff;">${params.productName}</strong>` : ' order'} has been packed and shipped.</p>

    <!-- Tracking Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;margin-bottom:24px;">
    <tr><td style="padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td style="padding-bottom:12px;border-bottom:1px solid #2a2a2a;">
                <span style="color:#666;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Tracking Number</span><br>
                <span style="color:#0070f3;font-size:18px;font-weight:700;font-family:monospace;letter-spacing:1px;">${params.awbNumber}</span>
            </td>
        </tr>
        <tr>
            <td style="padding-top:12px;">
                <span style="color:#666;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Courier</span><br>
                <span style="color:#fff;font-size:14px;font-weight:600;">${params.courierName}</span>
            </td>
        </tr>
        ${params.amountDisplay ? `
        <tr>
            <td style="padding-top:12px;">
                <span style="color:#666;font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Amount</span><br>
                <span style="color:#fff;font-size:14px;font-weight:600;">${params.amountDisplay}</span>
            </td>
        </tr>` : ''}
        </table>
    </td></tr>
    </table>

    <!-- CTA Button -->
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
        <a href="${params.trackingUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#0070f3,#0050d0);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.5px;">
            📦 Track Your Package
        </a>
    </td></tr>
    </table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:20px 24px;border-top:1px solid #222;text-align:center;">
    <p style="color:#555;font-size:11px;margin:0;">Powered by <strong style="color:#666;">Zavvy</strong></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
