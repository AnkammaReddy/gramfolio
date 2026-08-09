import { unstable_noStore as noStore } from "next/cache"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sql } from "drizzle-orm"
import { AUTH_DISABLED, DEMO_USER } from "@/lib/auth-config"
import { SessionsClient } from "./sessions-client"

export default async function AdminSessionsPage() {
  noStore()

  if (!AUTH_DISABLED) {
    const sessionData = await auth.api.getSession({ headers: await headers() })
    if (!sessionData?.user) redirect("/sign-in")
    const [u] = await db.select({ role: user.role }).from(user).where(eq(user.id, sessionData.user.id))
    if (!u || u.role !== "admin") redirect("/dashboard")
  }

  // KPI stats
  // Better Auth updates "updatedAt" on every authenticated request — use it for
  // real "active now" (last 30 min). "expiresAt" is used for total live sessions.
  const kpiRows = await db.execute(sql`
    SELECT
      COUNT(DISTINCT s."userId")
        FILTER (WHERE GREATEST(s."updatedAt", s."createdAt") > now() - interval '2 hours'
              AND s."expiresAt" > now())                                            AS active_now,
      COUNT(DISTINCT s."userId")
        FILTER (WHERE DATE(s."createdAt" AT TIME ZONE 'UTC') = CURRENT_DATE)        AS logged_in_today,
      COUNT(DISTINCT s."userId")
        FILTER (WHERE s."updatedAt" > now() - interval '7 days'
              AND s."expiresAt" > now())                                            AS active_this_week,
      COUNT(*)
        FILTER (WHERE s."expiresAt" > now())                                        AS total_active_sessions
    FROM session s
  `)
  const kpi = (Array.isArray(kpiRows) ? kpiRows : (kpiRows as { rows: unknown[] }).rows)[0] as {
    active_now: string
    logged_in_today: string
    active_this_week: string
    total_active_sessions: string
  }

  // Per-user session summary — active sessions only
  const userSessionRows = await db.execute(sql`
    SELECT
      u.id,
      u.name,
      u.email,
      u.banned,
      COUNT(s.id)                                                             AS session_count,
      MIN(s."createdAt")                                                      AS first_session,
      MAX(s."updatedAt")                                                      AS last_active,
      MAX(s."expiresAt")                                                      AS expires_at,
      MAX(s."ipAddress")                                                      AS last_ip,
      BOOL_OR(GREATEST(s."updatedAt", s."createdAt") > now() - interval '2 hours')  AS is_active_now,
      BOOL_OR(DATE(s."createdAt" AT TIME ZONE 'UTC') = CURRENT_DATE)         AS new_today
    FROM "user" u
    LEFT JOIN session s ON s."userId" = u.id AND s."expiresAt" > now()
    WHERE s.id IS NOT NULL
    GROUP BY u.id, u.name, u.email, u.banned
    ORDER BY last_active DESC
  `)
  const userSessions = (
    Array.isArray(userSessionRows) ? userSessionRows : (userSessionRows as { rows: unknown[] }).rows
  ) as {
    id: string
    name: string
    email: string
    banned: boolean
    session_count: string
    first_session: string
    last_active: string
    expires_at: string
    last_ip: string | null
    is_active_now: boolean
    new_today: boolean
  }[]

  // Daily unique users who logged in (new sessions) over last 14 days
  const dailyRows = await db.execute(sql`
    SELECT
      DATE(s."createdAt" AT TIME ZONE 'UTC')::text  AS day,
      COUNT(DISTINCT s."userId")::int                AS unique_users
    FROM session s
    WHERE s."createdAt" > now() - interval '14 days'
    GROUP BY 1
    ORDER BY 1 ASC
  `)
  const dailyActivity = (
    Array.isArray(dailyRows) ? dailyRows : (dailyRows as { rows: unknown[] }).rows
  ) as { day: string; unique_users: number }[]

  // Demo login stats
  let demoStats = { total_logins: 0, unique_ips: 0, last_24h: 0, last_7d: 0 }
  try {
    const demoRows = await db.execute(sql`
      SELECT
        COUNT(*)::int                                                               AS total_logins,
        COUNT(DISTINCT ip)::int                                                     AS unique_ips,
        COUNT(*) FILTER (WHERE "createdAt" > now() - interval '24 hours')::int     AS last_24h,
        COUNT(*) FILTER (WHERE "createdAt" > now() - interval '7 days')::int       AS last_7d
      FROM demo_logins
    `)
    const raw = Array.isArray(demoRows) ? demoRows : (demoRows as { rows: unknown[] }).rows
    if (raw?.[0]) demoStats = raw[0] as typeof demoStats
  } catch { /* demo_logins table may not exist */ }

  return (
    <SessionsClient
      kpi={{
        activeNow: Number(kpi.active_now),
        loggedInToday: Number(kpi.logged_in_today),
        activeThisWeek: Number(kpi.active_this_week),
        totalActiveSessions: Number(kpi.total_active_sessions),
      }}
      userSessions={userSessions}
      dailyActivity={dailyActivity}
      demoStats={demoStats}
    />
  )
}
