import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats an amount held in minor units: 128450 -> "$1,284.50". */
export function formatMoney(
  cents: number,
  opts?: { compact?: boolean; currency?: string },
) {
  const currency = opts?.currency ?? "USD";
  const locale = currency === "GBP" ? "en-GB" : currency === "EUR" ? "de-DE" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: opts?.compact ? "compact" : "standard",
    maximumFractionDigits: opts?.compact ? 1 : 2,
  }).format(cents / 100);
}

/** Whole days from today until `iso`. Negative when the date has passed. */
export function daysUntil(iso: string) {
  const target = new Date(iso);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
