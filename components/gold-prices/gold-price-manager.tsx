"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2, Loader2, Plus, Pencil, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCurrency } from "@/components/currency-provider"
import { formatCurrency, formatDate } from "@/lib/format"
import type { GoldPriceDTO } from "@/lib/types"
import { PURITY_PRESETS, deriveBullionFrom999, PURITY_LABELS } from "@/lib/purity"
import { upsertGoldPrice, deleteGoldPrice } from "@/app/actions/gold-prices"
import { cn } from "@/lib/utils"

const today = () => new Date().toISOString().slice(0, 10)

export function GoldPriceManager({ prices }: { prices: GoldPriceDTO[] }) {
  const router = useRouter()
  const currency = useCurrency()
  const [pending, startTransition] = useTransition()
  const [priceDate, setPriceDate] = useState(today())
  const [pricePerGram, setPricePerGram] = useState(0)
  const [source, setSource] = useState("")
  const [remarks, setRemarks] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)

  const fmt = (v: number) => formatCurrency(v, currency)

  const isEditing = editId !== null

  function loadForEdit(p: GoldPriceDTO) {
    setEditId(p.id)
    setPriceDate(p.priceDate)
    setPricePerGram(p.pricePerGram)
    setSource(p.source ?? "")
    setRemarks(p.remarks ?? "")
  }

  function cancelEdit() {
    setEditId(null)
    setPriceDate(today())
    setPricePerGram(0)
    setSource("")
    setRemarks("")
  }

  // Check if a date already exists — only warn when adding new
  const isDuplicate = !isEditing && prices.some(
    (p) => p.priceDate === priceDate && p.purity === "999"
  )

  const derivedPurities = PURITY_PRESETS.filter((p) => p !== "999")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pricePerGram <= 0) {
      toast.error("Price must be greater than 0")
      return
    }
    startTransition(async () => {
      try {
        await upsertGoldPrice({
          assetType: "gold",
          priceDate,
          purity: "999",
          pricePerGram,
          source: source || null,
          remarks: remarks || null,
        })
        toast.success(isEditing ? "Price updated" : "Gold price saved")
        cancelEdit()
        router.refresh()
      } catch {
        toast.error("Failed to save price")
      }
    })
  }

  function confirmDelete() {
    if (deleteId === null) return
    startTransition(async () => {
      try {
        await deleteGoldPrice(deleteId)
        toast.success("Price deleted")
        setDeleteId(null)
        router.refresh()
      } catch {
        toast.error("Failed to delete")
      }
    })
  }

  return (
    <>
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:sticky lg:top-20 lg:self-start">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">
                {isEditing ? "Edit Price" : "Add Price"}
              </CardTitle>
              <CardDescription className="mt-1">
                {isEditing
                  ? "Update the selected price record."
                  : "One record per metal, purity, and date."}
              </CardDescription>
            </div>
            {isEditing && (
              <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={cancelEdit} title="Cancel edit">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Metal is always Gold for now — hidden */}
            <input type="hidden" value="gold" />
            <div className="space-y-1.5">
              <Label htmlFor="priceDate">Date</Label>
              <Input
                id="priceDate"
                type="date"
                value={priceDate}
                onChange={(e) => setPriceDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ppg">Price / gram (Gold 999 — 24K)</Label>
              <Input
                id="ppg"
                type="number"
                step="0.01"
                min={0}
                value={pricePerGram || ""}
                onChange={(e) => setPricePerGram(e.target.value === "" ? 0 : Number(e.target.value))}
                onFocus={(e) => e.target.select()}
                required
              />
            </div>
            {pricePerGram > 0 && (
              <div className="rounded-md bg-muted/50 px-3 py-2 text-xs space-y-1 text-muted-foreground">
                <p className="font-medium text-foreground">Derived prices (from 999)</p>
                {derivedPurities.map((purity) => {
                  const derived = Math.round(deriveBullionFrom999(pricePerGram, purity) * 100) / 100
                  return (
                    <div key={purity} className="flex justify-between">
                      <span>{PURITY_LABELS[purity] ?? purity}</span>
                      <span className="tabular-nums">{fmt(derived)}</span>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. IBJA, GoodReturns"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="remarks">Remarks</Label>
              <Input
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional"
              />
            </div>
            {isDuplicate && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                A record for 999 on this date already exists. Saving will overwrite it.
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={pending}>
                {pending
                  ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  : isEditing
                  ? <Pencil className="h-4 w-4 mr-2" />
                  : <Plus className="h-4 w-4 mr-2" />}
                {isEditing ? "Update Price" : "Save Price"}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={cancelEdit} disabled={pending}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Price History</CardTitle>
          <CardDescription>{prices.length} recorded prices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Purity</TableHead>
                  <TableHead className="text-right">Price / g</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {prices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No prices recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  prices.map((p) => (
                    <TableRow
                      key={p.id}
                      className={cn("group", editId === p.id && "bg-muted/50")}
                    >
                      <TableCell className="whitespace-nowrap">{formatDate(p.priceDate)}</TableCell>
                      <TableCell>{p.purity}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {fmt(p.pricePerGram)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.source ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            className={cn(
                              "h-8 w-8",
                              editId === p.id
                                ? "text-foreground bg-muted"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => editId === p.id ? cancelEdit() : loadForEdit(p)}
                            aria-label="Edit price"
                            disabled={pending}
                          >
                            {editId === p.id ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(p.id)}
                            aria-label="Delete price"
                            disabled={pending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this price record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this bullion price entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={pending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
