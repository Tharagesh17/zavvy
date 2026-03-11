"use server";

import { createServiceRoleClient, createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { verifyOrderOwnership } from "@/lib/security";
import { sendPaymentApprovalEmail } from "@/lib/resend";
import { sanitizeString, normalizePhone } from "@/lib/validation";
import { logger } from "@/lib/logger";

export type CreateOrderFromLinkResult = { ok: true; orderId: string } | { ok: false; error: string };

export async function createOrderFromLink(
  _prev: CreateOrderFromLinkResult | null,
  formData: FormData
): Promise<CreateOrderFromLinkResult> {
  const requestId = logger.generateRequestId();
  logger.setRequestId(requestId);

  try {
    // Sanitize inputs
    const shortCode = sanitizeString(formData.get("short_code") as string);
    const buyer_name = sanitizeString(formData.get("buyer_name") as string);
    const buyer_email = sanitizeString(formData.get("buyer_email") as string);
    const buyer_phone_raw = (formData.get("buyer_phone") as string)?.trim();
    const line1 = sanitizeString(formData.get("line1") as string);
    const line2 = sanitizeString(formData.get("line2") as string);
    const city = sanitizeString(formData.get("city") as string);
    const state = sanitizeString(formData.get("state") as string);
    const pincode = (formData.get("pincode") as string)?.trim();

    // Parse items JSON
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let items: any[] = [];
    try {
      const itemsRaw = formData.get("items") as string;
      if (itemsRaw) items = JSON.parse(itemsRaw);
    } catch {
      return { ok: false, error: "Invalid items data." };
    }

    // Validation
    if (!shortCode || !buyer_name || !buyer_phone_raw) {
      return { ok: false, error: "Name and phone are required." };
    }
    if (!line1 || !city || !state || !pincode) {
      return { ok: false, error: "Complete address (line1, city, state, pincode) is required." };
    }
    if (items.length === 0) {
      return { ok: false, error: "At least one item must be selected." };
    }

    // Normalize phone
    let buyer_phone: string;
    try {
      buyer_phone = normalizePhone(buyer_phone_raw);
    } catch {
      return { ok: false, error: "Invalid phone number format." };
    }

    // Validate pincode
    if (!/^\d{6}$/.test(pincode)) {
      return { ok: false, error: "PIN code must be exactly 6 digits." };
    }

    // Validate email if provided
    if (buyer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer_email)) {
      return { ok: false, error: "Invalid email address." };
    }

    const supabase = createServiceRoleClient();

    // Fetch product link
    const { data: link, error: linkError } = await supabase
      .from("product_links")
      .select("id, product_id, seller_id")
      .eq("short_code", shortCode)
      .eq("is_active", true)
      .single();

    if (linkError || !link) {
      logger.warn("Invalid product link attempted", { shortCode, requestId });
      return { ok: false, error: "Invalid link." };
    }

    // Fetch product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, price, name, stock, variants")
      .eq("id", link.product_id)
      .eq("is_active", true)
      .single();

    if (productError || !product) {
      return { ok: false, error: "Product not available." };
    }

    // Calculate total quantity and validate items
    let totalQuantity = 0;
    let totalAmount = 0;
    const variantDecrements: { id: string; quantity: number }[] = [];

    const { data: variantsList } = await supabase
      .from("product_variants")
      .select("id, size, color, stock_count, price_override")
      .eq("product_id", link.product_id);

    for (const item of items) {
      if (!item.quantity || item.quantity < 1) {
        return { ok: false, error: "Invalid quantity for item." };
      }
      totalQuantity += item.quantity;

      let matchedVariant = null;
      if (variantsList && variantsList.length > 0) {
        matchedVariant = variantsList.find(v =>
          (v.size || "") === (item.variant?.size || "") &&
          (v.color || "") === (item.variant?.color || "")
        ) || variantsList[0]; // fallback to first if not exactly matched

        if (matchedVariant.stock_count < item.quantity) {
          return { ok: false, error: `Insufficient stock for selected variant. Only ${matchedVariant.stock_count} available.` };
        }
        variantDecrements.push({ id: matchedVariant.id, quantity: item.quantity });
        totalAmount += item.quantity * (matchedVariant.price_override ?? product.price);
      } else {
        totalAmount += item.quantity * product.price; // Trust server price
      }
    }

    // Check base stock if no variants matched
    if (variantDecrements.length === 0 && product.stock < totalQuantity) {
      return { ok: false, error: `Insufficient stock. Only ${product.stock} available.` };
    }

    const paymentMethodInput = sanitizeString((formData.get("payment_method") as string) || "manual_upi");

    // Fetch seller to check COD settings and Subscription Tier
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("cod_enabled, upi_id")
      .eq("id", link.seller_id)
      .single();

    if (sellerError || !seller) {
      return { ok: false, error: "Seller not found." };
    }

    let payment_method = "manual_upi";
    let cod_status = null;
    const payment_status = "pending";
    const order_status = "pending";

    if (paymentMethodInput === "cod") {
      if (!seller.cod_enabled) {
        return { ok: false, error: "Cash on Delivery is currently disabled by the seller." };
      }
      payment_method = "cod";
      cod_status = "pending_approval";
    }

    // Paise-Tag generation for manual UPI
    let finalAmount = totalAmount;
    if (payment_method === "manual_upi") {
      // Find a unique fractional amount in the last 15 minutes (reservation pool)
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: recentOrders } = await supabase
        .from("orders")
        .select("amount")
        .eq("seller_id", link.seller_id)
        .eq("payment_status", "pending")
        .gte("created_at", fifteenMinsAgo);

      const activeAmounts = new Set(recentOrders?.map(o => o.amount) || []);
      const startFraction = Math.floor(Math.random() * 99) + 1; // 1 to 99 paise

      for (let i = 0; i < 99; i++) {
        const fraction = ((startFraction + i - 1) % 99) + 1;
        const testAmount = totalAmount + fraction;
        if (!activeAmounts.has(testAmount)) {
          finalAmount = testAmount;
          break;
        }
      }
    }

    const { data: order, error: insertError } = await supabase
      .from("orders")
      .insert({
        seller_id: link.seller_id,
        product_id: link.product_id,
        product_link_id: link.id,
        buyer_name,
        buyer_phone,
        buyer_email: buyer_email || null,
        buyer_address: {
          line1,
          line2: line2 || null,
          city,
          state,
          pincode
        },
        items: items,
        amount: finalAmount,
        quantity: totalQuantity,
        payment_method,
        payment_status,
        cod_status,
        order_status,
      })
      .select("id")
      .single();

    if (insertError) {
      logger.error("Failed to create order", { error: insertError.message, requestId });
      return { ok: false, error: "Failed to create order. Please try again." };
    }

    logger.info("Order created", { orderId: order.id, sellerId: link.seller_id, requestId });

    // Decrement stock
    if (variantDecrements.length > 0) {
      for (const vd of variantDecrements) {
        await supabase.rpc("decrement_variant_stock", { v_id: vd.id, v_qty: vd.quantity });
      }
    } else {
      await supabase.rpc("decrement_stock", { product_id: link.product_id, quantity: totalQuantity });
    }

    return { ok: true, orderId: order.id };
  } catch (error) {
    logger.error("Error in createOrderFromLink", {}, error as Error);
    return { ok: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function createOrderFromLinkWrapper(
  prev: CreateOrderFromLinkResult | null,
  formData: FormData
) {
  const result = await createOrderFromLink(prev, formData);
  if (result.ok && result.orderId) {
    redirect(`/checkout/${result.orderId}`);
  }
  return result;
}

export type SubmitUtrResult = { ok: true } | { ok: false; error: string };

export async function submitUtrNumber(
  _prev: SubmitUtrResult | null,
  formData: FormData
): Promise<SubmitUtrResult> {
  const requestId = logger.generateRequestId();

  try {
    const orderId = sanitizeString(formData.get("order_id") as string);
    const utrNumber = sanitizeString(formData.get("utr_number") as string);

    if (!orderId || !utrNumber) {
      return { ok: false, error: "UTR number is required." };
    }

    if (!/^\d{12}$/.test(utrNumber)) {
      return { ok: false, error: "UTR must be exactly 12 digits." };
    }

    const supabase = createServiceRoleClient();

    // Verify order exists and is pending
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, seller_id, payment_status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return { ok: false, error: "Order not found." };
    }

    if (order.payment_status !== "pending") {
      return { ok: false, error: "Order is no longer pending payment." };
    }

    // Check UTR uniqueness directly handled by DB unique index, but we can catch the error nicely
    const { error: updateError } = await supabase
      .from("orders")
      .update({ utr_number: utrNumber, payment_status: "awaiting_approval" })
      .eq("id", orderId);

    if (updateError) {
      if (updateError.code === '23505') { // Unique violation
        return { ok: false, error: "This UTR number has already been used. Double-spending is not allowed." };
      }
      logger.error("Failed to save UTR", { error: updateError.message, orderId, requestId });
      return { ok: false, error: "Failed to submit UTR. Please try again." };
    }

    // Notify seller via Telegram with approve/reject buttons
    try {
      const { data: seller } = await supabase
        .from("sellers")
        .select("user_id")
        .eq("id", order.seller_id)
        .single();

      if (seller) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("telegram_chat_id")
          .eq("id", seller.user_id)
          .single();

        if (profile?.telegram_chat_id) {
          // Fetch order details for the notification
          const { data: fullOrder } = await supabase
            .from("orders")
            .select("amount, buyer_name, product_id")
            .eq("id", orderId)
            .single();

          const amount = fullOrder ? (fullOrder.amount / 100).toFixed(2) : "N/A";
          let productName = "Order";
          if (fullOrder?.product_id) {
            const { data: prod } = await supabase.from("products").select("name").eq("id", fullOrder.product_id).single();
            productName = prod?.name || "Order";
          }

          const botToken = process.env.TELEGRAM_BOT_TOKEN;
          if (botToken) {
            const chatId = profile.telegram_chat_id;
            const message = `🔔 *UPI Transaction ID Received!*\n\n` +
              `🛒 *Product:* ${productName}\n` +
              `💰 *Amount:* ₹${amount}\n` +
              `👤 *Buyer:* ${fullOrder?.buyer_name || "N/A"}\n` +
              `🔢 *Transaction ID:* \`${utrNumber}\`\n\n` +
              `Please verify this in your bank statement and confirm.`;

            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: "Markdown",
                reply_markup: {
                  inline_keyboard: [[
                    { text: "✅ Approve Payment", callback_data: `approve_upi:${orderId}` },
                    { text: "❌ Reject", callback_data: `reject_upi:${orderId}` }
                  ]]
                }
              }),
            });
          }
        }
      }
    } catch (tgErr) {
      logger.error("Failed to send Telegram UTR notification", {}, tgErr as Error);
    }

    revalidatePath(`/checkout/${orderId}`);
    logger.info("UTR number submitted", { orderId, utrNumber, requestId });

    return { ok: true };
  } catch (error) {
    logger.error("Error in submitUtrNumber", {}, error as Error);
    return { ok: false, error: "An unexpected error occurred." };
  }
}

interface OrderApprovalResult {
  success: boolean;
  error?: string;
}

export async function approveOrder(orderId: string): Promise<OrderApprovalResult> {
  const requestId = logger.generateRequestId();

  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const ownershipResult = await verifyOrderOwnership(user.id, orderId);

    if (!ownershipResult.success) {
      logger.logSecurity("Unauthorized order approval attempt", {
        userId: user.id,
        orderId,
        requestId,
        reason: "Order ownership verification failed",
      });
      return { success: false, error: "Unauthorized" };
    }

    if (ownershipResult.order?.payment_status === "paid") {
      return { success: false, error: "Order already marked as paid" };
    }

    // Removed Trial Expired checks

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        order_status: "confirmed",
        seller_approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      logger.error("Failed to approve order", { error: error.message, orderId, requestId });
      return { success: false, error: "Failed to approve order" };
    }

    revalidatePath("/dashboard/orders");
    logger.info("Order approved", { orderId, sellerId: ownershipResult.order?.seller_id, requestId });

    // Send approval email to buyer
    try {
      const { data: ord } = await supabase.from('orders')
        .select('buyer_email, buyer_name, amount, product_id, seller_id')
        .eq('id', orderId).single();

      if (ord?.buyer_email) {
        const { data: prod } = await supabase.from('products').select('name').eq('id', ord.product_id).single();
        const { data: slr } = await supabase.from('sellers').select('business_name').eq('id', ord.seller_id).single();

        await sendPaymentApprovalEmail({
          buyerEmail: ord.buyer_email,
          buyerName: ord.buyer_name,
          productName: prod?.name,
          orderAmount: ord.amount,
          sellerName: slr?.business_name,
          orderId,
        });
      }
    } catch (emailErr) {
      logger.error('Approval email error:', {}, emailErr as Error);
    }

    return { success: true };
  } catch (error) {
    logger.error("Error in approveOrder", {}, error as Error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function approveCodOrder(orderId: string): Promise<OrderApprovalResult> {
  const requestId = logger.generateRequestId();

  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const ownershipResult = await verifyOrderOwnership(user.id, orderId);

    if (!ownershipResult.success) {
      logger.logSecurity("Unauthorized COD approval attempt", {
        userId: user.id,
        orderId,
        requestId,
        reason: "Order ownership verification failed",
      });
      return { success: false, error: "Unauthorized" };
    }

    // Removed Trial Expired checks

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("orders")
      .update({
        cod_status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      logger.error("Failed to approve COD order", { error: error.message, orderId, requestId });
      return { success: false, error: "Failed to approve order" };
    }

    revalidatePath("/dashboard/orders");
    logger.info("COD order approved", { orderId, requestId });

    return { success: true };
  } catch (error) {
    logger.error("Error in approveCodOrder", {}, error as Error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function rejectCodOrder(orderId: string): Promise<OrderApprovalResult> {
  const requestId = logger.generateRequestId();

  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const ownershipResult = await verifyOrderOwnership(user.id, orderId);

    if (!ownershipResult.success) {
      logger.logSecurity("Unauthorized COD rejection attempt", {
        userId: user.id,
        orderId,
        requestId,
        reason: "Order ownership verification failed",
      });
      return { success: false, error: "Unauthorized" };
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("orders")
      .update({
        cod_status: "rejected",
        order_status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      logger.error("Failed to reject COD order", { error: error.message, orderId, requestId });
      return { success: false, error: "Failed to reject order" };
    }

    revalidatePath("/dashboard/orders");
    logger.info("COD order rejected", { orderId, requestId });

    return { success: true };
  } catch (error) {
    logger.error("Error in rejectCodOrder", {}, error as Error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
