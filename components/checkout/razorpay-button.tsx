"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Extend Window interface for Razorpay
declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Razorpay: any;
    }
}

interface RazorpayButtonProps {
    orderId: string;
    amount: number; // in paise
    currency: string;
    name: string;
    description: string;
    image?: string;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    razorpayKeyId: string;
    razorpayOrderId?: string; // Optional if using Order API
    className?: string; // Added className prop
    buttonText?: string; // Added buttonText prop
}

export function RazorpayButton({
    orderId,
    amount,
    currency = "INR",
    name,
    description,
    image,
    prefill,
    razorpayKeyId,
    razorpayOrderId,
    className, // Destructure
    buttonText = "Pay via Online / UPI",
}: RazorpayButtonProps) {
    const [loading, setLoading] = useState(false);

    const loadScript = (src: string) => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        setLoading(true);

        const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");

        if (!res) {
            toast.error("Razorpay SDK failed to load. Are you online?");
            setLoading(false);
            return;
        }

        const options = {
            key: razorpayKeyId,
            amount: amount.toString(),
            currency,
            name,
            description,
            image,
            order_id: razorpayOrderId, // If created on specific order API
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            handler: async function (response: any) {
                // Verify Payment
                try {
                    const verifyRes = await fetch("/api/orders/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            orderId,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpaySignature: response.razorpay_signature,
                        }),
                    });

                    const data = await verifyRes.json();

                    if (data.success) {
                        toast.success("Payment Successful!");
                        // Refresh or Redirect? 
                        window.location.reload();
                    } else {
                        toast.error(data.error || "Payment verification failed");
                    }
                } catch (error) {
                    console.error(error);
                    toast.error("Payment verification error");
                }
            },
            prefill,
            theme: {
                color: "#0070F3", // Updated to Electric Blue
            },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
        setLoading(false);
    };

    return (
        <Button
            onClick={handlePayment}
            disabled={loading}
            className={className || "w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 text-lg shadow-lg"}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                </>
            ) : (
                buttonText
            )}
        </Button>
    );
}
