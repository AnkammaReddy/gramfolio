"use server"

import { hashPassword } from "better-auth/crypto"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { account, user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { z } from "zod"

const resetSchema = z.object({
  userId: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
})

async function requireAdmin(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  const [u] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1)
  if (!u || u.role !== "admin") throw new Error("Forbidden: admin only")
  return session.user.id
}

export async function adminResetUserPassword(
  userId: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin()

    const { userId: safeUserId, newPassword: safePassword } = resetSchema.parse({ userId, newPassword })

    const userExists = await db.select({ email: user.email }).from(user).where(eq(user.id, safeUserId)).limit(1)
    if (userExists.length === 0) {
      return { success: false, message: "User not found" }
    }

    const hashed = await hashPassword(safePassword)

    const existing = await db.select({ id: account.id }).from(account).where(eq(account.userId, safeUserId)).limit(1)

    if (existing.length > 0) {
      await db.update(account).set({ password: hashed, passwordIsTemporary: true, updatedAt: new Date() }).where(eq(account.userId, safeUserId))
    } else {
      await db.insert(account).values({ id: crypto.randomUUID(), userId: safeUserId, providerId: "credential", accountId: `${safeUserId}:credential`, password: hashed, passwordIsTemporary: true, createdAt: new Date(), updatedAt: new Date() })
    }

    return { success: true, message: `Password reset successfully` }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to reset password"
    if (msg === "Unauthorized" || msg === "Forbidden: admin only") {
      return { success: false, message: msg }
    }
    console.error("[admin-password-reset] Error:", msg)
    return { success: false, message: "Failed to reset password" }
  }
}

export async function adminResetMultiplePasswords(
  userIds: string[],
  newPassword: string,
): Promise<Array<{ userId: string; success: boolean; message: string }>> {
  // requireAdmin is called inside adminResetUserPassword for each entry
  const results = []
  for (const userId of userIds) {
    const result = await adminResetUserPassword(userId, newPassword)
    results.push({ userId, success: result.success, message: result.message })
  }
  return results
}
