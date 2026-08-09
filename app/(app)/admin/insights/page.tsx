import { unstable_noStore as noStore } from "next/cache"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user, communityInsights } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { AUTH_DISABLED, DEMO_USER } from "@/lib/auth-config"
import { AdminInsightsClient } from "./admin-insights-client"

export default async function AdminInsightsPage() {
  noStore()

  if (!AUTH_DISABLED) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/sign-in")
    const [u] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id))
    if (!u || u.role !== "admin") redirect("/dashboard")
  }

  // Fetch all insights with reaction counts
  const rows = await db.execute(sql`
    SELECT
      ci.id,
      ci.title,
      ci.body,
      ci."weekLabel",
      ci."isActive",
      ci."createdAt",
      COALESCE(SUM(CASE WHEN ir.reaction = 'like' THEN 1 ELSE 0 END), 0)::int    AS likes,
      COALESCE(SUM(CASE WHEN ir.reaction = 'dislike' THEN 1 ELSE 0 END), 0)::int AS dislikes
    FROM community_insights ci
    LEFT JOIN insight_reactions ir ON ir."insightId" = ci.id
    GROUP BY ci.id, ci.title, ci.body, ci."weekLabel", ci."isActive", ci."createdAt"
    ORDER BY ci."createdAt" DESC
  `)
  const insights = (Array.isArray(rows) ? rows : (rows as { rows: unknown[] }).rows) as {
    id: number
    title: string
    body: string
    weekLabel: string
    isActive: boolean
    createdAt: Date
    likes: number
    dislikes: number
  }[]

  return <AdminInsightsClient insights={insights} />
}
