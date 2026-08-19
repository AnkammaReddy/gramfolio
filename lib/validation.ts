import { z } from "zod"
import { PURITY_PRESETS } from "./purity"

const numberish = z.coerce.number().refine((n) => !Number.isNaN(n), "Must be a number")
const nonNegative = numberish.refine((n) => n >= 0, "Must be 0 or greater")

/**
 * Sanitizes free-text input before it reaches the database:
 * - strips HTML tags (e.g. <script>, <img onerror>)
 * - strips control characters
 * - strips leading spreadsheet/CSV formula-injection chars (= + - @ |)
 * - trims and enforces a max length
 * Note: React already escapes JSX text so this is not about live XSS —
 * it keeps stored data clean and prevents CSV-export formula injection.
 */
function sanitizeText(v: string): string {
  return v
    .replace(/<[^>]*>/g, "") // remove any HTML tags
    .replace(/[\u0000-\u001F\u007F]/g, "") // remove control chars
    .replace(/^[=+\-@|]+/, "") // strip leading formula-injection chars
    .trim()
}

// Optional/nullable free-text field with sanitization and a length cap
const safeText = (max = 200) =>
  z
    .string()
    .max(max, `Must be ${max} characters or fewer`)
    .transform(sanitizeText)
    .optional()
    .nullable()

export const rewardComponentSchema = z.object({
  type: z.enum(["GiftVoucher", "Cashback", "RewardPoints", "SuperCoins", "Coupon"]),
  label: safeText(120),
  amount: nonNegative.default(0),
  quantity: nonNegative.default(0),
  percentage: nonNegative.default(0),
  expected: nonNegative.default(0),
  received: nonNegative.default(0),
  description: safeText(500),
  // Voucher-specific
  faceValue: nonNegative.default(0),
  amountPaid: nonNegative.default(0),
  cardUsed: safeText(120),
  rewardType: z.string().default("None"),
  // RewardPoints-specific
  pointsEarned: nonNegative.default(0),
  pointsPerMultiple: nonNegative.default(0),
  pointsMultiple: nonNegative.default(100),
  basePointValue: nonNegative.default(0),
  transferMultiplier: nonNegative.default(1),
  transferPartner: safeText(120),
  pointsStatus: z.string().default("Pending"),
  pointsVerified: z.coerce.boolean().default(false),
})

export const purchaseSchema = z.object({
  assetType: z.string().default("gold"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  deliveredDate: z.string().optional().nullable(),
  website: safeText(200),
  merchant: safeText(200),
  brand: safeText(120),
  category: z.enum(["Coin", "Bar", "Jewellery"]).default("Coin"),
  purity: z.enum(PURITY_PRESETS).default("999"),
  weightGrams: nonNegative,
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").default(1),
  purchasePrice: nonNegative,
  remarks: safeText(1000),
  // Payment
  creditCard: safeText(120),
  paymentMethod: safeText(120),
  rewardStrategy: safeText(120),
  rewardPercentage: nonNegative.default(0),
  rewardPointsExpected: nonNegative.default(0),
  rewardValue: nonNegative.default(0),
  pointsPerMultiple: nonNegative.default(0),
  pointsMultiple: nonNegative.default(100),
  pointsBaseValue: nonNegative.default(0),
  pointsTransferMultiplier: nonNegative.default(1),
  pointsTransferPartner: safeText(120),
  pointsReceived: nonNegative.default(0),
  pointsCreditedDate: z.string().optional().nullable(),
  pointsStatus: z.enum(["Pending", "Credited", "Missing"]).default("Pending"),
  pointsVerified: z.coerce.boolean().default(false),
  giftVoucherSavings: nonNegative.default(0),
  vouchers: z.array(z.any()).optional().default([]),
  superCoinsValue: nonNegative.default(0),
  couponSavings: nonNegative.default(0),
  cashbackExpected: nonNegative.default(0),
  cashbackReceived: nonNegative.default(0),
  cashbackCreditedDate: z.string().optional().nullable(),
  cashbackStatus: z.enum(["Pending", "Credited", "Missing"]).default("Pending"),
  verified: z.coerce.boolean().default(false),
  notes: safeText(1000),
  tags: z.array(z.string().max(60).transform(sanitizeText)).default([]),
  rewardComponents: z.array(rewardComponentSchema).default([]),
  // Purchase Price Breakdown (optional, tax P&L reference)
  listedPrice: nonNegative.optional().nullable(),
  platformDiscount: nonNegative.optional().nullable(),
  bankInstantDiscount: nonNegative.optional().nullable(),
  // Platform Charges (optional, excluded from gold value)
  platformCharges: nonNegative.optional().nullable(),
})

export type PurchaseInput = z.infer<typeof purchaseSchema>

export const goldPriceSchema = z.object({
  assetType: z.string().default("gold"),
  priceDate: z.string().min(1, "Date is required"),
  purity: z.string().default("999"),
  pricePerGram: nonNegative,
  source: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
})

export type GoldPriceInput = z.infer<typeof goldPriceSchema>

export const settingsSchema = z.object({
  currency: z.string().default("INR"),
  graphMode: z.enum(["purchase", "effective"]).default("effective"),
  defaultDateRange: z.string().default("1y"),
  theme: z.string().default("system"),
  displayName: z.string().optional().nullable(),
})

export type SettingsInput = z.infer<typeof settingsSchema>
