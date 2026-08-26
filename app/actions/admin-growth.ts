"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { AUTH_DISABLED, DEMO_USER } from "@/lib/auth-config";
import { getUserId } from "@/lib/session";

export type AdminGrowthMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  purchaseCount: number;
  lastPurchaseAt: string | null;
};

export type AdminGrowthActiveSession = {
  id: string;
  name: string;
  email: string;
  banned: boolean;
  sessionCount: number;
  firstSession: string;
  lastActive: string;
  lastIp: string | null;
  isActiveNow: boolean;
  newToday: boolean;
};

export type AdminGrowthSessionKpi = {
  activeNow: number;
  loggedInToday: number;
  activeThisWeek: number;
  totalActiveSessions: number;
};

export type AdminGrowthDailyPoint = {
  date: string;
  newMembers: number;
  newPurchases: number;
};

export type AdminGrowthData = {
  totalMembers: number;
  totalPurchases: number;
  daily: AdminGrowthDailyPoint[];
  recentMembers: AdminGrowthMember[];
  sessionKpi: AdminGrowthSessionKpi;
  activeSessions: AdminGrowthActiveSession[];
};

async function requireAdmin() {
  const callerUserId = AUTH_DISABLED ? DEMO_USER.id : await getUserId();
  const [u] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, callerUserId))
    .limit(1);
  if (!u || u.role !== "admin") throw new Error("Forbidden");
}

function asRows<T>(result: unknown): T[] {
  return (Array.isArray(result) ? result : (result as { rows: T[] }).rows) ?? [];
}

export async function getAdminGrowthData(): Promise<AdminGrowthData> {
  await requireAdmin();

  const totalsResult = await db.execute(sql`
    SELECT
      (SELECT COUNT(*)::int FROM "user") AS total_members,
      (SELECT COUNT(*)::int FROM purchases) AS total_purchases
  `);
  const [totals] = asRows<{
    total_members: string;
    total_purchases: string;
  }>(totalsResult);

  const dailyRows = asRows<{
    date: string;
    new_members: string;
    new_purchases: string;
  }>(
    await db.execute(sql`
      WITH signup_days AS (
        SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
               COUNT(*)::int AS cnt
        FROM "user"
        GROUP BY 1
      ),
      purchase_days AS (
        SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
               COUNT(*)::int AS cnt
        FROM purchases
        GROUP BY 1
      ),
      all_days AS (
        SELECT day FROM signup_days
        UNION
        SELECT day FROM purchase_days
      )
      SELECT
        d.day AS date,
        COALESCE(s.cnt, 0)::int AS new_members,
        COALESCE(p.cnt, 0)::int AS new_purchases
      FROM all_days d
      LEFT JOIN signup_days s ON s.day = d.day
      LEFT JOIN purchase_days p ON p.day = d.day
      ORDER BY d.day ASC
    `),
  );

  const memberRows = asRows<{
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
    purchase_count: string;
    last_purchase_at: string | null;
  }>(
    await db.execute(sql`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u."createdAt" AS created_at,
        COUNT(p.id)::int AS purchase_count,
        MAX(p."createdAt") AS last_purchase_at
      FROM "user" u
      LEFT JOIN purchases p ON p."userId" = u.id
      WHERE u."createdAt" > now() - interval '7 days'
      GROUP BY u.id, u.name, u.email, u.role, u."createdAt"
      ORDER BY u."createdAt" DESC
    `),
  );

  const [sessionKpiRow] = asRows<{
    active_now: string;
    logged_in_today: string;
    active_this_week: string;
    total_active_sessions: string;
  }>(
    await db.execute(sql`
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
    `),
  );

  const activeSessionRows = asRows<{
    id: string;
    name: string;
    email: string;
    banned: boolean;
    session_count: string;
    first_session: string;
    last_active: string;
    last_ip: string | null;
    is_active_now: boolean;
    new_today: boolean;
  }>(
    await db.execute(sql`
      SELECT
        u.id,
        u.name,
        u.email,
        u.banned,
        COUNT(s.id)::int                                                        AS session_count,
        MIN(s."createdAt")                                                      AS first_session,
        MAX(s."updatedAt")                                                      AS last_active,
        MAX(s."ipAddress")                                                      AS last_ip,
        BOOL_OR(GREATEST(s."updatedAt", s."createdAt") > now() - interval '2 hours') AS is_active_now,
        BOOL_OR(DATE(s."createdAt" AT TIME ZONE 'UTC') = CURRENT_DATE)         AS new_today
      FROM "user" u
      INNER JOIN session s ON s."userId" = u.id AND s."expiresAt" > now()
      GROUP BY u.id, u.name, u.email, u.banned
      ORDER BY last_active DESC
    `),
  );

  return {
    totalMembers: Number(totals?.total_members ?? 0),
    totalPurchases: Number(totals?.total_purchases ?? 0),
    daily: dailyRows.map((row) => ({
      date: row.date,
      newMembers: Number(row.new_members),
      newPurchases: Number(row.new_purchases),
    })),
    recentMembers: memberRows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: row.created_at,
      purchaseCount: Number(row.purchase_count),
      lastPurchaseAt: row.last_purchase_at,
    })),
    sessionKpi: {
      activeNow: Number(sessionKpiRow?.active_now ?? 0),
      loggedInToday: Number(sessionKpiRow?.logged_in_today ?? 0),
      activeThisWeek: Number(sessionKpiRow?.active_this_week ?? 0),
      totalActiveSessions: Number(sessionKpiRow?.total_active_sessions ?? 0),
    },
    activeSessions: activeSessionRows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      banned: row.banned,
      sessionCount: Number(row.session_count),
      firstSession: row.first_session,
      lastActive: row.last_active,
      lastIp: row.last_ip,
      isActiveNow: row.is_active_now,
      newToday: row.new_today,
    })),
  };
}
