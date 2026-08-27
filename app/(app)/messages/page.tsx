import { Suspense } from "react"
import { PageHeader } from "@/components/page-header"
import { getMyConversationMessages } from "@/app/actions/messages"
import { MessagesClient } from "@/components/messages/messages-client"

export default async function MessagesPage() {
  const { messages } = await getMyConversationMessages()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Talk to admin"
        description="A private conversation with the GramFolio admin. Messages are encrypted in the database."
      />
      <Suspense fallback={null}>
        <MessagesClient messages={messages} />
      </Suspense>
    </div>
  )
}
