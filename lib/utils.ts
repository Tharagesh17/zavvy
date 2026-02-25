import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format amount in paise to Indian Rupees currency string.
 * 
 * @param paise - Amount in paise (e.g., 10000 = ₹100.00)
 * @returns Formatted currency string (e.g., "₹100.00")
 */
export function formatCurrency(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(paise / 100);
}
