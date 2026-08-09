import { unstable_noStore as noStore } from "next/cache"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sql } from "drizzle-orm"
import { MembersClient } from "./members-client"
import { AUTH_DISABLED, DEMO_USER } from "@/lib/auth-config"

export default async function AdminInvitesPage() {
  noStore() // always fetch live — never serve a cached version of this page
  // Auth check — must be admin
  let currentUserId: string
  if (AUTH_DISABLED) {
    currentUserId = DEMO_USER.id
  } else {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/sign-in")
    const [u] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id))
    if (!u || u.role !== "admin") redirect("/dashboard")
    currentUserId = session.user.id
  }

  // Members with purchase aggregations
  const usersWithStats = await db.execute(sql`
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      u."createdAt",
      u.banned,
      COUNT(p.id)::int                          AS purchase_count,
      COALESCE(SUM(p."purchasePrice"), 0)::numeric AS purchase_total
    FROM "user" u
    LEFT JOIN purchases p ON p."userId" = u.id
    GROUP BY u.id, u.name, u.email, u.role, u."createdAt", u.banned
    ORDER BY u."createdAt" DESC
  `)
  const allUsers = (
    Array.isArray(usersWithStats) ? usersWithStats : (usersWithStats as { rows: unknown[] }).rows
  ) as {
    id: string
    name: string
    email: string
    role: string
    createdAt: Date
    banned: boolean
    purchase_count: number
    purchase_total: string
  }[]

  return (
    <MembersClient
      users={allUsers}
      currentUserId={currentUserId}
    />
  )
}
