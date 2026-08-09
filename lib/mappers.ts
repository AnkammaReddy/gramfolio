import type { Purchase, RewardComponent, GoldPrice, UserSettings } from "./db/schema"
import type {
  PurchaseDTO,
  RewardComponentDTO,
  GoldPriceDTO,
  SettingsDTO,
  CashbackStatus,
  RewardType,
  GraphMode,
} from "./types"

const num = (v: string | number | null | undefined) => Number(v ?? 0)

/** Safely convert a Postgres date value (Date object or string) to "yyyy-MM-dd" */
function toDateStr(v: Date | string | null | undefined): string {
  if (!v) return ""
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  // Already a string — normalise just in case it includes time part
  return String(v).slice(0, 10)
}

export function toPurchaseDTO(p: Purchase): PurchaseDTO {
  return {
    id: p.id,
    assetType: p.assetType,
    purchaseDate: toDateStr(p.purchaseDate),
    deliveredDate: p.deliveredDate ? toDateStr(p.deliveredDate) : null,
    website: p.website,
    merchant: p.merchant,
    brand: p.brand,
    category: p.category,
    purity: p.purity,
    weightGrams: num(p.weightGrams),
    quantity: p.quantity,
    purchasePrice: num(p.purchasePrice),
    pricePerGram: num(p.pricePerGram),
    remarks: p.remarks,
    creditCard: p.creditCard,
    paymentMethod: p.paymentMethod,
    rewardStrategy: p.rewardStrategy,
    rewardPercentage: num(p.rewardPercentage),
    rewardPointsExpected: num(p.rewardPointsExpected),
    rewardValue: num(p.rewardValue),
    pointsPerMultiple: num(p.pointsPerMultiple),
    pointsMultiple: num(p.pointsMultiple),
    pointsBaseValue: num(p.pointsBaseValue),
    pointsTransferMultiplier: num(p.pointsTransferMultiplier),
    pointsTransferPartner: p.pointsTransferPartner ?? null,
    pointsReceived: num(p.pointsReceived),
    pointsCreditedDate: p.pointsCreditedDate ? toDateStr(p.pointsCreditedDate) : null,
    pointsStatus: (p.pointsStatus as string) ?? "Pending",
    pointsVerified: p.pointsVerified ?? false,
    giftVoucherSavings: num(p.giftVoucherSavings),
    vouchersJson: p.vouchersJson ?? null,
    superCoinsValue: num(p.superCoinsValue),
    couponSavings: num(p.couponSavings),
    cashbackExpected: num(p.cashbackExpected),
    cashbackReceived: num(p.cashbackReceived),
    effectiveCost: num(p.effectiveCost),
    effectivePricePerGram: num(p.effectivePricePerGram),
    cashbackCreditedDate: p.cashbackCreditedDate ? toDateStr(p.cashbackCreditedDate) : null,
    cashbackStatus: p.cashbackStatus as CashbackStatus,
    verified: p.verified,
    notes: p.notes,
    tags: p.tags ?? [],
    createdAt: String(p.createdAt),
    listedPrice: p.listedPrice != null ? num(p.listedPrice) : null,
    platformDiscount: p.platformDiscount != null ? num(p.platformDiscount) : null,
    bankInstantDiscount: p.bankInstantDiscount != null ? num(p.bankInstantDiscount) : null,
    platformCharges: p.platformCharges != null ? num(p.platformCharges) : null,
  }
}

export function toRewardDTO(r: RewardComponent): RewardComponentDTO {
  return {
    id: r.id,
    purchaseId: r.purchaseId,
    type: r.type as RewardType,
    label: r.label,
    amount: num(r.amount),
    quantity: num(r.quantity),
    percentage: num(r.percentage),
    expected: num(r.expected),
    received: num(r.received),
    description: r.description,
    faceValue: num(r.faceValue),
    amountPaid: num(r.amountPaid),
    cardUsed: r.cardUsed ?? null,
    rewardType: r.rewardType ?? "None",
    // RewardPoints-specific
    pointsEarned: num(r.pointsEarned),
    pointsPerMultiple: num(r.pointsPerMultiple),
    pointsMultiple: num(r.pointsMultiple) || 100,
    basePointValue: num(r.basePointValue),
    transferMultiplier: num(r.transferMultiplier) || 1,
    transferPartner: r.transferPartner ?? null,
    pointsStatus: r.pointsStatus ?? "Pending",
    pointsVerified: r.pointsVerified ?? false,
  }
}

export function toGoldPriceDTO(g: GoldPrice): GoldPriceDTO {
  return {
    id: g.id,
    assetType: g.assetType,
    priceDate: toDateStr(g.priceDate),
    purity: g.purity,
    pricePerGram: num(g.pricePerGram),
    source: g.source,
    remarks: g.remarks,
  }
}

export function toSettingsDTO(s: UserSettings): SettingsDTO {
  return {
    currency: s.currency,
    graphMode: s.graphMode as GraphMode,
    defaultDateRange: s.defaultDateRange,
    theme: s.theme,
    displayName: s.displayName,
  }
}
