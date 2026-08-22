import Link from "next/link"
import type { Insight } from "@/lib/insights"
import { Lightbulb, TrendingUp, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"

const toneIcon = {
  neutral: Lightbulb,
  positive: TrendingUp,
  warning: TriangleAlert,
}

const toneStyle = {
  neutral: "border-border bg-muted/50 text-foreground hover:bg-muted",
  positive:
    "border-[var(--color-success)]/25 bg-[var(--color-success)]/8 text-foreground hover:bg-[var(--color-success)]/12",
  warning:
    "border-destructive/25 bg-destructive/8 text-foreground hover:bg-destructive/12",
}

const toneIconStyle = {
  neutral: "text-muted-foreground",
  positive: "text-[var(--color-success)]",
  warning: "text-destructive",
}

function InsightPill({ insight }: { insight: Insight }) {
  const Icon = toneIcon[insight.tone]
  const className = cn(
    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 leading-snug transition-colors",
    toneStyle[insight.tone],
    insight.href && "cursor-pointer",
  )
  const content = (
    <>
      <Icon className={cn("h-3.5 w-3.5 shrink-0", toneIconStyle[insight.tone])} />
      <span className="text-sm">{insight.text}</span>
    </>
  )

  if (insight.href) {
    return (
      <Link href={insight.href} className={className}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {insights.map((insight) => (
        <InsightPill key={insight.id} insight={insight} />
      ))}
    </div>
  )
}
