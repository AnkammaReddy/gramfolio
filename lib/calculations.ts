import type { PurchaseDTO, GoldPriceDTO, GraphMode } from "./types"
import { latestPrice } from "./analytics"

/**
 * Total non-cashback "instant" savings on a purchase (vouchers, supercoins,
 * coupons, reward value). These reduce effective cost immediately.
 */
export function instantSavings(p: {
  giftVoucherSavings: number
  superCoinsValue: number
  rewardValue: number
}): number {
  return (
    (p.giftVoucherSavings || 0) +
    (p.superCoinsValue || 0) +
    (p.rewardValue || 0)
  )
}

/** Price per gram from total price and total weight (weight = grams * qty handled by caller). */
export function computePricePerGram(purchasePrice: number, weightGrams: number): number {
  if (!weightGrams || weightGrams <= 0) return 0
  return purchasePrice / weightGrams
}

/**
 * Effective cost = purchase price minus all savings (instant savings + expected cashback).
 * "Not Credited" (Missing) cashback is excluded — the savings were never realized.
 * Pending and Credited both count as expected savings (optimistic accounting).
 */
export function computeEffectiveCost(p: {
  purchasePrice: number
  giftVoucherSavings: number
  superCoinsValue: number
  rewardValue: number
  cashbackExpected: number
  cashbackStatus?: string
}): number {
  const cashback = p.cashbackStatus === "Missing" ? 0 : (p.cashbackExpected || 0)
  const savings = instantSavings(p) + cashback
  return Math.max(0, (p.purchasePrice || 0) - savings)
}

export function computeEffectivePricePerGram(effectiveCost: number, weightGrams: number): number {
  if (!weightGrams || weightGrams <= 0) return 0
  return effectiveCost / weightGrams
}

/** Total grams for a purchase line (per-unit weight * quantity). */
export function totalWeight(weightGrams: number, quantity: number): number {
  return (weightGrams || 0) * (quantity || 1)
}

export type PortfolioTotals = {
  totalWeight: number
  totalPurchaseValue: number
  totalEffectiveInvestment: number
  todayBullionValue: number
  unrealizedPnL: number       // vs effective investment (with rewards)
  rawPnL: number              // vs purchase value (without rewards)
  returnPct: number           // % based on effective investment
  rawReturnPct: number        // % based on purchase value
  totalCashbackExpected: number
  totalCashbackReceived: number
  pendingCashback: number     // expected but not yet credited (excludes missing)
  missedCashback: number      // not credited by bank (status = Missing)
  totalInstantSavings: number // gift vouchers + supercoins + coupons + reward points
  totalRewardsSaved: number   // all savings realized: instant + received cashback
  avgPricePerGram: number
  avgEffectivePricePerGram: number
}

/**
 * Aggregate portfolio totals. Pass all gold prices so each purchase is valued
 * at the correct purity price (916, 995, 999, etc.) instead of always using 999.
 * `fallbackPrice` is used only when callers pass a single number instead of the prices array.
 * Note: weightGrams in DTO is per-unit; multiply by quantity for line totals.
 */
export function computeTotals(
  purchases: PurchaseDTO[],
  bullionPriceOrPrices: number | GoldPriceDTO[],
): PortfolioTotals {
  // Support both old callers that pass a single number (bullion 999 price)
  // and new callers that pass the full prices array for purity-aware valuation.
  const pricesArray: GoldPriceDTO[] | null =
    Array.isArray(bullionPriceOrPrices) ? bullionPriceOrPrices : null
  const fallbackPrice: number =
    Array.isArray(bullionPriceOrPrices) ? (bullionPriceOrPrices[0]?.pricePerGram ?? 0) : bullionPriceOrPrices

  let totalWeightG = 0
  let totalPurchaseValue = 0
  let totalEffectiveInvestment = 0
  let totalCashbackExpected = 0
  let totalCashbackReceived = 0
  let missedCashback = 0
  let totalInstantSavings = 0
  let todayBullionValue = 0

  for (const p of purchases) {
    const w = totalWeight(p.weightGrams, p.quantity)
    totalWeightG += w
    totalPurchaseValue += p.purchasePrice || 0
    const instant = instantSavings(p)
    totalInstantSavings += instant
    // When cashback is Missing (not credited by bank), exclude the expected cashback
    // from effective cost — the savings were never realized
    const adjustedEffective = p.cashbackStatus === "Missing"
      ? Math.max(0, (p.purchasePrice || 0) - instant)
      : (p.effectiveCost || 0)
    totalEffectiveInvestment += adjustedEffective
    totalCashbackExpected += p.cashbackExpected || 0
    totalCashbackReceived += p.cashbackReceived || 0
    if (p.cashbackStatus === "Missing") missedCashback += p.cashbackExpected || 0

    // Value each purchase at latest 999-derived spot only (today's bullion — no retail fallback).
    const priceForPurity = pricesArray
      ? latestPrice(pricesArray, p.purity)
      : fallbackPrice
    todayBullionValue += w * (priceForPurity > 0 ? priceForPurity : 0)
  }
  const hasPrices = todayBullionValue > 0
  const unrealizedPnL = hasPrices ? todayBullionValue - totalEffectiveInvestment : 0
  const rawPnL = hasPrices ? todayBullionValue - totalPurchaseValue : 0
  // Pending = expected but not yet credited, excluding missing ones
  const pendingCashback = Math.max(0, totalCashbackExpected - totalCashbackReceived - missedCashback)
  // Total realized savings = instant savings + cashback actually received
  const totalRewardsSaved = totalInstantSavings + totalCashbackReceived

  return {
    totalWeight: totalWeightG,
    totalPurchaseValue,
    totalEffectiveInvestment,
    todayBullionValue,
    unrealizedPnL,
    rawPnL,
    returnPct:
      totalEffectiveInvestment > 0 && hasPrices
        ? (unrealizedPnL / totalEffectiveInvestment) * 100
        : 0,
    rawReturnPct:
      totalPurchaseValue > 0 && hasPrices
        ? (rawPnL / totalPurchaseValue) * 100
        : 0,
    totalCashbackExpected,
    totalCashbackReceived,
    pendingCashback,
    missedCashback,
    totalInstantSavings,
    totalRewardsSaved,
    avgPricePerGram: totalWeightG > 0 ? totalPurchaseValue / totalWeightG : 0,
    avgEffectivePricePerGram: totalWeightG > 0 ? totalEffectiveInvestment / totalWeightG : 0,
  }
}

/** Cost basis for a purchase based on the selected graph mode. */
export function costBasis(p: PurchaseDTO, mode: GraphMode): number {
  return mode === "effective" ? p.effectiveCost : p.purchasePrice
}
