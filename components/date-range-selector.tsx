"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { RangeKey } from "@/lib/date-range"

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "all", label: "All" },
]

export function DateRangeSelector({
  value,
  onChange,
}: {
  value: RangeKey
  onChange: (key: RangeKey) => void
}) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1"
      role="group"
      aria-label="Select date range"
    >
      {RANGES.map((r) => (
        <Button
          key={r.key}
          type="button"
          size="sm"
          variant="ghost"
          aria-pressed={value === r.key}
          onClick={() => onChange(r.key)}
          className={cn(
            "h-7 rounded-md px-3 text-xs font-medium",
            value === r.key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {r.label}
        </Button>
      ))}
    </div>
  )
}
