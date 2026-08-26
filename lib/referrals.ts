/**
 * Card referral contribute options.
 * Extend later with more cards + a picker page; keep the list data-driven.
 */
export type CardReferral = {
  id: string
  name: string
  /** Short label shown next to the icon */
  shortName: string
  /** Reward copy shown on the contribute banner */
  rewardMessage: string
  /** Helps fund hosting for roughly this many months when the campaign succeeds */
  runwayHint: string
  /** Personal bank referral URL — set via NEXT_PUBLIC_SCAPIA_REFERRAL_URL for Scapia */
  url: string
}

/** Strip stray SPA hash fragments copied from bank share sheets (e.g. trailing #/). */
export function normalizeReferralUrl(raw: string): string {
  let url = raw.trim()
  // SBI app sometimes shares hash-router invite links; path-based /invite/ works reliably.
  url = url.replace(/(sbicard\.com)\/#\/invite\//i, "$1/invite/")
  // Trailing hash fragments from copy/paste or env typos.
  url = url.replace(/#\/?$/, "")
  return url
}

function referralUrl(envValue: string | undefined, fallback: string): string {
  return normalizeReferralUrl(envValue || fallback)
}

export const SCAPIA_REFERRAL: CardReferral = {
  id: "scapia",
  name: "Scapia Federal Bank Credit Card",
  shortName: "Scapia",
  rewardMessage: "₹5,000 Amazon Pay voucher for 2 successful referrals",
  runwayHint: "3 to 4 months",
  url: referralUrl(
    process.env.NEXT_PUBLIC_SCAPIA_REFERRAL_URL,
    "https://apply.scapia.cards/landing_page?referral_code=wztacg",
  ),
}

/** CRED app Refer & Earn invite (membership) — not a bank CC apply URL. */
export const CRED_APP_REFERRAL = {
  id: "cred-app",
  name: "CRED",
  url: referralUrl(
    process.env.NEXT_PUBLIC_CRED_REFERRAL_URL,
    "https://app.cred.club/spQx/ecohtl1x",
  ),
} as const

/** SBI Cashback Credit Card invite. */
export const SBI_CASHBACK_REFERRAL: CardReferral = {
  id: "sbi-cashback",
  name: "SBI Cashback Credit Card",
  shortName: "SBI Cashback",
  rewardMessage: "",
  runwayHint: "hosting runway varies",
  url: referralUrl(
    process.env.NEXT_PUBLIC_SBI_CASHBACK_REFERRAL_URL,
    "https://www.sbicard.com/invite/jisAaPVRqfD",
  ),
}

export const CARD_REFERRALS: CardReferral[] = [SCAPIA_REFERRAL, SBI_CASHBACK_REFERRAL]
