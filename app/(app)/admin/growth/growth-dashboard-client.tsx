"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
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
import type { AdminGrowthData, AdminGrowthDailyPoint } from "@/app/actions/admin-growth";
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

function rangeLabel(range: RangeKey) {
  return RANGE_OPTIONS.find((o) => o.key === range)?.label ?? range;
}

function KpiTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number;
  sub?: string;
  accent?: "chart-1" | "chart-2" | "green" | "blue" | "amber";
}) {
  const accentClass =
    accent === "chart-1"
      ? "border-l-[var(--color-chart-1)]"
      : accent === "chart-2"
        ? "border-l-[var(--color-chart-2)]"
        : accent === "green"
          ? "border-l-green-500"
          : accent === "blue"
            ? "border-l-blue-500"
            : accent === "amber"
              ? "border-l-amber-500"
              : "border-l-border";

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card px-3 py-2.5 border-l-[3px]",
        accentClass,
      )}
    >
      <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums leading-none sm:text-2xl">
        {value.toLocaleString("en-IN")}
      </p>
      {sub ? <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{sub}</p> : null}
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
    <div className="w-full overflow-x-auto pb-0.5">
      <div className="inline-flex min-w-max items-center rounded-lg border border-border bg-muted p-0.5 text-xs font-medium">
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
    </div>
  );
}

function DailyActivityChart({
  title,
  dataKey,
  data,
  rangeTotal,
  range,
  colorVar,
  gradientId,
}: {
  title: string;
  dataKey: "newMembers" | "newPurchases";
  data: AdminGrowthDailyPoint[];
  rangeTotal: number;
  range: RangeKey;
  colorVar: string;
  gradientId: string;
}) {
  const useScrollChart = data.length > 10;
  const chartMinWidth = Math.max(data.length * 44, 260);
  const showDots = data.length <= 14;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1 p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums"
            style={{
              backgroundColor: `color-mix(in oklab, ${colorVar} 15%, transparent)`,
              color: colorVar,
            }}
          >
            +{rangeTotal.toLocaleString("en-IN")} · {rangeLabel(range)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No data in range.</p>
        ) : (
          <div className={cn(useScrollChart && "overflow-x-auto -mx-1 px-1 pb-1")}>
            <div
              className="h-[200px] sm:h-[220px]"
              style={useScrollChart ? { minWidth: chartMinWidth } : undefined}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colorVar} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={colorVar} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
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
                    minTickGap={useScrollChart ? 18 : 24}
                    angle={useScrollChart ? -35 : 0}
                    textAnchor={useScrollChart ? "end" : "middle"}
                    height={useScrollChart ? 44 : 22}
                  />
                  <YAxis
                    allowDecimals={false}
                    width={34}
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
                  <Area
                    type="monotone"
                    dataKey={dataKey}
                    name={title}
                    stroke={colorVar}
                    fill={`url(#${gradientId})`}
                    strokeWidth={2}
                    dot={
                      showDots
                        ? { r: 2.5, fill: colorVar, stroke: "var(--color-background)", strokeWidth: 1 }
                        : false
                    }
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <Badge
      variant={role === "admin" ? "default" : "secondary"}
      className={cn(role === "admin" && "bg-primary")}
    >
      {role}
    </Badge>
  );
}

function MemberTableCell({
  name,
  email,
  trailing,
}: {
  name: string;
  email: string;
  trailing?: ReactNode;
}) {
  return (
    <TableCell className="min-w-[160px] whitespace-normal align-top">
      <p className="font-medium leading-tight">{name}</p>
      <p className="mt-0.5 max-w-[220px] truncate text-xs text-muted-foreground">{email}</p>
      {trailing ? <div className="mt-1.5 flex flex-wrap gap-1">{trailing}</div> : null}
    </TableCell>
  );
}

function ScrollTableSection({
  emptyMessage,
  isEmpty,
  minWidth,
  children,
}: {
  emptyMessage: string;
  isEmpty: boolean;
  minWidth: number;
  children: ReactNode;
}) {
  if (isEmpty) {
    return (
      <CardContent className="p-4 pt-0">
        <p className="text-center text-sm text-muted-foreground sm:text-left">{emptyMessage}</p>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <Table style={{ minWidth }}>{children}</Table>
      </div>
    </CardContent>
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
  const rangeText = rangeLabel(range);

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Members & growth</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Growth, sign-ups, purchases, and live session activity in one place.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <KpiTile
          label="Total members"
          value={data.totalMembers}
          sub={`+${rangeNewMembers} in ${rangeText}`}
          accent="chart-1"
        />
        <KpiTile
          label="Total purchases"
          value={data.totalPurchases}
          sub={`+${rangeNewPurchases.toLocaleString("en-IN")} in ${rangeText}`}
          accent="chart-2"
        />
        <KpiTile
          label="Active (2h)"
          value={data.sessionKpi.activeNow}
          sub="Live members"
          accent="green"
        />
        <KpiTile
          label="Logged in today"
          value={data.sessionKpi.loggedInToday}
          sub="New sessions"
          accent="blue"
        />
        <KpiTile
          label="Demo logins"
          value={data.demoStats?.last7d ?? 0}
          sub="Last 7 days"
          accent="amber"
        />
        <KpiTile
          label="Demo IPs"
          value={data.demoStats?.uniqueIps7d ?? 0}
          sub="Unique · 7 days"
          accent="amber"
        />
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium">Daily activity</p>
          <RangeFilter value={range} onChange={setRange} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <DailyActivityChart
            title="New members"
            dataKey="newMembers"
            data={filteredDaily}
            rangeTotal={rangeNewMembers}
            range={range}
            colorVar="var(--color-chart-1)"
            gradientId="growthMembersFill"
          />
          <DailyActivityChart
            title="New purchases"
            dataKey="newPurchases"
            data={filteredDaily}
            rangeTotal={rangeNewPurchases}
            range={range}
            colorVar="var(--color-chart-2)"
            gradientId="growthPurchasesFill"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base">Active now (last 2 hours)</CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.activeSessions.length} user{data.activeSessions.length === 1 ? "" : "s"} with
            recent session activity
          </p>
        </CardHeader>
        <ScrollTableSection
          emptyMessage="No active users in the last 2 hours."
          isEmpty={data.activeSessions.length === 0}
          minWidth={520}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead className="text-right">Sessions</TableHead>
              <TableHead>Last active</TableHead>
              <TableHead className="hidden md:table-cell">First login</TableHead>
              <TableHead className="hidden lg:table-cell">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.activeSessions.map((session) => (
              <TableRow key={session.id}>
                <MemberTableCell
                  name={session.name}
                  email={session.email}
                  trailing={
                    <>
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
                    </>
                  }
                />
                <TableCell className="text-right tabular-nums">{session.sessionCount}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  <span className="md:hidden">{timeAgo(session.lastActive)}</span>
                  <span className="hidden md:inline">{formatDateTime(session.lastActive)}</span>
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">
                  {formatDateTime(session.firstSession)}
                </TableCell>
                <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                  {session.lastIp ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </ScrollTableSection>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base">Recent purchases (last 7 days)</CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.recentPurchasers.length} member
            {data.recentPurchasers.length === 1 ? "" : "s"} who added purchases this week
          </p>
        </CardHeader>
        <ScrollTableSection
          emptyMessage="No purchases added in the last week."
          isEmpty={data.recentPurchasers.length === 0}
          minWidth={480}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead className="hidden sm:table-cell">Role</TableHead>
              <TableHead className="text-right">This week</TableHead>
              <TableHead className="text-right">All-time</TableHead>
              <TableHead>Last added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.recentPurchasers.map((user) => (
              <TableRow key={user.id}>
                <MemberTableCell
                  name={user.name}
                  email={user.email}
                  trailing={
                    <span className="sm:hidden">
                      <RoleBadge role={user.role} />
                    </span>
                  }
                />
                <TableCell className="hidden sm:table-cell">
                  <RoleBadge role={user.role} />
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {user.recentPurchaseCount}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {user.totalPurchaseCount}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  <span className="md:hidden">{timeAgo(user.lastPurchaseAt)}</span>
                  <span className="hidden md:inline">{formatDateTime(user.lastPurchaseAt)}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </ScrollTableSection>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base">Joined in the last week</CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.recentMembers.length} new member
            {data.recentMembers.length === 1 ? "" : "s"} in the past 7 days
          </p>
        </CardHeader>
        <ScrollTableSection
          emptyMessage="No new members in the last week."
          isEmpty={data.recentMembers.length === 0}
          minWidth={480}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead className="hidden sm:table-cell">Role</TableHead>
              <TableHead className="text-right">Purchases</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="hidden md:table-cell">Last purchase</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.recentMembers.map((member) => (
              <TableRow key={member.id}>
                <MemberTableCell
                  name={member.name}
                  email={member.email}
                  trailing={
                    <span className="sm:hidden">
                      <RoleBadge role={member.role} />
                    </span>
                  }
                />
                <TableCell className="hidden sm:table-cell">
                  <RoleBadge role={member.role} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{member.purchaseCount}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(member.createdAt)}
                </TableCell>
                <TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">
                  {member.lastPurchaseAt ? formatDateTime(member.lastPurchaseAt) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </ScrollTableSection>
      </Card>
    </div>
  );
}
