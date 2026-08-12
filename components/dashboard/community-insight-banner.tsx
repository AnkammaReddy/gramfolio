"use client"

import { useState, useTransition, type ReactNode } from "react"
import Link from "next/link"
import { ThumbsUp, ThumbsDown, Lightbulb, X, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { reactToInsight, hideInsight, type InsightWithReactions } from "@/app/actions/community-insight"
import { toast } from "sonner"
import { useIsDemo } from "@/components/demo-mode-provider"

const URL_IN_TEXT = /(https?:\/\/[^\s<>"']+|\/strategies\/[a-zA-Z0-9/_-]+)/g

/**
 * Safe hrefs only:
 * - https?://… (no javascript:/data:/protocol-relative)
 * - /strategies/… relative paths (public strategy articles)
 * Members cannot author insights — only admins — so the main abuse surface is a
 * compromised admin posting a phishing https URL (same as any CMS).
 */
function isSafeInsightHref(raw: string): boolean {
  const href = raw.trim().replace(/[.,);]+$/, "")
  if (!href || href.length > 500) return false
  if (href.startsWith("/strategies/")) {
    // single path segment tree, no // or ..
    return /^\/strategies\/[a-zA-Z0-9/_-]+$/.test(href) && !href.includes("..")
  }
  try {
    const u = new URL(href)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

/** Body that is only a path or absolute URL. */
function parseInsightHref(body: string): string | null {
  const t = body.trim()
  if (!t || t.includes("\n") || /\s/.test(t)) return null
  return isSafeInsightHref(t) ? t.replace(/[.,);]+$/, "") : null
}

function linkifyBody(body: string): ReactNode[] {
  const parts: ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null
  const re = new RegExp(URL_IN_TEXT.source, "g")
  while ((match = re.exec(body)) !== null) {
    if (match.index > last) {
      parts.push(body.slice(last, match.index))
    }
    const candidate = match[0]
    const href = candidate.replace(/[.,);]+$/, "")
    const trailing = candidate.slice(href.length)
    if (!isSafeInsightHref(href)) {
      parts.push(candidate)
      last = match.index + candidate.length
      continue
    }
    const external = href.startsWith("http")
    parts.push(
      external ? (
        <a
          key={`${href}-${match.index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-700 underline underline-offset-2 hover:opacity-80 dark:text-amber-400"
        >
          {href}
        </a>
      ) : (
        <Link
          key={`${href}-${match.index}`}
          href={href}
          className="text-amber-700 underline underline-offset-2 hover:opacity-80 dark:text-amber-400"
        >
          {href}
        </Link>
      ),
    )
    if (trailing) parts.push(trailing)
    last = match.index + match[0].length
  }
  if (last < body.length) parts.push(body.slice(last))
  return parts.length > 0 ? parts : [body]
}


export function CommunityInsightBanner({ insight }: { insight: InsightWithReactions }) {
  const isDemo = useIsDemo()
  const [pending, startTransition] = useTransition()
  const [hidden, setHidden] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [state, setState] = useState({
    likes: insight.likes,
    dislikes: insight.dislikes,
    userReaction: insight.userReaction,
  })

  if (hidden) return null

  const hrefOnly = parseInsightHref(insight.body)
  const bodyLong = !hrefOnly && (insight.body.length > 100 || insight.body.includes("\n"))
  const externalOnly = hrefOnly?.startsWith("http")

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
      <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />

      <div className="flex-1 min-w-0 space-y-0.5">
        <span className="text-sm text-foreground leading-snug">{insight.title}</span>
        {hrefOnly ? (
          externalOnly ? (
            <a
              href={hrefOnly}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-amber-700 underline underline-offset-2 hover:opacity-80 dark:text-amber-400"
            >
              Read full strategy
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          ) : (
            <Link
              href={hrefOnly}
              className="inline-flex items-center gap-1 text-xs text-amber-700 underline underline-offset-2 hover:opacity-80 dark:text-amber-400"
            >
              Read full strategy
            </Link>
          )
        ) : (
          <>
            <p
              className={cn(
                "text-xs text-muted-foreground leading-relaxed",
                !expanded && "line-clamp-1",
                expanded && "whitespace-pre-wrap",
              )}
            >
              {linkifyBody(insight.body)}
            </p>
            {bodyLong && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-xs text-foreground/80 underline underline-offset-2 hover:text-foreground"
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
        <button
          type="button"
          onClick={() => handleReact("like")}
          disabled={pending}
          aria-label="Useful"
          className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
            state.userReaction === "like"
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-border text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-600",
          )}
        >
          <ThumbsUp className="h-2.5 w-2.5" />
          {state.likes > 0 && state.likes}
        </button>
        <button
          type="button"
          onClick={() => handleReact("dislike")}
          disabled={pending}
          aria-label="Not useful"
          className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
            state.userReaction === "dislike"
              ? "border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400"
              : "border-border text-muted-foreground hover:border-rose-500/40 hover:text-rose-600",
          )}
        >
          <ThumbsDown className="h-2.5 w-2.5" />
          {state.dislikes > 0 && state.dislikes}
        </button>
        <button
          type="button"
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
