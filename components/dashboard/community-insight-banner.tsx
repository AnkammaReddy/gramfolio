"use client"

import { useState, useTransition } from "react"
import { ThumbsUp, ThumbsDown, Lightbulb, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { reactToInsight, hideInsight, type InsightWithReactions } from "@/app/actions/community-insight"
import { toast } from "sonner"
import { useIsDemo } from "@/components/demo-mode-provider"

export function CommunityInsightBanner({ insight }: { insight: InsightWithReactions }) {
  const isDemo = useIsDemo()
  const [pending, startTransition] = useTransition()
  const [hidden, setHidden] = useState(false)
  const [state, setState] = useState({
    likes: insight.likes,
    dislikes: insight.dislikes,
    userReaction: insight.userReaction,
  })

  if (hidden) return null

  function handleReact(reaction: "like" | "dislike") {
    if (isDemo) { toast.info("Read-only in demo mode"); return }
    startTransition(async () => {
      try {
        const result = await reactToInsight(insight.id, reaction)
        setState(result)
      } catch {
        toast.error("Failed to record reaction")
      }
    })
  }

  function handleHide() {
    setHidden(true)
    if (!isDemo) {
      startTransition(async () => {
        try {
          await hideInsight(insight.id)
        } catch {
          // best-effort — banner is already hidden client-side
        }
      })
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card/50 px-3.5 py-2.5">
      {/* Icon */}
      <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground shrink-0">
            Insight · {insight.weekLabel}
          </span>
          <span className="text-xs font-medium text-foreground leading-snug">{insight.title}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{insight.body}</p>
      </div>

      {/* Reactions + dismiss */}
      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
        <button
          onClick={() => handleReact("like")}
          disabled={pending}
          aria-label="Useful"
          className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
            state.userReaction === "like"
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-border text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-600",
          )}
        >
          <ThumbsUp className="h-2.5 w-2.5" />
          {state.likes > 0 && state.likes}
        </button>
        <button
          onClick={() => handleReact("dislike")}
          disabled={pending}
          aria-label="Not useful"
          className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
            state.userReaction === "dislike"
              ? "border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400"
              : "border-border text-muted-foreground hover:border-rose-500/40 hover:text-rose-600",
          )}
        >
          <ThumbsDown className="h-2.5 w-2.5" />
          {state.dislikes > 0 && state.dislikes}
        </button>
        <button
          onClick={handleHide}
          disabled={pending}
          aria-label="Dismiss insight"
          className="ml-1 rounded p-0.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
