"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Clock, LogIn, ShoppingBag, UserPlus, Users, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import type { AdminGrowthData } from "@/app/actions/admin-growth";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type RangeKey = "30d" | "90d" | "180d" | "365d" | "all";

const RANGE_OPTIONS: { key: RangeKey; label: string; days: number | null }[] = [
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
  { key: "180d", label: "6M", days: 180 },
  { key: "365d", label: "1Y", days: 365 },
  { key: "all", label: "All", days: null },
];

const axisProps = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

function filterDailyByRange(
  daily: AdminGrowthData["daily"],
  range: RangeKey,
): AdminGrowthData["daily"] {
  const option = RANGE_OPTIONS.find((r) => r.key === range);
  if (!option?.days || daily.length === 0) return daily;

  const lastDate = daily[daily.length - 1]!.date;
  const cutoff = new Date(`${lastDate}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - option.days + 1);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  return daily.filter((point) => point.date >= cutoffStr);
}

function sumField(
  points: AdminGrowthData["daily"],
  field: "newMembers" | "newPurchases",
): number {
  return points.reduce((sum, point) => sum + point[field], 0);
}

function tickDate(d: string) {
  const local = new Date(d.replace(/-/g, "/"));
  return local.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatDateTime(d: string | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(d));
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function RangeFilter({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (v: RangeKey) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-muted p-0.5 text-xs font-medium">
      {RANGE_OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={cn(
            "rounded-md px-2.5 py-1 transition-colors",
            value === option.key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function GrowthDashboardClient({ data }: { data: AdminGrowthData }) {
  const [range, setRange] = useState<RangeKey>("90d");

  const filteredDaily = useMemo(
    () => filterDailyByRange(data.daily, range),
    [data.daily, range],
  );

  const rangeNewMembers = sumField(filteredDaily, "newMembers");
  const rangeNewPurchases = sumField(filteredDaily, "newPurchases");

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members & growth</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Growth, sign-ups, purchases, and live session activity in one place.
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Growth
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{data.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              +{rangeNewMembers} in selected range
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total purchases</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{data.totalPurchases}</div>
            <p className="text-xs text-muted-foreground">
              +{rangeNewPurchases} in selected range
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg purchases / member</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {data.totalMembers > 0
                ? (data.totalPurchases / data.totalMembers).toFixed(1)
                : "0"}
            </div>
            <p className="text-xs text-muted-foreground">All-time average</p>
          </CardContent>
        </Card>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Sessions
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Active (last 2h)",
              value: data.sessionKpi.activeNow,
              icon: Wifi,
              color: "text-green-500",
            },
            {
              label: "Logged in today",
              value: data.sessionKpi.loggedInToday,
              icon: Activity,
              color: "text-blue-500",
            },
            {
              label: "Active this week",
              value: data.sessionKpi.activeThisWeek,
              icon: LogIn,
              color: "text-amber-500",
            },
            {
              label: "Live sessions",
              value: data.sessionKpi.totalActiveSessions,
              icon: Users,
              color: "text-primary",
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Daily activity</CardTitle>
            <p className="text-sm text-muted-foreground">
              New registrations and purchases recorded each day
            </p>
          </div>
          <RangeFilter value={range} onChange={setRange} />
        </CardHeader>
        <CardContent>
          {filteredDaily.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No activity in this range yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={filteredDaily} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={tickDate}
                  {...axisProps}
                  minTickGap={32}
                />
                <YAxis allowDecimals={false} width={32} {...axisProps} />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <ChartTooltip
                      active={active}
                      payload={payload as never}
                      label={label as string}
                      formatter={(v) => String(v)}
                      labelIsDate
                    />
                  )}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) =>
                    value === "newMembers" ? "New members" : "New purchases"
                  }
                />
                <Line
                  type="monotone"
                  dataKey="newMembers"
                  name="newMembers"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--color-chart-1)" }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="newPurchases"
                  name="newPurchases"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--color-chart-2)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Active sessions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Members with a non-expired session. Live = activity in the last 2 hours.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.activeSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sessions.</p>
          ) : (
            data.activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-col gap-1 rounded-lg border border-border px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{session.name}</span>
                    {session.isActiveNow && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-green-500">
                        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                        Live
                      </span>
                    )}
                    {session.newToday && !session.isActiveNow && (
                      <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                        New today
                      </Badge>
                    )}
                    {session.banned && (
                      <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                        Banned
                      </Badge>
                    )}
                  </div>
                  <span className="truncate text-xs text-muted-foreground">{session.email}</span>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                  <span>
                    <span className="font-medium text-foreground">{session.sessionCount}</span>{" "}
                    {session.sessionCount === 1 ? "session" : "sessions"}
                  </span>
                  <span>
                    Last active:{" "}
                    <span className="text-foreground">{timeAgo(session.lastActive)}</span>
                  </span>
                  <span>
                    First login:{" "}
                    <span className="text-foreground">{formatDateTime(session.firstSession)}</span>
                  </span>
                  {session.lastIp && (
                    <span className="font-mono text-[11px]">{session.lastIp}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Joined in the last week</CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.recentMembers.length} new member
            {data.recentMembers.length === 1 ? "" : "s"} in the past 7 days
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Purchases</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last purchase</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No new members in the last week.
                  </TableCell>
                </TableRow>
              ) : (
                data.recentMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-muted-foreground">{member.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={member.role === "admin" ? "default" : "secondary"}
                        className={cn(member.role === "admin" && "bg-primary")}
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {member.purchaseCount}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(member.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(member.lastPurchaseAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
