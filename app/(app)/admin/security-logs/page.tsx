"use server"
import { unstable_noStore as noStore } from "next/cache"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user, securityLogs } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { AUTH_DISABLED, DEMO_USER } from "@/lib/auth-config"
import { SecurityLogsClient } from "./security-logs-client"

export default async function SecurityLogsPage() {
  noStore()

  if (!AUTH_DISABLED) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/sign-in")
    const [u] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id))
    if (!u || u.role !== "admin") redirect("/dashboard")
  }

  const logs = await db
    .select()
    .from(securityLogs)
    .orderBy(desc(securityLogs.createdAt))
    .limit(200)

  return <SecurityLogsClient logs={logs} />
}
