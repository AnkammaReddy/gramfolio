"use client"

import { sendMemberMessage } from "@/app/actions/messages"
import type { MessageDTO } from "@/lib/types"
import { MessageThread } from "@/components/messages/message-thread"
import { useIsDemo } from "@/components/demo-mode-provider"

export function MessagesClient({ messages }: { messages: MessageDTO[] }) {
  const isDemo = useIsDemo()

  return (
    <MessageThread
      messages={messages}
      disabled={isDemo}
      pollMs={25000}
      emptyHint="Send a message to start a conversation with the GramFolio admin."
      onSend={sendMemberMessage}
    />
  )
}
