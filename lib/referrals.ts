/**
 * Card referral contribute options.
 * Extend later with more cards + a picker page; keep the list data-driven.
 */
export type CardReferral = {
  id: string
  name: string
  /** Short label shown next to the icon */
  shortName: string
  /** Helps fund hosting for roughly this many months when the campaign succeeds */
  runwayHint: string
  /** Personal bank referral URL — set via NEXT_PUBLIC_SCAPIA_REFERRAL_URL for Scapia */
  url: string
}

export const SCAPIA_REFERRAL: CardReferral = {
  id: "scapia",
  name: "Scapia Federal Bank Credit Card",
  shortName: "Scapia",
  runwayHint: "3 to 4 months",
  url:
    process.env.NEXT_PUBLIC_SCAPIA_REFERRAL_URL?.trim() ||
    "https://apply.scapia.cards/landing_page?referral_code=wztacg",
}

/** CRED app Refer & Earn invite (membership) — not a bank CC apply URL. */
export const CRED_APP_REFERRAL = {
  id: "cred-app",
  name: "CRED",
  url:
    process.env.NEXT_PUBLIC_CRED_REFERRAL_URL?.trim() ||
    "https://app.cred.club/spQx/ecohtl1x",
} as const

/** SBI Cashback Credit Card invite. */
export const SBI_CASHBACK_REFERRAL: CardReferral = {
  id: "sbi-cashback",
  name: "SBI Cashback Credit Card",
  shortName: "SBI Cashback",
  runwayHint: "hosting runway varies",
  url:
    process.env.NEXT_PUBLIC_SBI_CASHBACK_REFERRAL_URL?.trim() ||
    "https://www.sbicard.com/invite/jisAaPVRqfD",
}

export const CARD_REFERRALS: CardReferral[] = [SCAPIA_REFERRAL, SBI_CASHBACK_REFERRAL]
