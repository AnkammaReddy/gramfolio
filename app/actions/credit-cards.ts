"use server"

import { db } from "@/lib/db"
import { creditCards } from "@/lib/db/schema"
import { ilike, asc } from "drizzle-orm"

/** Returns all globally shared credit cards, optionally filtered by search term. */
export async function getCreditCards(search?: string): Promise<string[]> {
  const rows = await db
    .select({ name: creditCards.name })
    .from(creditCards)
    .where(search ? ilike(creditCards.name, `%${search}%`) : undefined)
    .orderBy(asc(creditCards.name))
  return rows.map((r) => r.name)
}

/**
 * Upserts a card name into the global library.
 * Called automatically when a purchase is saved with a credit card value.
 */
export async function upsertCreditCard(name: string): Promise<void> {
  const trimmed = name.trim()
  if (!trimmed) return
  await db
    .insert(creditCards)
    .values({ name: trimmed })
    .onConflictDoNothing()
}
