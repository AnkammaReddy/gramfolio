"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { PurchaseDTO, GoldPriceDTO } from "@/lib/types"
import { groupBy, type GroupStat } from "@/lib/analytics"
import { useCurrency } from "@/components/currency-provider"
import { formatCurrency, formatWeight } from "@/lib/format"
import { ChartCard } from "@/components/charts/chart-card"
import { ChartTooltip } from "@/components/charts/chart-tooltip"
import { KpiCard } from "@/components/kpi-card"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { CardInsightsPanel } from "@/components/analytics/card-insights-panel"
import type { CardInsight } from "@/lib/insights"

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
]

type Dimension = "card" | "website" | "brand"

const config: Record<
  Dimension,
  { selector: (p: PurchaseDTO) => string; label: string; topLabel: string }
> = {
  card: { selector: (p) => p.creditCard ?? "Unknown", label: "Card", topLabel: "Top Performing Card" },
  website: { selector: (p) => p.website ?? "Other", label: "Website", topLabel: "Top Website" },
  brand: { selector: (p) => p.brand ?? "Other", label: "Brand", topLabel: "Top Brand" },
}

export function AnalyticsView({
  purchases,
  prices,
  dimension,
  cardInsights = [],
}: {
  purchases: PurchaseDTO[]
  prices: GoldPriceDTO[]
  dimension: Dimension
  cardInsights?: CardInsight[]
}) {
  const currency = useCurrency()
  const fmt = (v: number) => formatCurrency(v, currency)
  const fmtC = (v: number) => formatCurrency(v, currency, { compact: true })
  const { selector, label, topLabel } = config[dimension]

  // allStats includes Unknown — used for KPI totals so null-card purchases aren't excluded
  const allStats = useMemo(
    () => groupBy(purchases, selector, prices),
    [purchases, selector, prices, dimension],
  )

  // chartStats filters Unknown card from chart/table display only
  const stats = useMemo(
    () => allStats.filter((s) => s.key !== "Unknown" || dimension !== "card"),
    [allStats, dimension],
  )

  // Totals always from allStats — never drop reward value from null-card purchases
  const totals = useMemo(
    () =>
      allStats.reduce(
        (acc, s) => ({
          spend: acc.spend + s.spend,
          weight: acc.weight + s.weight,
          rewardValue: acc.rewardValue + s.rewardValue,
          effective: acc.effective + s.effective,
        }),
        { spend: 0, weight: 0, rewardValue: 0, effective: 0 },
      ),
    [allStats],
  )

  const topByReward = useMemo(
    () => [...allStats].sort((a, b) => b.rewardValue - a.rewardValue)[0],
    [allStats],
  )
  const savingsPct = totals.spend > 0 ? ((totals.spend - totals.effective) / totals.spend) * 100 : 0

  return (
    <div className="space-y-6">
      {dimension === "card" && cardInsights.length > 0 && (
        <CardInsightsPanel insights={cardInsights} />
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total Spend" value={fmtC(totals.spend)} />
        <KpiCard label="Total Weight" value={formatWeight(totals.weight)} />
        <KpiCard label="Rewards Value" value={fmtC(totals.rewardValue)} tone="positive" />
        <KpiCard label="Effective Savings" value={`${savingsPct.toFixed(1)}%`} tone="primary" />
      </div>

      {topByReward && topByReward.rewardValue > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
          <Trophy className="h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium shrink-0">{topLabel}:</p>
          <p className="text-xs">
            <span className="font-semibold text-foreground">{topByReward.key}</span>
            {" — "}
            <span className="font-semibold text-primary">{fmt(topByReward.rewardValue)}</span>
            {" in rewards across "}{topByReward.count} purchases
          </p>
        </div>
      )}

      {dimension === "card" && (
        <ChartCard title="Reward Rate by Card" description="Rewards earned as % of spend">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={stats.map((s) => ({ ...s, rewardRate: s.spend > 0 ? +((s.rewardValue / s.spend) * 100).toFixed(2) : 0 }))}
              margin={{ left: 8, right: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="key"
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={({ x, y, payload }) => (
                  <text x={x} y={y + 8} textAnchor="middle" fontSize={10} fill="var(--color-muted-foreground)">
                    {(payload.value as string).length > 12
                      ? (payload.value as string).slice(0, 12) + "…"
                      : payload.value}
                  </text>
                )}
              />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload, label: l }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload as GroupStat & { rewardRate: number }
                  return (
                    <div className="rounded-lg border bg-popover p-2.5 text-xs shadow-md space-y-1">
                      <p className="font-medium">{l}</p>
                      <p className="text-[var(--color-success)]">Rate: {d.rewardRate}%</p>
                      <p className="text-muted-foreground">Rewards: {fmt(d.rewardValue)}</p>
                      <p className="text-muted-foreground">Spend: {fmt(d.spend)}</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="rewardRate" name="Reward Rate %" fill="var(--color-success)" radius={[4, 4, 0, 0]}>
                {stats.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title={`Spend by ${label}`} description="Total purchase value">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={fmtC}
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="key"
                width={110}
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload, label: l }) => (
                  <ChartTooltip active={active} payload={payload as never} label={l as string} formatter={fmt} />
                )}
              />
              <Bar dataKey="spend" name="Spend" radius={[0, 6, 6, 0]}>
                {stats.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Rewards Distribution" description="Reward value share">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={stats.filter((s) => s.rewardValue > 0)}
                dataKey="rewardValue"
                nameKey="key"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
              >
                {stats.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => (
                  <ChartTooltip active={active} payload={payload as never} formatter={fmt} />
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{label}</TableHead>
                <TableHead className="text-right">Txns</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">Weight</TableHead>
                <TableHead className="text-right">Avg Price/g</TableHead>
                <TableHead className="text-right">Eff Price/g</TableHead>
                <TableHead className="text-right">Rewards</TableHead>
                <TableHead className="text-right">Cashback</TableHead>
                {dimension !== "card" && <TableHead className="text-right">Current Value</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((s) => (
                <AnalyticsRow key={s.key} s={s} fmt={fmt} showValue={dimension !== "card"} />
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}

function AnalyticsRow({
  s,
  fmt,
  showValue,
}: {
  s: GroupStat
  fmt: (v: number) => string
  showValue: boolean
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">{s.key}</TableCell>
      <TableCell className="text-right tabular-nums">{s.count}</TableCell>
      <TableCell className="text-right tabular-nums">{fmt(s.spend)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatWeight(s.weight)}</TableCell>
      <TableCell className="text-right tabular-nums">{fmt(s.avgPrice)}</TableCell>
      <TableCell className="text-right tabular-nums">{fmt(s.avgEffectivePrice)}</TableCell>
      <TableCell className="text-right tabular-nums text-[var(--color-success)]">
        {fmt(s.rewardValue)}
      </TableCell>
      <TableCell className="text-right tabular-nums">{fmt(s.cashbackReceived)}</TableCell>
      {showValue && (
        <TableCell
          className={cn(
            "text-right tabular-nums",
            s.currentValue > 0 && (s.profit >= 0 ? "text-[var(--color-success)]" : "text-destructive"),
          )}
        >
          {s.currentValue > 0 ? fmt(s.currentValue) : "—"}
        </TableCell>
      )}
    </TableRow>
  )
}
