"use client"

import { useMemo } from "react"
import type { PurchaseDTO, GoldPriceDTO } from "@/lib/types"
import { latestPrice } from "@/lib/analytics"
import { totalWeight } from "@/lib/calculations"
import { useCurrency } from "@/components/currency-provider"
import { formatCurrency, formatWeight } from "@/lib/format"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type PuritySlice = {
  purity: string
  weight: number
  effective: number
}

type Holding = {
  brand: string
  category: string
  weight: number
  spend: number
  effective: number
  avgCost: number
  avgEffective: number
  currentValue: number
  profit: number
  returnPct: number
  slices: PuritySlice[]
}

export function HoldingsTable({
  purchases,
  prices,
}: {
  purchases: PurchaseDTO[]
  prices: GoldPriceDTO[]
}) {
  const currency = useCurrency()
  const fmt = (v: number) => formatCurrency(v, currency)
  // Still used for the "—" guard (show dashes when no price data at all)
  const bullion = useMemo(() => latestPrice(prices), [prices])

  const holdings = useMemo<Holding[]>(() => {
    const map = new Map<string, Holding>()
    for (const p of purchases) {
      const key = `${p.brand ?? "Unknown"}__${p.category}`
      const h: Holding =
        map.get(key) ??
        {
          brand: p.brand ?? "Unknown",
          category: p.category,
          weight: 0,
          spend: 0,
          effective: 0,
          avgCost: 0,
          avgEffective: 0,
          currentValue: 0,
          profit: 0,
          returnPct: 0,
          slices: [],
        }
      const w = totalWeight(p.weightGrams, p.quantity)
      h.weight += w
      h.spend += p.purchasePrice
      h.effective += p.effectiveCost
      // Accumulate weight per purity within this holding for correct current-value derivation
      const slice = h.slices.find((s) => s.purity === p.purity)
      if (slice) {
        slice.weight += w
        slice.effective += p.effectiveCost
      } else {
        h.slices.push({ purity: p.purity, weight: w, effective: p.effectiveCost })
      }
      map.set(key, h)
    }
    return [...map.values()]
      .map((h) => {
        h.avgCost = h.weight > 0 ? h.spend / h.weight : 0
        h.avgEffective = h.weight > 0 ? h.effective / h.weight : 0
        // Sum purity-correct current value across all slices
        h.currentValue = h.slices.reduce((sum, s) => {
          const rate = latestPrice(prices, s.purity)
          return sum + (rate > 0 ? s.weight * rate : 0)
        }, 0)
        h.profit = h.currentValue > 0 ? h.currentValue - h.effective : 0
        h.returnPct = h.effective > 0 && h.currentValue > 0 ? (h.profit / h.effective) * 100 : 0
        return h
      })
      .sort((a, b) => b.weight - a.weight)
  }, [purchases, prices])

  const totals = useMemo(
    () =>
      holdings.reduce(
        (acc, h) => ({
          weight: acc.weight + h.weight,
          effective: acc.effective + h.effective,
          currentValue: acc.currentValue + h.currentValue,
          profit: acc.profit + h.profit,
        }),
        { weight: 0, effective: 0, currentValue: 0, profit: 0 },
      ),
    [holdings],
  )

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Weight</TableHead>
              <TableHead className="text-right">Avg Cost/g</TableHead>
              <TableHead className="text-right">Avg Eff/g</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead className="text-right">Return</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((h) => (
              <TableRow key={`${h.brand}-${h.category}`}>
                <TableCell className="font-medium">{h.brand}</TableCell>
                <TableCell>
                  <Badge variant="outline">{h.category}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatWeight(h.weight)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(h.avgCost)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(h.avgEffective)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {bullion > 0 ? fmt(h.currentValue) : "—"}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums font-medium",
                    bullion > 0 && (h.profit >= 0 ? "text-[var(--color-success)]" : "text-destructive"),
                  )}
                >
                  {bullion > 0 ? fmt(h.profit) : "—"}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    bullion > 0 && (h.profit >= 0 ? "text-[var(--color-success)]" : "text-destructive"),
                  )}
                >
                  {bullion > 0 ? `${h.returnPct.toFixed(1)}%` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <tfoot className="border-t border-border bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={2} className="font-semibold">
                Total
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatWeight(totals.weight)}
              </TableCell>
              <TableCell colSpan={2} />
              <TableCell className="text-right font-semibold tabular-nums">
                {bullion > 0 ? fmt(totals.currentValue) : "—"}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-semibold tabular-nums",
                  bullion > 0 && (totals.profit >= 0 ? "text-[var(--color-success)]" : "text-destructive"),
                )}
              >
                {bullion > 0 ? fmt(totals.profit) : "—"}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {bullion > 0 && totals.effective > 0
                  ? `${((totals.profit / totals.effective) * 100).toFixed(1)}%`
                  : "—"}
              </TableCell>
            </TableRow>
          </tfoot>
        </Table>
      </div>
    </Card>
  )
}
