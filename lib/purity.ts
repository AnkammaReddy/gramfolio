/** Preset fineness values (parts per thousand). Only 999 spot is stored in gold_prices. */
export const PURITY_PRESETS = ["999", "995", "965", "916"] as const
export type PurityPreset = (typeof PURITY_PRESETS)[number]

/** Select value when the user enters a fineness not in PURITY_PRESETS. */
export const PURITY_CUSTOM = "custom"

export const PURITY_OPTIONS = [...PURITY_PRESETS, PURITY_CUSTOM] as const

/** @deprecated Use PURITY_PRESETS — kept for existing imports. */
export const PURITIES = PURITY_PRESETS

export const PURITY_LABELS: Record<string, string> = {
  "999": "999 (24K)",
  "995": "995 (BIS Hallmark)",
  "965": "965",
  "916": "916 (22K)",
  [PURITY_CUSTOM]: "Custom…",
}

/** Integer fineness 1–999 (e.g. 916, 965, 875). */
export function isValidPurity(purity: string): boolean {
  const n = Number(purity)
  return Number.isFinite(n) && Number.isInteger(n) && n > 0 && n <= 999
}

export function isPurityPreset(purity: string): purity is PurityPreset {
  return (PURITY_PRESETS as readonly string[]).includes(purity)
}

/** Derive bullion ₹/g for any fineness from the 999 spot price. */
export function deriveBullionFrom999(price999: number, purity: string): number {
  if (purity === "999") return price999
  if (!isValidPurity(purity)) return 0
  return price999 * (Number(purity) / 999)
}

export function splitPurityForForm(stored: string): {
  choice: string
  custom: string
} {
  if (isPurityPreset(stored)) return { choice: stored, custom: "" }
  return { choice: PURITY_CUSTOM, custom: stored }
}

export function resolvePurityFromForm(choice: string, custom: string): string {
  if (choice !== PURITY_CUSTOM) return choice
  return custom.trim()
}
