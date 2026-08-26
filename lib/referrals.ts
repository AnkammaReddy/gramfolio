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

const SBI_REFERRAL_CODE = /sbicard\.com(?:\/#\/)?\/invite\/([A-Za-z0-9]+)/i
const SBI_EAPPLY_CODE =
  /sbicard\.com\/eapply\/eapply-form\.page(?:\?|&)(?:[^#]*&)?referralcode=([A-Za-z0-9]+)/i

/** Server redirect path — use in href so GramFolio sends a clean Location header to SBI. */
export const SBI_CASHBACK_REDIRECT_PATH = "/r/sbi-cashback"

/** Direct SBI e-apply URL — avoids /invite/ links that redirect into #/ hash routing. */
export function sbiEapplyReferralUrl(code: string): string {
  return `https://www.sbicard.com/eapply/eapply-form.page?referralcode=${code}`
}

function stripSbiHash(url: string): string {
  try {
    url = decodeURIComponent(url)
  } catch {
    // keep url
  }
  return url.split("#")[0].replace(/%23\/?$/i, "").trim()
}

/** Strip stray SPA hash fragments and normalize SBI links to the e-apply form. */
export function normalizeReferralUrl(raw: string): string {
  let url = raw.trim()
  if (/sbicard\.com/i.test(url)) {
    url = stripSbiHash(url)
  } else {
    url = url.replace(/#\/?$/, "")
  }

  const inviteMatch = url.match(SBI_REFERRAL_CODE)
  if (inviteMatch) return sbiEapplyReferralUrl(inviteMatch[1])

  const eapplyMatch = url.match(SBI_EAPPLY_CODE)
  if (eapplyMatch) return sbiEapplyReferralUrl(eapplyMatch[1])

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

const SBI_CASHBACK_REFERRAL_CODE = "jisAaPVRqfD"

/** SBI Cashback Credit Card invite. */
export const SBI_CASHBACK_REFERRAL: CardReferral = {
  id: "sbi-cashback",
  name: "SBI Cashback Credit Card",
  shortName: "SBI Cashback",
  rewardMessage: "",
  runwayHint: "hosting runway varies",
  url: referralUrl(
    process.env.NEXT_PUBLIC_SBI_CASHBACK_REFERRAL_URL,
    sbiEapplyReferralUrl(SBI_CASHBACK_REFERRAL_CODE),
  ),
}

export const CARD_REFERRALS: CardReferral[] = [SCAPIA_REFERRAL, SBI_CASHBACK_REFERRAL]
