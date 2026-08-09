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
import { useCurrency } from "@/components/currency-provider"
import { formatCurrency, formatDate } from "@/lib/format"
import { updateCashbackStatus } from "@/app/actions/purchases"
import type { PurchaseDTO } from "@/lib/types"
import { cn } from "@/lib/utils"

type Filter = "all" | "Pending" | "Credited" | "Missing"

export function CashbackTracker({ purchases }: { purchases: PurchaseDTO[] }) {
  const router = useRouter()
  const currency = useCurrency()
  const [pending, startTransition] = useTransition()
  const [filter, setFilter] = useState<Filter>("all")
  // confirmingId: which row is in "enter received amount" mode
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [confirmAmount, setConfirmAmount] = useState<string>("")
  const fmt = (v: number) => formatCurrency(v, currency)

  // Only purchases that involve cashback.
  const cashbackRows = useMemo(
    () => purchases.filter((p) => p.cashbackExpected > 0 || p.cashbackReceived > 0),
    [purchases],
  )

  const totals = useMemo(() => {
    let expected = 0   // Pending (optimistic) + Credited (actual received)
    let received = 0   // actual cashbackReceived for Credited rows only
    let pendingAmt = 0 // cashbackExpected for Pending rows
    let missing = 0    // cashbackExpected for Missing rows
    for (const p of cashbackRows) {
      if (p.cashbackStatus === "Credited") {
        received += p.cashbackReceived          // actual
        expected += p.cashbackReceived          // credited: count what actually landed
      } else if (p.cashbackStatus === "Pending") {
        expected += p.cashbackExpected          // optimistic
        pendingAmt += p.cashbackExpected
      } else if (p.cashbackStatus === "Missing") {
        missing += p.cashbackExpected
      }
    }
    return { expected, received, pendingAmt, missing }
  }, [cashbackRows])

  const filtered = useMemo(
    () => (filter === "all" ? cashbackRows : cashbackRows.filter((p) => p.cashbackStatus === filter)),
    [cashbackRows, filter],
  )

  function startCreditConfirm(p: PurchaseDTO) {
    setConfirmingId(p.id)
    setConfirmAmount(String(p.cashbackExpected || ""))
  }

  function markCredited(p: PurchaseDTO, received: number) {
    startTransition(async () => {
      try {
        await updateCashbackStatus(p.id, "Credited", received)
        setConfirmingId(null)
        setConfirmAmount("")
        toast.success("Marked as credited")
        router.refresh()
      } catch {
        toast.error("Failed to update")
      }
    })
  }

  function markMissing(p: PurchaseDTO) {
    startTransition(async () => {
      try {
        await updateCashbackStatus(p.id, "Missing")
        toast.success("Marked as not credited by bank")
        router.refresh()
      } catch {
        toast.error("Failed to update")
      }
    })
  }

  function markPending(p: PurchaseDTO) {
    startTransition(async () => {
      try {
        await updateCashbackStatus(p.id, "Pending")
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
          label="Total Cashback"
          value={fmt(totals.expected)}
          icon={Clock}
          sub="Received + Pending (expected)"
          tooltip="Credited rows use the actual received amount; Pending rows use the expected amount (optimistic). Missing rows are excluded. This matches what's reflected in your effective price."
        />
        <KpiCard
          label="Total Received"
          value={fmt(totals.received)}
          icon={CheckCircle2}
          tone="positive"
          sub="Confirmed by bank"
          tooltip="Cashback that has actually landed in your account. Marks the purchase as fully settled — effective price remains discounted by this amount."
        />
        <KpiCard
          label="Pending"
          value={fmt(totals.pendingAmt)}
          icon={Clock}
          tone="negative"
          sub="Awaiting credit"
          tooltip="Cashback expected but not yet credited by the bank. Still counted in your effective price (optimistic). Mark as 'Credited' once it arrives, or 'Not Credited' if the bank denies it."
        />
        <KpiCard
          label="Not Credited by Bank"
          value={fmt(totals.missing)}
          icon={TriangleAlert}
          tone="negative"
          sub="Bank denied / lapsed"
          tooltip="Cashback the bank did not credit. This amount is excluded from your effective price — the purchase is treated at full cost with no cashback benefit."
        />
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="Pending">Pending</TabsTrigger>
          <TabsTrigger value="Credited">Credited</TabsTrigger>
          <TabsTrigger value="Missing">Not Credited</TabsTrigger>
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No cashback entries in this view.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => {
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
                          {fmt(p.cashbackExpected)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.cashbackStatus === "Credited" ? (
                            <span>
                              {fmt(p.cashbackReceived)}
                              {p.cashbackReceived !== p.cashbackExpected && (
                                <span className={cn("ml-1 text-xs", p.cashbackReceived < p.cashbackExpected ? "text-destructive" : "text-[var(--color-success)]")}>
                                  ({p.cashbackReceived < p.cashbackExpected ? "-" : "+"}{fmt(Math.abs(p.cashbackReceived - p.cashbackExpected))})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={p.cashbackStatus} />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {/* Pending row: inline amount confirm before marking Credited */}
                            {p.cashbackStatus === "Pending" && (
                              confirmingId === p.id ? (
                                <div className="flex items-center gap-1.5">
                                  <Input
                                    type="number"
                                    className="h-8 w-28 text-sm"
                                    value={confirmAmount}
                                    onChange={(e) => setConfirmAmount(e.target.value)}
                                    step="0.01"
                                    min="0"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={pending}
                                    onClick={() => markCredited(p, parseFloat(confirmAmount) || 0)}
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={pending}
                                    onClick={() => { setConfirmingId(null); setConfirmAmount("") }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <Button size="sm" variant="outline" disabled={pending} onClick={() => startCreditConfirm(p)}>
                                    Credited
                                  </Button>
                                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => markMissing(p)}>
                                    Not Credited
                                  </Button>
                                </>
                              )
                            )}
                            {/* Credited row: can mark Not Credited or move back to Pending */}
                            {p.cashbackStatus === "Credited" && (
                              <>
                                <Button size="sm" variant="ghost" disabled={pending} onClick={() => markMissing(p)}>
                                  Not Credited
                                </Button>
                                <Button size="sm" variant="ghost" disabled={pending} onClick={() => markPending(p)}>
                                  Mark Pending
                                </Button>
                              </>
                            )}
                            {/* Not Credited row: can move back to Pending */}
                            {p.cashbackStatus === "Missing" && (
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
    Credited:{ className: "bg-[var(--color-success)]/15 text-[var(--color-success)]", label: "Credited" },
    Missing: { className: "bg-destructive/15 text-destructive", label: "Not Credited by Bank" },
    Pending: { className: "bg-muted text-muted-foreground", label: "Pending" },
  }
  const entry = map[status] ?? { className: "bg-muted text-muted-foreground", label: status }
  return (
    <Badge variant="secondary" className={cn("font-medium", entry.className)}>
      {entry.label}
    </Badge>
  )
}
