"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Trash2, Loader2, ChevronDown, HelpCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useCurrency } from "@/components/currency-provider"
import { formatCurrency } from "@/lib/format"
import { DateField } from "./date-field"
import { CardCombobox } from "./card-combobox"
import { BrandCombobox } from "./brand-combobox"
import { WebsiteCombobox } from "./website-combobox"
import { CashbackRewardCard } from "./cashback-reward-card"
import { RewardPointsCard } from "./reward-points-card"
import { GiftVouchersCard, type VoucherRow, emptyVoucher, totalVoucherSavings } from "./gift-vouchers-card"
import {
  computeEffectiveCost,
  computeEffectivePricePerGram,
  computePricePerGram,
  totalWeight,
} from "@/lib/calculations"
import {
  PURITIES,
  CATEGORIES,
  PAYMENT_METHODS,
  CASHBACK_STATUSES,
  REWARD_TYPES,
  type RewardType,
  type RewardComponentDTO,
  type PurchaseDTO,
} from "@/lib/types"
import { createPurchase, updatePurchase } from "@/app/actions/purchases"
import { useIsDemo } from "@/components/demo-mode-provider"

import type { PurchaseInput } from "@/lib/validation"

type RewardRow = {
  type: RewardType
  label: string
  amount: number
  quantity: number
  percentage: number
  expected: number
  received: number
  description: string
}

type FormState = {
  purchaseDate: string
  deliveredDate: string
  website: string
  merchant: string
  brand: string
  category: string
  purity: string
  weightGrams: number
  quantity: number
  purchasePrice: number
  remarks: string
  creditCard: string
  paymentMethod: string
  rewardStrategy: string
  rewardPercentage: number
  rewardPointsExpected: number
  rewardValue: number
  pointsPerMultiple: number
  pointsMultiple: number
  pointsBaseValue: number
  pointsTransferMultiplier: number
  pointsTransferPartner: string
  pointsPartnerValue: number
  pointsReceived: number
  pointsCreditedDate: string
  pointsStatus: string
  pointsVerified: boolean
  giftVoucherSavings: number
  superCoinsValue: number
  cashbackExpected: number
  cashbackReceived: number
  cashbackCreditedDate: string
  cashbackStatus: string
  verified: boolean
  notes: string
  tags: string
  // Jewellery-only breakdown (informational, stored in notes on save)
  jewelleryGoldValue: number
  jewelleryMakingCharges: number
  jewelleryWastage: number
  jewelleryGst: number
  // Purchase Price Breakdown (optional)
  listedPrice: number | null
  platformDiscount: number | null
  bankInstantDiscount: number | null
  // Platform Charges (optional)
  platformCharges: number | null
}

const today = () => new Date().toISOString().slice(0, 10)

function initState(p?: PurchaseDTO): FormState {
  return {
    purchaseDate: p?.purchaseDate ?? today(),
    deliveredDate: p?.deliveredDate ?? "",
    website: p?.website ?? "",
    merchant: p?.merchant ?? "",
    brand: p?.brand ?? "",
    category: p?.category ?? "Coin",
    purity: p?.purity ?? "999",
    weightGrams: p?.weightGrams ?? 1,
    quantity: p?.quantity ?? 1,
    purchasePrice: p?.purchasePrice ?? 0,
    remarks: p?.remarks ?? "",
    creditCard: p?.creditCard ?? "",
    // Backward compat: normalize legacy free-text paymentMethod values to
    // the structured enum. Rules:
    //   "Credit card" / "CC" / "Credit card " → "Credit Card"
    //   null + creditCard present             → infer "Credit Card"
    //   null + no creditCard                  → "" (blank, user must choose)
    //   "Cash", "UPI", "Net Banking"          → pass through unchanged
    paymentMethod: (() => {
      // New purchase (p is undefined) → default to Credit Card
      if (!p) return "Credit Card"
      const raw = p.paymentMethod?.trim() ?? ""
      if (!raw) return p.creditCard ? "Credit Card" : ""
      const lower = raw.toLowerCase()
      if (lower === "cc" || lower.startsWith("credit card")) return "Credit Card"
      if (lower.startsWith("debit card") || lower === "debit") return "Debit Card"
      return raw
    })(),
    rewardStrategy: p?.rewardStrategy ?? "",
    rewardPercentage: p?.rewardPercentage ?? 0,
    rewardPointsExpected: p?.rewardPointsExpected ?? 0,
    rewardValue: p?.rewardValue ?? 0,
    pointsPerMultiple: p?.pointsPerMultiple ?? 0,
    pointsMultiple: p?.pointsMultiple ?? 100,
    pointsBaseValue: p?.pointsBaseValue ?? 0,
    pointsTransferMultiplier: p?.pointsTransferMultiplier ?? 1,
    pointsTransferPartner: p?.pointsTransferPartner ?? "",
    pointsReceived: p?.pointsReceived ?? 0,
    pointsCreditedDate: p?.pointsCreditedDate ?? "",
    pointsStatus: p?.pointsStatus ?? "Pending",
    pointsVerified: p?.pointsVerified ?? false,
    giftVoucherSavings: p?.giftVoucherSavings ?? 0,
    superCoinsValue: p?.superCoinsValue ?? 0,
    cashbackExpected: p?.cashbackExpected ?? 0,
    cashbackReceived: p?.cashbackReceived ?? 0,
    cashbackCreditedDate: p?.cashbackCreditedDate ?? "",
    cashbackStatus: p?.cashbackStatus ?? "Pending",
    verified: p?.verified ?? false,
    // Backward compat: merge legacy `remarks` into `notes` so no data is lost.
    // If both are filled, append remarks after a newline separator.
    notes: (() => {
      const n = p?.notes?.trim() ?? ""
      const r = p?.remarks?.trim() ?? ""
      if (n && r) return `${n}\n${r}`
      return n || r
    })(),
    tags: (p?.tags ?? []).join(", "),
    jewelleryGoldValue: 0,
    jewelleryMakingCharges: 0,
    jewelleryWastage: 0,
    jewelleryGst: 0,
    listedPrice: p?.listedPrice ?? null,
    platformDiscount: p?.platformDiscount ?? null,
    bankInstantDiscount: p?.bankInstantDiscount ?? null,
    platformCharges: p?.platformCharges ?? null,
  }
}

export function PurchaseForm({
  purchase,
  initialComponents,
  forceCreate = false,
  }: {
  purchase?: PurchaseDTO
  initialComponents?: RewardComponentDTO[]
  forceCreate?: boolean
  }) {
  const router = useRouter()
  const currency = useCurrency()
  const isDemo = useIsDemo()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState<FormState>(() => initState(purchase))
  const [rewards, setRewards] = useState<RewardRow[]>(
    () =>
      initialComponents
        ?.filter((c) => c.type !== "GiftVoucher")
        .map((c) => ({
          type: c.type,
          label: c.label ?? "",
          amount: c.amount,
          quantity: c.quantity,
          percentage: c.percentage,
          expected: c.expected,
          received: c.received,
          description: c.description ?? "",
        })) ?? [],
  )

  const [vouchers, setVouchers] = useState<VoucherRow[]>(() =>
    initialComponents
      ?.filter((c) => c.type === "GiftVoucher")
      .map((c) => {
        const rewardType = (
          c.rewardType && c.rewardType !== "None"
            ? c.rewardType
            : c.expected > 0 && c.percentage > 0
            ? "Cashback"
            : "None"
        ) as "None" | "Cashback" | "RewardPoints"
        return {
          ...emptyVoucher(),
          label: c.label ?? "",
          faceValue: c.faceValue,
          amountPaid: c.amountPaid,
          cardUsed: c.cardUsed ?? "",
          rewardType,
          cashbackExpected: rewardType === "Cashback" ? c.expected : 0,
          cashbackReceived: c.received,
          cashbackPct: c.percentage,
          // RewardPoints fields
          pointsEarned: c.pointsEarned || 0,
          pointsPerMultiple: c.pointsPerMultiple || 0,
          pointsMultiple: c.pointsMultiple || 100,
          basePointValue: c.basePointValue || 0,
          transferMultiplier: c.transferMultiplier || 1,
          transferPartner: c.transferPartner ?? "",
          pointsValue: rewardType === "RewardPoints" ? c.expected : 0,
          cashbackStatus: c.pointsStatus ?? "Pending",
          cashbackVerified: c.pointsVerified ?? false,
        }
      }) ?? [],
  )

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const fmt = (v: number) => formatCurrency(v, currency)

  // Live derived values — gift voucher savings come from the voucher rows, not form.giftVoucherSavings
  const derived = useMemo(() => {
    const grams = totalWeight(form.weightGrams, form.quantity)
    const pricePerGram = computePricePerGram(form.purchasePrice, grams)
    const effectiveCost = computeEffectiveCost({
      ...form,
      giftVoucherSavings: totalVoucherSavings(vouchers),
    })
    const effectivePricePerGram = computeEffectivePricePerGram(effectiveCost, grams)
    return { grams, pricePerGram, effectiveCost, effectivePricePerGram }
  }, [form, vouchers])

  const addReward = () =>
    setRewards((r) => [
      ...r,
      { type: "Cashback", label: "", amount: 0, quantity: 0, percentage: 0, expected: 0, received: 0, description: "" },
    ])

  const updateReward = (i: number, patch: Partial<RewardRow>) =>
    setRewards((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))

  const removeReward = (i: number) => setRewards((r) => r.filter((_, idx) => idx !== i))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.weightGrams <= 0) {
      toast.error("Weight must be greater than 0")
      return
    }
    if (form.purchasePrice <= 0) {
      toast.error("Purchase price must be greater than 0")
      return
    }
    const payload: PurchaseInput = {
      assetType: "gold",
      purchaseDate: form.purchaseDate,
      deliveredDate: form.deliveredDate || null,
      website: form.website || null,
      merchant: form.merchant || null,
      brand: form.brand || null,
      category: form.category as "Coin" | "Bar" | "Jewellery",
      purity: form.purity,
      weightGrams: form.weightGrams,
      quantity: form.quantity,
      purchasePrice: form.purchasePrice,
      remarks: null, // deprecated — data migrated to notes in initState
      creditCard: form.creditCard || null,
      paymentMethod: form.paymentMethod || null,
      rewardStrategy: null, // deprecated — field removed from form
      rewardPercentage: form.rewardPercentage,
      rewardPointsExpected: form.rewardPointsExpected,
      rewardValue: form.rewardValue,
      pointsPerMultiple: form.pointsPerMultiple,
      pointsMultiple: form.pointsMultiple,
      pointsBaseValue: form.pointsBaseValue,
      pointsTransferMultiplier: form.pointsTransferMultiplier,
      pointsTransferPartner: form.pointsTransferPartner || null,
      pointsReceived: form.pointsReceived,
      pointsCreditedDate: form.pointsCreditedDate || null,
      pointsStatus: form.pointsStatus as "Pending" | "Credited" | "Missing",
      pointsVerified: form.pointsVerified,
      vouchers,
      giftVoucherSavings: totalVoucherSavings(vouchers),
      superCoinsValue: form.superCoinsValue,
      couponSavings: 0,
      cashbackExpected: form.cashbackExpected,
      cashbackReceived: form.cashbackReceived,
      cashbackCreditedDate: form.cashbackCreditedDate || null,
      cashbackStatus: form.cashbackStatus as "Pending" | "Credited" | "Missing",
      verified: form.verified,
      notes: (() => {
        const base = form.notes?.trim() ?? ""
        if (form.category !== "Jewellery") return base || null
        const gv = form.jewelleryGoldValue
        const mc = form.jewelleryMakingCharges
        const wa = form.jewelleryWastage
        const gs = form.jewelleryGst
        if (!gv && !mc && !wa && !gs) return base || null
        const breakdown = [
          gv ? `Gold value: ₹${gv}` : "",
          mc ? `Making charges: ₹${mc}` : "",
          wa ? `Wastage: ₹${wa}` : "",
          gs ? `GST/Taxes: ₹${gs}` : "",
        ].filter(Boolean).join(" | ")
        return base ? `${base}\n[Jewellery breakdown: ${breakdown}]` : `[Jewellery breakdown: ${breakdown}]`
      })(),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      listedPrice: form.listedPrice ?? null,
      platformDiscount: form.platformDiscount ?? null,
      bankInstantDiscount: form.bankInstantDiscount ?? null,
      platformCharges: form.platformCharges ?? null,
      rewardComponents: [
        // Gift vouchers as structured reward components
        ...vouchers.map((v) => ({
          type: "GiftVoucher" as const,
          label: v.label || null,
          amount: v.faceValue,
          quantity: 1,
          percentage: v.cashbackPct,
          expected: v.rewardType === "Cashback" ? v.cashbackExpected : v.rewardType === "RewardPoints" ? v.pointsValue : 0,
          received: v.cashbackReceived,
          description: v.transferPartner || v.cardUsed || null,
          faceValue: v.faceValue,
          amountPaid: v.amountPaid || v.faceValue,
          cardUsed: v.cardUsed || null,
          rewardType: v.rewardType ?? "None",
          // RewardPoints fields
          pointsEarned: v.pointsEarned,
          pointsPerMultiple: v.pointsPerMultiple,
          pointsMultiple: v.pointsMultiple,
          basePointValue: v.basePointValue,
          transferMultiplier: v.transferMultiplier,
          transferPartner: v.transferPartner || null,
          pointsStatus: v.pointsStatus ?? "Pending",
          pointsVerified: v.pointsVerified ?? false,
        })),
        // Other reward component rows
        ...rewards.map((r) => ({
          type: r.type,
          label: r.label || null,
          amount: r.amount,
          quantity: r.quantity,
          percentage: r.percentage,
          expected: r.expected,
          received: r.received,
          description: r.description || null,
          faceValue: 0,
          amountPaid: 0,
          cardUsed: null,
          rewardType: "None" as const,
          pointsEarned: 0,
          pointsPerMultiple: 0,
          pointsMultiple: 100,
          basePointValue: 0,
          transferMultiplier: 1,
          transferPartner: null,
          pointsStatus: "Pending",
          pointsVerified: false,
        })),
      ],
    }

    startTransition(async () => {
      try {
        if (purchase && !forceCreate) {
      await updatePurchase(purchase.id, payload)
      toast.success("Purchase updated")
    } else {
      await createPurchase(payload)
      toast.success("Purchase saved")
    }
        router.refresh()
        router.push("/purchases")
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong"
        toast.error(msg === "DEMO_READ_ONLY" ? "Demo account is read-only. Sign up for a free account to save data." : msg)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Feedback notice — only for brand-new purchases, not duplicates */}
      {!purchase && (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          We&apos;re simplifying how purchases are captured — your feedback is appreciated.{" "}
          <a
            href="mailto:feedback@example.com"
            className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
          >
            Share your thoughts.
          </a>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Purchase details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Purchase Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 divide-y divide-border">

              {/* Group 1: Store — Website · Brand */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-1 pb-4 sm:px-0">
                <p className="col-span-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pt-1">Store</p>
                <Field label="Website" htmlFor="website">
                  <WebsiteCombobox
                    value={form.website}
                    onChange={(v) => set("website", v)}
                    placeholder="e.g. Flipkart"
                  />
                </Field>
                <Field label="Brand" htmlFor="brand">
                  <BrandCombobox
                    value={form.brand}
                    onChange={(v) => set("brand", v)}
                    placeholder="e.g. Tanishq"
                  />
                </Field>
              </div>

              {/* Group 2: Item & Quantity — Category · Purity · Weight · Qty */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-1 py-4 sm:px-0 lg:grid-cols-4">
                <p className="col-span-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:col-span-4">Item & Quantity</p>
                <SelectField
                  label="Category"
                  value={form.category}
                  onChange={(v) => set("category", v)}
                  options={CATEGORIES}
                />
                <SelectField
                  label="Purity"
                  value={form.purity}
                  onChange={(v) => set("purity", v)}
                  options={PURITIES}
                />
                <NumberField
                  label="Weight (g) / unit"
                  value={form.weightGrams}
                  onChange={(v) => set("weightGrams", v)}
                  step="0.01"
                />
                <NumberField
                  label="Quantity"
                  value={form.quantity}
                  onChange={(v) => set("quantity", v)}
                  step="1"
                />
              </div>

              {/* Group 4: Transaction — Purchase Date · Price · Payment Method · Card */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-5 px-1 py-4 sm:px-0">
                <p className="col-span-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Transaction</p>
                <DateField
                  label="Purchase Date"
                  id="purchaseDate"
                  value={form.purchaseDate}
                  onChange={(v) => set("purchaseDate", v)}
                  required
                />
                <NumberField
                  label="Purchase Price (total)"
                  value={form.purchasePrice}
                  onChange={(v) => set("purchasePrice", v)}
                  step="0.01"
                />
                <SelectField
                  label="Payment Method"
                  value={form.paymentMethod}
                  onChange={(v) => {
                    set("paymentMethod", v)
                    if (v !== "Credit Card" && v !== "Debit Card") set("creditCard", "")
                  }}
                  options={[...PAYMENT_METHODS]}
                />
                {(form.paymentMethod === "Credit Card" || form.paymentMethod === "Debit Card") ? (
                  <Field
                    label={form.paymentMethod === "Debit Card" ? "Debit Card" : "Credit Card"}
                    htmlFor="creditCard"
                  >
                    <CardCombobox
                      value={form.creditCard}
                      onChange={(v) => set("creditCard", v)}
                      disabled={isDemo}
                      placeholder={form.paymentMethod === "Debit Card" ? "e.g. SBI Debit" : "e.g. HDFC Regalia"}
                    />
                  </Field>
                ) : (
                  <div />
                )}
              </div>

              {/* Jewellery breakdown — shown only for Jewellery */}
              {form.category === "Jewellery" && (
                <div className="py-4">
                <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Jewellery Breakdown{" "}
                    <span className="font-normal normal-case">(informational — stored in notes)</span>
                  </p>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {(
                      [
                        { key: "jewelleryGoldValue" as const,     label: "Gold Value (₹)" },
                        { key: "jewelleryMakingCharges" as const, label: "Making Charges (₹)" },
                        { key: "jewelleryWastage" as const,        label: "Wastage (₹)" },
                        { key: "jewelleryGst" as const,            label: "GST / Taxes (₹)" },
                      ] as const
                    ).map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <label htmlFor={key} className="text-xs font-medium text-muted-foreground">{label}</label>
                        <Input
                          id={key}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          value={form[key] || ""}
                          onChange={(e) => set(key, parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const total =
                      (form.jewelleryGoldValue || 0) +
                      (form.jewelleryMakingCharges || 0) +
                      (form.jewelleryWastage || 0) +
                      (form.jewelleryGst || 0)
                    if (!total) return null
                    const inr = (v: number) =>
                      new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v)
                    const diff = form.purchasePrice - total
                    return (
                      <p className="text-xs text-muted-foreground">
                        Breakdown total:{" "}
                        <span className="font-medium text-foreground">{inr(total)}</span>
                        {Math.abs(diff) > 1 && (
                          <span className={`ml-2 ${diff > 0 ? "text-destructive" : "text-chart-2"}`}>
                            ({diff > 0 ? "+" : ""}{inr(diff)} vs purchase price)
                          </span>
                        )}
                      </p>
                    )
                  })()}
                </div>
                </div>
              )}

              {/* Notes */}
              <div className="pt-4">
                <Field label="Notes" htmlFor="notes">
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    rows={2}
                    placeholder="Anything worth remembering"
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          {/* ── Purchase Price Breakdown (optional, collapsible) ─ */}
          <PriceBreakdownSection form={form} set={set} />

          {/* ── Payment & Rewards (unified) ───────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Rewards</CardTitle>
              <CardDescription>Track cashback, reward points or voucher savings from this purchase.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0 divide-y divide-border p-0">
              {/* Reward rows — collapsible */}
                {/* Cashback */}
                <RewardSection
                  title="Cashback"
                  description="Direct cashback credited to your account or statement."
                  hint="Use this if your credit card offers a % cashback on gold purchases. Track both the expected and received amounts to monitor if the cashback was actually credited."
                  badge={form.cashbackExpected > 0 ? `${fmt(form.cashbackExpected)} expected` : undefined}
                  defaultOpen={false}
                  nested
                >
                  <CashbackRewardCard
                    percentage={form.rewardPercentage}
                    expectedValue={form.cashbackExpected}
                    purchasePrice={form.purchasePrice}
                    cashbackCredited={form.cashbackReceived}
                    onPercentageChange={(v) => set("rewardPercentage", v)}
                    onExpectedChange={(v) => set("cashbackExpected", v)}
                    onCashbackCreditedChange={(v) => set("cashbackReceived", v)}
                  />
                </RewardSection>

                {/* Reward Points */}
                <RewardSection
                  title="Reward Points"
                  description="Credit card reward points earned on this purchase."
                  hint="Use this if your card earns reward points (not cashback). Enter the earning rate (e.g. 2 pts per ₹100), the base value per point, and optionally a transfer partner to calculate the effective ₹ value of the points earned."
                  badge={form.rewardValue > 0 ? `${fmt(form.rewardValue)} value` : form.rewardPointsExpected > 0 ? `${form.rewardPointsExpected.toLocaleString("en-IN")} pts` : undefined}
                  defaultOpen={false}
                  nested
                >
                  <RewardPointsCard
                    purchasePrice={form.purchasePrice}
                    pointsPerMultiple={form.pointsPerMultiple}
                    multiple={form.pointsMultiple}
                    effectiveMultiplier={form.pointsTransferMultiplier}
                    transferPartner={form.pointsTransferPartner}
                    basePointValue={form.pointsBaseValue}
                    pointsExpected={form.rewardPointsExpected}
                    rewardValue={form.rewardValue}
                    pointsReceived={form.pointsReceived}
                    pointsCreditedDate={form.pointsCreditedDate}
                    pointsStatus={form.pointsStatus}
                    pointsVerified={form.pointsVerified}
                    onPointsPerMultipleChange={(v) => set("pointsPerMultiple", v)}
                    onMultipleChange={(v) => set("pointsMultiple", v)}
                    onEffectiveMultiplierChange={(v) => set("pointsTransferMultiplier", v)}
                    onTransferPartnerChange={(v) => set("pointsTransferPartner", v)}
                    onBasePointValueChange={(v) => set("pointsBaseValue", v)}
                    onPointsExpectedChange={(v) => set("rewardPointsExpected", v)}
                    onRewardValueChange={(v) => set("rewardValue", v)}
                    onPointsReceivedChange={(v) => set("pointsReceived", v)}
                    onPointsCreditedDateChange={(v) => set("pointsCreditedDate", v)}
                    onPointsStatusChange={(v) => set("pointsStatus", v)}
                    onPointsVerifiedChange={(v) => set("pointsVerified", v)}
                  />
                </RewardSection>

                {/* Gift Vouchers & Savings */}
                <RewardSection
                  title="Gift Vouchers & Savings"
                  description="Vouchers, wallet credits, and SuperCoins used for this purchase."
                  hint="If you bought gift vouchers at a discount (e.g. 5% off on Amazon Pay via HDFC Smartbuy) and used them to pay, add them here. The face value minus what you paid becomes a saving."
                  badge={
                    totalVoucherSavings(vouchers) > 0 || form.superCoinsValue > 0
                      ? `${fmt(totalVoucherSavings(vouchers) + form.superCoinsValue)} savings`
                      : vouchers.length > 0
                      ? `${vouchers.length} voucher${vouchers.length > 1 ? "s" : ""}`
                      : undefined
                  }
                  defaultOpen={false}
                  nested
                >
                  <GiftVouchersCard
                    vouchers={vouchers}
                    superCoinsValue={form.superCoinsValue}
                    onVouchersChange={setVouchers}
                    onSuperCoinsChange={(v) => set("superCoinsValue", v)}
                  />
                </RewardSection>
            </CardContent>
          </Card>

        </div>

        {/* Sidebar: summary + tags */}
        <div className="space-y-6">
          <Card className="lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle className="text-base">Effective Cost</CardTitle>
              <CardDescription>Live calculation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SummaryRow label="Total Weight" value={`${derived.grams.toFixed(3)} g`} />
              <SummaryRow label="Purchase Price" value={fmt(form.purchasePrice)} />
              <SummaryRow label="Price / gram" value={fmt(derived.pricePerGram)} />
              <Separator />
              <SummaryRow label="Effective Cost" value={fmt(derived.effectiveCost)} strong />
              <SummaryRow
                label="Effective / gram"
                value={fmt(derived.effectivePricePerGram)}
                strong
              />
              <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                Effective cost = purchase price − voucher net savings (discount + card rewards) −
                supercoins − reward value − expected cashback.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Tags (comma separated)" htmlFor="tags">
                <Input
                  id="tags"
                  value={form.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  placeholder="Akshaya Tritiya, Festival Offer"
                />
              </Field>
              {form.tags.trim() && (
                <div className="flex flex-wrap gap-1.5">
                  {form.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {isDemo && (
          <p className="mr-auto text-xs text-muted-foreground">
            Read-only in demo mode — changes are disabled.
          </p>
        )}
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending || isDemo} title={isDemo ? "Read-only in demo mode" : undefined}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {purchase && !forceCreate ? "Save Changes" : "Add Purchase"}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  children,
  compact,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
  compact?: boolean
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <Label htmlFor={htmlFor} className={compact ? "text-xs" : undefined}>
          {label}
        </Label>
      )}
      {children}
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  step = "0.01",
  compact,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: string
  compact?: boolean
}) {
  return (
    <Field label={label} compact={compact}>
      <Input
        type="number"
        inputMode="decimal"
        step={step}
        min={0}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        onFocus={(e) => e.target.select()}
      />
    </Field>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  optionLabels,
  compact,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: readonly string[]
  optionLabels?: Record<string, string>
  compact?: boolean
}) {
  return (
    <Field label={label} compact={compact}>
      <Select value={value} onValueChange={(v) => onChange((v as string) ?? value)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {optionLabels?.[o] ?? o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function PriceBreakdownSection({
  form,
  set,
}: {
  form: FormState
  set: (key: keyof FormState, value: unknown) => void
}) {
  const [open, setOpen] = useState(false)
  const inr = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v)

  const listed = form.listedPrice ?? 0
  const pd = form.platformDiscount ?? 0
  const bd = form.bankInstantDiscount ?? 0
  const pc = form.platformCharges ?? 0
  const hasAny =
    form.listedPrice != null ||
    form.platformDiscount != null ||
    form.bankInstantDiscount != null ||
    form.platformCharges != null
  const derived = listed - pd - bd
  const total = derived + pc
  const diff = Math.abs(total - form.purchasePrice)
  const mismatch = (form.listedPrice != null || form.platformDiscount != null || form.bankInstantDiscount != null || form.platformCharges != null) && diff >= 1

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-muted/40 transition-colors rounded-xl"
        aria-expanded={open}
      >
        <div>
          <p className="text-base font-semibold">Purchase Price Breakdown</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Optional — refer to your invoice for filling this section.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasAny && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {form.listedPrice != null ? `${inr(listed)} listed` : "partial"}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <CardContent className="space-y-4 pt-0">
          {/* Mismatch warning */}
          {mismatch && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/8 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                Breakdown total <span className="font-semibold">{inr(total)}</span> does not match
                Purchase Price <span className="font-semibold">{inr(form.purchasePrice)}</span>
                {" "}(difference of <span className="font-semibold">{inr(diff)}</span>). You can still save.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Listed Price */}
            <div className="space-y-1">
              <label htmlFor="listedPrice" className="text-xs font-medium text-muted-foreground">
                Listed Price (₹)
              </label>
              <Input
                id="listedPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 152331"
                value={form.listedPrice ?? ""}
                onChange={(e) => set("listedPrice", e.target.value === "" ? null : parseFloat(e.target.value))}
              />
            </div>

            {/* Platform Discount */}
            <div className="space-y-1">
              <label htmlFor="platformDiscount" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                Platform Discount (₹)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="inline-flex">
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] text-xs">
                      Coupons, promo codes, SuperCoins applied at checkout
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <Input
                id="platformDiscount"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 8923"
                value={form.platformDiscount ?? ""}
                onChange={(e) => set("platformDiscount", e.target.value === "" ? null : parseFloat(e.target.value))}
              />
            </div>

            {/* Bank Instant Discount */}
            <div className="space-y-1">
              <label htmlFor="bankInstantDiscount" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                Bank Instant Discount (₹)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="inline-flex">
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] text-xs">
                      Bank or card instant discount applied at payment step
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <Input
                id="bankInstantDiscount"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 500"
                value={form.bankInstantDiscount ?? ""}
                onChange={(e) => set("bankInstantDiscount", e.target.value === "" ? null : parseFloat(e.target.value))}
              />
            </div>

            {/* Platform Charges */}
            <div className="space-y-1">
              <label htmlFor="platformCharges" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                Platform Charges (₹)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="inline-flex">
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px] text-xs">
                      Delivery, packaging, GST on services — charges unrelated to gold value
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </label>
              <Input
                id="platformCharges"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 199"
                value={form.platformCharges ?? ""}
                onChange={(e) => set("platformCharges", e.target.value === "" ? null : parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* Live summary */}
          {hasAny && (
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
              {listed > 0 && <span>Listed <span className="font-medium text-foreground">{inr(listed)}</span></span>}
              {pd > 0 && <span>− Platform discount <span className="font-medium text-foreground">{inr(pd)}</span></span>}
              {bd > 0 && <span>− Bank discount <span className="font-medium text-foreground">{inr(bd)}</span></span>}
              {pc > 0 && <span>+ Platform charges <span className="font-medium text-foreground">{inr(pc)}</span></span>}
              {listed > 0 && (
                <span className={`font-medium ${mismatch ? "text-amber-500" : "text-foreground"}`}>
                  = {inr(total)}
                </span>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function RewardSection({
  title,
  description,
  hint,
  badge,
  defaultOpen = true,
  nested = false,
  children,
}: {
  title: string
  description: string
  hint: string
  badge?: string
  defaultOpen?: boolean
  /** When true, renders flush (no outer border/radius) — use inside a parent Card */
  nested?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={nested ? "" : "rounded-xl border border-border bg-card overflow-hidden"}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        aria-expanded={open}
      >
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{title}</span>
            {badge && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {badge}
              </span>
            )}
          </div>
          {!open && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{description}</p>
          )}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-64 text-xs leading-relaxed">
              {hint}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border">
          {children}
        </div>
      )}
    </div>
  )
}



function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold text-foreground" : "text-foreground"}>{value}</span>
    </div>
  )
}
