"use client"

import { useSearchParams } from "next/navigation"
import { sendMemberMessage } from "@/app/actions/messages"
import type { MessageDTO } from "@/lib/types"
import { getMessageTopic, type MessageTopicKey } from "@/lib/message-topics"
import { MessageThread } from "@/components/messages/message-thread"
import { useIsDemo } from "@/components/demo-mode-provider"

export function MessagesClient({ messages }: { messages: MessageDTO[] }) {
  const isDemo = useIsDemo()
  const searchParams = useSearchParams()
  const topicParam = searchParams.get("topic") as MessageTopicKey | null
  const topic = getMessageTopic(topicParam)

  return (
    <MessageThread
      key={topic.key}
      messages={messages}
      disabled={isDemo}
      pollMs={25000}
      initialBody={topic.draft}
      emptyHint="Send a message to start a conversation with the GramFolio admin."
      onSend={sendMemberMessage}
    />
  )
}
