"use server"

import { verifyPassword } from "better-auth/crypto"
import { db } from "@/lib/db"
import { account, session, user, userSettings, securityLogs, conversations, messages } from "@/lib/db/schema"
import { and, eq, inArray, isNotNull } from "drizzle-orm"
import { headers } from "next/headers"
import { assertNotDemo } from "@/lib/auth-config"
import { getSession } from "@/lib/session"

async function getClientIp(): Promise<string> {
  const hdrs = await headers()
  return (
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ||
    hdrs.get("x-real-ip") ||
    "unknown"
  )
}

async function logSecurityEvent(
  eventType: "account_delete_attempt" | "account_delete_success" | "account_delete_failed",
  email: string,
  ipAddress: string,
  details: Record<string, string | number> = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx?: any,
): Promise<void> {
  const safeEmail = (email || "unknown").toLowerCase().trim() || "unknown"
  console.error(
    "[SECURITY_LOG]",
    JSON.stringify({ eventType, email: safeEmail, ipAddress, details, timestamp: new Date().toISOString() }),
  )
  try {
    const client = tx ?? db
    await client.insert(securityLogs).values({
      eventType,
      email: safeEmail,
      ipAddress,
      details,
    })
  } catch (err) {
    console.error("[SECURITY_LOG_DB_ERROR]", err)
  }
}

/**
 * Permanently deletes the current user's login identity.
 *
 * Hard-deletes: session, account, user_settings (optional), user, conversations, messages
 * Retains with orphan userId: purchases and related portfolio rows
 */
export async function deleteAccount(password: string) {
  const ip = await getClientIp()
  const authSession = await getSession()

  if (!authSession?.user) {
    await logSecurityEvent("account_delete_failed", "unknown", ip, { reason: "unauthorized" })
    throw new Error("Unauthorized")
  }

  const userId = authSession.user.id
  const email = authSession.user.email ?? "unknown"

  await logSecurityEvent("account_delete_attempt", email, ip, { userId })

  try {
    assertNotDemo(userId)
  } catch {
    await logSecurityEvent("account_delete_failed", email, ip, { reason: "demo_read_only", userId })
    throw new Error("DEMO_READ_ONLY")
  }

  if (!password) {
    await logSecurityEvent("account_delete_failed", email, ip, { reason: "password_required", userId })
    throw new Error("Password is required to delete your account")
  }

  // Password lives on the account row that has a hash — no separate credentials provider.
  const [acct] = await db
    .select({ password: account.password })
    .from(account)
    .where(and(eq(account.userId, userId), isNotNull(account.password)))
    .limit(1)

  if (!acct?.password) {
    await logSecurityEvent("account_delete_failed", email, ip, { reason: "no_password_hash", userId })
    throw new Error("Unable to verify password for this account")
  }

  const valid = await verifyPassword({ hash: acct.password, password })
  if (!valid) {
    await logSecurityEvent("account_delete_failed", email, ip, { reason: "incorrect_password", userId })
    throw new Error("Incorrect password")
  }

  // Success log + hard-deletes in one transaction so the audit row cannot be lost.
  await db.transaction(async (tx) => {
    await logSecurityEvent("account_delete_success", email, ip, { userId }, tx)
    const convRows = await tx
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.userId, userId))
    const convIds = convRows.map((c) => c.id)
    if (convIds.length > 0) {
      await tx.delete(messages).where(inArray(messages.conversationId, convIds))
    }
    await tx.delete(conversations).where(eq(conversations.userId, userId))
    await tx.delete(session).where(eq(session.userId, userId))
    await tx.delete(account).where(eq(account.userId, userId))
    await tx.delete(userSettings).where(eq(userSettings.userId, userId))
    await tx.delete(user).where(eq(user.id, userId))
  })

  return { success: true }
}
