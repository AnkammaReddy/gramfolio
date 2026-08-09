"use server"

import { verifyPassword } from "better-auth/crypto"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { account, user, userSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { assertNotDemo } from "@/lib/auth-config"

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

/**
 * Permanently deletes the current user's account.
 *
 * Hard-deletes: user, account (credentials), session (both cascade via FK on
 * `user.id`), and userSettings (preferences — no longer needed once the
 * identity is gone).
 *
 * Kept as-is (not owned by the identity, preserved for records/community):
 * purchases, goldPrices, rewardComponents, feedback, insightReactions.
 */
export async function deleteAccount(password: string) {
  const userId = await getUserId()
  assertNotDemo(userId)

  if (!password) {
    throw new Error("Password is required to delete your account")
  }

  const [acct] = await db
    .select({ password: account.password })
    .from(account)
    .where(eq(account.userId, userId))

  if (!acct?.password) {
    throw new Error("Unable to verify password for this account")
  }

  const valid = await verifyPassword({ hash: acct.password, password })
  if (!valid) {
    throw new Error("Incorrect password")
  }

  // Preferences are tied 1:1 to the identity — clean these up explicitly.
  await db.delete(userSettings).where(eq(userSettings.userId, userId))

  // Deleting the user row cascades to `account` and `session` via FK
  // (onDelete: "cascade"). Purchases, goldPrices, rewardComponents,
  // feedback, and insightReactions are intentionally left untouched.
  await db.delete(user).where(eq(user.id, userId))

  return { success: true }
}
