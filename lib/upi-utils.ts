/**
 * UPI Utility Functions for Zavvy Direct Payment System
 * Handles Paise-Tag generation, UPI deep links, and device detection.
 */

/**
 * Generate a unique Paise-Tag (01–99) for payment identification.
 * Seller can match exact amount in their bank statement to an order.
 */
export function generatePaiseTag(): number {
    return Math.floor(Math.random() * 99) + 1; // 1–99
}

/**
 * Calculate the final payment amount with Paise-Tag applied.
 * @param baseAmountPaise - Order amount in paise (e.g., 50000 for ₹500)
 * @param paiseTag - The generated paise tag (e.g., 37)
 * @returns Amount in rupees with paise (e.g., 500.37)
 */
export function getTaggedAmount(baseAmountPaise: number, paiseTag: number): string {
    const rupees = Math.floor(baseAmountPaise / 100);
    const existingPaise = baseAmountPaise % 100;
    // If there are already paise in the amount, just add the tag
    const finalPaise = existingPaise + paiseTag;
    return `${rupees + Math.floor(finalPaise / 100)}.${String(finalPaise % 100).padStart(2, '0')}`;
}

interface UpiLinkParams {
    pa: string;  // Payee UPI VPA
    pn: string;  // Payee Name
    am: string;  // Amount (e.g., "500.37")
    tr: string;  // Transaction Reference (Order ID)
    tn: string;  // Transaction Note
    cu?: string; // Currency (default: INR)
}

/**
 * Generate a standards-compliant UPI deep link.
 * Works with all UPI apps (GPay, PhonePe, Paytm, BHIM, etc.)
 */
export function generateUpiDeepLink(params: UpiLinkParams): string {
    const { pa, pn, am, tr, tn, cu = 'INR' } = params;
    return `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&am=${am}&tr=${encodeURIComponent(tr)}&tn=${encodeURIComponent(tn)}&cu=${cu}`;
}

/**
 * Detect if the user is on a mobile device (server-side via User-Agent).
 * Intent links only work on mobile; desktop needs QR.
 */
export function isMobileDevice(userAgent: string): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}
