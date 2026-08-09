"use client"

import { useState } from "react"
import { Plus, Trash2, ChevronDown, ChevronUp, Ticket } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Field } from "./field"
import { formatCurrency } from "@/lib/format"
import { useCurrency } from "@/components/currency-provider"

export type VoucherRewardType = "None" | "Cashback" | "RewardPoints"

export type VoucherRow = {
  label: string          // e.g. "Amazon Pay"
  faceValue: number      // face value of the voucher
  amountPaid: number     // what you actually paid (0 = same as face)
  cardUsed: string       // credit card used to buy the voucher
  // Reward on the card purchase
  rewardType: VoucherRewardType
  // Cashback sub-fields
  cashbackPct: number
  cashbackExpected: number
  cashbackReceived: number
  cashbackStatus: string
  cashbackVerified: boolean
  // Points sub-fields
  pointsPerMultiple: number
  pointsMultiple: number
  pointsEarned: number
  basePointValue: number
  transferMultiplier: number
  transferPartner: string
  pointsValue: number
  pointsStatus: string
  pointsVerified: boolean
}

export function emptyVoucher(): VoucherRow {
  return {
    label: "",
    faceValue: 0,
    amountPaid: 0,
    cardUsed: "",
    rewardType: "None",
    cashbackPct: 0,
    cashbackExpected: 0,
    cashbackReceived: 0,
    cashbackStatus: "Pending",
    cashbackVerified: false,
    pointsPerMultiple: 0,
    pointsMultiple: 100,
    pointsEarned: 0,
    basePointValue: 0.25,
    transferMultiplier: 1,
    transferPartner: "",
    pointsValue: 0,
    pointsStatus: "Pending",
    pointsVerified: false,
  }
}

/** Compute reward value for a voucher given its current state */
function voucherRewardValue(v: VoucherRow): number {
  if (v.rewardType === "Cashback") return v.cashbackExpected
  if (v.rewardType === "RewardPoints") return v.pointsValue
  return 0
}

/** Net saving from a voucher = (face − paid) + reward value */
export function voucherNetSaving(v: VoucherRow): number {
  const discount = Math.max(0, (v.faceValue || 0) - (v.amountPaid || v.faceValue || 0))
  return discount + voucherRewardValue(v)
}

/** Total gift voucher savings across all vouchers (for effective cost) */
export function totalVoucherSavings(vouchers: VoucherRow[]): number {
  return vouchers.reduce((sum, v) => sum + voucherNetSaving(v), 0)
}


function NumberInput({
  label, id, value, onChange, step = "0.01", placeholder, suffix,
}: {
  label: string; id: string; value: number; onChange: (v: number) => void
  step?: string; placeholder?: string; suffix?: string
}) {
  return (
    <Field label={label} htmlFor={id} compact>
      <div className="relative">
        <Input
          id={id}
          type="number"
          step={step}
          placeholder={placeholder ?? "0"}
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={suffix ? "pr-8" : ""}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  )
}

function VoucherRewardSection({
  voucher, index, onUpdate,
}: {
  voucher: VoucherRow; index: number; onUpdate: (patch: Partial<VoucherRow>) => void
}) {
  const currency = useCurrency()
  const fmt = (v: number) => formatCurrency(v, currency)

  const handleCashbackPct = (pct: number) => {
    const base = voucher.amountPaid || voucher.faceValue || 0
    onUpdate({
      cashbackPct: pct,
      cashbackExpected: base > 0 ? Math.round(base * pct) / 100 : 0,
    })
  }

  // partnerPointValue: ₹ value of 1 partner point — local only, derived pointsValue IS saved
  const [partnerPointValue, setPartnerPointValueState] = useState<number>(0)

  // ratioParts: local X:Y display state; transferMultiplier stores decimal (card/partner)
  const [ratioParts, setRatioParts] = useState<{ card: number; partner: number }>(() => {
    const m = voucher.transferMultiplier
    if (!m || m <= 0) return { card: 1, partner: 1 }
    const candidates = [1,2,3,4,5,10,25,50,100]
    for (const p of candidates) {
      const c = m * p
      if (Math.abs(c - Math.round(c)) < 0.01) return { card: Math.round(c), partner: p }
    }
    return { card: m, partner: 1 }
  })

  const calcPoints = (merged: VoucherRow, pptv: number, rCard: number, rPartner: number) => {
    const base = merged.amountPaid || merged.faceValue || 0
    const multiples = merged.pointsMultiple > 0 ? Math.floor(base / merged.pointsMultiple) : 0
    const earned = multiples * merged.pointsPerMultiple
    const ratio = rPartner > 0 ? rCard / rPartner : 1
    const partnerPts = ratio > 0 ? earned / ratio : 0
    // use transfer if partner set, else base value
    const value = merged.transferPartner && pptv > 0
      ? partnerPts * pptv
      : earned * (merged.basePointValue > 0 ? merged.basePointValue : 0)
    return { earned, value: Math.round(value * 100) / 100 }
  }

  const handlePointsField = (patch: Partial<VoucherRow>, pptv = partnerPointValue, rc = ratioParts.card, rp = ratioParts.partner) => {
    const merged = { ...voucher, ...patch }
    const { earned, value } = calcPoints(merged, pptv, rc, rp)
    onUpdate({ ...patch, pointsEarned: earned, pointsValue: value })
  }

  const handleRatioChange = (card: number, partner: number) => {
    setRatioParts({ card, partner })
    const ratio = partner > 0 ? card / partner : 1
    handlePointsField({ transferMultiplier: ratio }, partnerPointValue, card, partner)
  }

  const handlePartnerPtValue = (v: number) => {
    setPartnerPointValueState(v)
    handlePointsField({}, v, ratioParts.card, ratioParts.partner)
  }

  return (
    <div className="mt-3 space-y-3">
      {/* Reward type toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Card reward:</span>
        {(["None", "Cashback", "RewardPoints"] as VoucherRewardType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onUpdate({ rewardType: t })}
            className={[
              "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
              voucher.rewardType === t
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
            ].join(" ")}
          >
            {t === "RewardPoints" ? "Points" : t}
          </button>
        ))}
      </div>

      {/* Cashback fields */}
      {voucher.rewardType === "Cashback" && (
        <div className="rounded-md border border-border/60 bg-background/60 p-3 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cashback on card</p>
          <div className="grid gap-3 grid-cols-2">
            <NumberInput
              label="Cashback %" id={`v-cb-pct-${index}`}
              value={voucher.cashbackPct} onChange={handleCashbackPct}
              step="0.01" suffix="%"
            />
            <NumberInput
              label="Expected" id={`v-cb-exp-${index}`}
              value={voucher.cashbackExpected} onChange={(v) => onUpdate({ cashbackExpected: v })}
            />
          </div>
          {voucher.cashbackExpected > 0 && (
            <p className="text-xs text-muted-foreground">
              {voucher.cashbackPct}% of {fmt(voucher.amountPaid || voucher.faceValue)} ={" "}
              <span className="font-semibold text-foreground">{fmt(voucher.cashbackExpected)}</span>
            </p>
          )}
        </div>
      )}

      {/* Reward Points fields */}
      {voucher.rewardType === "RewardPoints" && (
        <div className="rounded-md border border-border/60 bg-background/60 p-3 space-y-3">
          {/* Earning Rate */}
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Earning Rate</p>
          <div className="grid gap-3 grid-cols-2">
            <NumberInput
              label="Points" id={`v-pts-pp-${index}`}
              value={voucher.pointsPerMultiple}
              onChange={(v) => handlePointsField({ pointsPerMultiple: v })}
              step="1" placeholder="e.g. 2"
            />
            <NumberInput
              label="Every ₹" id={`v-pts-mult-${index}`}
              value={voucher.pointsMultiple}
              onChange={(v) => handlePointsField({ pointsMultiple: v })}
              step="1" placeholder="e.g. 100"
            />
          </div>

          {/* Base value per point — dimmed when transfer partner set */}
          <div className={`pt-2 border-t border-border/40 transition-opacity ${voucher.transferPartner ? "opacity-50" : ""}`}>
            <Field label="Base value per point (₹)" htmlFor={`v-pts-bv-${index}`} compact>
              <Input
                id={`v-pts-bv-${index}`}
                type="number"
                min={0}
                step={0.01}
                placeholder="0.25"
                value={voucher.basePointValue || ""}
                placeholder="0.25"
                onChange={(e) => handlePointsField({ basePointValue: Number(e.target.value) || 0 })}
                onFocus={(e) => e.target.select()}
                disabled={!!voucher.transferPartner}
              />
            </Field>
            {voucher.transferPartner ? (
              <p className="mt-1 text-xs text-muted-foreground">Not used — transfer partner value applies instead.</p>
            ) : voucher.pointsEarned > 0 && voucher.basePointValue > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {voucher.pointsEarned.toLocaleString()} pts × ₹{voucher.basePointValue} = <span className="font-medium text-foreground">{fmt(voucher.pointsEarned * voucher.basePointValue)}</span>
              </p>
            ) : null}
          </div>

          {/* Transfer Partner (optional) */}
          <div className="pt-2 border-t border-border/40 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Transfer Partner <span className="normal-case font-normal text-muted-foreground/60">(optional)</span>
            </p>
            <div className="grid gap-3 grid-cols-2">
              <Field label="Partner name" htmlFor={`v-pts-tp-${index}`} compact>
                <Input
                  id={`v-pts-tp-${index}`}
                  value={voucher.transferPartner}
                  onChange={(e) => handlePointsField({ transferPartner: e.target.value })}
                  placeholder="e.g. Accor, KrisFlyer"
                />
              </Field>
              <Field label="Ratio (card : partner)" htmlFor={`v-pts-rc-${index}`} compact>
                <div className="flex items-center gap-1.5">
                  <Input
                    id={`v-pts-rc-${index}`}
                    type="number" min={1} step={1} placeholder="1"
                    value={ratioParts.card || ""}
                    onChange={(e) => handleRatioChange(Number(e.target.value) || 1, ratioParts.partner)}
                    onFocus={(e) => e.target.select()}
                    className="w-0 flex-1 text-center"
                  />
                  <span className="shrink-0 text-sm font-medium text-muted-foreground">:</span>
                  <Input
                    id={`v-pts-rp-${index}`}
                    type="number" min={1} step={1} placeholder="1"
                    value={ratioParts.partner || ""}
                    onChange={(e) => handleRatioChange(ratioParts.card, Number(e.target.value) || 1)}
                    onFocus={(e) => e.target.select()}
                    className="w-0 flex-1 text-center"
                  />
                </div>
              </Field>
              <Field label="Partner pt value (₹)" htmlFor={`v-pts-pptv-${index}`} compact>
                <Input
                  id={`v-pts-pptv-${index}`}
                  type="number" min={0} step={0.01} placeholder="e.g. 2.10"
                  value={partnerPointValue || ""}
                  onChange={(e) => handlePartnerPtValue(Number(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                />
              </Field>
            </div>
          </div>

          {/* Summary */}
          {voucher.pointsEarned > 0 && (
            <div className="space-y-1">
              {voucher.transferPartner && partnerPointValue > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {voucher.pointsEarned.toLocaleString()} pts ({ratioParts.card}:{ratioParts.partner}) ={" "}
                  <span className="font-medium text-foreground">
                    {Math.floor(voucher.pointsEarned / (ratioParts.card / ratioParts.partner)).toLocaleString()} {voucher.transferPartner} pts
                  </span>{" "}× ₹{partnerPointValue}
                </p>
              ) : null}
              <div className="flex items-center gap-2 rounded bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
                <span>{voucher.pointsEarned.toLocaleString()} pts</span>
                <span className="text-border">→</span>
                <span className="font-semibold text-foreground">{fmt(voucher.pointsValue)}</span>
                {voucher.transferPartner && (
                  <span className="ml-auto text-muted-foreground">via {voucher.transferPartner}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function GiftVouchersCard({
  vouchers,
  superCoinsValue,
  onVouchersChange,
  onSuperCoinsChange,
}: {
  vouchers: VoucherRow[]
  superCoinsValue: number
  onVouchersChange: (rows: VoucherRow[]) => void
  onSuperCoinsChange: (v: number) => void
}) {
  const currency = useCurrency()
  const fmt = (v: number) => formatCurrency(v, currency)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  const toggle = (i: number) => setExpanded((prev) => ({ ...prev, [i]: !prev[i] }))

  const add = () => {
    const next = [...vouchers, emptyVoucher()]
    onVouchersChange(next)
    setExpanded((prev) => ({ ...prev, [next.length - 1]: true }))
  }

  const remove = (i: number) => {
    onVouchersChange(vouchers.filter((_, idx) => idx !== i))
    setExpanded((prev) => {
      const next = { ...prev }
      delete next[i]
      return next
    })
  }

  const update = (i: number, patch: Partial<VoucherRow>) => {
    const next = vouchers.map((v, idx) => {
      if (idx !== i) return v
      const merged = { ...v, ...patch }
      // Auto-fill amountPaid from faceValue if not set
      if (patch.faceValue !== undefined && merged.amountPaid === 0) {
        merged.amountPaid = patch.faceValue
      }
      // Recalc cashback expected when amountPaid changes
      if ((patch.amountPaid !== undefined || patch.faceValue !== undefined) && merged.rewardType === "Cashback" && merged.cashbackPct > 0) {
        const base = merged.amountPaid || merged.faceValue || 0
        merged.cashbackExpected = Math.round(base * merged.cashbackPct) / 100
      }
      return merged
    })
    onVouchersChange(next)
  }

  const totalFace = vouchers.reduce((s, v) => s + (v.faceValue || 0), 0)
  const totalPaid = vouchers.reduce((s, v) => s + (v.amountPaid || v.faceValue || 0), 0)
  const totalDiscount = totalFace - totalPaid
  const totalRewardValue = vouchers.reduce((s, v) => s + voucherRewardValue(v), 0)
  const totalSaving = totalDiscount + totalRewardValue + (superCoinsValue || 0)

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
      <CardContent className="pt-5">
        <div className="space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15">
                <Ticket className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                Gift Vouchers &amp; Savings
              </h3>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={add}>
              <Plus className="h-3.5 w-3.5" />
              Add Voucher
            </Button>
          </div>

          {/* Voucher rows */}
          {vouchers.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              No vouchers added. Use gift cards purchased at a discount to reduce effective cost.
            </p>
          ) : (
            <div className="space-y-3">
              {vouchers.map((v, i) => {
                const discount = Math.max(0, (v.faceValue || 0) - (v.amountPaid || v.faceValue || 0))
                const rewardVal = voucherRewardValue(v)
                const isOpen = expanded[i] ?? false

                return (
                  <div key={i} className="rounded-lg border border-border/70 bg-background/70 p-3">
                    {/* Row header */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggle(i)}
                        className="flex flex-1 items-center gap-2 text-left"
                        aria-expanded={isOpen}
                      >
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="flex-1 truncate text-sm font-medium">
                          {v.label || `Voucher ${i + 1}`}
                        </span>
                        {v.faceValue > 0 && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {fmt(v.faceValue)}
                            {discount > 0 && (
                              <span className="ml-1 font-medium text-green-600 dark:text-green-400">
                                −{fmt(discount)}
                              </span>
                            )}
                            {rewardVal > 0 && (
                              <span className="ml-1 font-medium text-green-600 dark:text-green-400">
                                −{fmt(rewardVal)}
                              </span>
                            )}
                          </span>
                        )}
                      </button>
                      <Button
                        type="button" variant="ghost" size="icon"
                        onClick={() => remove(i)} aria-label="Remove voucher"
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div className="mt-3 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Voucher source / label" htmlFor={`v-label-${i}`} compact>
                            <Input
                              id={`v-label-${i}`}
                              value={v.label}
                              onChange={(e) => update(i, { label: e.target.value })}
                              placeholder="e.g. Amazon Pay, Flipkart"
                            />
                          </Field>
                          <Field label="Card used to buy" htmlFor={`v-card-${i}`} compact>
                            <Input
                              id={`v-card-${i}`}
                              value={v.cardUsed}
                              onChange={(e) => update(i, { cardUsed: e.target.value })}
                              placeholder="e.g. HDFC Infinia"
                            />
                          </Field>
                          <NumberInput
                            label="Face value" id={`v-face-${i}`}
                            value={v.faceValue}
                            onChange={(val) => update(i, { faceValue: val })}
                          />
                          <NumberInput
                            label="Amount paid" id={`v-paid-${i}`}
                            value={v.amountPaid || v.faceValue}
                            onChange={(val) => update(i, { amountPaid: val })}
                          />
                        </div>

                        {/* Discount summary */}
                        {v.faceValue > 0 && v.amountPaid > 0 && v.amountPaid < v.faceValue && (
                          <div className="rounded bg-green-500/8 px-2.5 py-1.5 text-xs">
                            <span className="text-muted-foreground">Voucher discount: </span>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {fmt(v.faceValue - v.amountPaid)}
                            </span>
                            <span className="ml-1 text-muted-foreground">
                              ({((1 - v.amountPaid / v.faceValue) * 100).toFixed(1)}% off)
                            </span>
                          </div>
                        )}

                        {/* Card reward sub-section */}
                        <VoucherRewardSection voucher={v} index={i} onUpdate={(p) => update(i, p)} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <Separator className="opacity-50" />

          {/* SuperCoins / wallet credits */}
          <Field label="SuperCoins / wallet credits" htmlFor="supercoins" compact>
            <Input
              id="supercoins"
              type="number"
              step="0.01"
              placeholder="0"
              value={superCoinsValue || ""}
              onChange={(e) => onSuperCoinsChange(parseFloat(e.target.value) || 0)}
            />
          </Field>

          {/* Footer totals */}
          {(totalFace > 0 || superCoinsValue > 0) && (
            <div className="rounded-lg bg-muted/40 px-3 py-2.5 space-y-1">
              {vouchers.length > 0 && (
                <>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Total face value</span>
                    <span>{fmt(totalFace)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Total paid for vouchers</span>
                    <span>{fmt(totalPaid)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Voucher discount</span>
                      <span className="font-medium text-green-600 dark:text-green-400">−{fmt(totalDiscount)}</span>
                    </div>
                  )}
                  {totalRewardValue > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Card rewards on vouchers</span>
                      <span className="font-medium text-primary">−{fmt(totalRewardValue)}</span>
                    </div>
                  )}
                  {superCoinsValue > 0 && <Separator className="my-1 opacity-30" />}
                </>
              )}
              {superCoinsValue > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>SuperCoins / wallet</span>
                  <span>−{fmt(superCoinsValue)}</span>
                </div>
              )}
              <Separator className="my-1 opacity-30" />
              <div className="flex justify-between text-xs font-semibold">
                <span>Total savings</span>
                <span className="text-green-600 dark:text-green-400">−{fmt(totalSaving)}</span>
              </div>
            </div>
          )}

        </div>
      </CardContent>
    </Card>
  )
}
