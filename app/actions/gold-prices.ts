"use server"

import { db } from "@/lib/db"
import { goldPrices } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"
import { goldPriceSchema, type GoldPriceInput } from "@/lib/validation"
import { toGoldPriceDTO } from "@/lib/mappers"
import type { GoldPriceDTO } from "@/lib/types"

export const getGoldPrices = unstable_cache(
  async (): Promise<GoldPriceDTO[]> => {
    const rows = await db
      .select()
      .from(goldPrices)
      .orderBy(desc(goldPrices.priceDate))
    return rows.map(toGoldPriceDTO)
  },
  ["gold-prices"],
  { tags: ["gold-prices"], revalidate: 300 },
)

/** Latest 24K (999) price per gram, or 0 if none recorded. */
/** Returns the exact-date bullion price per gram for a given date and purity, or null if not recorded. */
export async function getBullionPriceForDate(
  date: string,
  purity = "999",
): Promise<number | null> {
  const rows = await db
    .select()
    .from(goldPrices)
    .where(
      and(
        eq(goldPrices.priceDate, date),
        eq(goldPrices.purity, purity),
      ),
    )
    .limit(1)
  return rows.length > 0 ? Number(rows[0].pricePerGram) : null
}

/** Returns the full price entry for a given date and purity, or null if not recorded. */
export async function getBullionEntryForDate(
  date: string,
  purity = "999",
): Promise<{ pricePerGram: number; source: string | null } | null> {
  const rows = await db
    .select()
    .from(goldPrices)
    .where(
      and(
        eq(goldPrices.priceDate, date),
        eq(goldPrices.purity, purity),
      ),
    )
    .limit(1)
  if (rows.length === 0) return null
  return {
    pricePerGram: Number(rows[0].pricePerGram),
    source: rows[0].source ?? null,
  }
}

export async function getLatestBullionPrice(purity = "999"): Promise<number> {
  const [row] = await db
    .select()
    .from(goldPrices)
    .where(eq(goldPrices.purity, purity))
    .orderBy(desc(goldPrices.priceDate))
    .limit(1)
  return row ? Number(row.pricePerGram) : 0
}

export async function upsertGoldPrice(input: GoldPriceInput) {
  const userId = await getUserId()
  const parsed = goldPriceSchema.parse(input)
  // Upsert on (priceDate, assetType, purity) — shared across all users
  const existing = await db
    .select()
    .from(goldPrices)
    .where(
      and(
        eq(goldPrices.priceDate, parsed.priceDate),
        eq(goldPrices.assetType, parsed.assetType),
        eq(goldPrices.purity, parsed.purity),
      ),
    )
  if (existing.length > 0) {
    await db
      .update(goldPrices)
      .set({
        pricePerGram: String(parsed.pricePerGram),
        source: parsed.source || null,
        remarks: parsed.remarks || null,
        userId, // track who last updated
      })
      .where(eq(goldPrices.id, existing[0].id))
  } else {
    await db.insert(goldPrices).values({
      userId,
      assetType: parsed.assetType,
      priceDate: parsed.priceDate,
      purity: parsed.purity,
      pricePerGram: String(parsed.pricePerGram),
      source: parsed.source || null,
      remarks: parsed.remarks || null,
    })
  }
  revalidateTag("gold-prices", "max")
  revalidatePath("/", "layout")
}

export async function deleteGoldPrice(id: number) {
  await db.delete(goldPrices).where(eq(goldPrices.id, id))
  revalidateTag("gold-prices", "max")
  revalidatePath("/", "layout")
}
