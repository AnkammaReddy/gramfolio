"use client"

import { useState, useTransition } from "react"
import { markFeedbackRead } from "@/app/actions/feedback"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, CheckCheck, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type FeedbackRow = {
  id: number
  userId: string
  category: string
  message: string
  rating: number | null
  createdAt: Date
  readAt: Date | null
  userName: string | null
  userEmail: string | null
}

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-muted text-muted-foreground",
  bug: "bg-destructive/15 text-destructive",
  feature: "bg-primary/15 text-primary",
  praise: "bg-green-500/15 text-green-700 dark:text-green-400",
  contribute: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  service_request: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
}

const FILTERS = ["all", "unread", "general", "bug", "feature", "praise", "contribute", "service_request"] as const
type Filter = typeof FILTERS[number]

export function AdminFeedbackClient({ items }: { items: FeedbackRow[] }) {
  const [filter, setFilter] = useState<Filter>("all")
  const [pending, startTransition] = useTransition()
  const [localRead, setLocalRead] = useState<Set<number>>(
    new Set(items.filter((i) => i.readAt).map((i) => i.id)),
  )

  const filtered = items.filter((item) => {
    if (filter === "unread") return !localRead.has(item.id)
    if (filter === "all") return true
    return item.category === filter
  })

  function handleMarkRead(id: number) {
    setLocalRead((prev) => new Set(prev).add(id))
    startTransition(async () => {
      try {
        await markFeedbackRead(id)
      } catch {
        toast.error("Failed to mark as read")
      }
    })
  }

  const unreadCount = items.filter((i) => !localRead.has(i.id)).length

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {f === "unread" ? `Unread (${unreadCount})` : f.replace("_", " ")}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 px-6 py-10 text-center text-sm text-muted-foreground">
          No feedback in this category yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isRead = localRead.has(item.id)
            return (
              <Card key={item.id} className={cn(!isRead && "border-primary/30 bg-primary/5")}>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.general,
                        )}
                      >
                        {item.category}
                      </span>
                      {!isRead && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                          New
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {item.userName || item.userEmail || item.userId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {!isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1.5 px-2 text-xs"
                          disabled={pending}
                          onClick={() => handleMarkRead(item.id)}
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-foreground/90 text-pretty">{item.message}</p>
                  {item.rating && (
                    <div className="mt-2 flex items-center gap-0.5">
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="ml-1 text-xs text-muted-foreground">{item.rating}/5</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
