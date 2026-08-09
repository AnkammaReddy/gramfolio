"use server"

import { db } from "@/lib/db"
import { account } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { hashPassword } from "better-auth/crypto"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

/**
 * User action to set their permanent password after receiving a temporary one from admin.
 * This clears the passwordIsTemporary flag.
 *
 * @param newPassword - The new password to set
 * @returns Success/error result
 */
export async function userSetPassword(newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    // Get current user session
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session || !session.user) {
      return { success: false, message: "Not authenticated" }
    }

    const userId = session.user.id

    // Validate password — same rules as signup
    if (!newPassword || newPassword.length < 8) {
      return { success: false, message: "Password must be at least 8 characters" }
    }
    if (!/[A-Z]/.test(newPassword)) {
      return { success: false, message: "Password must contain at least one uppercase letter" }
    }
    if (!/[0-9]/.test(newPassword)) {
      return { success: false, message: "Password must contain at least one number" }
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword)

    // Update account and clear temporary flag
    const result = await db
      .update(account)
      .set({
        password: hashedPassword,
        passwordIsTemporary: false,
        updatedAt: new Date(),
      })
      .where(eq(account.userId, userId))

    if (result.rowCount === 0) {
      return { success: false, message: "Account not found" }
    }

    return {
      success: true,
      message: "Password updated successfully",
    }
  } catch (error) {
    console.error("[set-password] Error:", error instanceof Error ? error.message : error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to set password",
    }
  }
}

/**
 * Server action to check if current user has a temporary password.
 * Used to determine if redirect to set-password page is needed.
 *
 * @returns { hasTemporaryPassword: boolean }
 */
export async function checkTemporaryPassword(): Promise<{ hasTemporaryPassword: boolean }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session || !session.user) {
      return { hasTemporaryPassword: false }
    }

    const userId = session.user.id

    const accountRecord = await db
      .select()
      .from(account)
      .where(eq(account.userId, userId))
      .limit(1)

    if (accountRecord.length === 0) {
      return { hasTemporaryPassword: false }
    }

    return {
      hasTemporaryPassword: accountRecord[0].passwordIsTemporary ?? false,
    }
  } catch (error) {
    console.error("[check-temp-password] Error:", error instanceof Error ? error.message : error)
    return { hasTemporaryPassword: false }
  }
}
