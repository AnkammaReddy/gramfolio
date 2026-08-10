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

export const CARD_REFERRALS: CardReferral[] = [SCAPIA_REFERRAL]
