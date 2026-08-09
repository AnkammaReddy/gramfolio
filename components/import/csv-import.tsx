"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Upload, Download, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  parseCsv,
  downloadCsv,
  IMPORT_FIELDS,
  CSV_TEMPLATE,
  type ImportFieldKey,
} from "@/lib/csv"
import { purchaseSchema, type PurchaseInput } from "@/lib/validation"
import { bulkCreatePurchases } from "@/app/actions/purchases"

const SKIP = "__skip__"
type Step = "upload" | "map" | "preview"

/** Best-effort auto-match a CSV header to a known field. */
function autoMatch(header: string): ImportFieldKey | typeof SKIP {
  const norm = header.toLowerCase().replace(/[^a-z]/g, "")
  for (const f of IMPORT_FIELDS) {
    const key = f.key.toLowerCase()
    const label = f.label.toLowerCase().replace(/[^a-z]/g, "")
    if (norm === key.toLowerCase() || norm === label || label.includes(norm) || norm.includes(key.toLowerCase())) {
      return f.key
    }
  }
  return SKIP
}

export function CsvImport() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>("upload")
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? "")
      const { headers, rows } = parseCsv(text)
      if (headers.length === 0 || rows.length === 0) {
        toast.error("CSV appears to be empty")
        return
      }
      const initialMapping: Record<string, string> = {}
      headers.forEach((h) => {
        initialMapping[h] = autoMatch(h)
      })
      setHeaders(headers)
      setRows(rows)
      setMapping(initialMapping)
      setStep("map")
    }
    reader.readAsText(file)
  }

  // Build mapped + validated records.
  const validation = useMemo(() => {
    if (step !== "preview") return { valid: [] as PurchaseInput[], errors: [] as string[] }
    const fieldToHeader: Partial<Record<ImportFieldKey, string>> = {}
    for (const [header, field] of Object.entries(mapping)) {
      if (field !== SKIP) fieldToHeader[field as ImportFieldKey] = header
    }
    const headerIndex = (h?: string) => (h ? headers.indexOf(h) : -1)
    const valid: PurchaseInput[] = []
    const errors: string[] = []

    rows.forEach((row, i) => {
      const get = (key: ImportFieldKey) => {
        const idx = headerIndex(fieldToHeader[key])
        return idx >= 0 ? (row[idx] ?? "").trim() : ""
      }
      const num = (key: ImportFieldKey) => {
        const v = get(key)
        return v === "" ? 0 : Number(v.replace(/[^0-9.-]/g, ""))
      }
      const raw = {
        assetType: "gold",
        purchaseDate: get("purchaseDate"),
        deliveredDate: get("deliveredDate") || null,
        website: get("website") || null,
        merchant: get("merchant") || null,
        brand: get("brand") || null,
        category: (get("category") || "Coin") as "Coin" | "Bar",
        purity: get("purity") || "999",
        weightGrams: num("weightGrams"),
        quantity: get("quantity") ? Number(get("quantity")) : 1,
        purchasePrice: num("purchasePrice"),
        remarks: get("remarks") || null,
        creditCard: get("creditCard") || null,
        paymentMethod: get("paymentMethod") || null,
        rewardStrategy: get("rewardStrategy") || null,
        rewardPercentage: num("rewardPercentage"),
        rewardPointsExpected: 0,
        rewardValue: num("rewardValue"),
        giftVoucherSavings: num("giftVoucherSavings"),
        superCoinsValue: num("superCoinsValue"),
        couponSavings: num("couponSavings"),
        cashbackExpected: num("cashbackExpected"),
        cashbackReceived: num("cashbackReceived"),
        cashbackCreditedDate: null,
        cashbackStatus: (get("cashbackStatus") || "Pending") as "Pending" | "Credited" | "Missing",
        verified: false,
        notes: get("notes") || null,
        tags: get("tags") ? get("tags").split(/[;|]/).map((t) => t.trim()).filter(Boolean) : [],
        rewardComponents: [],
      }
      const result = purchaseSchema.safeParse(raw)
      if (result.success) {
        valid.push(result.data)
      } else {
        errors.push(`Row ${i + 1}: ${result.error.issues[0]?.message ?? "invalid"}`)
      }
    })
    return { valid, errors }
  }, [step, mapping, rows, headers])

  const requiredMapped = IMPORT_FIELDS.filter((f) => "required" in f && f.required).every((f) =>
    Object.values(mapping).includes(f.key),
  )

  function doImport() {
    startTransition(async () => {
      try {
        const { count } = await bulkCreatePurchases(validation.valid)
        toast.success(`Imported ${count} purchases`)
        router.push("/purchases")
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Import failed"
        toast.error(msg === "DEMO_READ_ONLY" ? "Demo account is read-only. Sign up for a free account to save data." : msg)
      }
    })
  }

  return (
    <div className="space-y-6">
      <Stepper step={step} />

      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload CSV</CardTitle>
            <CardDescription>
              Choose a CSV file of your purchases. Download the template to see the expected columns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">Click to select a CSV file</span>
              <span className="text-xs text-muted-foreground">or drag and drop</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files?.[0]
                if (file) handleFile(file)
              }}
              className="sr-only"
            />
            <Button
              variant="outline"
              onClick={() => downloadCsv("gold-purchases-template.csv", CSV_TEMPLATE)}
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "map" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Map Columns</CardTitle>
            <CardDescription>
              Match your CSV columns to purchase fields. We auto-matched where possible.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {headers.map((header) => (
                <div
                  key={header}
                  className="flex items-center gap-2 rounded-lg border border-border p-2"
                >
                  <span className="flex-1 truncate text-sm font-medium" title={header}>
                    {header}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Select
                    value={mapping[header] ?? SKIP}
                    onValueChange={(v) => setMapping((m) => ({ ...m, [header]: (v as string) ?? SKIP }))}
                  >
                    <SelectTrigger className="h-8 w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SKIP}>Skip column</SelectItem>
                      {IMPORT_FIELDS.map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label}
                          {"required" in f && f.required ? " *" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {!requiredMapped && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Required fields missing</AlertTitle>
                <AlertDescription>
                  Map Purchase Date, Weight, and Purchase Price to continue.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button disabled={!requiredMapped} onClick={() => setStep("preview")}>
                Preview
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview & Confirm</CardTitle>
            <CardDescription>
              {validation.valid.length} valid rows, {validation.errors.length} with errors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-[var(--color-success)]/15 text-[var(--color-success)]">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {validation.valid.length} valid
              </Badge>
              {validation.errors.length > 0 && (
                <Badge variant="secondary" className="bg-destructive/15 text-destructive">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {validation.errors.length} errors
                </Badge>
              )}
            </div>

            {validation.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Some rows could not be parsed</AlertTitle>
                <AlertDescription>
                  <ul className="mt-1 max-h-32 list-disc overflow-y-auto pl-4 text-xs">
                    {validation.errors.slice(0, 10).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="max-h-80 overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Card</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validation.valid.slice(0, 50).map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="whitespace-nowrap">{p.purchaseDate}</TableCell>
                      <TableCell>{p.brand ?? "—"}</TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.weightGrams}g</TableCell>
                      <TableCell className="text-right tabular-nums">{p.purchasePrice}</TableCell>
                      <TableCell>{p.creditCard ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("map")}>
                Back
              </Button>
              <Button disabled={validation.valid.length === 0 || pending} onClick={doImport}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Import {validation.valid.length} purchases
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Stepper({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "Upload" },
    { key: "map", label: "Map Columns" },
    { key: "preview", label: "Preview" },
  ]
  const activeIndex = steps.findIndex((s) => s.key === step)
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <span
            className={
              i <= activeIndex
                ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
                : "flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
            }
          >
            {i + 1}
          </span>
          <span className={i <= activeIndex ? "text-sm font-medium" : "text-sm text-muted-foreground"}>
            {s.label}
          </span>
          {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
        </div>
      ))}
    </div>
  )
}
