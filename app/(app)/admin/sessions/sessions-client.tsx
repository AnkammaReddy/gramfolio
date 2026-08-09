"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity, Users, LogIn, Clock, Wifi } from "lucide-react"

type UserSession = {
  id: string
  name: string
  email: string
  banned: boolean
  session_count: string
  first_session: string
  last_active: string
  expires_at: string
  last_ip: string | null
  is_active_now: boolean
  new_today: boolean
}

type DayActivity = {
  day: string
  unique_users: number
}

type KPI = {
  activeNow: number
  loggedInToday: number
  activeThisWeek: number
  totalActiveSessions: number
}

type DemoStats = {
  total_logins: number
  unique_ips: number
  last_24h: number
  last_7d: number
}

function formatDate(d: string | null) {
  if (!d) return "—"
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(new Date(d))
}

function formatDay(d: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(d))
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function SessionsClient({
  kpi,
  userSessions,
  dailyActivity,
  demoStats,
}: {
  kpi: KPI
  userSessions: UserSession[]
  dailyActivity: DayActivity[]
  demoStats: DemoStats
}) {
  const maxUsers = Math.max(...dailyActivity.map((d) => Number(d.unique_users)), 1)

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Session Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live overview of member logins and active sessions.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Active (last 2h)", value: kpi.activeNow, icon: Wifi, color: "text-green-500" },
          { label: "Logged in today", value: kpi.loggedInToday, icon: Activity, color: "text-blue-500" },
          { label: "Active this week", value: kpi.activeThisWeek, icon: LogIn, color: "text-amber-500" },
          { label: "Total live sessions", value: kpi.totalActiveSessions, icon: Users, color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Demo login stats */}
      {demoStats.total_logins > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Demo logins</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total", value: demoStats.total_logins },
              { label: "Unique IPs", value: demoStats.unique_ips },
              { label: "Last 24 hours", value: demoStats.last_24h },
              { label: "Last 7 days", value: demoStats.last_7d },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily unique users bar chart — last 14 days */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily unique logins — last 14 days</CardTitle>
          <CardDescription>Unique users who started a new session each day</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No session data yet.</p>
          ) : (
            <div className="relative h-40 flex items-end gap-1.5">
              {dailyActivity.map((d) => {
                const count = Number(d.unique_users)
                const pct = (count / maxUsers) * 100
                const isToday = d.day === new Date().toISOString().slice(0, 10)
                return (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1 h-full group justify-end">
                    <span className="text-[10px] text-muted-foreground tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                      {count}
                    </span>
                    <div
                      className={`w-full rounded-t transition-all ${isToday ? "bg-primary" : "bg-primary/40 group-hover:bg-primary/70"}`}
                      style={{ height: `${Math.max(pct, 3)}%` }}
                      title={`${count} unique user${count !== 1 ? "s" : ""}`}
                    />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDay(d.day)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-user session table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Active member sessions
          </CardTitle>
          <CardDescription>
            Members with at least one non-expired session. &quot;Live&quot; = session activity within last 2 hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {userSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sessions.</p>
          ) : (
            userSessions.map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-1 rounded-lg border border-border px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{s.name}</span>
                    {s.is_active_now && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-green-500">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        Live
                      </span>
                    )}
                    {s.new_today && !s.is_active_now && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">New today</Badge>
                    )}
                    {s.banned && (
                      <Badge variant="destructive" className="text-[10px] h-4 px-1.5">Banned</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground truncate">{s.email}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 shrink-0 text-xs text-muted-foreground">
                  <span>
                    <span className="text-foreground font-medium">{s.session_count}</span>{" "}
                    {Number(s.session_count) === 1 ? "session" : "sessions"}
                  </span>
                  <span>Last active: <span className="text-foreground">{timeAgo(s.last_active)}</span></span>
                  <span>First login: <span className="text-foreground">{formatDate(s.first_session)}</span></span>
                  {s.last_ip && (
                    <span className="font-mono text-[11px]">{s.last_ip}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
