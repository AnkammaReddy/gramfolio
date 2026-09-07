"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ExternalLink, Info, MessageCircle, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { notifyAdminCardReferralInterest } from "@/app/actions/messages"
import { useIsDemo } from "@/components/demo-mode-provider"
import { SCAPIA_REFERRAL } from "@/lib/referrals"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const SCAPIA_REFERRAL_BANNER_ENABLED = true

function ScapiaMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#0D9488] text-xs font-semibold text-white",
        className,
      )}
      aria-hidden
    >
      S
    </span>
  )
}

export function DashboardFeedbackBanner() {
  const isDemo = useIsDemo()
  const [isPending, startTransition] = useTransition()
  const [dismissed, setDismissed] = useState(false)

  if (!SCAPIA_REFERRAL_BANNER_ENABLED || isDemo || dismissed) return null

  function openReferralLink() {
    const url = SCAPIA_REFERRAL.url
    if (!url) return

    window.open(url, "_blank", "noopener,noreferrer")

    startTransition(async () => {
      try {
        await notifyAdminCardReferralInterest()
        toast.success("Admin notified — thanks for contributing!")
      } catch {
        toast.error("Could not notify admin. You can still message us from Talk to admin.")
      }
    })
  }

  return (
    <div className="relative rounded-lg border border-border bg-card/60 px-3 py-2.5 sm:px-4">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex gap-2.5 pr-5 sm:pr-6">
        <ScapiaMark className="mt-0.5" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-foreground leading-tight">
              Help keep GramFolio free
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="rounded-sm text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Why this referral is shown"
                  >
                    <Info className="h-3.5 w-3.5 shrink-0 cursor-help" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] text-xs">
                  Personal Scapia referral link — approved applications help cover hosting.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
            No ads or subscription. Applying via this link supports hosting at no extra cost to
            you.
          </p>

          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 leading-snug">
            {SCAPIA_REFERRAL.rewardMessage}
          </p>

          <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              type="button"
              size="sm"
              className="h-8 w-full gap-1.5 text-sm sm:w-auto"
              disabled={!SCAPIA_REFERRAL.url || isPending}
              title={!SCAPIA_REFERRAL.url ? "Referral link not configured" : undefined}
              onClick={openReferralLink}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {isPending ? "Notifying…" : "Apply on Scapia"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 w-full gap-1.5 text-sm text-muted-foreground sm:w-auto"
              asChild
            >
              <Link href="/messages?topic=card-referrals">
                <MessageCircle className="h-3.5 w-3.5" />
                Message admin instead
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
