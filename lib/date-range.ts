import type { PurchaseDTO } from "./types"

export type RangeKey = "1m" | "3m" | "6m" | "1y" | "all"

export const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
]

export function rangeStartDate(range: RangeKey): string | null {
  if (range === "all") return null
  const d = new Date()
  const months = { "1m": 1, "3m": 3, "6m": 6, "1y": 12 }[range]
  d.setMonth(d.getMonth() - months)
  return d.toISOString().slice(0, 10)
}

export function filterByRange(purchases: PurchaseDTO[], range: RangeKey): PurchaseDTO[] {
  const start = rangeStartDate(range)
  if (!start) return purchases
  return purchases.filter((p) => p.purchaseDate >= start)
}
