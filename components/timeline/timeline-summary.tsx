"use client"

import { useMemo, useState } from "react"
import type { PurchaseDTO, GoldPriceDTO } from "@/lib/types"
import { latestPrice } from "@/lib/analytics"
import { computeTotals, instantSavings } from "@/lib/calculations"
import { useCurrency } from "@/components/currency-provider"
import { formatCurrency, formatWeight } from "@/lib/format"
import { ArrowUpRight, ArrowDownRight, Minus, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function TimelineSummary({
  purchases,
  prices,
}: {
  purchases: PurchaseDTO[]
  prices: GoldPriceDTO[]
}) {
  const currency = useCurrency()
  const fmt = (v: number) => formatCurrency(v, currency)
  const fmtCompact = (v: number) => formatCurrency(v, currency, { compact: true })

  const totals = useMemo(() => {
    return computeTotals(purchases, prices)
  }, [purchases, prices])

  const totalSavingsRealized = useMemo(() => {
    return purchases.reduce((sum, p) => {
      const instant = instantSavings(p)
      const cashback = p.cashbackStatus === "Missing" ? 0 : (p.cashbackExpected || 0)
      return sum + instant + cashback
    }, 0)
  }, [purchases])

  const missingCashbackCount = useMemo(
    () => purchases.filter((p) => p.cashbackStatus === "Missing").length,
    [purchases]
  )

  const gain = totals.unrealizedPnL
  const gainPct = totals.returnPct
  const hasBullionPrice = totals.todayBullionValue > 0
  const [open, setOpen] = useState(true)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:bg-muted/40 transition-colors border-b border-border"
      >
        <span>Portfolio Summary</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {/* Collapsible body */}
      {open && (
        <>
      {/* Top strip — primary metrics */}
      <div className="grid grid-cols-2 divide-x divide-border sm:grid-cols-4">
        <SummaryCell
          label="Total Invested"
          value={fmtCompact(totals.totalEffectiveInvestment)}
          sub={`Purchase cost ${fmtCompact(totals.totalPurchaseValue)}`}
        />
        <SummaryCell
          label="Today's Value"
          value={hasBullionPrice ? fmtCompact(totals.todayBullionValue) : "—"}
          sub={hasBullionPrice ? `${fmt(totals.todayBullionValue / totals.totalWeight)} / g` : "No price data"}
        />
        <SummaryCell
          label="Overall Gain / Loss"
          value={hasBullionPrice ? `${gain >= 0 ? "+" : ""}${fmtCompact(gain)}` : "—"}
          gainValue={hasBullionPrice ? gain : null}
          sub={
            hasBullionPrice ? (
              <GainPill value={gainPct} />
            ) : undefined
          }
        />
        <SummaryCell
          label="Total Weight"
          value={formatWeight(totals.totalWeight)}
          sub={`${purchases.length} purchase${purchases.length !== 1 ? "s" : ""}`}
        />
      </div>

      {/* Bottom strip — secondary metrics */}
      <div className="grid grid-cols-2 divide-x divide-border sm:grid-cols-4 border-t border-border bg-muted/30">
        <SummaryCell
          label="Avg Buy Price"
          value={`${fmt(totals.avgEffectivePricePerGram)} / g`}
          sub={`Purchase avg ${fmt(totals.avgPricePerGram)} / g`}
          small
        />
        <SummaryCell
          label="Total Savings"
          value={totalSavingsRealized > 0 ? fmt(totalSavingsRealized) : "—"}
          sub={
            totalSavingsRealized > 0
              ? `${((totalSavingsRealized / totals.totalPurchaseValue) * 100).toFixed(1)}% off purchase cost`
              : "No rewards applied"
          }
          tone={totalSavingsRealized > 0 ? "positive" : "default"}
          small
        />
        <SummaryCell
          label="Cashback Pending"
          value={totals.pendingCashback > 0 ? fmt(totals.pendingCashback) : "—"}
          sub={totals.pendingCashback > 0 ? "Expected from bank" : "All settled"}
          small
        />
        <SummaryCell
          label="Not Credited by Bank"
          value={missingCashbackCount > 0 ? `${missingCashbackCount} purchase${missingCashbackCount !== 1 ? "s" : ""}` : "—"}
          sub={
            missingCashbackCount > 0
              ? `${fmt(purchases.filter(p => p.cashbackStatus === "Missing").reduce((s, p) => s + (p.cashbackExpected || 0), 0))} unrealized`
              : "All accounted for"
          }
          tone={missingCashbackCount > 0 ? "negative" : "default"}
          small
        />
      </div>
        </>
      )}
    </div>
  )
}

function GainPill({ value }: { value: number }) {
  const positive = value >= 0
  const neutral = value === 0
  const Icon = neutral ? Minus : positive ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        positive && !neutral && "text-[var(--color-success)]",
        !positive && "text-destructive",
        neutral && "text-muted-foreground"
      )}
    >
      <Icon className="h-3 w-3" />
      {positive && !neutral ? "+" : ""}{value.toFixed(2)}%
    </span>
  )
}

function SummaryCell({
  label,
  value,
  sub,
  gainValue,
  tone = "default",
  small = false,
}: {
  label: string
  value: string
  sub?: React.ReactNode
  gainValue?: number | null
  tone?: "default" | "positive" | "negative"
  small?: boolean
}) {
  const isGainColored = gainValue !== undefined && gainValue !== null
  return (
    <div className="px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
      <p
        className={cn(
          "font-semibold tabular-nums leading-tight",
          small ? "text-sm" : "text-lg",
          isGainColored && gainValue! >= 0 && "text-[var(--color-success)]",
          isGainColored && gainValue! < 0 && "text-destructive",
          tone === "positive" && "text-[var(--color-success)]",
          tone === "negative" && "text-destructive",
        )}
      >
        {value}
      </p>
      {sub && (
        <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
      )}
    </div>
  )
}
