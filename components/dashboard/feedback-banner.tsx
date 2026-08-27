"use client"

import { useState, useTransition } from "react"
import { ExternalLink, Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { trackReferralClick } from "@/app/actions/feedback"
import { useIsDemo } from "@/components/demo-mode-provider"
import { SCAPIA_REFERRAL } from "@/lib/referrals"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

/** Temporary — set true to show the Scapia referral banner on the dashboard again. */
const SCAPIA_REFERRAL_BANNER_ENABLED = false

function ScapiaMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#0D9488] text-sm font-semibold text-white",
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
  const [, startTransition] = useTransition()
  const [dismissed, setDismissed] = useState(false)

  if (!SCAPIA_REFERRAL_BANNER_ENABLED || isDemo || dismissed) return null

  function openReferralLink() {
    const url = SCAPIA_REFERRAL.url
    if (!url) return
    window.open(url, "_blank", "noopener,noreferrer")
    startTransition(async () => {
      try {
        await trackReferralClick(SCAPIA_REFERRAL.id)
      } catch {
        // Click already happened; tracking failure should not block the user.
      }
    })
  }

  return (
    <div className="relative rounded-lg border border-border bg-card/60 px-3 py-2.5 transition-all">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-2.5 pr-6">
        <ScapiaMark />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-medium text-foreground">Scapia card referral</span>
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
                    Helps keep GramFolio running.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button
              type="button"
              size="sm"
              className="h-7 gap-1.5 shrink-0 text-sm"
              disabled={!SCAPIA_REFERRAL.url}
              title={!SCAPIA_REFERRAL.url ? "Referral link not configured" : undefined}
              onClick={openReferralLink}
            >
              <ExternalLink className="h-3 w-3" />
              Apply
            </Button>
          </div>
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400 leading-snug">
            {SCAPIA_REFERRAL.rewardMessage}
          </p>
        </div>
      </div>
    </div>
  )
}
