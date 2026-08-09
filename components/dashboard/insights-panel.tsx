import type { Insight } from "@/lib/insights"
import { Lightbulb, TrendingUp, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"

const toneIcon = {
  neutral: Lightbulb,
  positive: TrendingUp,
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

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {insights.map((insight) => {
        const Icon = toneIcon[insight.tone]
        return (
          <div
            key={insight.id}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 leading-snug",
              toneStyle[insight.tone],
            )}
          >
            <Icon className={cn("h-3 w-3 shrink-0", toneIconStyle[insight.tone])} />
            <span className="text-[11px] font-semibold">{insight.text}</span>
          </div>
        )
      })}
    </div>
  )
}
