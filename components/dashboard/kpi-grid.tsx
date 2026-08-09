"use client"

import { useMemo } from "react"
import type { PurchaseDTO, GoldPriceDTO } from "@/lib/types"
import { computeTotals } from "@/lib/calculations"
import { latestPrice, latestPriceEntry } from "@/lib/analytics"

import { useCurrency } from "@/components/currency-provider"
import { formatCurrency, formatWeight } from "@/lib/format"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, Scale, Receipt } from "lucide-react"
import Link from "next/link"

function PnlHeroCard({
  label,
  sublabel,
  value,
  pct,
  hasBullion,
  breakdownHref,
  avgEffectivePrice,
  savingPerGram,
  rewardsSaved,
}: {
  label: string
  sublabel: string
  value: number
  pct: number
  hasBullion: boolean
  breakdownHref?: string
  avgEffectivePrice?: number
  savingPerGram?: number
  rewardsSaved?: number
}) {
  const currency = useCurrency()
  const fmt = (v: number) => formatCurrency(v, currency)
  const isGain = value >= 0
  const Icon = !hasBullion ? Minus : isGain ? TrendingUp : TrendingDown

  return (
    <div className="rounded-lg border bg-card p-3 flex flex-col gap-2 sm:rounded-xl sm:p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground">{sublabel}</p>
        </div>
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md sm:h-7 sm:w-7",
            !hasBullion
              ? "bg-muted text-muted-foreground"
              : isGain
              ? "bg-[var(--color-success)]/12 text-[var(--color-success)]"
              : "bg-destructive/12 text-destructive",
          )}
        >
          <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </span>
      </div>

      <div>
        <p
          className={cn(
            "text-lg font-bold tabular-nums sm:text-xl",
            !hasBullion
              ? "text-muted-foreground"
              : isGain
              ? "text-[var(--color-success)]"
              : "text-destructive",
          )}
        >
          {hasBullion ? fmt(value) : "—"}
        </p>
        {hasBullion && (
          <p
            className={cn(
              "text-[11px] font-medium mt-0.5",
              isGain ? "text-[var(--color-success)]" : "text-destructive",
            )}
          >
            {isGain ? "+" : ""}
            {pct.toFixed(2)}% return
          </p>
        )}
        {!hasBullion && (
          <p className="text-[10px] text-muted-foreground mt-0.5">Add today&apos;s gold price</p>
        )}
      </div>

      {(avgEffectivePrice !== undefined || breakdownHref) && (
        <div className="pt-1.5 border-t border-border space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            {avgEffectivePrice !== undefined && (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Avg Eff. Price</p>
                <p className="text-[11px] font-semibold tabular-nums text-foreground">{fmt(avgEffectivePrice)}/g</p>
              </div>
            )}
            {savingPerGram !== undefined && savingPerGram > 0 && (
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Saving</p>
                <p className="text-[11px] font-semibold tabular-nums text-[var(--color-success)]">{fmt(savingPerGram)}/g</p>
              </div>
            )}
          </div>
          {rewardsSaved !== undefined && rewardsSaved > 0 && (
            <p className="hidden text-[10px] text-[var(--color-success)] sm:block">
              {fmt(rewardsSaved)} saved via rewards
            </p>
          )}
          {breakdownHref && (
            <Link
              href={breakdownHref}
              className="block text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              View breakdown →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground truncate">{label}</p>
        <p className="text-base font-semibold tabular-nums text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export function KpiGrid({
  purchases,
  prices,
}: {
  purchases: PurchaseDTO[]
  prices: GoldPriceDTO[]
}) {
  const currency = useCurrency()
  const bullionEntry = useMemo(() => latestPriceEntry(prices), [prices])
  const bullion = bullionEntry?.pricePerGram ?? 0
  const t = useMemo(() => computeTotals(purchases, prices), [purchases, prices])
  const fmt = (v: number) => formatCurrency(v, currency)
  const fmtC = (v: number) => formatCurrency(v, currency, { compact: true })
  const hasBullion = bullion > 0
  const rewardsSaved = t.totalRewardsSaved

  // Group by purity for the holdings mini-breakdown
  const holdingsByPurity = useMemo(() => {
    const map = new Map<string, { weight: number; value: number; count: number }>()
    for (const p of purchases) {
      const w = p.weightGrams * p.quantity
      const purityPrice = latestPrice(prices, p.purity) ||
        (bullion > 0 ? bullion * (Number(p.purity) / 999) : 0)
      const v = w * purityPrice
      const existing = map.get(p.purity)
      if (existing) {
        existing.weight += w
        existing.value += v
        existing.count += 1
      } else {
        map.set(p.purity, { weight: w, value: v, count: 1 })
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1].weight - a[1].weight)
  }, [purchases, prices, bullion])

  return (
    <div className="space-y-3">
      {/* Hero row — 2-col on mobile, 4-col on sm+ */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">

        {/* Tile 1: Today's Value + Amount Invested */}
        <div className="rounded-lg border bg-card p-3 flex flex-col gap-2 sm:rounded-xl sm:p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Today&apos;s Value</p>
              <p className="text-[10px] text-muted-foreground">excl. GST</p>
            </div>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/12 text-primary sm:h-7 sm:w-7">
              <Receipt className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </span>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums text-foreground sm:text-xl">
              {hasBullion ? fmtC(t.todayBullionValue) : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Invested: <span className="font-semibold text-foreground tabular-nums">{fmtC(t.totalPurchaseValue)}</span>
            </p>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-border">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Avg Buy</p>
              <p className="text-[11px] font-semibold tabular-nums text-foreground">{fmt(t.avgPricePerGram)}/g</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Spot</p>
              <p className="text-[11px] font-semibold tabular-nums text-foreground">
                {hasBullion ? `${fmt(bullion)}/g` : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Tile 2: Holdings mini-breakdown by purity */}
        <div className="rounded-lg border bg-card p-3 flex flex-col gap-2 sm:rounded-xl sm:p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Holdings</p>
              <p className="text-[10px] text-muted-foreground">{formatWeight(t.totalWeight)} total</p>
            </div>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground sm:h-7 sm:w-7">
              <Scale className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </span>
          </div>
          <div className="space-y-1.5">
            {holdingsByPurity.map(([purity, { weight, value, count }]) => (
              <div key={purity} className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded bg-muted px-1 py-0.5 text-[9px] font-semibold text-muted-foreground">
                    {purity}
                  </span>
                  <span className="text-[11px] font-medium text-foreground tabular-nums">{formatWeight(weight)}</span>
                  <span className="hidden text-[10px] text-muted-foreground sm:inline">{count} {count === 1 ? "purchase" : "purchases"}</span>
                </div>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {hasBullion ? fmtC(value) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tile 3: P/L without rewards */}
        <PnlHeroCard
          label="P/L without Rewards"
          sublabel="vs. purchase price paid"
          value={t.rawPnL}
          pct={t.rawReturnPct}
          hasBullion={hasBullion}
        />

        {/* Tile 4: P/L with rewards */}
        <PnlHeroCard
          label="P/L with Rewards"
          sublabel="vs. effective cost after rewards"
          value={t.unrealizedPnL}
          pct={t.returnPct}
          hasBullion={hasBullion}
          breakdownHref="/cashback"
          avgEffectivePrice={t.avgEffectivePricePerGram}
          savingPerGram={t.avgPricePerGram - t.avgEffectivePricePerGram}
          rewardsSaved={rewardsSaved}
        />
      </div>
    </div>
  )
}
