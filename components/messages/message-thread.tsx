"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { MessageDTO } from "@/lib/types"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Send } from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/format"

export function MessageThread({
  messages,
  onSend,
  disabled,
  emptyHint,
  pollMs,
  initialBody = "",
  compact = false,
}: {
  messages: MessageDTO[]
  onSend: (body: string) => Promise<void>
  disabled?: boolean
  emptyHint?: string
  pollMs?: number
  initialBody?: string
  compact?: boolean
}) {
  const router = useRouter()
  const [body, setBody] = useState(initialBody)
  const [pending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!pollMs) return
    const id = window.setInterval(() => router.refresh(), pollMs)
    return () => window.clearInterval(id)
  }, [pollMs, router])

  function handleSend() {
    const trimmed = body.trim()
    if (!trimmed || disabled) return
    startTransition(async () => {
      try {
        await onSend(trimmed)
        setBody("")
        router.refresh()
      } catch (e) {
        if (e instanceof Error && e.message === "DEMO_READ_ONLY") {
          toast.info("Read-only in demo mode")
        } else if (e instanceof Error && e.message === "RATE_LIMIT") {
          toast.error("Too many messages sent. Please wait before sending more.")
        } else if (e instanceof Error && e.message === "Forbidden") {
          toast.error("Messaging is not available for this account.")
        } else {
          toast.error("Failed to send message")
        }
      }
    })
  }

  useEffect(() => {
    setBody(initialBody)
  }, [initialBody])

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card",
        compact ? "min-h-[320px]" : "min-h-[420px]",
      )}
    >
      <ScrollArea
        className="flex-1 px-4 py-4"
        style={{ maxHeight: compact ? "min(40vh, 360px)" : "min(52vh, 520px)" }}
      >
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emptyHint ?? "No messages yet."}
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn("flex", m.isMine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                    m.isMine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px] tabular-nums",
                      m.isMine ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    {formatDate(m.createdAt.slice(0, 10))}
                    {" · "}
                    {new Date(m.createdAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      <div className="border-t border-border p-3 space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          rows={3}
          maxLength={2000}
          disabled={disabled || pending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Enter to send · Shift+Enter for new line</p>
          <Button
            type="button"
            size="sm"
            disabled={disabled || pending || !body.trim()}
            onClick={handleSend}
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
