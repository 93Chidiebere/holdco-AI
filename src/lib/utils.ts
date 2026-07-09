import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurrencySymbol(currencyCode: string): string {
  switch (currencyCode) {
    case "NGN": return "₦";
    case "USD": return "$";
    case "EUR": return "€";
    case "GBP": return "£";
    case "KES": return "KSh";
    case "ZAR": return "R";
    default: return "₦";
  }
}
