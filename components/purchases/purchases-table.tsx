"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Search, Pencil, Trash2, Filter, X, Copy } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCurrency } from "@/components/currency-provider"
import { formatCurrency, formatDate, formatWeight } from "@/lib/format"
import { totalWeight } from "@/lib/calculations"
import { deletePurchase } from "@/app/actions/purchases"
import type { PurchaseDTO } from "@/lib/types"
import { CASHBACK_STATUSES } from "@/lib/types"
import { useIsDemo } from "@/components/demo-mode-provider"

const ALL = "__all__"

export function PurchasesTable({ purchases }: { purchases: PurchaseDTO[] }) {
  const router = useRouter()
  const currency = useCurrency()
  const isDemo = useIsDemo()
  const [pending, startTransition] = useTransition()
  const [query, setQuery] = useState("")
  const [website, setWebsite] = useState(ALL)
  const [brand, setBrand] = useState(ALL)
  const [category, setCategory] = useState(ALL)
  const [card, setCard] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [purity, setPurity] = useState(ALL)
  const [showFilters, setShowFilters] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const fmt = (v: number) => formatCurrency(v, currency)

  const unique = (key: keyof PurchaseDTO) =>
    [...new Set(purchases.map((p) => (p[key] as string) ?? "").filter(Boolean))].sort()

  const websites = useMemo(() => unique("website"), [purchases])
  const brands = useMemo(() => unique("brand"), [purchases])
  const cards = useMemo(() => unique("creditCard"), [purchases])
  const purities = useMemo(() => unique("purity"), [purchases])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return purchases.filter((p) => {
      if (website !== ALL && p.website !== website) return false
      if (brand !== ALL && p.brand !== brand) return false
      if (category !== ALL && p.category !== category) return false
      if (card !== ALL && p.creditCard !== card) return false
      if (status !== ALL && p.cashbackStatus !== status) return false
      if (purity !== ALL && p.purity !== purity) return false
      if (q) {
        const hay = [p.brand, p.website, p.merchant, p.creditCard, p.notes, p.remarks, ...p.tags]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [purchases, query, website, brand, category, card, status, purity])

  const activeFilters =
    [website, brand, category, card, status, purity].filter((v) => v !== ALL).length +
    (query ? 1 : 0)

  const clearFilters = () => {
    setQuery("")
    setWebsite(ALL)
    setBrand(ALL)
    setCategory(ALL)
    setCard(ALL)
    setStatus(ALL)
    setPurity(ALL)
  }

  function confirmDelete() {
    if (deleteId == null) return
    const id = deleteId
    startTransition(async () => {
      try {
        await deletePurchase(id)
        toast.success("Purchase deleted")
        setDeleteId(null)
        router.refresh()
      } catch {
        toast.error("Failed to delete purchase")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brand, store, card, tags…"
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters((s) => !s)}
          className="shrink-0"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilters > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilters}
            </Badge>
          )}
        </Button>
        {activeFilters > 0 && (
          <Button variant="ghost" onClick={clearFilters} className="shrink-0">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-3 lg:grid-cols-6">
          <FilterSelect label="Website" value={website} onChange={setWebsite} options={websites} />
          <FilterSelect label="Brand" value={brand} onChange={setBrand} options={brands} />
          <FilterSelect
            label="Category"
            value={category}
            onChange={setCategory}
            options={["Coin", "Bar"]}
          />
          <FilterSelect label="Credit Card" value={card} onChange={setCard} options={cards} />
          <FilterSelect
            label="Cashback"
            value={status}
            onChange={setStatus}
            options={CASHBACK_STATUSES}
          />
          <FilterSelect label="Purity" value={purity} onChange={setPurity} options={purities} />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Weight</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Effective</TableHead>
              <TableHead>Card</TableHead>
              <TableHead className="w-24 sm:w-48">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No purchases match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(p.purchaseDate)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{p.brand ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{p.website ?? ""}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.category}</Badge>
                    <span className="ml-1 text-xs text-muted-foreground">{p.purity}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatWeight(totalWeight(p.weightGrams, p.quantity))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(p.purchasePrice)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {fmt(p.effectiveCost)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{p.creditCard ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-start gap-1">
                      {!isDemo && (
                        <ButtonLink
                          href={`/purchases/new?from=${p.id}`}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 sm:w-auto sm:gap-1.5 sm:px-2"
                          aria-label="Duplicate purchase"
                          title="Duplicate — pre-fills form, update date & price"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline text-xs">Duplicate</span>
                        </ButtonLink>
                      )}
                      <ButtonLink
                        href={`/purchases/${p.id}`}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 sm:w-auto sm:gap-1.5 sm:px-2"
                        aria-label="Edit purchase"
                        title={isDemo ? "Read-only in demo mode" : undefined}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline text-xs">Edit</span>
                      </ButtonLink>
                      {!isDemo && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 sm:w-auto sm:gap-1.5 sm:px-2 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(p.id)}
                          aria-label="Delete purchase"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline text-xs">Delete</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {purchases.length} purchases
      </p>

      <Dialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete purchase?</DialogTitle>
            <DialogDescription>
              This permanently removes the purchase and its reward components. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={pending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: readonly string[]
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={(v) => onChange((v as string) ?? ALL)}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
