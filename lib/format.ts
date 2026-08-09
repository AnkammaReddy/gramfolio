const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
}

export function currencySymbol(currency = "INR") {
  return CURRENCY_SYMBOLS[currency] ?? currency + " "
}

export function formatCurrency(value: number, currency = "INR", opts?: { compact?: boolean }) {
  const symbol = currencySymbol(currency)
  const v = value || 0
  if (opts?.compact && Math.abs(v) >= 100000) {
    // Indian-style compact for large numbers
    if (Math.abs(v) >= 10000000) return `${symbol}${(v / 10000000).toFixed(2)}Cr`
    return `${symbol}${(v / 100000).toFixed(2)}L`
  }
  const locale = currency === "INR" ? "en-IN" : "en-US"
  return `${symbol}${v.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

export function formatWeight(grams: number) {
  return `${(grams || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })} g`
}

export function formatPercent(value: number, digits = 2) {
  const v = value || 0
  return `${v >= 0 ? "" : ""}${v.toFixed(digits)}%`
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return "—"
  // Parse YYYY-MM-DD strings as local time to avoid UTC midnight shifting the
  // date back by one day in IST (UTC+5:30) and other positive-offset timezones.
  const d =
    typeof date === "string"
      ? /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? new Date(date.replace(/-/g, "/"))
        : new Date(date)
      : date
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

export function daysBetween(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}
