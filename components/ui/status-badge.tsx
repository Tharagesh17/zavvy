import { cn } from "@/lib/utils";

const statusConfig = {
    pending: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
    paid: { label: "Paid", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    shipped: { label: "Shipped", className: "bg-blue-100 text-blue-800 border-blue-200" },
    delivered: { label: "Delivered", className: "bg-green-100 text-green-800 border-green-200" },
    cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-800 border-gray-200" },
    pending_approval: { label: "Pending Approval", className: "bg-orange-100 text-orange-800 border-orange-200" },
    approved: { label: "Approved", className: "bg-teal-100 text-teal-800 border-teal-200" },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-200" },
};

interface StatusBadgeProps {
    status: string;
    className?: string;
}

/**
 * StatusBadge component for displaying order/payment status.
 * 
 * Supports multiple status types with color-coded badges.
 * 
 * @param status - Status string (pending, paid, shipped, etc.)
 * @param className - Optional additional CSS classes
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border",
                config.className,
                className
            )}
        >
            {config.label}
        </span>
    );
}
