"use client"

import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export const AUTH_SUPPORT_EMAIL = "folio@gramfolio.in"
export const AUTH_SUPPORT_REDDIT_URL = "https://www.reddit.com/user/dilly_reddy/"
export const AUTH_SUPPORT_REDDIT_LABEL = "Reddit (u/dilly_reddy)"

/** Toast for auth-flow errors — short auto-dismiss; contact note is on the form footer. */
export function authErrorToast(message: string) {
  toast.error(message, {
    duration: 4_000,
  })
}

/** Inline note under forms / error banners. */
export function AuthSupportNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground leading-relaxed text-balance", className)}>
      Having trouble? Email{" "}
      <a
        href={`mailto:${AUTH_SUPPORT_EMAIL}`}
        className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
      >
        {AUTH_SUPPORT_EMAIL}
      </a>{" "}
      or reach out on{" "}
      <Link
        href={AUTH_SUPPORT_REDDIT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
      >
        Reddit
      </Link>
      .
    </p>
  )
}
