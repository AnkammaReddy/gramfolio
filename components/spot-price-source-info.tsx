"use client"

import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/** Single info control explaining India + Intl. spot sources (tap/hover). */
export function SpotPriceSourceInfo({ indiaUpdated }: { indiaUpdated?: string | null }) {
  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger
          className="inline-flex shrink-0 rounded-sm p-0.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          aria-label="Spot price sources"
        >
          <Info className="h-3 w-3" />
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="max-w-[240px] space-y-2 text-xs leading-snug">
          <div>
            <p className="font-medium">India (₹/g)</p>
            <p className="text-background/80">
              Mia by Tanishq — manually recorded
              {indiaUpdated ? ` · updated ${indiaUpdated}` : ""}.
            </p>
          </div>
          <div>
            <p className="font-medium">Intl. ($/oz)</p>
            <p className="text-background/80">
              Yahoo Finance gold futures (GC=F) · refreshes about every 15 min.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
