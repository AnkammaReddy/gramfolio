import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user as userTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { AUTH_DISABLED } from "@/lib/auth-config"
import {
  getAdminConversationMessages,
  listConversationsForAdmin,
} from "@/app/actions/messages"
import { PageHeader } from "@/components/page-header"
import { AdminMessagesClient } from "./admin-messages-client"

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>
}) {
  if (!AUTH_DISABLED) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/sign-in")
    const [row] = await db
      .select({ role: userTable.role })
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
    if (row?.role !== "admin") redirect("/dashboard")
  }

  const params = await searchParams
  const conversations = await listConversationsForAdmin()
  const unreadTotal = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  const parsedId = params.c ? Number.parseInt(params.c, 10) : NaN
  const selectedId =
    Number.isFinite(parsedId) && conversations.some((c) => c.id === parsedId)
      ? parsedId
      : conversations[0]?.id ?? null

  const threadMessages =
    selectedId != null ? await getAdminConversationMessages(selectedId) : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversations"
        description={`${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}${unreadTotal > 0 ? ` · ${unreadTotal} unread` : ""}`}
      />
      <AdminMessagesClient
        conversations={conversations}
        initialConversationId={selectedId}
        initialMessages={threadMessages}
      />
    </div>
  )
}
