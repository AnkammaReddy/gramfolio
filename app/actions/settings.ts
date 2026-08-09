"use server"

import { db } from "@/lib/db"
import { userSettings } from "@/lib/db/schema"
import { getUserId } from "@/lib/session"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { settingsSchema, type SettingsInput } from "@/lib/validation"
import { assertNotDemo } from "@/lib/auth-config"
import { toSettingsDTO } from "@/lib/mappers"
import type { SettingsDTO } from "@/lib/types"

const DEFAULTS: SettingsDTO = {
  currency: "INR",
  graphMode: "effective",
  defaultDateRange: "1y",
  theme: "system",
  displayName: null,
}

export async function getSettings(): Promise<SettingsDTO> {
  const userId = await getUserId()
  const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, userId))
  return row ? toSettingsDTO(row) : DEFAULTS
}

export async function saveSettings(input: Partial<SettingsInput>) {
  const userId = await getUserId()
  assertNotDemo(userId)
  const current = await getSettings()
  const parsed = settingsSchema.parse({ ...current, ...input })
  const [existing] = await db.select().from(userSettings).where(eq(userSettings.userId, userId))
  if (existing) {
    await db
      .update(userSettings)
      .set({ ...parsed, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId))
  } else {
    await db.insert(userSettings).values({ userId, ...parsed })
  }
  revalidatePath("/", "layout")
}

/** Lightweight persistence for the graph-mode toggle. */
export async function setGraphMode(mode: "purchase" | "effective") {
  await saveSettings({ graphMode: mode })
}
