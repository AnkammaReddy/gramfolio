"use client"

import { useMemo, useEffect, useState } from "react"
import { Coins, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field } from "./field"
import { formatCurrency } from "@/lib/format"
import { useCurrency } from "@/components/currency-provider"

export function RewardPointsCard({
  purchasePrice,
  pointsPerMultiple,
  multiple,
  effectiveMultiplier,
  transferPartner,
  basePointValue,
  pointsExpected,
  rewardValue,
  pointsReceived,
  pointsCreditedDate,
  pointsStatus,
  pointsVerified,
  onPointsPerMultipleChange,
  onMultipleChange,
  onEffectiveMultiplierChange,
  onTransferPartnerChange,
  onBasePointValueChange,
  onPointsExpectedChange,
  onRewardValueChange,
  onPointsReceivedChange,
  onPointsCreditedDateChange,
  onPointsStatusChange,
  onPointsVerifiedChange,
}: {
  purchasePrice: number
  pointsPerMultiple: number
  multiple: number
  effectiveMultiplier: number
  transferPartner: string
  basePointValue: number
  pointsExpected: number
  rewardValue: number
  pointsReceived: number
  pointsCreditedDate: string
  pointsStatus: string
  pointsVerified: boolean
  onPointsPerMultipleChange: (v: number) => void
  onMultipleChange: (v: number) => void
  onEffectiveMultiplierChange: (v: number) => void
  onTransferPartnerChange: (v: string) => void
  onBasePointValueChange: (v: number) => void
  onPointsExpectedChange: (v: number) => void
  onRewardValueChange: (v: number) => void
  onPointsReceivedChange: (v: number) => void
  onPointsCreditedDateChange: (v: string) => void
  onPointsStatusChange: (v: string) => void
  onPointsVerifiedChange: (v: boolean) => void
}) {
  const currency = useCurrency()
  const fmt = (v: number) => formatCurrency(v, currency)
  const sym = currency === "INR" ? "₹" : "$"

  // effectiveMultiplier = card:partner ratio stored as decimal (card/partner), e.g. 3:5 → 0.6, 1:1 → 1, 2:1 → 2
  // basePointValue      = base card value per point (e.g. ₹0.25) — stored in DB
  // partnerPointValue   = ₹ value of 1 partner point (e.g. ₹2.10) — local only; derived rewardValue IS saved
  // Derive on load: rewardValue = partnerPts × pptv = (earned / ratio) × pptv
  // → pptv = rewardValue × ratio / earned  (only when transferPartner is set and earned > 0)
  const derivedPartnerPointValue = (() => {
    if (!transferPartner || !rewardValue || !pointsExpected || pointsExpected <= 0) return 0
    const ratio = effectiveMultiplier > 0 ? effectiveMultiplier : 1
    return (rewardValue * ratio) / pointsExpected
  })()
  const [partnerPointValue, setPartnerPointValue] = useState<number>(derivedPartnerPointValue)

  // Split effectiveMultiplier decimal back into card:partner integers for display
  // We store card/partner as a decimal. To reverse: find the simplest integer pair.
  // For display we keep local card/partner state and write the decimal to DB on change.
  const [ratioParts, setRatioParts] = useState<{ card: number; partner: number }>(() => {
    if (!effectiveMultiplier || effectiveMultiplier <= 0) return { card: 1, partner: 1 }
    // effectiveMultiplier = card/partner → if > 1 it's e.g. 2:1, if < 1 it's e.g. 3:5
    // round-trip: try to find simple integers within tolerance
    const candidates = [1,2,3,4,5,10,25,50,100]
    for (const p of candidates) {
      const c = effectiveMultiplier * p
      if (Math.abs(c - Math.round(c)) < 0.01) return { card: Math.round(c), partner: p }
    }
    return { card: effectiveMultiplier, partner: 1 }
  })

  // Effective ratio as a decimal (card pts per partner pt)
  const ratio = ratioParts.partner > 0 ? ratioParts.card / ratioParts.partner : 1

  const calc = useMemo(() => {
    if (!purchasePrice || !pointsPerMultiple || !multiple) return { earned: 0, baseValue: 0, transferValue: 0, partnerPts: 0 }
    const earned = Math.floor(purchasePrice / multiple) * pointsPerMultiple
    const baseValue = earned * (basePointValue > 0 ? basePointValue : 0)
    // e.g. 386 card pts, ratio 3:5 (decimal 0.6) → 386 / 0.6 ≈ 643 partner pts × ₹2.10
    const partnerPts = ratio > 0 ? earned / ratio : 0
    const transferValue = transferPartner && partnerPointValue > 0 ? partnerPts * partnerPointValue : 0
    return { earned, baseValue, transferValue, partnerPts }
  }, [purchasePrice, pointsPerMultiple, multiple, basePointValue, ratio, partnerPointValue, transferPartner])

  const syncCalc = (perMult: number, mult: number, baseVal: number, r: number, pptv: number, partner: string) => {
    const earned = mult > 0 ? Math.floor(purchasePrice / mult) * perMult : 0
    onPointsExpectedChange(earned)
    const partnerPts = r > 0 ? earned / r : 0
    const effectiveValue = partner && pptv > 0
      ? partnerPts * pptv
      : earned * (baseVal > 0 ? baseVal : 0)
    onRewardValueChange(effectiveValue)
  }

  const handleRatioChange = (card: number, partner: number) => {
    const newParts = { card, partner }
    setRatioParts(newParts)
    const r = partner > 0 ? card / partner : 1
    onEffectiveMultiplierChange(r)
    syncCalc(pointsPerMultiple, multiple, basePointValue, r, partnerPointValue, transferPartner)
  }

  const setPerMultiple    = (v: number) => { onPointsPerMultipleChange(v);  syncCalc(v, multiple, basePointValue, ratio, partnerPointValue, transferPartner) }
  const setMultiple       = (v: number) => { onMultipleChange(v);            syncCalc(pointsPerMultiple, v, basePointValue, ratio, partnerPointValue, transferPartner) }
  const setBasePointVal   = (v: number) => { onBasePointValueChange(v);      syncCalc(pointsPerMultiple, multiple, v, ratio, partnerPointValue, transferPartner) }
  const setPartnerPtValue = (v: number) => { setPartnerPointValue(v);        syncCalc(pointsPerMultiple, multiple, basePointValue, ratio, v, transferPartner) }
  const setPartner        = (v: string) => { onTransferPartnerChange(v);     syncCalc(pointsPerMultiple, multiple, basePointValue, ratio, partnerPointValue, v) }

  useEffect(() => {
    if (purchasePrice && multiple && pointsPerMultiple) {
      syncCalc(pointsPerMultiple, multiple, basePointValue, ratio, partnerPointValue, transferPartner)
    }
  }, [purchasePrice, multiple, pointsPerMultiple, basePointValue, ratio, partnerPointValue, transferPartner])

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent">
      <CardContent className="pt-5">
        <div className="space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15">
                <Coins className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">CC Reward Points</h3>
            </div>
            {calc.earned > 0 && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                {calc.earned.toLocaleString("en-IN")} pts earned
              </span>
            )}
          </div>

          {/* ── Earning Rate ─────────────────────────────────── */}
          <div className="rounded-lg border border-border/60 bg-background/60 p-3">
            <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Earning Rate
            </p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <Field label="Points earned" htmlFor="rp-pts" compact>
                <Input
                  id="rp-pts"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="e.g. 2"
                  value={pointsPerMultiple || ""}
                  onChange={(e) => setPerMultiple(Number(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                />
              </Field>
              <div className="flex h-9 items-center justify-center px-1">
                <span className="text-xs font-medium text-muted-foreground">per</span>
              </div>
              <Field label={`Every (${sym})`} htmlFor="rp-mult" compact>
                <Input
                  id="rp-mult"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="e.g. 100"
                  value={multiple || ""}
                  onChange={(e) => setMultiple(Number(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                />
              </Field>
            </div>

            {/* Earning rate inline hint */}
            {purchasePrice > 0 && pointsPerMultiple > 0 && multiple > 0 && (
              <div className="mt-2.5 flex items-center gap-1.5 rounded bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">
                <span>{Math.floor(purchasePrice / multiple)} × {sym}{multiple}</span>
                <ArrowRight className="h-3 w-3 shrink-0" />
                <span className="font-semibold text-foreground">{calc.earned.toLocaleString("en-IN")} points</span>
              </div>
            )}

            {/* Base value per point — inside Earning Rate */}
            <div className={`mt-3 pt-3 border-t border-border/40 transition-opacity ${transferPartner ? "opacity-50" : ""}`}>
              <Field label={`Base value per point (${sym})`} htmlFor="rp-base" compact>
                <Input
                  id="rp-base"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.25"
                  value={basePointValue || ""}
                  placeholder="0.25"
                  onChange={(e) => setBasePointVal(Number(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  disabled={!!transferPartner}
                />
              </Field>
              {transferPartner ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Not used — transfer partner value applies instead.
                </p>
              ) : calc.baseValue > 0 ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {calc.earned.toLocaleString("en-IN")} pts × {sym}{basePointValue} = <span className="font-medium text-foreground">{fmt(calc.baseValue)}</span>
                </p>
              ) : null}
            </div>
          </div>

          {/* ── Transfer (optional) ──────────────────────────── */}
          <div className="rounded-lg border border-border/60 bg-background/60 p-3">
            <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Transfer Partner <span className="normal-case font-normal text-muted-foreground/60">(optional)</span>
            </p>
            <div className="grid gap-3 grid-cols-2">
              <Field label="Partner name" htmlFor="rp-partner" compact>
                <Input
                  id="rp-partner"
                  type="text"
                  placeholder="e.g. Accor, KrisFlyer"
                  value={transferPartner}
                  onChange={(e) => setPartner(e.target.value)}
                />
              </Field>
              <Field label="Ratio (card : partner)" htmlFor="rp-ratio-card" compact>
                <div className="flex items-center gap-1.5">
                  <Input
                    id="rp-ratio-card"
                    type="number"
                    min={1}
                    step={1}
                    placeholder="3"
                    value={ratioParts.card || ""}
                    onChange={(e) => handleRatioChange(Number(e.target.value) || 1, ratioParts.partner)}
                    onFocus={(e) => e.target.select()}
                    className="w-0 flex-1 text-center"
                  />
                  <span className="shrink-0 text-sm font-medium text-muted-foreground">:</span>
                  <Input
                    id="rp-ratio-partner"
                    type="number"
                    min={1}
                    step={1}
                    placeholder="5"
                    value={ratioParts.partner || ""}
                    onChange={(e) => handleRatioChange(ratioParts.card, Number(e.target.value) || 1)}
                    onFocus={(e) => e.target.select()}
                    className="w-0 flex-1 text-center"
                  />
                </div>
              </Field>
              <Field label={`Partner pt value (${sym})`} htmlFor="rp-pptv" compact>
                <Input
                  id="rp-pptv"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="e.g. 2.10"
                  value={partnerPointValue || ""}
                  onChange={(e) => setPartnerPtValue(Number(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                />
              </Field>
            </div>

            {/* Transfer effective value summary */}
            {transferPartner && calc.transferValue > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs text-muted-foreground">
                  {calc.earned.toLocaleString("en-IN")} card pts ({ratioParts.card}:{ratioParts.partner}) = <span className="font-medium text-foreground">{Math.floor(calc.partnerPts).toLocaleString("en-IN")} {transferPartner} pts</span>
                  {" "}× {sym}{partnerPointValue}
                </p>
                <div className="flex items-center justify-between rounded-md border border-amber-500/20 bg-amber-500/8 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Transfer value</span>
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{fmt(calc.transferValue)}</span>
                </div>
              </div>
            )}
            {transferPartner && !calc.transferValue && (
              <p className="mt-2 text-xs text-muted-foreground">Enter ratio and partner point value to see transfer worth.</p>
            )}
          </div>



        </div>
      </CardContent>
    </Card>
  )
}
