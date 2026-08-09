"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle2, Clock, TriangleAlert } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KpiCard } from "@/components/kpi-card"
import { formatDate, formatCurrency } from "@/lib/format"
import { updateRewardPointsStatus } from "@/app/actions/purchases"
import type { PurchaseDTO } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/components/currency-provider"

type Filter = "all" | "Pending" | "Credited" | "Not Credited"

export function RewardPointsTracker({ purchases }: { purchases: PurchaseDTO[] }) {
  const router = useRouter()
  const currency = useCurrency()
  const fmt = (v: number) => formatCurrency(v, currency)
  const [pending, startTransition] = useTransition()
  const [filter, setFilter] = useState<Filter>("all")

  // confirmingId: which row is in "enter received points" mode
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [confirmPoints, setConfirmPoints] = useState<string>("")

  // Compute expected points from earning rate fields, fall back to stored value
  const computedExpected = (p: PurchaseDTO) => {
    if (p.pointsPerMultiple > 0 && p.pointsMultiple > 0) {
      return Math.floor(p.purchasePrice / p.pointsMultiple) * p.pointsPerMultiple
    }
    return p.rewardPointsExpected
  }

  // Convert points to ₹ value using transfer strategy if set, else base value
  // ratio = pointsTransferMultiplier stored as card/partner decimal (e.g. 1:1 → 1.0, 3:5 → 0.6)
  const pointsToValue = (p: PurchaseDTO, pts: number): number => {
    if (pts <= 0) return 0
    if (p.pointsTransferPartner && p.pointsTransferMultiplier > 0) {
      // pts / ratio = partner pts — but we don't have partnerPointValue persisted.
      // Fall back to rewardValue-proportional calc: rewardValue / expectedPts * receivedPts
      const exp = computedExpected(p)
      if (exp > 0 && p.rewardValue > 0) return (pts / exp) * p.rewardValue
      return 0
    }
    return pts * (p.pointsBaseValue > 0 ? p.pointsBaseValue : 0)
  }

  const rewardRows = useMemo(
    () => purchases.filter((p) => p.pointsPerMultiple > 0 || p.rewardPointsExpected > 0 || p.rewardValue > 0),
    [purchases],
  )

  const totals = useMemo(() => {
    let expectedPts = 0
    let creditedPts = 0
    let pendingPts = 0
    let notCreditedPts = 0
    let creditedValue = 0
    let pendingValue = 0
    for (const p of rewardRows) {
      const exp = computedExpected(p)
      if (p.pointsStatus === "Credited") {
        // use actual received points for Credited
        const recv = p.pointsReceived > 0 ? p.pointsReceived : exp
        creditedPts += recv
        creditedValue += pointsToValue(p, recv)
      } else if (p.pointsStatus === "Pending") {
        pendingPts += exp
        pendingValue += pointsToValue(p, exp)
      } else if (p.pointsStatus === "Not Credited") {
        notCreditedPts += exp
      }
    }
    expectedPts = creditedPts + pendingPts
    return { expectedPts, creditedPts, pendingPts, notCreditedPts, creditedValue, pendingValue }
  }, [rewardRows])

  const filtered = useMemo(() => {
    if (filter === "all") return rewardRows
    return rewardRows.filter((p) => p.pointsStatus === filter)
  }, [rewardRows, filter])

  function startCreditConfirm(p: PurchaseDTO) {
    setConfirmingId(p.id)
    setConfirmPoints(String(computedExpected(p)))
  }

  function markCredited(p: PurchaseDTO, receivedPts: number) {
    startTransition(async () => {
      try {
        await updateRewardPointsStatus(
          p.id,
          "Credited",
          receivedPts,
          new Date().toISOString().slice(0, 10),
        )
        setConfirmingId(null)
        setConfirmPoints("")
        toast.success("Marked as credited")
        router.refresh()
      } catch {
        toast.error("Failed to update")
      }
    })
  }

  function markNotCredited(p: PurchaseDTO) {
    startTransition(async () => {
      try {
        await updateRewardPointsStatus(p.id, "Not Credited")
        toast.success("Marked as not credited (MCC)")
        router.refresh()
      } catch {
        toast.error("Failed to update")
      }
    })
  }

  function markPending(p: PurchaseDTO) {
    startTransition(async () => {
      try {
        await updateRewardPointsStatus(p.id, "Pending")
        toast.success("Moved back to pending")
        router.refresh()
      } catch {
        toast.error("Failed to update")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Total Points"
          value={String(Math.round(totals.expectedPts))}
          icon={Clock}
          sub="Received + Pending (expected)"
          tooltip="Credited rows use actual received points; Pending rows use expected. Not Credited excluded."
        />
        <KpiCard
          label="Credited"
          value={String(Math.round(totals.creditedPts))}
          icon={CheckCircle2}
          tone="positive"
          sub={`≈ ${fmt(totals.creditedValue)}`}
          tooltip="Actual points confirmed by the bank, converted to ₹ value using your transfer strategy or base point value."
        />
        <KpiCard
          label="Pending"
          value={String(Math.round(totals.pendingPts))}
          icon={Clock}
          tone="negative"
          sub={`≈ ${fmt(totals.pendingValue)} expected`}
          tooltip="Points not yet credited. Still counted in your effective price optimistically."
        />
        <KpiCard
          label="Not Credited (MCC)"
          value={String(Math.round(totals.notCreditedPts))}
          icon={TriangleAlert}
          tone="negative"
          sub="Excluded from effective price"
          tooltip="Points the bank did not credit due to ineligible MCC. These are excluded from your effective price."
        />
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="Pending">Pending</TabsTrigger>
          <TabsTrigger value="Credited">Credited</TabsTrigger>
          <TabsTrigger value="Not Credited">Not Credited</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="overflow-hidden p-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase</TableHead>
                  <TableHead>Card</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No reward points in this view.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => {
                    const exp = computedExpected(p)
                    const recv = p.pointsStatus === "Credited"
                      ? (p.pointsReceived > 0 ? p.pointsReceived : exp)
                      : null
                    const diff = recv !== null ? recv - exp : 0
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium">{p.brand ?? "Gold"}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(p.purchaseDate)} • {p.website ?? "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{p.creditCard ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {Math.round(exp).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {recv !== null ? (
                            <span>
                              {Math.round(recv).toLocaleString("en-IN")}
                              {diff !== 0 && (
                                <span className={cn("ml-1 text-xs", diff < 0 ? "text-destructive" : "text-[var(--color-success)]")}>
                                  ({diff > 0 ? "+" : ""}{Math.round(diff).toLocaleString("en-IN")})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs text-muted-foreground">
                          {recv !== null
                            ? fmt(pointsToValue(p, recv))
                            : p.pointsStatus === "Pending"
                            ? fmt(pointsToValue(p, exp))
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={p.pointsStatus} />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {p.pointsStatus === "Pending" && (
                              confirmingId === p.id ? (
                                <div className="flex items-center gap-1.5">
                                  <Input
                                    type="number"
                                    className="h-8 w-28 text-sm"
                                    value={confirmPoints}
                                    onChange={(e) => setConfirmPoints(e.target.value)}
                                    step="1"
                                    min="0"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={pending}
                                    onClick={() => markCredited(p, parseInt(confirmPoints) || 0)}
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={pending}
                                    onClick={() => { setConfirmingId(null); setConfirmPoints("") }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <Button size="sm" variant="outline" disabled={pending} onClick={() => startCreditConfirm(p)}>
                                    Credited
                                  </Button>
                                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => markNotCredited(p)}>
                                    Not Credited
                                  </Button>
                                </>
                              )
                            )}
                            {p.pointsStatus === "Credited" && (
                              <>
                                <Button size="sm" variant="ghost" disabled={pending} onClick={() => markNotCredited(p)}>
                                  Not Credited
                                </Button>
                                <Button size="sm" variant="ghost" disabled={pending} onClick={() => markPending(p)}>
                                  Mark Pending
                                </Button>
                              </>
                            )}
                            {p.pointsStatus === "Not Credited" && (
                              <Button size="sm" variant="ghost" disabled={pending} onClick={() => markPending(p)}>
                                Mark Pending
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { className: string; label: string }> = {
    Credited: { className: "bg-[var(--color-success)]/15 text-[var(--color-success)]", label: "Credited" },
    "Not Credited": { className: "bg-destructive/15 text-destructive", label: "Not Credited (MCC)" },
    Pending: { className: "bg-muted text-muted-foreground", label: "Pending" },
  }
  const entry = map[status] ?? { className: "bg-muted text-muted-foreground", label: status }
  return (
    <Badge variant="secondary" className={cn("font-medium", entry.className)}>
      {entry.label}
    </Badge>
  )
}
