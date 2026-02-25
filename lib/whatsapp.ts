export function generateWhatsAppThankYouLink(buyerPhone: string, buyerName: string, orderId: string, shopName: string) {
    // Normalize phone to format without + or spaces for the deep link
    const normalizedPhone = buyerPhone.replace(/\D/g, "");

    const text = `Hi ${buyerName} 👋\n\nThank you for shopping with ${shopName}!\nWe have received your order (ID: ${orderId.slice(0, 8).toUpperCase()}).\nWe'll keep you updated on the tracking details soon.\n\nLet us know if you have any questions!`;

    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
}

export function generateWhatsAppSoldOutAlert(sellerPhone: string, productName: string) {
    const normalizedPhone = sellerPhone.replace(/\D/g, "");

    const text = `⚠️ *Stock Alert*\n\nYour product *${productName}* is sold out!\n\nPlease open your Zavvy dashboard or go to the Zavvy Telegram Bot to add more stock quickly.`;

    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
}
