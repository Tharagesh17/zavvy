import { createServiceRoleClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";
import { UpiPaymentSection } from "./upi-payment-section";
import { CodStatusPoller } from "./cod-status-poller";
import { PaymentStatusPoller } from "./payment-status-poller";

export default async function CheckoutOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = createServiceRoleClient();

  // Fetch Order
  const { data: order } = await supabase
    .from("orders")
    .select(`
      id, amount, order_status, payment_status, payment_method, 
      cod_status, created_at, product_id, seller_id, 
      razorpay_order_id, buyer_name, buyer_phone
    `)
    .eq("id", orderId)
    .single();

  if (!order) notFound();

  const { data: product } = await supabase
    .from("products")
    .select("name, images, price")
    .eq("id", order.product_id)
    .single();

  const { data: seller } = await supabase
    .from("sellers")
    .select("business_name, upi_id")
    .eq("id", order.seller_id)
    .single();

  const amountInr = order.amount / 100;
  const displayAmount = (order.amount % 100 === 0)
    ? `${Math.floor(amountInr)}.00`
    : amountInr.toFixed(2);
  const upiId = seller?.upi_id || "payment@zavvy";
  const businessName = seller?.business_name || "Zavvy Seller";
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${displayAmount}&tr=${orderId.substring(0, 8)}&cu=INR&tn=Order+${orderId.substring(0, 8)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}&margin=10`;

  const isCod = order.payment_method === 'cod';
  const isPaid = order.payment_status === 'paid' || order.payment_status === 'verified';
  const isReview = order.payment_status === 'needs_review' || order.payment_status === 'awaiting_approval';
  const isCodPending = isCod && order.cod_status === 'pending_approval';
  const isCodApproved = isCod && order.cod_status === 'approved';
  // const isCodRejected = isCod && order.cod_status === 'rejected'; // Not used in this simplified view

  // Status Badge Logic (Midnight Theme)
  let statusBadge = null;
  if (isPaid) {
    statusBadge = (
      <div className="flex flex-col items-center justify-center space-y-4 py-8 animate-fade-in-up">
        <div className="relative">
          <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
          <CheckCircle2 className="h-20 w-20 text-green-500 relative z-10" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-tight">Payment Successful</h2>
          <p className="text-slate-400">Your order is confirmed.</p>
        </div>
        <Link href="/" className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-colors">
          Return Home
        </Link>
      </div>
    );
  } else if (isReview) {
    statusBadge = (
      <PaymentStatusPoller orderId={orderId} currentStatus={order.payment_status} />
    );
  } else if (isCodPending) {
    statusBadge = (
      <div className="flex flex-col items-center justify-center space-y-4 py-8 animate-fade-in-up">
        <div className="relative">
          <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full"></div>
          <Lock className="h-20 w-20 text-amber-500 relative z-10" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-tight">Request Sent</h2>
          <p className="text-slate-400">Waiting for COD approval.</p>
          <p className="text-slate-600 text-xs mt-2">This page will update automatically...</p>
        </div>
        <CodStatusPoller orderId={orderId} currentCodStatus={order.cod_status} />
      </div>
    );
  } else if (isCodApproved) {
    statusBadge = (
      <div className="flex flex-col items-center justify-center space-y-4 py-8 animate-fade-in-up">
        <div className="relative">
          <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
          <CheckCircle2 className="h-20 w-20 text-green-500 relative z-10" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-tight">Order Confirmed</h2>
          <p className="text-slate-400">Get your cash ready for delivery.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight text-white flex flex-col font-sans selection:bg-electric/30">

      {/* Header / Brand */}
      <header className="p-6 flex justify-center border-b border-white/5 bg-charcoal/30 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 bg-electric rounded-md flex items-center justify-center shadow-[0_0_15px_rgba(0,112,243,0.5)]">
            <span className="font-bold text-white text-xs">Z</span>
          </div>
          <span className="font-bold tracking-tight text-lg">Zavvy</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-4 md:p-8">
        <div className="w-full max-w-[480px] space-y-8">

          {/* Product Summary Card (Glass) */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-electric to-purple-600 rounded-2xl opacity-20 blur transition duration-1000 group-hover:duration-200"></div>
            <div className="relative p-6 rounded-2xl bg-charcoal/80 border border-white/10 backdrop-blur-xl flex justify-between items-center">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest font-medium mb-1">Purchasing</p>
                <h1 className="text-xl font-bold text-white leading-tight">{product?.name}</h1>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">₹{displayAmount}</p>
              </div>
            </div>
          </div>

          {statusBadge ? (
            statusBadge
          ) : (
            <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

              {/* Payment Options */}
              <div className="space-y-4">
                <UpiPaymentSection
                  upiUrl={upiUrl}
                  upiId={upiId}
                  qrUrl={qrUrl}
                  orderId={orderId}
                  displayAmount={displayAmount}
                />
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-slate-600 text-xs">
        <div className="flex items-center justify-center gap-2 mb-2 opacity-50">
          <Lock className="h-3 w-3" />
          <span className="uppercase tracking-widest font-bold">End-to-End Encrypted</span>
        </div>
        <p>Powered by <span className="text-slate-500 font-bold">Zavvy</span></p>
      </footer>
    </div>
  );
}
