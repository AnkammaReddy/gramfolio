"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { ConversationDTO, MessageDTO } from "@/lib/types"
import { sendAdminMessage } from "@/app/actions/messages"
import { MessageThread } from "@/components/messages/message-thread"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/format"
import { toast } from "sonner"

export function AdminMessagesClient({
  conversations,
  initialConversationId,
  initialMessages,
}: {
  conversations: ConversationDTO[]
  initialConversationId: number | null
  initialMessages: MessageDTO[]
}) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<number | null>(initialConversationId)
  const [, startTransition] = useTransition()

  const selected = conversations.find((c) => c.id === selectedId) ?? null

  function selectConversation(id: number) {
    setSelectedId(id)
    startTransition(() => {
      router.push(`/admin/messages?c=${id}`)
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(240px,320px)_1fr]">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Conversations
          </p>
        </div>
        <ul className="max-h-[min(60vh,560px)] overflow-y-auto divide-y divide-border">
          {conversations.length === 0 ? (
            <li className="px-3 py-6 text-sm text-muted-foreground text-center">
              No conversations yet.
            </li>
          ) : (
            conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => selectConversation(c.id)}
                  className={cn(
                    "w-full px-3 py-3 text-left transition-colors hover:bg-accent",
                    selectedId === c.id && "bg-primary/10",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {c.userName ?? "Member"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{c.userEmail}</p>
                    </div>
                    {c.unreadCount > 0 && (
                      <Badge variant="destructive" className="shrink-0 h-5 min-w-5 px-1.5">
                        {c.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(c.lastMessageAt.slice(0, 10))}
                  </p>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="min-w-0">
        {selected ? (
          <div className="space-y-2">
            <div className="px-1">
              <p className="text-sm font-medium text-foreground">
                {selected.userName ?? "Member"}
              </p>
              <p className="text-xs text-muted-foreground">{selected.userEmail}</p>
            </div>
            <MessageThread
              key={selected.id}
              messages={initialMessages}
              pollMs={25000}
              emptyHint="No messages in this conversation yet."
              onSend={async (body) => {
                try {
                  await sendAdminMessage(selected.id, body)
                  router.refresh()
                } catch {
                  toast.error("Failed to send message")
                  throw new Error("send failed")
                }
              }}
            />
          </div>
        ) : (
          <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 text-center text-sm text-muted-foreground">
            Select a conversation to view messages.
          </div>
        )}
      </div>
    </div>
  )
}
