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
  newToday: boolean;
};

export type AdminGrowthSessionKpi = {
  activeNow: number;
  loggedInToday: number;
};

export type AdminGrowthDemoStats = {
  totalLogins: number;
  uniqueIps: number;
  last24h: number;
  last7d: number;
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
  demoStats: AdminGrowthDemoStats;
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

function toNum(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "bigint") return Number(value);
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toIso(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
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
  }>(
    await db.execute(sql`
      SELECT
        COUNT(DISTINCT s."userId")
          FILTER (WHERE GREATEST(s."updatedAt", s."createdAt") > now() - interval '2 hours'
                AND s."expiresAt" > now())                                     AS active_now,
        COUNT(DISTINCT s."userId")
          FILTER (WHERE DATE(s."createdAt" AT TIME ZONE 'UTC') = CURRENT_DATE) AS logged_in_today
      FROM session s
    `),
  );

  let demoStats: AdminGrowthDemoStats = {
    totalLogins: 0,
    uniqueIps: 0,
    last24h: 0,
    last7d: 0,
  };
  try {
    const [demoRow] = asRows<{
      total_logins: string;
      unique_ips: string;
      last_24h: string;
      last_7d: string;
    }>(
      await db.execute(sql`
        SELECT
          COUNT(*)::int                                                           AS total_logins,
          COUNT(DISTINCT ip)::int                                                 AS unique_ips,
          COUNT(*) FILTER (WHERE "createdAt" > now() - interval '24 hours')::int AS last_24h,
          COUNT(*) FILTER (WHERE "createdAt" > now() - interval '7 days')::int   AS last_7d
        FROM demo_logins
      `),
    );
    if (demoRow) {
      demoStats = {
        totalLogins: toNum(demoRow.total_logins),
        uniqueIps: toNum(demoRow.unique_ips),
        last24h: toNum(demoRow.last_24h),
        last7d: toNum(demoRow.last_7d),
      };
    }
  } catch {
    /* demo_logins table may not exist */
  }

  const activeSessionRows = asRows<{
    id: string;
    name: string;
    email: string;
    banned: boolean;
    session_count: string;
    first_session: string;
    last_active: string;
    last_ip: string | null;
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
        BOOL_OR(DATE(s."createdAt" AT TIME ZONE 'UTC') = CURRENT_DATE)         AS new_today
      FROM "user" u
      INNER JOIN session s ON s."userId" = u.id
        AND s."expiresAt" > now()
        AND GREATEST(s."updatedAt", s."createdAt") > now() - interval '2 hours'
      GROUP BY u.id, u.name, u.email, u.banned
      ORDER BY last_active DESC
    `),
  );

  return {
    totalMembers: toNum(totals?.total_members),
    totalPurchases: toNum(totals?.total_purchases),
    daily: dailyRows.map((row) => ({
      date: String(row.date),
      newMembers: toNum(row.new_members),
      newPurchases: toNum(row.new_purchases),
    })),
    recentMembers: memberRows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: toIso(row.created_at) ?? "",
      purchaseCount: toNum(row.purchase_count),
      lastPurchaseAt: toIso(row.last_purchase_at),
    })),
    sessionKpi: {
      activeNow: toNum(sessionKpiRow?.active_now),
      loggedInToday: toNum(sessionKpiRow?.logged_in_today),
    },
    demoStats,
    activeSessions: activeSessionRows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      banned: Boolean(row.banned),
      sessionCount: toNum(row.session_count),
      firstSession: toIso(row.first_session) ?? "",
      lastActive: toIso(row.last_active) ?? "",
      lastIp: row.last_ip,
      newToday: Boolean(row.new_today),
    })),
  };
}
