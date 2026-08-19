/** Preset fineness values (parts per thousand). Only 999 spot is stored in gold_prices. */
export const PURITY_PRESETS = ["999", "995", "965", "916"] as const
export type PurityPreset = (typeof PURITY_PRESETS)[number]

/** @deprecated Use PURITY_PRESETS — kept for existing imports. */
export const PURITIES = PURITY_PRESETS

export const PURITY_LABELS: Record<PurityPreset, string> = {
  "999": "999 (24K)",
  "995": "995 (BIS Hallmark)",
  "965": "965",
  "916": "916 (22K)",
}

/** Derive bullion ₹/g for any fineness from the 999 spot price. */
export function deriveBullionFrom999(price999: number, purity: string): number {
  if (purity === "999") return price999
  const fineness = Number(purity)
  if (!Number.isFinite(fineness) || fineness <= 0 || fineness > 999) return 0
  return price999 * (fineness / 999)
}
