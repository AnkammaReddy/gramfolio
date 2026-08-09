import type { PurchaseDTO, GoldPriceDTO } from "./types"
import { totalWeight } from "./calculations"

/** Minimal RFC-4180-ish CSV parser supporting quoted fields and commas/newlines within quotes. */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = []
  let field = ""
  let row: string[] = []
  let inQuotes = false
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ",") {
      row.push(field)
      field = ""
    } else if (c === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else {
      field += c
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""))
  const headers = nonEmpty.length > 0 ? nonEmpty[0].map((h) => h.trim()) : []
  return { headers, rows: nonEmpty.slice(1) }
}

function escapeCsv(value: unknown): string {
  const s = value == null ? "" : String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const head = headers.map(escapeCsv).join(",")
  const body = rows.map((r) => r.map(escapeCsv).join(",")).join("\n")
  return `${head}\n${body}`
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** The canonical fields a CSV can map to for purchase import. */
export type ImportField = { key: string; label: string; required?: boolean }
export const IMPORT_FIELDS = [
  { key: "purchaseDate", label: "Purchase Date", required: true },
  { key: "deliveredDate", label: "Delivered Date" },
  { key: "website", label: "Website" },
  { key: "merchant", label: "Merchant" },
  { key: "brand", label: "Brand" },
  { key: "category", label: "Category (Coin/Bar)" },
  { key: "purity", label: "Purity" },
  { key: "weightGrams", label: "Weight (g)", required: true },
  { key: "quantity", label: "Quantity" },
  { key: "purchasePrice", label: "Purchase Price", required: true },
  { key: "creditCard", label: "Credit Card" },
  { key: "paymentMethod", label: "Payment Method" },
  { key: "rewardStrategy", label: "Reward Strategy" },
  { key: "rewardPercentage", label: "Reward %" },
  { key: "rewardValue", label: "Reward Value" },
  { key: "giftVoucherSavings", label: "Gift Voucher Savings" },
  { key: "superCoinsValue", label: "SuperCoins Value" },
  { key: "couponSavings", label: "Coupon Savings" },
  { key: "cashbackExpected", label: "Cashback Expected" },
  { key: "cashbackReceived", label: "Cashback Received" },
  { key: "cashbackStatus", label: "Cashback Status" },
  { key: "remarks", label: "Remarks" },
  { key: "notes", label: "Notes" },
  { key: "tags", label: "Tags (semicolon separated)" },
] as const satisfies readonly ImportField[]

export type ImportFieldKey = (typeof IMPORT_FIELDS)[number]["key"]

/** Template CSV header + a sample row so users know the expected format. */
export const CSV_TEMPLATE = toCsv(
  IMPORT_FIELDS.map((f) => f.label),
  [
    [
      "2024-04-15",
      "Flipkart",
      "MMTC-PAMP",
      "MMTC-PAMP",
      "Coin",
      "999",
      "10",
      "1",
      "72500",
      "HSBC TravelOne",
      "Credit Card",
      "5% cashback + SuperCoins",
      "5",
      "0",
      "0",
      "120",
      "0",
      "3625",
      "0",
      "2024-05-20",
      "Pending",
      "Akshaya Tritiya offer",
      "",
      "Festival;Akshaya Tritiya",
    ],
  ],
)

// ---- Export builders ----

export function purchasesToCsv(purchases: PurchaseDTO[]): string {
  const headers = [
    "Purchase Date",
    "Delivered Date",
    "Website",
    "Merchant",
    "Brand",
    "Category",
    "Purity",
    "Weight (g)",
    "Quantity",
    "Total Weight (g)",
    "Purchase Price",
    "Price/g",
    "Credit Card",
    "Reward Value",
    "Cashback Expected",
    "Cashback Received",
    "Effective Cost",
    "Effective Price/g",
    "Cashback Status",
    "Verified",
    "Tags",
  ]
  const rows = purchases.map((p) => [
    p.purchaseDate,
    p.deliveredDate,
    p.website,
    p.merchant,
    p.brand,
    p.category,
    p.purity,
    p.weightGrams,
    p.quantity,
    totalWeight(p.weightGrams, p.quantity),
    p.purchasePrice,
    p.pricePerGram,
    p.creditCard,
    p.rewardValue,
    p.cashbackExpected,
    p.cashbackReceived,
    p.effectiveCost,
    p.effectivePricePerGram,
    p.cashbackStatus,
    p.verified ? "Yes" : "No",
    p.tags.join(";"),
  ])
  return toCsv(headers, rows)
}

export function cashbackToCsv(purchases: PurchaseDTO[]): string {
  const headers = [
    "Purchase Date",
    "Brand",
    "Credit Card",
    "Cashback Expected",
    "Cashback Received",
    "Credited Date",
    "Status",
    "Verified",
  ]
  const rows = purchases
    .filter((p) => p.cashbackExpected > 0 || p.cashbackReceived > 0)
    .map((p) => [
      p.purchaseDate,
      p.brand,
      p.creditCard,
      p.cashbackExpected,
      p.cashbackReceived,
      p.cashbackCreditedDate,
      p.cashbackStatus,
      p.verified ? "Yes" : "No",
    ])
  return toCsv(headers, rows)
}

export function goldPricesToCsv(prices: GoldPriceDTO[]): string {
  const headers = ["Date", "Purity", "Price/g", "Source", "Remarks"]
  const rows = prices.map((p) => [p.priceDate, p.purity, p.pricePerGram, p.source, p.remarks])
  return toCsv(headers, rows)
}
