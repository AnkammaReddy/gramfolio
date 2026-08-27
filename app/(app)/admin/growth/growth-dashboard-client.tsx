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

function CompactStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="min-w-[4.5rem] flex-1 rounded border border-border/80 bg-muted/20 px-2 py-1">
      <p className="truncate text-[10px] leading-none text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold tabular-nums leading-none">{value}</p>
      {hint ? (
        <p className="mt-0.5 truncate text-[9px] leading-none text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function KpiGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-md border border-border/60 bg-muted/10 p-1.5">
      <p className="px-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
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
  const avgPurchases =
    data.totalMembers > 0 ? (data.totalPurchases / data.totalMembers).toFixed(1) : "0";

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members & growth</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Growth, sign-ups, purchases, and live session activity in one place.
        </p>
      </div>

      <Card>
        <CardContent className="p-2.5">
          <div className="flex flex-col gap-1.5 lg:flex-row">
            <KpiGroup title="Growth">
              <CompactStat
                label="Members"
                value={data.totalMembers}
                hint={`+${rangeNewMembers}`}
              />
              <CompactStat
                label="Purchases"
                value={data.totalPurchases}
                hint={`+${rangeNewPurchases}`}
              />
              <CompactStat label="Avg / user" value={avgPurchases} />
            </KpiGroup>
            <KpiGroup title="Sessions">
              <CompactStat label="Active 2h" value={data.sessionKpi.activeNow} />
              <CompactStat label="Today" value={data.sessionKpi.loggedInToday} />
            </KpiGroup>
            <KpiGroup title="Demo">
              <CompactStat label="Total" value={data.demoStats.totalLogins} />
              <CompactStat label="24h" value={data.demoStats.last24h} />
              <CompactStat label="7d" value={data.demoStats.last7d} />
              <CompactStat label="IPs" value={data.demoStats.uniqueIps} />
            </KpiGroup>
          </div>
        </CardContent>
      </Card>

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
          <CardTitle className="text-base">Active now (last 2 hours)</CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.activeSessions.length} user{data.activeSessions.length === 1 ? "" : "s"} with
            recent session activity
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead>Last active</TableHead>
                <TableHead>First login</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.activeSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No active users in the last 2 hours.
                  </TableCell>
                </TableRow>
              ) : (
                data.activeSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-2">
                        {session.name}
                        {session.newToday && (
                          <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                            New today
                          </Badge>
                        )}
                        {session.banned && (
                          <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                            Banned
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{session.email}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {session.sessionCount}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {timeAgo(session.lastActive)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(session.firstSession)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {session.lastIp ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
