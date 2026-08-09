import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
  tooltip,
}: {
  label: string
  value: string
  sub?: string
  icon?: LucideIcon
  tone?: "default" | "positive" | "negative" | "primary"
  tooltip?: string
}) {
  const toneClasses: Record<string, string> = {
    default: "text-foreground",
    positive: "text-[var(--color-success)]",
    negative: "text-destructive",
    primary: "text-primary",
  }
  return (
    <Card className="gap-0 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground leading-tight">
            {label}
          </span>
          {tooltip && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-default shrink-0">
                    <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px] text-xs leading-snug">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {Icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className={cn("mt-3 text-2xl font-semibold tabular-nums tracking-tight", toneClasses[tone])}>
        {value}
      </div>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  )
}
