import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user as userTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { AUTH_DISABLED } from "@/lib/auth-config"
import { getAllFeedback } from "@/app/actions/feedback"
import { PageHeader } from "@/components/page-header"
import { AdminFeedbackClient } from "./admin-feedback-client"

export default async function AdminFeedbackPage() {
  if (!AUTH_DISABLED) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/sign-in")
    const [row] = await db
      .select({ role: userTable.role })
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
    if (row?.role !== "admin") redirect("/dashboard")
  }

  const items = await getAllFeedback()
  const unread = items.filter((i) => !i.readAt).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback"
        description={`${items.length} total submission${items.length !== 1 ? "s" : ""}${unread > 0 ? ` · ${unread} unread` : ""}`}
      />
      <AdminFeedbackClient items={items} />
    </div>
  )
}
