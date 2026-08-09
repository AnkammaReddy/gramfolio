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
 * Build a lookup map of the correct latest price per purity from a prices array.
 * Uses latestPrice() so stale direct purity entries (e.g. an old 916 price from 2024)
 * are overridden by a fresher 999-derived value, consistent with the Timeline fix.
 */
function buildPriceMap(prices: GoldPriceDTO[]): Map<string, number> {
  const purities = Array.from(new Set(prices.map((p) => p.purity)))
  const map = new Map<string, number>()
  for (const purity of purities) {
    const price = latestPrice(prices, purity)
    if (price > 0) map.set(purity, price)
  }
  return map
}

/**
 * Aggregate portfolio totals. Pass all gold prices so each purchase is valued
 * at the correct purity price (916, 995, 999, etc.) instead of always using 999.
 * `fallbackPrice` is used only when a purchase's purity has no matching price entry.
 * Note: weightGrams in DTO is per-unit; multiply by quantity for line totals.
 */
export function computeTotals(
  purchases: PurchaseDTO[],
  bullionPriceOrPrices: number | GoldPriceDTO[],
): PortfolioTotals {
  // Support both old callers that pass a single number (bullion 999 price)
  // and new callers that pass the full prices array for purity-aware valuation.
  const priceMap: Map<string, number> | null =
    Array.isArray(bullionPriceOrPrices) ? buildPriceMap(bullionPriceOrPrices) : null
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

    // For bullion valuation: use purity-specific price from priceMap if available.
    // priceMap contains latest prices (for KPI dashboard showing today's value).
    // If no price exists for this purity, fall back to purchase's own pricePerGram
    // (so purchases with missing bullion entries still show a meaningful value).
    const priceForPurity = priceMap
      ? (priceMap.get(p.purity) ?? p.pricePerGram ?? fallbackPrice ?? 0)
      : (fallbackPrice || p.pricePerGram || 0)
    todayBullionValue += w * priceForPurity
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
