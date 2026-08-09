"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { submitFeedback, type FeedbackInput } from "@/app/actions/feedback"
import type { Feedback } from "@/lib/db/schema"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Star, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsDemo } from "@/components/demo-mode-provider"

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "praise", label: "Praise" },
  { value: "contribute", label: "Contribute / Sponsor" },
  { value: "service_request", label: "Service Request" },
] as const

const VALID_CATEGORIES = CATEGORIES.map((c) => c.value)

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-muted text-muted-foreground",
  bug: "bg-destructive/15 text-destructive",
  feature: "bg-primary/15 text-primary",
  praise: "bg-green-500/15 text-green-700 dark:text-green-400",
  contribute: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  service_request: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Star
            className={cn(
              "h-5 w-5 transition-colors",
              (hovered || value) >= star
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-1 text-xs text-muted-foreground">{value}/5</span>
      )}
    </div>
  )
}

export function FeedbackClient({
  myFeedback,
  prefillCategory,
  prefillMessage,
}: {
  myFeedback: Feedback[]
  prefillCategory?: string
  prefillMessage?: string
}) {
  const isDemo = useIsDemo()
  const [pending, startTransition] = useTransition()
  const validCategory = VALID_CATEGORIES.includes(prefillCategory as FeedbackInput["category"])
    ? (prefillCategory as FeedbackInput["category"])
    : "general"
  const [category, setCategory] = useState<FeedbackInput["category"]>(validCategory)
  const [message, setMessage] = useState(prefillMessage ?? "")
  const [rating, setRating] = useState(0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (message.trim().length < 10) {
      toast.error("Please write at least 10 characters")
      return
    }
    startTransition(async () => {
      try {
        await submitFeedback({ category, message: message.trim(), rating: rating || undefined })
        toast.success("Thank you for your feedback!")
        setMessage("")
        setRating(0)
        setCategory("general")
      } catch {
        toast.error("Failed to submit feedback")
      }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Submit form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Share your thoughts</CardTitle>
          <CardDescription>All feedback goes directly to the admin. Be as specific as you like.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as FeedbackInput["category"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={5}
                placeholder="Describe your feedback in detail…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
              />
              <p className="text-right text-xs text-muted-foreground">{message.length}/1000</p>
            </div>

            <div className="space-y-1.5">
              <Label>Overall rating <span className="text-xs font-normal text-muted-foreground">(optional)</span></Label>
              <StarRating value={rating} onChange={setRating} />
            </div>

  <Button type="submit" disabled={pending || isDemo} className="w-full" title={isDemo ? "Read-only in demo mode" : undefined}>
    {pending ? "Submitting…" : "Submit feedback"}
  </Button>
          </form>
        </CardContent>
      </Card>

      {/* Past submissions */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Your previous feedback</h2>
        {myFeedback.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
            <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No feedback submitted yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myFeedback.map((item) => (
              <Card key={item.id} className="text-sm">
                <CardContent className="pt-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.general)}>
                      {item.category.replace("_", " ")}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 text-pretty">{item.message}</p>
                  {item.rating && (
                    <div className="mt-2 flex items-center gap-1">
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
