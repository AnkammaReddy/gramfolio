export type MessageTopicKey = "strategy" | "general"

export type MessageTopic = {
  key: MessageTopicKey
  label: string
  description: string
  draft: string
}

export const MESSAGE_TOPICS: MessageTopic[] = [
  {
    key: "strategy",
    label: "Optimize purchases",
    description: "Get help improving your gold buying strategy",
    draft:
      "Hi! I'd like help reviewing my purchases and optimizing my gold buying strategy. Can you look at my portfolio and suggest improvements?",
  },
  {
    key: "general",
    label: "General message",
    description: "Ask anything else",
    draft: "",
  },
]

export function getMessageTopic(key: MessageTopicKey | string | null | undefined): MessageTopic {
  return MESSAGE_TOPICS.find((topic) => topic.key === key) ?? MESSAGE_TOPICS[1]!
}
