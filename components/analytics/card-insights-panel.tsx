"use client"

import { Lightbulb, TrendingUp, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CardInsight } from "@/lib/insights"

const toneIcon = {
  positive: TrendingUp,
  neutral: Lightbulb,
  warning: TriangleAlert,
}

const toneStyle = {
  neutral: "border-border bg-muted/50 text-foreground",
  positive: "border-[var(--color-success)]/25 bg-[var(--color-success)]/8 text-foreground",
  warning: "border-destructive/25 bg-destructive/8 text-foreground",
}

const toneIconStyle = {
  neutral: "text-muted-foreground",
  positive: "text-[var(--color-success)]",
  warning: "text-destructive",
}

export function CardInsightsPanel({ insights }: { insights: CardInsight[] }) {
  if (insights.length === 0) return null

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground px-0.5">Strategy Insights</p>
      <div className="flex flex-wrap gap-2">
        {insights.slice(0, 3).map((insight) => {
          const Icon = toneIcon[insight.tone]
          return (
            <div
              key={insight.id}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm leading-snug",
                toneStyle[insight.tone],
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 shrink-0", toneIconStyle[insight.tone])} />
              <span>{insight.headline}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
