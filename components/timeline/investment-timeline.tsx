"use client"

import { useMemo } from "react"
import Link from "next/link"
import type { PurchaseDTO, GoldPriceDTO } from "@/lib/types"
import { latestPrice, priceAsOfWithSource } from "@/lib/analytics"
import { totalWeight, instantSavings } from "@/lib/calculations"
import { useCurrency } from "@/components/currency-provider"
import { formatCurrency, formatDate, formatWeight } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Coins, ArrowUpRight, ArrowDownRight, Minus, CreditCard, TriangleAlert, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function InvestmentTimeline({
  purchases,
  prices,
}: {
  purchases: PurchaseDTO[]
  prices: GoldPriceDTO[]
}) {
  const currency = useCurrency()
  const fmt = (v: number) => formatCurrency(v, currency)

  // Latest price is purity-specific — latestPrice() handles 999-derivation and staleness correctly
  const latestPriceForPurity = useMemo(() => {
    return (purity: string) => latestPrice(prices, purity)
  }, [prices])

  const sorted = useMemo(
    () => [...purchases].sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate)),
    [purchases],
  )

  return (
    <div className="relative space-y-0">
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" aria-hidden />
      {sorted.map((p) => {
        const weight = totalWeight(p.weightGrams, p.quantity)
        const bullion = latestPriceForPurity(p.purity)
        const currentValue = bullion > 0 ? weight * bullion : 0
        const { pricePerGram: bullionOnDate, source: bullionOnDateSource } = priceAsOfWithSource(
          prices,
          p.purchaseDate,
          p.purity,
          p.pricePerGram || 0,
        )

        // Instant savings (vouchers, supercoins, reward points) — always realized
        const savings = instantSavings(p)

        // Cashback is NOT realized when status is Missing — bank never credited it
        const cashbackRealized = p.cashbackStatus === "Missing" ? 0 : (p.cashbackExpected || 0)
        const totalSavings = savings + cashbackRealized

        // Effective cost adjusted for missing cashback
        const adjustedEffectiveCost = p.cashbackStatus === "Missing"
          ? Math.max(0, p.purchasePrice - savings)
          : p.effectiveCost
        const adjustedEffectivePpg = weight > 0 ? adjustedEffectiveCost / weight : 0

        // Gains without rewards (based on purchase price)
        const gainRaw = bullion > 0 ? currentValue - p.purchasePrice : null
        const gainRawPct = gainRaw !== null && p.purchasePrice > 0
          ? (gainRaw / p.purchasePrice) * 100
          : null

        // Gains with rewards (based on adjusted effective cost — excludes missing cashback)
        const gainEff = bullion > 0 ? currentValue - adjustedEffectiveCost : null
        const gainEffPct = gainEff !== null && adjustedEffectiveCost > 0
          ? (gainEff / adjustedEffectiveCost) * 100
          : null

        // Bullion appreciation since purchase
        const bullionGain = bullionOnDate > 0 && bullion > 0
          ? ((bullion - bullionOnDate) / bullionOnDate) * 100
          : null

        return (
          <div key={p.id} className="relative flex gap-4 pb-6">
            {/* Timeline dot */}
            <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-primary">
              <Coins className="h-4 w-4" />
            </span>

            <Link
              href={`/purchases/${p.id}`}
              className="flex-1 rounded-xl border border-border bg-card transition-colors hover:border-primary/40 overflow-hidden"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{p.brand ?? "Gold"}</span>
                  <Badge variant="outline" className="text-xs">{p.category}</Badge>
                  <span className="text-xs text-muted-foreground font-medium">{p.purity}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs font-medium text-foreground">{formatWeight(weight)}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{formatDate(p.purchaseDate)}</span>
                  {p.website && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{p.website}</span>
                    </>
                  )}
                  {p.creditCard && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {p.creditCard}
                      </span>
                    </>
                  )}
                </div>
                {p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">

                {/* Section 1: Cost */}
                <div className="px-4 py-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cost</p>
                  <div className="grid grid-cols-2 gap-3">
                    <StatCell
                      label="Purchase Cost"
                      value={fmt(p.purchasePrice)}
                      sub={`${fmt(p.pricePerGram)} / g`}
                    />
                    <StatCell
                      label="Effective Cost"
                      value={fmt(adjustedEffectiveCost)}
                      sub={`${fmt(adjustedEffectivePpg)} / g`}
                      highlight={totalSavings > 0}
                      hint={totalSavings > 0 ? `Savings: ${fmt(totalSavings)}` : undefined}
                      missingCashback={p.cashbackStatus === "Missing" ? p.cashbackExpected : 0}
                    />
                  </div>
                </div>

                {/* Section 2: Bullion */}
                <div className="px-4 py-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bullion</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-muted-foreground">On Purchase Date</p>
                        {bullionOnDateSource !== "exact" && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info
                                  className={cn(
                                    "h-3 w-3 shrink-0 cursor-help",
                                    bullionOnDateSource === "derived_999"
                                      ? "text-muted-foreground"
                                      : "text-amber-500",
                                  )}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[240px] text-xs">
                                {bullionOnDateSource === "derived_999"
                                  ? `Derived from the 999 bullion price on ${formatDate(p.purchaseDate)} (× ${p.purity}/999). Only 999 prices are stored; ${p.purity} is computed from that rate.`
                                  : `No bullion entry for ${formatDate(p.purchaseDate)}. Showing purchase price as estimate. Add a 999 price for this date for bullion valuation.`}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {bullionOnDate > 0 ? fmt(bullionOnDate * weight) : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bullionOnDate > 0 ? `${fmt(bullionOnDate)} / g` : "No entry"}
                        {bullionOnDate > 0 && bullionOnDateSource === "derived_999" && (
                          <span className="text-muted-foreground ml-1">(from 999)</span>
                        )}
                        {bullionOnDate > 0 && bullionOnDateSource === "fallback" && (
                          <span className="text-amber-500 ml-1">(est.)</span>
                        )}
                      </p>
                    </div>
                    <StatCell
                      label="Today's Value"
                      value={bullion > 0 ? fmt(currentValue) : "—"}
                      sub={bullion > 0 ? `${fmt(bullion)} / g` : "No price"}
                    />
                  </div>

                </div>

                {/* Section 3: Gains */}
                <div className="px-4 py-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gain / Loss</p>
                  <div className="grid grid-cols-2 gap-3">
                    <StatCell
                      label="Without Rewards"
                      value={gainRaw !== null ? `${gainRaw >= 0 ? "+" : ""}${fmt(gainRaw)}` : "—"}
                      sub={gainRaw !== null ? (
                        <span className="flex items-center gap-1">
                          <span>{gainRaw >= 0 ? "+" : ""}{fmt(gainRaw / weight)} / g</span>
                          {gainRawPct !== null && <GainChip value={gainRawPct} suffix="%" />}
                        </span>
                      ) : undefined}
                      gainValue={gainRaw}
                    />
                    <StatCell
                      label="With Rewards"
                      value={gainEff !== null ? `${gainEff >= 0 ? "+" : ""}${fmt(gainEff)}` : "—"}
                      sub={gainEff !== null ? (
                        <span className="flex items-center gap-1">
                          <span>{gainEff >= 0 ? "+" : ""}{fmt(gainEff / weight)} / g</span>
                          {gainEffPct !== null && <GainChip value={gainEffPct} suffix="%" />}
                        </span>
                      ) : undefined}
                      gainValue={gainEff}
                    />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )
      })}
    </div>
  )
}

function GainChip({ value, suffix }: { value: number | null; suffix: string }) {
  if (value === null) return <span className="text-muted-foreground">—</span>
  const positive = value >= 0
  const Icon = positive ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-xs font-medium",
      positive ? "text-[var(--color-success)]" : "text-destructive"
    )}>
      <Icon className="h-3 w-3" />
      {positive ? "+" : ""}{value.toFixed(1)}{suffix}
    </span>
  )
}

function StatCell({
  label,
  value,
  sub,
  hint,
  highlight,
  gainValue,
  missingCashback,
}: {
  label: string
  value: string
  sub?: React.ReactNode
  hint?: string
  highlight?: boolean
  gainValue?: number | null
  missingCashback?: number
}) {
  const isGainColored = gainValue !== undefined && gainValue !== null
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p
        className={cn(
          "text-sm font-semibold tabular-nums",
          isGainColored && gainValue >= 0 && "text-[var(--color-success)]",
          isGainColored && gainValue < 0 && "text-destructive",
          highlight && "text-[var(--color-success)]",
        )}
        title={hint}
      >
        {value}
      </p>
      {sub && (
        <div className="text-xs text-muted-foreground mt-0.5">
          {typeof sub === "string" ? sub : sub}
        </div>
      )}
      {!!missingCashback && missingCashback > 0 && (
        <div className="flex items-center gap-1 mt-1 text-xs text-destructive font-medium">
          <TriangleAlert className="h-3 w-3 shrink-0" />
          <span>+{missingCashback} cashback not credited</span>
        </div>
      )}
    </div>
  )
}
