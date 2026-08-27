"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { getMyConversationMessages, sendMemberMessage } from "@/app/actions/messages"
import type { MessageDTO } from "@/lib/types"
import { MESSAGE_TOPICS, type MessageTopicKey } from "@/lib/message-topics"
import { MessageThread } from "@/components/messages/message-thread"
import { useIsDemo } from "@/components/demo-mode-provider"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { MessageCircle } from "lucide-react"

export function TalkToAdminFab() {
  const pathname = usePathname()
  const isDemo = useIsDemo()
  const [open, setOpen] = useState(false)
  const [topic, setTopic] = useState<MessageTopicKey>("general")
  const [messages, setMessages] = useState<MessageDTO[]>([])
  const [loading, startLoad] = useTransition()

  const hidden =
    pathname === "/messages" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up")

  useEffect(() => {
    if (!open) return
    startLoad(async () => {
      const data = await getMyConversationMessages()
      setMessages(data.messages)
    })
  }, [open])

  if (hidden) return null

  const selectedTopic = MESSAGE_TOPICS.find((item) => item.key === topic) ?? MESSAGE_TOPICS[1]!

  return (
    <>
      <Button
        type="button"
        size="icon"
        aria-label="Talk to admin"
        title="Talk to admin"
        className={cn(
          "fixed bottom-6 right-4 z-40 size-14 rounded-full shadow-lg lg:right-8",
          "bg-primary text-primary-foreground hover:bg-primary/90",
        )}
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[min(90vh,720px)] gap-0 overflow-y-auto p-0">
          <SheetHeader className="border-b border-border px-4 py-4 text-left">
            <SheetTitle>Talk to admin</SheetTitle>
            <SheetDescription>
              Private, encrypted chat with the GramFolio admin. Pick a topic or write your own message.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4 py-4">
            <div className="flex flex-wrap gap-2">
              {MESSAGE_TOPICS.map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  size="sm"
                  variant={topic === item.key ? "default" : "outline"}
                  className="h-auto flex-col items-start gap-0.5 px-3 py-2 text-left"
                  onClick={() => setTopic(item.key)}
                >
                  <span className="text-sm font-medium">{item.label}</span>
                  <span
                    className={cn(
                      "text-xs font-normal",
                      topic === item.key ? "text-primary-foreground/80" : "text-muted-foreground",
                    )}
                  >
                    {item.description}
                  </span>
                </Button>
              ))}
            </div>

            {loading && messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading conversation…</p>
            ) : (
              <MessageThread
                key={topic}
                messages={messages}
                disabled={isDemo}
                pollMs={open ? 25000 : undefined}
                initialBody={selectedTopic.draft}
                compact
                emptyHint="Send a message to start a conversation with the GramFolio admin."
                onSend={async (body) => {
                  await sendMemberMessage(body)
                  const data = await getMyConversationMessages()
                  setMessages(data.messages)
                }}
              />
            )}

            <p className="text-center text-xs text-muted-foreground">
              Prefer the full page?{" "}
              <Link
                href={`/messages?topic=${topic}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => setOpen(false)}
              >
                Open Talk to admin
              </Link>
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
