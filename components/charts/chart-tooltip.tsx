"use client"

import { formatDate } from "@/lib/format"

type TooltipProps = {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>
  label?: string
  formatter: (v: number) => string
  labelIsDate?: boolean
}

export function ChartTooltip({ active, payload, label, formatter, labelIsDate }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-popover-foreground">
        {labelIsDate ? formatDate(label) : label}
      </p>
      <div className="flex flex-col gap-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-medium tabular-nums text-popover-foreground">
              {formatter(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
