"use client"

import { Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  downloadCsv,
  purchasesToCsv,
  cashbackToCsv,
  goldPricesToCsv,
  toCsv,
} from "@/lib/csv"
import { computeTotals } from "@/lib/calculations"
import { latestPrice, groupBy } from "@/lib/analytics"
import type { PurchaseDTO, GoldPriceDTO } from "@/lib/types"

export function CsvExport({
  purchases,
  prices,
}: {
  purchases: PurchaseDTO[]
  prices: GoldPriceDTO[]
}) {
  const today = new Date().toISOString().slice(0, 10)
  const bullion = latestPrice(prices)

  const exportPortfolio = () => {
    const t = computeTotals(purchases, prices)
    const csv = toCsv(
      ["Metric", "Value"],
      [
        ["Total Weight (g)", t.totalWeight],
        ["Total Purchase Value", t.totalPurchaseValue],
        ["Total Effective Investment", t.totalEffectiveInvestment],
        ["Today's Bullion Value", t.todayBullionValue],
        ["Unrealized P/L", t.unrealizedPnL],
        ["Total Cashback Expected", t.totalCashbackExpected],
        ["Total Cashback Received", t.totalCashbackReceived],
        ["Pending Cashback", t.pendingCashback],
        ["Avg Price/g", t.avgPricePerGram],
        ["Avg Effective Price/g", t.avgEffectivePricePerGram],
        ["Return %", t.returnPct.toFixed(2)],
      ],
    )
    downloadCsv(`portfolio-summary-${today}.csv`, csv)
  }

  const exportAnalytics = () => {
    const byCard = groupBy(purchases, (p) => p.creditCard ?? "Unknown", prices)
    const csv = toCsv(
      ["Card", "Transactions", "Spend", "Weight (g)", "Avg Price/g", "Eff Price/g", "Rewards", "Cashback Received"],
      byCard.map((s) => [
        s.key,
        s.count,
        s.spend,
        s.weight,
        s.avgPrice,
        s.avgEffectivePrice,
        s.rewardValue,
        s.cashbackReceived,
      ]),
    )
    downloadCsv(`card-analytics-${today}.csv`, csv)
  }

  const items = [
    {
      title: "Purchases",
      description: "All purchase records with computed costs.",
      count: purchases.length,
      action: () => downloadCsv(`purchases-${today}.csv`, purchasesToCsv(purchases)),
    },
    {
      title: "Cashback",
      description: "Cashback tracking across all purchases.",
      count: purchases.filter((p) => p.cashbackExpected > 0 || p.cashbackReceived > 0).length,
      action: () => downloadCsv(`cashback-${today}.csv`, cashbackToCsv(purchases)),
    },
    {
      title: "Gold Prices",
      description: "Your recorded bullion price history.",
      count: prices.length,
      action: () => downloadCsv(`gold-prices-${today}.csv`, goldPricesToCsv(prices)),
    },
    {
      title: "Portfolio Summary",
      description: "Aggregate KPIs and totals.",
      count: purchases.length,
      action: exportPortfolio,
    },
    {
      title: "Card Analytics",
      description: "Per-card spend and reward breakdown.",
      count: purchases.length,
      action: exportAnalytics,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader>
            <CardTitle className="text-base">{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={item.action}
              disabled={item.count === 0}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
