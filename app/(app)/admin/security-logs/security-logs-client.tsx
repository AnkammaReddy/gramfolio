"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Shield, Search } from "lucide-react"
import type { SecurityLog } from "@/lib/db/schema"

const EVENT_META: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  recovery_attempt:        { label: "Recovery attempt",  variant: "secondary" },
  recovery_success:        { label: "Recovery success",  variant: "default" },
  recovery_failed:         { label: "Recovery failed",   variant: "destructive" },
  rate_limit_exceeded:     { label: "Rate limited",      variant: "destructive" },
  account_delete_attempt:  { label: "Delete attempt",    variant: "secondary" },
  account_delete_success:  { label: "Account deleted",   variant: "default" },
  account_delete_failed:   { label: "Delete failed",     variant: "destructive" },
}

function fmt(d: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: true,
  }).format(new Date(d))
}

export function SecurityLogsClient({ logs }: { logs: SecurityLog[] }) {
  const [search, setSearch] = useState("")

  const filtered = search.trim()
    ? logs.filter(
        (l) =>
          l.email.toLowerCase().includes(search.toLowerCase()) ||
          l.ipAddress.includes(search) ||
          l.eventType.includes(search.toLowerCase()),
      )
    : logs

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">Security Logs</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Auth security events (password recovery &amp; account deletion) — last 200. Search by email, IP, or event type.
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total events",   value: logs.length },
          { label: "Unique emails",  value: new Set(logs.map((l) => l.email)).size },
          { label: "Unique IPs",     value: new Set(logs.map((l) => l.ipAddress)).size },
          { label: "Rate limited",   value: logs.filter((l) => l.eventType === "rate_limit_exceeded").length },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email, IP or event type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Log table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Event</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">IP Address</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No logs found.
                </td>
              </tr>
            ) : (
              filtered.map((log) => {
                const meta = EVENT_META[log.eventType] ?? { label: log.eventType, variant: "outline" as const }
                return (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap font-mono">
                      {fmt(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={meta.variant} className="text-[11px]">{meta.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">{log.email}</td>
                    <td className="px-4 py-3 text-xs font-mono">{log.ipAddress}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {log.details && Object.keys(log.details).length > 0
                        ? Object.entries(log.details)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" · ")
                        : "—"}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
