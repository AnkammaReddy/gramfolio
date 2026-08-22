import type { PurchaseDTO, GoldPriceDTO } from "./types"
import { computeTotals } from "./calculations"
import { groupBy } from "./analytics"
import { formatCurrency } from "./format"
import { daysBetween } from "./format"

export type CardInsight = {
  id: string
  card: string
  tone: "positive" | "neutral" | "warning"
  headline: string
  detail: string
}

export function generateCardInsights(
  purchases: PurchaseDTO[],
  prices: GoldPriceDTO[],
  currency: string,
): CardInsight[] {
  const fmt = (n: number) => formatCurrency(n, currency)
  const insights: CardInsight[] = []

  const cardStats = groupBy(purchases, (p) => p.creditCard ?? "", prices).filter(
    (s) => s.key !== "Unknown" && s.key !== "" && s.count >= 1,
  )
  if (cardStats.length === 0) return insights

  // Per-card breakdown of savings by type
  type CardBreakdown = {
    key: string
    voucher: number
    cashback: number
    points: number
    other: number
    total: number
    avgEffectivePrice: number
    spend: number
    count: number
  }

  const breakdowns: CardBreakdown[] = cardStats.map((s) => {
    const cardPurchases = purchases.filter((p) => (p.creditCard ?? "") === s.key)
    let voucher = 0, cashback = 0, points = 0, other = 0
    for (const p of cardPurchases) {
      voucher += p.giftVoucherSavings
      cashback += p.cashbackStatus === "Credited" ? p.cashbackReceived
        : p.cashbackStatus === "Pending" ? p.cashbackExpected : 0
      points += p.rewardValue > 0 && (p.pointsStatus === "Credited" || p.pointsStatus === "Pending")
        ? p.rewardValue - p.giftVoucherSavings - p.superCoinsValue - p.couponSavings
          - (p.cashbackStatus === "Credited" ? p.cashbackReceived : p.cashbackStatus === "Pending" ? p.cashbackExpected : 0)
        : 0
      other += p.superCoinsValue + p.couponSavings
    }
    return {
      key: s.key,
      voucher: Math.max(0, Math.round(voucher)),
      cashback: Math.max(0, Math.round(cashback)),
      points: Math.max(0, Math.round(points)),
      other: Math.max(0, Math.round(other)),
      total: s.rewardValue,
      avgEffectivePrice: s.avgEffectivePrice,
      spend: s.spend,
      count: s.count,
    }
  })

  // Best effective price card
  const bestEffective = [...breakdowns]
    .filter((b) => b.avgEffectivePrice > 0)
    .sort((a, b) => a.avgEffectivePrice - b.avgEffectivePrice)[0]

  // Worst effective price card (only if multiple cards)
  const worstEffective = breakdowns.length > 1
    ? [...breakdowns].filter((b) => b.avgEffectivePrice > 0).sort((a, b) => b.avgEffectivePrice - a.avgEffectivePrice)[0]
    : null

  if (bestEffective) {
    const dominant = (() => {
      const { voucher, cashback, points, other } = bestEffective
      const max = Math.max(voucher, cashback, points, other)
      if (max === 0) return null
      if (max === voucher) return { label: "gift vouchers", amount: voucher }
      if (max === cashback) return { label: "cashback", amount: cashback }
      if (max === points) return { label: "reward points", amount: points }
      return { label: "coupons / SuperCoins", amount: other }
    })()

    insights.push({
      id: "best-effective",
      card: bestEffective.key,
      tone: "positive",
      headline: `${bestEffective.key} gives the best effective rate at ${fmt(bestEffective.avgEffectivePrice)}/g`,
      detail: dominant
        ? `Primary driver: ${dominant.label} saving ${fmt(dominant.amount)} across ${bestEffective.count} purchase${bestEffective.count > 1 ? "s" : ""}.`
        : `Effective savings across ${bestEffective.count} purchase${bestEffective.count > 1 ? "s" : ""}.`,
    })
  }

  // Voucher strategy insight — find card with highest voucher savings %
  const voucherLeader = [...breakdowns]
    .filter((b) => b.voucher > 0 && b.spend > 0)
    .sort((a, b) => (b.voucher / b.spend) - (a.voucher / a.spend))[0]

  // Non-voucher cards average effective price (for comparison)
  const nonVoucherCards = breakdowns.filter((b) => b.voucher === 0 && b.avgEffectivePrice > 0)
  const avgNonVoucherEffective = nonVoucherCards.length > 0
    ? nonVoucherCards.reduce((s, b) => s + b.avgEffectivePrice, 0) / nonVoucherCards.length
    : 0

  if (voucherLeader) {
    const voucherPct = ((voucherLeader.voucher / voucherLeader.spend) * 100).toFixed(1)
    const priceGap = avgNonVoucherEffective > 0
      ? avgNonVoucherEffective - voucherLeader.avgEffectivePrice
      : 0
    const gapText = priceGap > 0
      ? ` That's ${fmt(Math.round(priceGap))}/g cheaper than non-voucher cards (avg ${fmt(Math.round(avgNonVoucherEffective))}/g).`
      : ""
    insights.push({
      id: "voucher-leader",
      card: voucherLeader.key,
      tone: "positive",
      headline: `Gift vouchers reduced effective price by ${voucherPct}% (${fmt(voucherLeader.voucher)} saved)`,
      detail: `Vouchers cut the base purchase price upfront — before any card reward applies — bringing the effective rate to ${fmt(Math.round(voucherLeader.avgEffectivePrice))}/g.${gapText}`,
    })
  }

  // Cashback vs voucher comparison — effective price per gram tells the real story
  const cashbackOnlyCards = breakdowns.filter((b) => b.cashback > 0 && b.voucher === 0 && b.spend > 0)
  const voucherCards = breakdowns.filter((b) => b.voucher > 0 && b.avgEffectivePrice > 0)

  if (cashbackOnlyCards.length > 0 && voucherCards.length > 0) {
    const avgCashbackEffective = cashbackOnlyCards.reduce((s, b) => s + b.avgEffectivePrice, 0) / cashbackOnlyCards.length
    const avgVoucherEffective = voucherCards.reduce((s, b) => s + b.avgEffectivePrice, 0) / voucherCards.length
    const gap = Math.round(avgCashbackEffective - avgVoucherEffective)

    if (gap > 0) {
      insights.push({
        id: "voucher-vs-cashback",
        card: voucherCards[0].key,
        tone: "positive",
        headline: `Gift voucher strategy beats cashback cards by ${fmt(gap)}/g`,
        detail: `Voucher purchases average ${fmt(Math.round(avgVoucherEffective))}/g vs ${fmt(Math.round(avgCashbackEffective))}/g for cashback cards. Upfront price reduction is more effective than post-purchase reimbursement.`,
      })
    } else {
      const absgap = Math.abs(gap)
      insights.push({
        id: "voucher-vs-cashback",
        card: cashbackOnlyCards[0].key,
        tone: "neutral",
        headline: `Cashback cards are currently ${fmt(absgap)}/g more effective than vouchers`,
        detail: `Cashback average ${fmt(Math.round(avgCashbackEffective))}/g vs ${fmt(Math.round(avgVoucherEffective))}/g for vouchers. Pairing both strategies could improve the voucher rate further.`,
      })
    }
  }

  // Fallback 3rd insight — effective price gap between best and worst card
  if (insights.length < 3 && worstEffective && bestEffective && worstEffective.key !== bestEffective.key) {
    const gap = worstEffective.avgEffectivePrice - bestEffective.avgEffectivePrice
    if (gap > 10) {
      insights.push({
        id: "eff-gap",
        card: worstEffective.key,
        tone: "warning",
        headline: `${worstEffective.key} costs ${fmt(gap)}/g more than your best card`,
        detail: `Effective rate of ${fmt(worstEffective.avgEffectivePrice)}/g vs ${fmt(bestEffective.avgEffectivePrice)}/g on ${bestEffective.key}. Pairing with vouchers could close this gap.`,
      })
    }
  }

  return insights.slice(0, 3)
}

export type Insight = {
  id: string
  text: string
  tone: "neutral" | "positive" | "warning"
  href?: string
}

export function generateInsights(
  purchases: PurchaseDTO[],
  prices: GoldPriceDTO[],
  currency: string,
): Insight[] {
  const insights: Insight[] = []
  if (purchases.length === 0) return insights

  const totals = computeTotals(purchases, prices)
  const fmt = (n: number) => formatCurrency(n, currency)

  // Best performing credit card by total reward value.
  const cardStats = groupBy(purchases, (p) => p.creditCard ?? "", prices).filter(
    (s) => s.key !== "Unknown",
  )
  const topCard = [...cardStats].sort((a, b) => b.rewardValue - a.rewardValue)[0]
  if (topCard && topCard.rewardValue > 0) {
    insights.push({
      id: "top-card",
      tone: "positive",
      text: `${topCard.key} has generated ${fmt(topCard.rewardValue)} worth of rewards.`,
      href: "/analytics/cards",
    })
  }

  // Lowest average acquisition cost by website.
  const siteStats = groupBy(purchases, (p) => p.website ?? "", prices).filter(
    (s) => s.key !== "Unknown" && s.weight > 0,
  )
  const cheapestSite = [...siteStats].sort((a, b) => a.avgEffectivePrice - b.avgEffectivePrice)[0]
  if (cheapestSite) {
    insights.push({
      id: "cheapest-site",
      tone: "neutral",
      text: `${cheapestSite.key} purchases have the lowest average acquisition cost at ${fmt(
        cheapestSite.avgEffectivePrice,
      )}/g.`,
      href: "/analytics/websites",
    })
  }

  // Pending cashback.
  if (totals.pendingCashback > 0) {
    insights.push({
      id: "pending-cb",
      tone: "warning",
      text: `You have ${fmt(totals.pendingCashback)} cashback pending.`,
      href: "/cashback",
    })
  }

  return insights
}

export type Notification = {
  id: string
  title: string
  description: string
  tone: "info" | "warning" | "success"
  href?: string
}

export function generateNotifications(
  purchases: PurchaseDTO[],
  prices: GoldPriceDTO[],
  currency: string,
): Notification[] {
  const notes: Notification[] = []
  const fmt = (n: number) => formatCurrency(n, currency)
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  // Missing today's bullion price.
  const hasToday = prices.some((p) => p.priceDate === todayStr && p.purity === "999")
  if (!hasToday) {
    notes.push({
      id: "missing-price",
      title: "Missing today's gold price",
      description: "Add today's 24K bullion price to keep valuations current.",
      tone: "warning",
      href: "/gold-prices",
    })
  }

  // Pending cashback.
  let pendingCount = 0
  let pendingAmount = 0
  for (const p of purchases) {
    if (p.cashbackStatus === "Pending" && p.cashbackExpected > 0) {
      pendingCount += 1
      pendingAmount += Math.max(0, p.cashbackExpected - p.cashbackReceived)
    }
  }
  if (pendingCount > 0) {
    notes.push({
      id: "pending-cb",
      title: `${pendingCount} pending cashback ${pendingCount === 1 ? "claim" : "claims"}`,
      description: `${fmt(pendingAmount)} expected across your purchases.`,
      tone: "info",
      href: "/cashback",
    })
  }

  // Recently added purchase (within 7 days of creation).
  const recent = [...purchases]
    .filter((p) => daysBetween(new Date(p.createdAt), today) <= 7)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  if (recent) {
    notes.push({
      id: "recent",
      title: "Recently added purchase",
      description: `${recent.brand ?? "Gold"} • ${recent.weightGrams * recent.quantity}g from ${recent.website ?? "store"}.`,
      tone: "success",
      href: "/purchases",
    })
  }

  return notes
}
