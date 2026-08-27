import "server-only"

import { headers } from "next/headers"
import { db, pool } from "@/lib/db"
import { securityLogs, user } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

const MEMBER_MAX_SENDS = 30
const ADMIN_MAX_SENDS = 120
const SEND_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function getClientIp(hdrs: Awaited<ReturnType<typeof headers>>): string {
  return (
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ||
    hdrs.get("x-real-ip") ||
    "unknown"
  )
}

function isLocalIp(ip: string): boolean {
  return ip === "unknown" || ip === "::1" || ip === "127.0.0.1"
}

async function logMessageSecurityEvent(
  eventType: "message_send" | "message_rate_limit" | "message_blocked_banned",
  email: string,
  ip: string,
  details: Record<string, string | number> = {},
): Promise<void> {
  console.error(
    "[SECURITY_LOG]",
    JSON.stringify({
      eventType,
      email,
      ipAddress: ip,
      details,
      timestamp: new Date().toISOString(),
    }),
  )

  try {
    await db.insert(securityLogs).values({
      eventType,
      email,
      ipAddress: ip,
      details,
    })
  } catch (err) {
    console.error("[SECURITY_LOG_DB_ERROR]", err)
  }
}

export async function assertUserCanUseMessages(userId: string): Promise<void> {
  const hdrs = await headers()
  const ip = getClientIp(hdrs)

  const rows = await db.execute<{ banned: boolean }>(
    sql`SELECT COALESCE(banned, false) AS banned FROM "user" WHERE id = ${userId} LIMIT 1`,
  )
  const banned = Boolean((rows as unknown as { banned: boolean }[])[0]?.banned)
  if (banned) {
    const [u] = await db.select({ email: user.email }).from(user).where(eq(user.id, userId)).limit(1)
    await logMessageSecurityEvent("message_blocked_banned", u?.email ?? userId, ip, { userId })
    throw new Error("Forbidden")
  }
}

export async function checkMessageSendRateLimit(
  userId: string,
  role: "member" | "admin",
): Promise<void> {
  const hdrs = await headers()
  const ip = getClientIp(hdrs)
  if (isLocalIp(ip)) return

  const maxAttempts = role === "admin" ? ADMIN_MAX_SENDS : MEMBER_MAX_SENDS
  const rateKey = `msg:${role}:${userId}`
  const windowStart = new Date(Date.now() - SEND_WINDOW_MS).toISOString()

  const client = await pool.connect()
  try {
    const { rows } = await client.query<{ id: number; attempts: number }>(
      `SELECT id, attempts FROM signup_rate_limit
       WHERE ip = $1 AND window_start > $2
       ORDER BY window_start DESC LIMIT 1`,
      [rateKey, windowStart],
    )

    if (rows.length === 0) {
      await client.query(
        `INSERT INTO signup_rate_limit (ip, attempts, window_start) VALUES ($1, 1, NOW())`,
        [rateKey],
      )
      return
    }

    if (rows[0].attempts >= maxAttempts) {
      const [u] = await db.select({ email: user.email }).from(user).where(eq(user.id, userId)).limit(1)
      await logMessageSecurityEvent("message_rate_limit", u?.email ?? userId, ip, {
        userId,
        role,
        attempts: rows[0].attempts,
      })
      throw new Error("RATE_LIMIT")
    }

    await client.query(`UPDATE signup_rate_limit SET attempts = attempts + 1 WHERE id = $1`, [
      rows[0].id,
    ])
  } finally {
    client.release()
  }
}

export async function logMessageSent(
  userId: string,
  role: "member" | "admin",
  conversationId: number,
): Promise<void> {
  const hdrs = await headers()
  const ip = getClientIp(hdrs)
  const [u] = await db.select({ email: user.email }).from(user).where(eq(user.id, userId)).limit(1)
  await logMessageSecurityEvent("message_send", u?.email ?? userId, ip, {
    userId,
    role,
    conversationId,
  })
}
