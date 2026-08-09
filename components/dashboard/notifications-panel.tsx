import Link from "next/link"
import type { Notification } from "@/lib/insights"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Info, TriangleAlert, CheckCircle2, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const toneIcon = { info: Info, warning: TriangleAlert, success: CheckCircle2 }
const toneColor = {
  info: "text-primary bg-primary/10",
  warning: "text-destructive bg-destructive/10",
  success: "text-[var(--color-success)] bg-[var(--color-success)]/10",
}

export function NotificationsPanel({ notifications }: { notifications: Notification[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Bell className="h-4 w-4" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {notifications.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">You're all caught up.</p>
        ) : (
          notifications.map((n) => {
            const Icon = toneIcon[n.tone]
            const inner = (
              <div className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-accent">
                <span
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    toneColor[n.tone],
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground text-pretty">{n.description}</p>
                </div>
                {n.href && <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />}
              </div>
            )
            return n.href ? (
              <Link key={n.id} href={n.href}>
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
