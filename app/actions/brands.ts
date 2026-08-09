"use server"

import { db } from "@/lib/db"
import { brands } from "@/lib/db/schema"
import { ilike, asc } from "drizzle-orm"

export async function getBrands(search?: string): Promise<string[]> {
  const rows = await db
    .select({ name: brands.name })
    .from(brands)
    .where(search ? ilike(brands.name, `%${search}%`) : undefined)
    .orderBy(asc(brands.name))
  return rows.map((r) => r.name)
}

export async function upsertBrand(name: string): Promise<void> {
  // Defense in depth: strip HTML tags, control chars, and leading formula chars
  const trimmed = name
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/^[=+\-@|]+/, "")
    .trim()
    .slice(0, 120)
  if (!trimmed) return
  await db
    .insert(brands)
    .values({ name: trimmed })
    .onConflictDoNothing()
}
