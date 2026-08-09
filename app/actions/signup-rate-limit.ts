"use server"

import { headers } from "next/headers"
import { pool } from "@/lib/db"

const MAX_ATTEMPTS = 2
const WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

function getIp(hdrs: Awaited<ReturnType<typeof headers>>): string {
  return (
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ||
    hdrs.get("x-real-ip") ||
    "unknown"
  )
}

export async function checkSignupRateLimit(): Promise<{ allowed: boolean; message?: string }> {
  const hdrs = await headers()
  const ip = getIp(hdrs)

  // Never rate-limit in development / sandbox
  if (ip === "unknown" || ip === "::1" || ip === "127.0.0.1") {
    return { allowed: true }
  }

  const client = await pool.connect()
  try {
    const windowStart = new Date(Date.now() - WINDOW_MS).toISOString()

    const { rows } = await client.query<{ id: number; attempts: number }>(
      `SELECT id, attempts FROM signup_rate_limit
       WHERE ip = $1 AND window_start > $2
       ORDER BY window_start DESC LIMIT 1`,
      [ip, windowStart],
    )

    if (rows.length === 0) {
      // First attempt from this IP today — insert a new row
      await client.query(
        `INSERT INTO signup_rate_limit (ip, attempts, window_start) VALUES ($1, 1, NOW())`,
        [ip],
      )
      return { allowed: true }
    }

    const row = rows[0]

    if (row.attempts >= MAX_ATTEMPTS) {
      return {
        allowed: false,
        message: `Too many sign-up attempts from your location. Please try again after 24 hours.`,
      }
    }

    // Increment attempt count
    await client.query(
      `UPDATE signup_rate_limit SET attempts = attempts + 1 WHERE id = $1`,
      [row.id],
    )
    return { allowed: true }
  } finally {
    client.release()
  }
}
