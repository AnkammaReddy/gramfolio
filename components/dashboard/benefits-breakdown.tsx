"use client"

import { useMemo } from "react"
import type { PurchaseDTO, GoldPriceDTO } from "@/lib/types"
import { computeTotals } from "@/lib/calculations"
import { latestPrice } from "@/lib/analytics"
import { useCurrency } from "@/components/currency-provider"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import { CheckCircle2, Clock, CircleAlert, Sparkles, ChevronRight } from "lucide-react"
import Link from "next/link"

export function BenefitsBreakdown({
  purchases,
  prices,
}: {
  purchases: PurchaseDTO[]
  prices: GoldPriceDTO[]
}) {
  const currency = useCurrency()
  const fmt = (v: number) => formatCurrency(v, currency)
  const bullion = useMemo(() => latestPrice(prices), [prices])
  const t = useMemo(() => computeTotals(purchases, prices), [purchases, prices])

  const items = [
    {
      key: "expected",
      label: "Expected",
      description: "Total cashback promised across all purchases",
      value: t.totalCashbackExpected,
      icon: Sparkles,
      colorClass: "text-muted-foreground",
      bgClass: "bg-muted",
      show: true,
    },
    {
      key: "received",
      label: "Received",
      description: "Credited by bank",
      value: t.totalCashbackReceived,
      icon: CheckCircle2,
      colorClass: "text-[var(--color-success)]",
      bgClass: "bg-[var(--color-success)]/10",
      show: true,
    },
    {
      key: "pending",
      label: "Pending",
      description: "Awaiting credit from bank",
      value: t.pendingCashback,
      icon: Clock,
      colorClass: "text-amber-600 dark:text-amber-400",
      bgClass: "bg-amber-500/10",
      show: t.pendingCashback > 0,
    },
    {
      key: "missed",
      label: "Not Credited",
      description: "Bank did not provide (MCC or other reason)",
      value: t.missedCashback,
      icon: CircleAlert,
      colorClass: "text-destructive",
      bgClass: "bg-destructive/10",
      show: t.missedCashback > 0,
    },
  ]

  const visibleItems = items.filter((i) => i.show)

  // If no cashback data at all, don't render
  if (t.totalCashbackExpected === 0) return null

  const receivedPct =
    t.totalCashbackExpected > 0
      ? (t.totalCashbackReceived / t.totalCashbackExpected) * 100
      : 0
  const pendingPct =
    t.totalCashbackExpected > 0
      ? (t.pendingCashback / t.totalCashbackExpected) * 100
      : 0
  const missedPct =
    t.totalCashbackExpected > 0
      ? (t.missedCashback / t.totalCashbackExpected) * 100
      : 0

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div>
          <p className="text-sm font-semibold text-foreground">Bank Rewards</p>
          <p className="text-xs text-muted-foreground mt-0.5">Cashback breakdown across all purchases</p>
        </div>
        <Link
          href="/cashback"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Progress bar */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted gap-0.5">
          {receivedPct > 0 && (
            <div
              className="h-full rounded-full bg-[var(--color-success)] transition-all"
              style={{ width: `${receivedPct}%` }}
            />
          )}
          {pendingPct > 0 && (
            <div
              className="h-full rounded-full bg-amber-400 transition-all"
              style={{ width: `${pendingPct}%` }}
            />
          )}
          {missedPct > 0 && (
            <div
              className="h-full rounded-full bg-destructive transition-all"
              style={{ width: `${missedPct}%` }}
            />
          )}
        </div>
      </div>

      {/* Breakdown grid */}
      <div className={cn(
        "grid divide-border px-5 pb-4 pt-3",
        visibleItems.length === 2 ? "grid-cols-2 divide-x" :
        visibleItems.length === 3 ? "grid-cols-3 divide-x" :
        "grid-cols-4 divide-x"
      )}>
        {visibleItems.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.key} className="flex flex-col gap-1.5 px-4 first:pl-0 last:pr-0">
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", item.bgClass)}>
                <Icon className={cn("h-3.5 w-3.5", item.colorClass)} />
              </div>
              <p className={cn("text-base font-semibold tabular-nums", item.colorClass)}>
                {fmt(item.value)}
              </p>
              <div>
                <p className="text-xs font-medium text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Instant savings footer — always show if non-zero */}
      {t.totalInstantSavings > 0 && (
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Instant savings (vouchers, coins, coupons)
          </p>
          <p className="text-xs font-semibold text-foreground">{fmt(t.totalInstantSavings)}</p>
        </div>
      )}
    </div>
  )
}
