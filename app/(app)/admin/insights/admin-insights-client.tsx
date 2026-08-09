"use client"

import { useState, useTransition } from "react"
import { ThumbsUp, ThumbsDown, Plus, Lightbulb, CheckCircle2, Circle, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createCommunityInsight, toggleInsightActive } from "@/app/actions/community-insight"
import { toast } from "sonner"

type InsightRow = {
  id: number
  title: string
  body: string
  weekLabel: string
  isActive: boolean
  createdAt: Date
  likes: number
  dislikes: number
}

export function AdminInsightsClient({ insights: initial }: { insights: InsightRow[] }) {
  const [insights, setInsights] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({ title: "", body: "", weekLabel: "" })
  const [showForm, setShowForm] = useState(false)

  const fmt = (d: Date) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

  function handleToggle(id: number, currentActive: boolean) {
    startTransition(async () => {
      try {
        await toggleInsightActive(id, !currentActive)
        setInsights((prev) =>
          prev.map((ins) =>
            ins.id === id
              ? { ...ins, isActive: !currentActive }
              : currentActive === false
              ? ins
              : { ...ins, isActive: false }, // deactivate others when activating one
          ),
        )
        toast.success(!currentActive ? "Insight activated" : "Insight hidden")
      } catch {
        toast.error("Failed to update insight")
      }
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim() || !form.weekLabel.trim()) {
      toast.error("All fields are required")
      return
    }
    startTransition(async () => {
      try {
        await createCommunityInsight(form.title.trim(), form.body.trim(), form.weekLabel.trim())
        toast.success("Insight published — previous active insight deactivated")
        setForm({ title: "", body: "", weekLabel: "" })
        setShowForm(false)
        // Mark all existing as inactive, prepend new one (optimistic)
        setInsights((prev) => [
          { id: Date.now(), ...form, isActive: true, createdAt: new Date(), likes: 0, dislikes: 0 },
          ...prev.map((i) => ({ ...i, isActive: false })),
        ])
      } catch {
        toast.error("Failed to publish insight")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Community Insights</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Publish the weekly per-gram strategy insight shown on the dashboard.</p>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Insight
        </Button>
      </div>

      {/* Publish form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card/60 p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            New community insight
          </p>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Week label — e.g. Week of 28 Jul 2026"
              value={form.weekLabel}
              onChange={(e) => setForm((f) => ({ ...f, weekLabel: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              type="text"
              placeholder="Title — short, per-gram strategy insight"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              maxLength={120}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <textarea
              rows={4}
              placeholder="Body — explain the insight and what makes it useful..."
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              maxLength={600}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Publishing…" : "Publish Insight"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Insights list */}
      {insights.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No insights yet. Publish the first one above.
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Insight</th>
                <th className="hidden md:table-cell px-4 py-3 text-left font-medium text-muted-foreground">Week</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Reactions</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Visibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {insights.map((ins) => (
                <tr key={ins.id} className={cn("transition-colors", ins.isActive ? "bg-emerald-500/5" : "hover:bg-muted/30")}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground line-clamp-1">{ins.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ins.body}</p>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {ins.weekLabel}
                    <p className="text-[11px] mt-0.5">{fmt(ins.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <ThumbsUp className="h-3 w-3" />{ins.likes}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                        <ThumbsDown className="h-3 w-3" />{ins.dislikes}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {ins.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Circle className="h-3.5 w-3.5" /> Past
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(ins.id, ins.isActive)}
                      disabled={pending}
                      title={ins.isActive ? "Hide insight" : "Make active"}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        ins.isActive
                          ? "border-border text-muted-foreground hover:border-rose-500/40 hover:text-rose-500"
                          : "border-border text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-500",
                      )}
                    >
                      {ins.isActive ? <><EyeOff className="h-3 w-3" /> Hide</> : <><Eye className="h-3 w-3" /> Show</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
