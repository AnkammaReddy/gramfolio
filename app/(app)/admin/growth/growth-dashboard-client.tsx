"use client";

import { useMemo, useState, type ReactNode } from "react";
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
import type {
  AdminGrowthActiveSession,
  AdminGrowthData,
  AdminGrowthMember,
} from "@/app/actions/admin-growth";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type RangeKey = "7d" | "30d" | "90d" | "180d" | "365d" | "all";

const RANGE_OPTIONS: { key: RangeKey; label: string; days: number | null }[] = [
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
  { key: "180d", label: "6M", days: 180 },
  { key: "365d", label: "1Y", days: 365 },
  { key: "all", label: "All", days: null },
];

const axisProps = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 10,
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

function tickDate(d: string, compact = false) {
  const local = new Date(d.replace(/-/g, "/"));
  if (compact) {
    return local.toLocaleDateString("en-IN", { day: "numeric", month: "numeric" });
  }
  return local.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatAxisNum(value: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
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
    <div className="min-w-[4rem] flex-1 rounded border border-border/80 bg-muted/20 px-2 py-1">
      <p className="truncate text-[10px] leading-none text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums leading-none sm:text-base">
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </p>
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
  children: ReactNode;
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
    <div className="w-full overflow-x-auto pb-0.5 sm:w-auto sm:overflow-visible">
      <div className="inline-flex min-w-max items-center rounded-lg border border-border bg-muted p-0.5 text-xs font-medium">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={cn(
              "rounded-md px-2 py-1 transition-colors sm:px-2.5",
              value === option.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ActiveSessionMobileRow({ session }: { session: AdminGrowthActiveSession }) {
  return (
    <div className="space-y-1 rounded-lg border border-border px-3 py-2.5 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{session.name}</span>
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
      </div>
      <p className="truncate text-xs text-muted-foreground">{session.email}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span>
          <span className="text-foreground">{session.sessionCount}</span> sessions
        </span>
        <span>Active {timeAgo(session.lastActive)}</span>
        {session.lastIp ? <span className="font-mono">{session.lastIp}</span> : null}
      </div>
    </div>
  );
}

function RecentMemberMobileRow({ member }: { member: AdminGrowthMember }) {
  return (
    <div className="space-y-1 rounded-lg border border-border px-3 py-2.5 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{member.name}</span>
        <Badge
          variant={member.role === "admin" ? "default" : "secondary"}
          className={cn("h-4 px-1.5 text-[10px]", member.role === "admin" && "bg-primary")}
        >
          {member.role}
        </Badge>
      </div>
      <p className="truncate text-xs text-muted-foreground">{member.email}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span>
          <span className="text-foreground">{member.purchaseCount}</span> purchases
        </span>
        <span>Joined {formatDate(member.createdAt)}</span>
      </div>
    </div>
  );
}

export function GrowthDashboardClient({ data }: { data: AdminGrowthData }) {
  const [range, setRange] = useState<RangeKey>("7d");

  const filteredDaily = useMemo(
    () => filterDailyByRange(data.daily, range),
    [data.daily, range],
  );

  const rangeNewMembers = sumField(filteredDaily, "newMembers");
  const rangeNewPurchases = sumField(filteredDaily, "newPurchases");

  const chartMinWidth = Math.max(filteredDaily.length * 44, 280);
  const useScrollChart = filteredDaily.length > 10;

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Members & growth</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Growth, sign-ups, purchases, and live session activity in one place.
        </p>
      </div>

      <Card>
        <CardContent className="p-2 sm:p-2.5">
          <div className="flex flex-col gap-1.5 lg:flex-row">
            <KpiGroup title="Growth">
              <CompactStat
                label="Members"
                value={data.totalMembers}
                hint={`+${rangeNewMembers} in range`}
              />
              <CompactStat
                label="Purchases"
                value={data.totalPurchases}
                hint={`+${rangeNewPurchases} in range`}
              />
            </KpiGroup>
            <KpiGroup title="Sessions">
              <CompactStat label="Active 2h" value={data.sessionKpi.activeNow} />
              <CompactStat label="Today" value={data.sessionKpi.loggedInToday} />
            </KpiGroup>
            <KpiGroup title="Demo">
              <CompactStat label="7 days" value={data.demoStats?.last7d ?? 0} />
              <CompactStat label="IPs (7d)" value={data.demoStats?.uniqueIps7d ?? 0} />
            </KpiGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3 space-y-0 p-4 pb-2 sm:p-6 sm:pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-base">Daily activity</CardTitle>
              <p className="text-sm text-muted-foreground">
                New sign-ups vs purchases — separate scales when volumes differ
              </p>
            </div>
            <RangeFilter value={range} onChange={setRange} />
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-2 py-0.5">
              <span className="h-2 w-2 rounded-full bg-[var(--color-chart-1)]" />
              Members{" "}
              <span className="font-semibold tabular-nums text-foreground">{rangeNewMembers}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-2 py-0.5">
              <span className="h-2 w-2 rounded-full bg-[var(--color-chart-2)]" />
              Purchases{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {rangeNewPurchases.toLocaleString("en-IN")}
              </span>
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {filteredDaily.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No activity in this range yet.
            </p>
          ) : (
            <div
              className={cn(
                useScrollChart && "overflow-x-auto pb-1 -mx-1 px-1",
              )}
            >
              <div
                className="h-[240px] sm:h-[280px]"
                style={useScrollChart ? { minWidth: chartMinWidth } : undefined}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={filteredDaily}
                    margin={{ left: 0, right: 4, top: 8, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => tickDate(String(d), useScrollChart)}
                      {...axisProps}
                      interval={useScrollChart ? 0 : "preserveStartEnd"}
                      minTickGap={useScrollChart ? 20 : 28}
                      angle={useScrollChart ? -35 : 0}
                      textAnchor={useScrollChart ? "end" : "middle"}
                      height={useScrollChart ? 48 : 24}
                    />
                    <YAxis
                      yAxisId="members"
                      orientation="left"
                      allowDecimals={false}
                      width={36}
                      tickFormatter={formatAxisNum}
                      {...axisProps}
                    />
                    <YAxis
                      yAxisId="purchases"
                      orientation="right"
                      allowDecimals={false}
                      width={40}
                      tickFormatter={formatAxisNum}
                      {...axisProps}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => (
                        <ChartTooltip
                          active={active}
                          payload={payload as never}
                          label={label as string}
                          formatter={(v) => Number(v).toLocaleString("en-IN")}
                          labelIsDate
                        />
                      )}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                      formatter={(value) =>
                        value === "newMembers" ? "New members" : "New purchases"
                      }
                    />
                    <Line
                      yAxisId="members"
                      type="monotone"
                      dataKey="newMembers"
                      name="newMembers"
                      stroke="var(--color-chart-1)"
                      strokeWidth={2}
                      dot={filteredDaily.length <= 14 ? { r: 2.5, fill: "var(--color-chart-1)" } : false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      yAxisId="purchases"
                      type="monotone"
                      dataKey="newPurchases"
                      name="newPurchases"
                      stroke="var(--color-chart-2)"
                      strokeWidth={2}
                      dot={filteredDaily.length <= 14 ? { r: 2.5, fill: "var(--color-chart-2)" } : false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {useScrollChart ? (
            <p className="mt-2 text-center text-[10px] text-muted-foreground sm:hidden">
              Swipe chart horizontally to see all days
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base">Active now (last 2 hours)</CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.activeSessions.length} user{data.activeSessions.length === 1 ? "" : "s"} with
            recent session activity
          </p>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0 sm:hidden">
          {data.activeSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active users in the last 2 hours.</p>
          ) : (
            data.activeSessions.map((session) => (
              <ActiveSessionMobileRow key={session.id} session={session} />
            ))
          )}
        </CardContent>
        <CardContent className="hidden p-0 sm:block">
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
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base">Joined in the last week</CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.recentMembers.length} new member
            {data.recentMembers.length === 1 ? "" : "s"} in the past 7 days
          </p>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0 sm:hidden">
          {data.recentMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No new members in the last week.</p>
          ) : (
            data.recentMembers.map((member) => (
              <RecentMemberMobileRow key={member.id} member={member} />
            ))
          )}
        </CardContent>
        <CardContent className="hidden p-0 sm:block">
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
