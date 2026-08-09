"use client"

import { useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { PurchaseDTO, GoldPriceDTO } from "@/lib/types"
import { useGraphMode } from "@/components/graph-mode-provider"
import { useCurrency } from "@/components/currency-provider"
import { formatCurrency, formatDate } from "@/lib/format"
import {
  dailyPnl,
  latestPrice,
  portfolioOverTime,
} from "@/lib/analytics"
import { filterByRange, RANGE_OPTIONS, type RangeKey } from "@/lib/date-range"
import { ChartCard } from "@/components/charts/chart-card"
import { ChartTooltip } from "@/components/charts/chart-tooltip"
import { GraphModeToggle } from "@/components/graph-mode-toggle"
import { cn } from "@/lib/utils"

function RangeFilter({ value, onChange }: { value: RangeKey; onChange: (v: RangeKey) => void }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-muted p-0.5 text-xs font-medium">
      {RANGE_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-2.5 py-1 transition-colors",
            value === o.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const axisProps = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
}

export function DashboardCharts({
  purchases,
  prices,
}: {
  purchases: PurchaseDTO[]
  prices: GoldPriceDTO[]
}) {
  const { mode } = useGraphMode()
  const currency = useCurrency()
  const [range, setRange] = useState<RangeKey>("all")

  const fmt = (v: number) => formatCurrency(v, currency, { compact: true })
  const fmtFull = (v: number) => formatCurrency(v, currency)

  const filtered = useMemo(() => filterByRange(purchases, range), [purchases, range])
  const bullion = useMemo(() => latestPrice(prices), [prices])

  const overTime = useMemo(
    () => portfolioOverTime(filtered, prices, mode),
    [filtered, prices, mode],
  )
  const pnl = useMemo(() => dailyPnl(overTime), [overTime])
  // Parse YYYY-MM-DD as local time (replacing "-" with "/" avoids UTC midnight
  // timezone shift that causes every tick to render as the same date in IST).
  const tickDate = (d: string) => {
    if (!d || typeof d !== "string") return ""
    const local = new Date(d.replace(/-/g, "/"))
    return local.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Charts</span>
        <GraphModeToggle />
      </div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {/* 1. Portfolio Value Over Time */}
      <ChartCard
        title="Portfolio Value Over Time"
        description="Invested cost vs. current bullion value"
        className="xl:col-span-2"
        action={<RangeFilter value={range} onChange={setRange} />}
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={overTime} margin={{ left: 4, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="fillBullion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fillInvested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-5)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--color-chart-5)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="date" tickFormatter={tickDate} {...axisProps} minTickGap={32} />
            <YAxis tickFormatter={fmt} width={56} {...axisProps} />
            <Tooltip
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload as never}
                  label={label as string}
                  formatter={fmtFull}
                  labelIsDate
                />
              )}
            />
            <Area
              type="monotone"
              dataKey="invested"
              name="Invested"
              stroke="var(--color-chart-5)"
              fill="url(#fillInvested)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="bullion"
              name="Bullion Value"
              stroke="var(--color-chart-1)"
              fill="url(#fillBullion)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 2. Investment Cost vs Current Bullion Value (latest snapshot) */}
      <ChartCard
        title="Cost vs. Current Value"
        description="Latest invested cost against bullion value"
      >
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={[
              {
                name: "Portfolio",
                invested: overTime.at(-1)?.invested ?? 0,
                bullion: overTime.at(-1)?.bullion ?? 0,
              },
            ]}
            margin={{ left: 4, right: 8, top: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="name" {...axisProps} />
            <YAxis tickFormatter={fmt} width={56} {...axisProps} />
            <Tooltip
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload as never}
                  label={label as string}
                  formatter={fmtFull}
                />
              )}
            />
            <Bar dataKey="invested" name="Invested" fill="var(--color-chart-5)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="bullion" name="Bullion Value" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 3. Daily Profit/Loss — zero-anchored split gradient: green above 0, red below */}
      {(() => {
        const pnlValues = pnl.map((d) => d.pnl)
        const maxVal = Math.max(0, ...pnlValues)
        const minVal = Math.min(0, ...pnlValues)
        const range = maxVal - minVal || 1
        // zeroOffset = fraction from top where y=0 sits (0 = top, 1 = bottom)
        const zeroOffset = maxVal / range
        const GREEN = "var(--color-chart-2)"
        const RED = "var(--color-destructive)"

        return (
          <ChartCard title="Profit / Loss Trend" description="Unrealized P/L over time">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={pnl} margin={{ left: 4, right: 8, top: 8 }}>
                <defs>
                  {/* Stroke gradient: green above zero, red below */}
                  <linearGradient id="strokePnl" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                    <stop offset={zeroOffset} stopColor={GREEN} />
                    <stop offset={zeroOffset} stopColor={RED} />
                  </linearGradient>
                  {/* Fill gradient: green-tinted above zero, red-tinted below */}
                  <linearGradient id="fillPnl" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                    <stop offset="0%" stopColor={GREEN} stopOpacity={0.25} />
                    <stop offset={zeroOffset} stopColor={GREEN} stopOpacity={0.05} />
                    <stop offset={zeroOffset} stopColor={RED} stopOpacity={0.05} />
                    <stop offset="100%" stopColor={RED} stopOpacity={0.25} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={tickDate} {...axisProps} minTickGap={32} />
                <YAxis tickFormatter={fmt} width={56} {...axisProps} />
                <ReferenceLine y={0} stroke="var(--color-border)" strokeDasharray="4 4" />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <ChartTooltip
                      active={active}
                      payload={payload as never}
                      label={label as string}
                      formatter={fmtFull}
                      labelIsDate
                    />
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="pnl"
                  name="Profit / Loss"
                  stroke="url(#strokePnl)"
                  fill="url(#fillPnl)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )
      })()}


    </div>
    </div>
  )
}


