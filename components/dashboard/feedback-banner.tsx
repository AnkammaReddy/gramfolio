"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { MessageSquare, Heart, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { submitFeedback, type FeedbackInput } from "@/app/actions/feedback"
import { useIsDemo } from "@/components/demo-mode-provider"
import Link from "next/link"

const CONTRIBUTE_URL =
  "/feedback?category=contribute&message=" +
  encodeURIComponent(
    "I am interested in contributing to GramFolio! Any gift voucher is helpful — preferably Amazon Pay voucher, which goes towards the Vercel subscription to keep this app running. I will drop the voucher code here.",
  )

export function DashboardFeedbackBanner() {
  const isDemo = useIsDemo()
  const [pending, startTransition] = useTransition()
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)

  if (dismissed) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (message.trim().length < 10) {
      toast.error("Please write at least 10 characters")
      return
    }
    startTransition(async () => {
      try {
        await submitFeedback({ category: "general" as FeedbackInput["category"], message: message.trim() })
        toast.success("Thank you for your feedback!")
        setSubmitted(true)
        setExpanded(false)
      } catch {
        toast.error("Failed to submit feedback")
      }
    })
  }

  return (
    <div className={cn(
      "relative rounded-lg border border-border bg-card/60 px-3 py-2.5 transition-all",
    )}>
      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {!expanded && !submitted ? (
        <div className="grid grid-cols-2 items-center gap-3 pr-6">
          <div className="flex items-center gap-1.5 text-sm min-w-0">
            <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <button
              onClick={() => setExpanded(true)}
              className="text-left text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              <span className="hidden sm:inline">Bug or feature request?</span>
              <span className="sm:hidden">Bug or Feature?</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
            <Heart className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            <Link
              href={CONTRIBUTE_URL}
              className="text-amber-600 dark:text-amber-400 underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              Contribute?
            </Link>
          </div>
        </div>
      ) : submitted ? (
        /* Thank you state */
        <div className="flex items-center gap-2 pr-6 text-sm text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
          <span>
            Feedback received — thank you! View all your feedback on the{" "}
            <Link href="/feedback" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
              Feedback page
            </Link>.
          </span>
        </div>
      ) : (
        /* Expanded inline form */
        <form onSubmit={handleSubmit} className="space-y-2.5 pr-6">
          <div className="flex items-center gap-1.5 text-sm">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            Quick feedback
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="ml-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
          <textarea
            rows={3}
            placeholder="Describe your feedback…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="sm"
              className="h-7 gap-1.5 text-sm"
              disabled={pending || isDemo}
              title={isDemo ? "Read-only in demo mode" : undefined}
            >
              <Send className="h-3 w-3" />
              {pending ? "Sending…" : "Send feedback"}
            </Button>
            <Link
              href="/feedback"
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Full feedback page
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
