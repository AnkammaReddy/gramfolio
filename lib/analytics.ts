import type { PurchaseDTO, GoldPriceDTO, GraphMode } from "./types"
import { costBasis, totalWeight } from "./calculations"
import { deriveBullionFrom999 } from "./purity"

const monthKey = (d: string) => d.slice(0, 7) // YYYY-MM

export function monthLabel(key: string) {
  const [y, m] = key.split("-")
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
}

export type BullionPriceSource = "exact" | "derived_999" | "fallback"

/** Bullion price on an exact date (used for Timeline card "On Purchase Date").
 *  1. Looks for an exact purity entry on that date.
 *  2. If not found, looks for a 999 entry on that exact date and derives via purity ratio.
 *  3. If still nothing found, returns fallbackPricePerGram (the purchase's own pricePerGram).
 *  Does NOT carry forward prior-date prices — that would misrepresent purchase-date bullion value.
 */
export function priceAsOfWithSource(
  prices: GoldPriceDTO[],
  date: string,
  purity = "999",
  fallbackPricePerGram = 0,
): { pricePerGram: number; source: BullionPriceSource } {
  const exact = prices.find((p) => p.purity === purity && p.priceDate === date)
  if (exact) return { pricePerGram: exact.pricePerGram, source: "exact" }

  if (purity !== "999") {
    const base999 = prices.find((p) => p.purity === "999" && p.priceDate === date)
    if (base999) {
      return {
        pricePerGram: deriveBullionFrom999(base999.pricePerGram, purity),
        source: "derived_999",
      }
    }
  }

  return { pricePerGram: fallbackPricePerGram, source: "fallback" }
}

export function priceAsOf(
  prices: GoldPriceDTO[],
  date: string,
  purity = "999",
  fallbackPricePerGram = 0,
): number {
  return priceAsOfWithSource(prices, date, purity, fallbackPricePerGram).pricePerGram
}

/**
 * Carry-forward bullion price for graph plotting — used by portfolioOverTime.
 * Unlike priceAsOf, this DOES carry forward the most recent prior 999 entry
 * when no exact-date entry exists. This is correct for graphs because we need
 * a price for every date point, not just purchase dates.
 * Applies the same freshness logic as latestPrice: if 999 is newer, derive from it.
 */
function priceCarryForward(prices: GoldPriceDTO[], date: string, purity: string): number {
  // Find best exact-purity entry on or before this date
  let bestExact: GoldPriceDTO | null = null
  for (const p of prices) {
    if (p.purity !== purity) continue
    if (p.priceDate <= date && (!bestExact || p.priceDate > bestExact.priceDate)) bestExact = p
  }

  // Find best 999 entry on or before this date (for derivation)
  let best999: GoldPriceDTO | null = null
  for (const p of prices) {
    if (p.purity !== "999") continue
    if (p.priceDate <= date && (!best999 || p.priceDate > best999.priceDate)) best999 = p
  }

  if (purity === "999") return best999?.pricePerGram ?? 0

  // Prefer 999-derived when 999 is fresher than exact-purity entry (same as latestPrice logic)
  if (best999) {
    if (!bestExact || best999.priceDate > bestExact.priceDate) {
      return deriveBullionFrom999(best999.pricePerGram, purity)
    }
  }
  return bestExact?.pricePerGram ?? 0
}

/**
 * Bullion ₹/g for a chart/history date.
 * - Prefer carry-forward 999 spot (purity-adjusted).
 * - Historical dates only: fall back to purchase price/g when no spot exists yet.
 * - Today: spot only — never purchase price/g (current portfolio value).
 */
function bullionRateOnDate(
  prices: GoldPriceDTO[],
  date: string,
  purity: string,
  purchasePricePerGram: number,
  isToday: boolean,
): number {
  const spot = priceCarryForward(prices, date, purity)
  if (spot > 0) return spot
  if (isToday) return 0
  return purchasePricePerGram
}

export function latestPrice(prices: GoldPriceDTO[], purity = "999"): number {
  let best: GoldPriceDTO | null = null
  for (const p of prices) {
    if (p.purity !== purity) continue
    if (!best || p.priceDate > best.priceDate) best = p
  }

  // Always find the latest 999 entry for comparison / derivation
  if (purity !== "999") {
    let base999: GoldPriceDTO | null = null
    for (const p of prices) {
      if (p.purity !== "999") continue
      if (!base999 || p.priceDate > base999.priceDate) base999 = p
    }

    if (base999) {
      // If there is no exact entry, or the 999 entry is newer than the exact purity entry,
      // derive from 999 — this prevents stale direct entries (e.g. an old 916 price from 2024)
      // from overriding a fresher 999-based derivation.
      if (!best || base999.priceDate > best.priceDate) {
        return deriveBullionFrom999(base999.pricePerGram, purity)
      }
    }

    // Exact entry exists and is as recent as (or newer than) the 999 entry — use it
    if (best) return best.pricePerGram
  } else {
    // purity === "999" — return directly
    if (best) return best.pricePerGram
  }
  return 0
}

export function latestPriceEntry(prices: GoldPriceDTO[], purity = "999"): GoldPriceDTO | null {
  let best: GoldPriceDTO | null = null
  for (const p of prices) {
    if (p.purity !== purity) continue
    if (!best || p.priceDate > best.priceDate) best = p
  }
  return best
}

export type TimePoint = {
  date: string
  invested: number
  bullion: number
  pnl: number
  cumulativeWeight: number
  /** True when one or more purchases occurred on this date. */
  isPurchase: boolean
}

/**
 * Portfolio value over time.
 *
 * Strategy:
 * - Build a timeline from purchase dates plus today.
 * - Every purchase date is always plotted (visible nodes on the chart).
 * - Historical dates: carry-forward 999 spot, else purchase price/g (estimate).
 * - Today: latest carry-forward spot only (real current bullion value).
 */
export function portfolioOverTime(
  purchases: PurchaseDTO[],
  prices: GoldPriceDTO[],
  mode: GraphMode,
): TimePoint[] {
  if (purchases.length === 0 || prices.length === 0) return []

  const sorted = [...purchases].sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate))
  const today = new Date().toISOString().slice(0, 10)
  const purchaseDates = new Set(sorted.map((p) => p.purchaseDate))

  // Timeline: purchase dates + today only.
  const dateSet = new Set<string>()
  for (const p of sorted) dateSet.add(p.purchaseDate)
  dateSet.add(today)
  const allDates = [...dateSet].sort((a, b) => a.localeCompare(b))

  let invested = 0
  let pi = 0
  const holdings: { weight: number; purity: string; fallbackPricePerGram: number }[] = []
  const points: TimePoint[] = []

  for (const date of allDates) {
    const isToday = date === today
    while (pi < sorted.length && sorted[pi].purchaseDate <= date) {
      const p = sorted[pi]
      invested += costBasis(p, mode)
      holdings.push({
        weight: totalWeight(p.weightGrams, p.quantity),
        purity: p.purity,
        fallbackPricePerGram: p.pricePerGram || 0,
      })
      pi++
    }
    if (holdings.length === 0) continue

    let bullion = 0
    let weight = 0
    for (const h of holdings) {
      const price = bullionRateOnDate(prices, date, h.purity, h.fallbackPricePerGram, isToday)
      bullion += h.weight * price
      weight += h.weight
    }

    const isPurchase = purchaseDates.has(date)
    // Always plot purchase dates; skip today only when bullion cannot be valued.
    if (bullion === 0 && !isPurchase) continue

    points.push({
      date,
      invested: round(invested),
      bullion: round(bullion),
      pnl: round(bullion - invested),
      cumulativeWeight: round(weight),
      isPurchase,
    })
  }

  return points
}

export type MonthlyPoint = {
  month: string
  label: string
  cashback: number
  purchases: number
  weight: number
  spend: number
}

export function monthlySeries(purchases: PurchaseDTO[]): MonthlyPoint[] {
  const map = new Map<string, MonthlyPoint>()
  for (const p of purchases) {
    const key = monthKey(p.purchaseDate)
    const entry =
      map.get(key) ??
      { month: key, label: monthLabel(key), cashback: 0, purchases: 0, weight: 0, spend: 0 }
    entry.cashback += p.cashbackReceived
    entry.purchases += 1
    entry.weight += totalWeight(p.weightGrams, p.quantity)
    entry.spend += p.purchasePrice
    map.set(key, entry)
  }
  return [...map.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => ({ ...m, cashback: round(m.cashback), weight: round(m.weight), spend: round(m.spend) }))
}

export type AvgCostPoint = { date: string; avgPurchase: number; avgEffective: number }

/** Running average cost per gram over time (both purchase and effective basis). */
export function avgCostOverTime(purchases: PurchaseDTO[]): AvgCostPoint[] {
  const sorted = [...purchases].sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate))
  let weight = 0
  let purchaseSum = 0
  let effectiveSum = 0
  const points: AvgCostPoint[] = []
  for (const p of sorted) {
    weight += totalWeight(p.weightGrams, p.quantity)
    purchaseSum += p.purchasePrice
    effectiveSum += p.effectiveCost
    if (weight === 0) continue
    points.push({
      date: p.purchaseDate,
      avgPurchase: round(purchaseSum / weight),
      avgEffective: round(effectiveSum / weight),
    })
  }
  return points
}

export type GroupStat = {
  key: string
  weight: number
  spend: number
  effective: number
  count: number
  cashbackExpected: number
  cashbackReceived: number
  rewardValue: number
  avgPrice: number
  avgEffectivePrice: number
  currentValue: number
  profit: number
}

function emptyStat(key: string): GroupStat {
  return {
    key,
    weight: 0,
    spend: 0,
    effective: 0,
    count: 0,
    cashbackExpected: 0,
    cashbackReceived: 0,
    rewardValue: 0,
    avgPrice: 0,
    avgEffectivePrice: 0,
    currentValue: 0,
    profit: 0,
  }
}

export function groupBy(
  purchases: PurchaseDTO[],
  selector: (p: PurchaseDTO) => string,
  pricesOrBullion: GoldPriceDTO[] | number,
): GroupStat[] {
  // Build per-purchase current value using purity-aware prices
  const getPurchaseValue = (p: PurchaseDTO): number => {
    const w = totalWeight(p.weightGrams, p.quantity)
    if (Array.isArray(pricesOrBullion)) {
      const price = latestPrice(pricesOrBullion, p.purity)
      return price > 0 ? w * price : 0
    }
    return pricesOrBullion > 0 ? w * pricesOrBullion : 0
  }

  const map = new Map<string, GroupStat>()
  for (const p of purchases) {
    const key = selector(p) || "Unknown"
    const s = map.get(key) ?? emptyStat(key)
    const w = totalWeight(p.weightGrams, p.quantity)
    s.weight += w
    s.spend += p.purchasePrice
    s.effective += p.effectiveCost
    s.count += 1
    s.cashbackExpected += p.cashbackExpected
    s.cashbackReceived += p.cashbackReceived

    // Cashback contribution: Credited → use actual received; Pending → expected (optimistic); Missing → 0
    const cashbackContrib = p.cashbackStatus === "Credited"
      ? p.cashbackReceived
      : p.cashbackStatus === "Pending"
      ? p.cashbackExpected
      : 0

    // Points contribution: Credited → rewardValue scaled to received pts; Pending → full rewardValue (optimistic); Not Credited → 0
    let pointsContrib = 0
    if (p.rewardValue > 0) {
      const exp = p.pointsPerMultiple > 0 && p.pointsMultiple > 0
        ? Math.floor(p.purchasePrice / p.pointsMultiple) * p.pointsPerMultiple
        : p.rewardPointsExpected
      if (p.pointsStatus === "Credited") {
        const recv = p.pointsReceived > 0 ? p.pointsReceived : exp
        pointsContrib = exp > 0 ? (recv / exp) * p.rewardValue : p.rewardValue
      } else if (p.pointsStatus === "Pending") {
        pointsContrib = p.rewardValue
      }
      // Not Credited → 0
    }

    s.rewardValue += pointsContrib + p.giftVoucherSavings + p.superCoinsValue + p.couponSavings + cashbackContrib
    s.currentValue += getPurchaseValue(p)
    map.set(key, s)
  }
  return [...map.values()]
    .map((s) => {
      s.avgPrice = s.weight > 0 ? s.spend / s.weight : 0
      s.avgEffectivePrice = s.weight > 0 ? s.effective / s.weight : 0
      s.profit = s.currentValue > 0 ? s.currentValue - s.effective : 0
      return roundStat(s)
    })
    .sort((a, b) => b.spend - a.spend)
}

export type DailyPnl = { date: string; pnl: number; isPurchase: boolean }

export function dailyPnl(points: TimePoint[]): DailyPnl[] {
  return points.map((p) => ({ date: p.date, pnl: p.pnl, isPurchase: p.isPurchase }))
}

function round(n: number) {
  return Math.round(n * 100) / 100
}

function roundStat(s: GroupStat): GroupStat {
  return {
    ...s,
    weight: round(s.weight),
    spend: round(s.spend),
    effective: round(s.effective),
    cashbackExpected: round(s.cashbackExpected),
    cashbackReceived: round(s.cashbackReceived),
    rewardValue: round(s.rewardValue),
    avgPrice: round(s.avgPrice),
    avgEffectivePrice: round(s.avgEffectivePrice),
    currentValue: round(s.currentValue),
    profit: round(s.profit),
  }
}
