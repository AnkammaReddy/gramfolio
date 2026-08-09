"use server"

import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { headers } from "next/headers"

const DEMO_USER_ID = "demo-gramfolio-user"
const DEMO_MAX_SESSIONS = 10
const DEMO_SESSION_MINUTES = 15
const DEMO_RATE_LIMIT = 3        // max sign-ins per IP per hour
const DEMO_RATE_WINDOW_MINS = 60 // rolling window in minutes

/**
 * Called after the demo user signs in.
 * 1. Rate-limits by IP — max 3 sign-ins per IP per hour.
 * 2. Logs the sign-in (timestamp, IP, user agent).
 * 3. Sets the newest session to expire in 15 minutes.
 * 4. Trims sessions beyond the concurrent limit.
 */
export async function enforceDemoSessionLimit() {
  const hdrs = await headers()
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0].trim()
            ?? hdrs.get("x-real-ip")
            ?? "unknown"
  const userAgent = hdrs.get("user-agent") ?? null

  // Step 1: IP rate limit — count sign-ins from this IP in the last hour
  if (ip !== "unknown") {
    const countRows = await db.execute(
      sql`SELECT COUNT(*) AS cnt FROM demo_logins
          WHERE ip = ${ip}
            AND "createdAt" > now() - (${DEMO_RATE_WINDOW_MINS} * interval '1 minute')`,
    )
    const count = Number((countRows as unknown as { cnt: string }[])[0]?.cnt ?? 0)
    if (count >= DEMO_RATE_LIMIT) {
      throw new Error("Too many demo sign-ins from your network. Please try again in an hour.")
    }
  }

  // Step 2: Log this sign-in
  await db.execute(
    sql`INSERT INTO demo_logins (ip, "userAgent") VALUES (${ip}, ${userAgent})`,
  )

  // Step 3: Shorten the newest session to 15 minutes
  await db.execute(
    sql`UPDATE session
        SET "expiresAt" = now() + (${DEMO_SESSION_MINUTES} * interval '1 minute')
        WHERE "userId" = ${DEMO_USER_ID}
          AND "createdAt" = (
            SELECT MAX("createdAt") FROM session WHERE "userId" = ${DEMO_USER_ID}
          )`,
  )

  // Step 4: Trim sessions beyond the concurrent limit
  const rows = await db.execute(
    sql`SELECT id FROM session
        WHERE "userId" = ${DEMO_USER_ID} AND "expiresAt" > now()
        ORDER BY "createdAt" ASC`,
  )
  const sessions = rows as unknown as { id: string }[]
  if (sessions.length > DEMO_MAX_SESSIONS) {
    const toDelete = sessions
      .slice(0, sessions.length - DEMO_MAX_SESSIONS)
      .map((r) => r.id)
    await db.execute(
      sql`DELETE FROM session WHERE id = ANY(ARRAY[${sql.join(
        toDelete.map((id) => sql`${id}`),
        sql`, `,
      )}]::text[])`,
    )
  }
}

/**
 * Returns a summary of demo login activity for admin review.
 */
export async function getDemoLoginStats() {
  const result = await db.execute(
    sql`SELECT
          COUNT(*)                                          AS total_logins,
          COUNT(DISTINCT ip)                               AS unique_ips,
          COUNT(*) FILTER (WHERE "createdAt" > now() - interval '24 hours') AS last_24h,
          COUNT(*) FILTER (WHERE "createdAt" > now() - interval '7 days')   AS last_7d
        FROM demo_logins`,
  )
  // db.execute returns either a row array directly or { rows: [...] } depending
  // on the Drizzle driver — handle both shapes.
  const raw = result as unknown
  const row = (Array.isArray(raw) ? raw : (raw as { rows: unknown[] }).rows)?.[0] as {
    total_logins: string
    unique_ips: string
    last_24h: string
    last_7d: string
  } | undefined
  return {
    total_logins: row?.total_logins ?? "0",
    unique_ips:   row?.unique_ips   ?? "0",
    last_24h:     row?.last_24h     ?? "0",
    last_7d:      row?.last_7d      ?? "0",
  }
}
