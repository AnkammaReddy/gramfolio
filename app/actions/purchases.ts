"use server"

import { db } from "@/lib/db"
import { purchases, rewardComponents } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath, revalidateTag } from "next/cache"
import { purchaseSchema, type PurchaseInput } from "@/lib/validation"
import {
  computeEffectiveCost,
  computeEffectivePricePerGram,
  computePricePerGram,
  totalWeight,
} from "@/lib/calculations"
import { toPurchaseDTO, toRewardDTO } from "@/lib/mappers"
import type { PurchaseDTO, RewardComponentDTO } from "@/lib/types"
import { upsertCreditCard } from "./credit-cards"
import { upsertBrand } from "./brands"
import { assertNotDemo } from "@/lib/auth-config"

function derive(input: PurchaseInput) {
  const gramsTotal = totalWeight(input.weightGrams, input.quantity)
  const pricePerGram = computePricePerGram(input.purchasePrice, gramsTotal)
  const effectiveCost = computeEffectiveCost(input)
  const effectivePricePerGram = computeEffectivePricePerGram(effectiveCost, gramsTotal)
  return { pricePerGram, effectiveCost, effectivePricePerGram }
}

function toRow(input: PurchaseInput, userId: string) {
  const { pricePerGram, effectiveCost, effectivePricePerGram } = derive(input)
  return {
    userId,
    assetType: input.assetType,
    purchaseDate: input.purchaseDate,
    deliveredDate: input.deliveredDate || null,
    website: input.website || null,
    merchant: input.merchant || null,
    brand: input.brand || null,
    category: input.category,
    purity: input.purity,
    weightGrams: String(input.weightGrams),
    quantity: input.quantity,
    purchasePrice: String(input.purchasePrice),
    pricePerGram: String(pricePerGram),
    remarks: input.remarks || null,
    creditCard: input.creditCard || null,
    paymentMethod: input.paymentMethod || null,
    rewardStrategy: input.rewardStrategy || null,
    rewardPercentage: String(input.rewardPercentage),
    rewardPointsExpected: String(input.rewardPointsExpected),
    rewardValue: String(input.rewardValue),
    pointsPerMultiple: String(input.pointsPerMultiple ?? 0),
    pointsMultiple: String(input.pointsMultiple ?? 100),
    pointsBaseValue: String(input.pointsBaseValue ?? 0),
    pointsTransferMultiplier: String(input.pointsTransferMultiplier ?? 1),
    pointsTransferPartner: input.pointsTransferPartner || null,
    pointsReceived: String(input.pointsReceived ?? 0),
    pointsCreditedDate: input.pointsCreditedDate || null,
    pointsStatus: input.pointsStatus ?? "Pending",
    pointsVerified: input.pointsVerified ?? false,
    giftVoucherSavings: String(input.giftVoucherSavings),
    vouchersJson: input.vouchers && input.vouchers.length > 0 ? JSON.stringify(input.vouchers) : null,
    superCoinsValue: String(input.superCoinsValue),
    couponSavings: String(input.couponSavings),
    cashbackExpected: String(input.cashbackExpected),
    cashbackReceived: String(input.cashbackReceived),
    effectiveCost: String(effectiveCost),
    effectivePricePerGram: String(effectivePricePerGram),
    cashbackCreditedDate: input.cashbackCreditedDate || null,
    cashbackStatus: input.cashbackStatus,
    verified: input.verified,
    notes: input.notes || null,
    tags: input.tags ?? [],
    listedPrice: input.listedPrice != null ? String(input.listedPrice) : null,
    platformDiscount: input.platformDiscount != null ? String(input.platformDiscount) : null,
    bankInstantDiscount: input.bankInstantDiscount != null ? String(input.bankInstantDiscount) : null,
    platformCharges: input.platformCharges != null ? String(input.platformCharges) : null,
    updatedAt: new Date(),
  }
}

async function saveRewardComponents(
  userId: string,
  purchaseId: number,
  components: PurchaseInput["rewardComponents"],
) {
  await db
    .delete(rewardComponents)
    .where(and(eq(rewardComponents.userId, userId), eq(rewardComponents.purchaseId, purchaseId)))
  if (components.length === 0) return
  await db.insert(rewardComponents).values(
    components.map((c) => ({
      userId,
      purchaseId,
      type: c.type,
      label: c.label || null,
      amount: String(c.amount),
      quantity: String(c.quantity),
      percentage: String(c.percentage),
      expected: String(c.expected),
      received: String(c.received),
      description: c.description || null,
      faceValue: String(c.faceValue ?? 0),
      amountPaid: String(c.amountPaid ?? 0),
      cardUsed: c.cardUsed || null,
      rewardType: c.rewardType || "None",
      // RewardPoints fields
      pointsEarned: String(c.pointsEarned ?? 0),
      pointsPerMultiple: String(c.pointsPerMultiple ?? 0),
      pointsMultiple: String(c.pointsMultiple ?? 100),
      basePointValue: String(c.basePointValue ?? 0),
      transferMultiplier: String(c.transferMultiplier ?? 1),
      transferPartner: c.transferPartner || null,
      pointsStatus: c.pointsStatus || "Pending",
      pointsVerified: c.pointsVerified ?? false,
    })),
  )
}

export async function getPurchases(): Promise<PurchaseDTO[]> {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(purchases)
    .where(eq(purchases.userId, userId))
    .orderBy(desc(purchases.purchaseDate), desc(purchases.id))
  return rows.map(toPurchaseDTO)
}

export async function getPurchase(
  id: number,
): Promise<{ purchase: PurchaseDTO; components: RewardComponentDTO[] } | null> {
  const userId = await getUserId()
  const [row] = await db
    .select()
    .from(purchases)
    .where(and(eq(purchases.id, id), eq(purchases.userId, userId)))
  if (!row) return null
  const comps = await db
    .select()
    .from(rewardComponents)
    .where(and(eq(rewardComponents.userId, userId), eq(rewardComponents.purchaseId, id)))
  return { purchase: toPurchaseDTO(row), components: comps.map(toRewardDTO) }
}

export async function getRewardComponents(): Promise<RewardComponentDTO[]> {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(rewardComponents)
    .where(eq(rewardComponents.userId, userId))
  return rows.map(toRewardDTO)
}

async function bustPurchasesCache(userId: string) {
  revalidateTag(`purchases-${userId}`, "max")
  revalidatePath("/dashboard")
  revalidatePath("/purchases")
  revalidatePath("/analytics")
  revalidatePath("/", "layout")
}

export async function refreshPurchasesCache() {
  const userId = await getUserId()
  await bustPurchasesCache(userId)
  return { success: true }
}

export async function recalculateAllRewardPoints() {
  const userId = await getUserId()
  
  // Get all purchases for this user
  const allPurchases = await db
    .select()
    .from(purchases)
    .where(eq(purchases.userId, userId))
  
  // Recalculate and update each purchase
  for (const p of allPurchases) {
    if (p.purchasePrice && p.pointsMultiple && p.pointsPerMultiple) {
      const rewardPointsExpected = Math.floor(Number(p.purchasePrice) / Number(p.pointsMultiple)) * Number(p.pointsPerMultiple)
      const rewardValue = rewardPointsExpected * Number(p.pointsBaseValue || 0) * Number(p.pointsTransferMultiplier || 1)
      
      await db
        .update(purchases)
        .set({ 
          rewardPointsExpected: String(rewardPointsExpected),
          rewardValue: String(rewardValue),
          updatedAt: new Date()
        })
        .where(eq(purchases.id, p.id))
    }
  }
  
  await bustPurchasesCache(userId)
  return { success: true, updated: allPurchases.length }
}

export async function createPurchase(input: PurchaseInput) {
  const userId = await getUserId()
  assertNotDemo(userId)
  const parsed = purchaseSchema.parse(input)
  const [row] = await db.insert(purchases).values(toRow(parsed, userId)).returning({ id: purchases.id })
  await saveRewardComponents(userId, row.id, parsed.rewardComponents)
  if (parsed.creditCard) await upsertCreditCard(parsed.creditCard)
  if (parsed.brand) await upsertBrand(parsed.brand)
  await bustPurchasesCache(userId)
  return { id: row.id }
}

export async function updatePurchase(id: number, input: PurchaseInput) {
  const userId = await getUserId()
  assertNotDemo(userId)
  const parsed = purchaseSchema.parse(input)
  if (parsed.creditCard) await upsertCreditCard(parsed.creditCard)
  if (parsed.brand) await upsertBrand(parsed.brand)
  await db
    .update(purchases)
    .set(toRow(parsed, userId))
    .where(and(eq(purchases.id, id), eq(purchases.userId, userId)))
  await saveRewardComponents(userId, id, parsed.rewardComponents)
  await bustPurchasesCache(userId)
  return { id }
}

export async function deletePurchase(id: number) {
  const userId = await getUserId()
  assertNotDemo(userId)
  await db
    .delete(rewardComponents)
    .where(and(eq(rewardComponents.userId, userId), eq(rewardComponents.purchaseId, id)))
  await db.delete(purchases).where(and(eq(purchases.id, id), eq(purchases.userId, userId)))
  await bustPurchasesCache(userId)
}

export async function markCashbackVerified(id: number, verified: boolean) {
  const userId = await getUserId()
  await db
    .update(purchases)
    .set({ verified, updatedAt: new Date() })
    .where(and(eq(purchases.id, id), eq(purchases.userId, userId)))
  await bustPurchasesCache(userId)
}

export async function updateCashbackStatus(
  id: number,
  status: "Pending" | "Credited" | "Missing",
  received?: number,
  creditedDate?: string | null,
) {
  const userId = await getUserId()

  // Fetch the row so we can recalculate effectiveCost with the new status.
  // "Missing" (Not Credited) must not deduct cashbackExpected from effective cost.
  const [row] = await db
    .select()
    .from(purchases)
    .where(and(eq(purchases.id, id), eq(purchases.userId, userId)))
    .limit(1)

  const set: Record<string, unknown> = { cashbackStatus: status, updatedAt: new Date() }

  if (status === "Pending" || status === "Missing") {
    // Wipe received when moving back to Pending or marking as Missing
    set.cashbackReceived = "0"
    set.cashbackCreditedDate = null
  }

  if (status === "Credited") {
    if (typeof received === "number") set.cashbackReceived = String(received)
    if (creditedDate !== undefined) set.cashbackCreditedDate = creditedDate
  }

  if (row) {
    // For effective cost:
    // - Pending: use cashbackExpected (optimistic)
    // - Credited: use actual cashbackReceived (what really landed)
    // - Missing: 0 (never received)
    const actualReceived = status === "Credited"
      ? (typeof received === "number" ? received : Number(row.cashbackReceived ?? 0))
      : 0
    const cashbackForCost = status === "Pending"
      ? Number(row.cashbackExpected ?? 0)
      : status === "Credited"
      ? actualReceived
      : 0

    const effectiveCost = computeEffectiveCost({
      purchasePrice: Number(row.purchasePrice),
      giftVoucherSavings: Number(row.giftVoucherSavings ?? 0),
      superCoinsValue: Number(row.superCoinsValue ?? 0),
      rewardValue: Number(row.rewardValue ?? 0),
      cashbackExpected: cashbackForCost,
      cashbackStatus: "Pending", // always "apply" the above computed amount
    })
    const gramsTotal = totalWeight(Number(row.weightGrams), Number(row.quantity ?? 1))
    set.effectiveCost = String(effectiveCost)
    set.effectivePricePerGram = String(computeEffectivePricePerGram(effectiveCost, gramsTotal))
  }

  await db
    .update(purchases)
    .set(set)
    .where(and(eq(purchases.id, id), eq(purchases.userId, userId)))
  await bustPurchasesCache(userId)
}

export async function markRewardPointsVerified(id: number, verified: boolean) {
  const userId = await getUserId()
  await db
    .update(purchases)
    .set({ pointsVerified: verified, updatedAt: new Date() })
    .where(and(eq(purchases.id, id), eq(purchases.userId, userId)))
  await bustPurchasesCache(userId)
}

export async function updateRewardPointsStatus(
  id: number,
  status: "Pending" | "Credited" | "Not Credited" | "Redeemed",
  received?: number,
  creditedDate?: string | null,
) {
  const userId = await getUserId()
  const set: Record<string, unknown> = { pointsStatus: status, updatedAt: new Date() }

  if (status === "Pending" || status === "Not Credited") {
    // Wipe received when moving back to Pending or marking Not Credited
    set.pointsReceived = "0"
    set.pointsCreditedDate = null
  }

  if (status === "Credited") {
    if (typeof received === "number") set.pointsReceived = String(received)
    if (creditedDate !== undefined) set.pointsCreditedDate = creditedDate
  }

  await db
    .update(purchases)
    .set(set)
    .where(and(eq(purchases.id, id), eq(purchases.userId, userId)))
  await bustPurchasesCache(userId)
}

/**
 * Fetches an existing purchase to use as a template for duplication.
 * Returns the purchase and its reward components so the form can be
 * pre-filled. The caller is responsible for resetting date/price fields.
 */
export async function getPurchaseForDuplicate(
  id: number,
): Promise<{ purchase: PurchaseDTO; components: RewardComponentDTO[] } | null> {
  return getPurchase(id)
}

/** Bulk insert from CSV import (already validated client-side via the same schema). */
export async function bulkCreatePurchases(inputs: PurchaseInput[]) {
  const userId = await getUserId()
  assertNotDemo(userId)
  let count = 0
  for (const raw of inputs) {
    const parsed = purchaseSchema.parse(raw)
    const [row] = await db.insert(purchases).values(toRow(parsed, userId)).returning({ id: purchases.id })
    await saveRewardComponents(userId, row.id, parsed.rewardComponents)
    count++
  }
  await bustPurchasesCache(userId)
  return { count }
}
