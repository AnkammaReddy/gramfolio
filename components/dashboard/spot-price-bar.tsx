"use server"

import { db } from "@/lib/db"
import { goldPrices } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { toGoldPriceDTO } from "@/lib/mappers"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ── DB: latest recorded price per purity ──────────────────────────────────────
async function latestPrice(purity: string) {
  const [row] = await db
    .select()
    .from(goldPrices)
    .where(eq(goldPrices.purity, purity))
    .orderBy(desc(goldPrices.priceDate))
    .limit(1)
  return row ? toGoldPriceDTO(row) : null
}

// ── Yahoo Finance: international gold spot (USD/oz) ───────────────────────────
// Unofficial endpoint — no API key, cached 15 min. Fails gracefully.
async function fetchGoldUsd(): Promise<{ price: number; change: number; changePct: number } | null> {
  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=1d",
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 900 }, // 15-minute server cache
      },
    )
    if (!res.ok) return null
    const data = await res.json()
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta?.regularMarketPrice) return null
    const price = meta.regularMarketPrice as number
    const prev = (meta.chartPreviousClose ?? meta.previousClose ?? price) as number
    const change = price - prev
    const changePct = prev !== 0 ? (change / prev) * 100 : 0
    return { price, change, changePct }
  } catch {
    return null
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtInr(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 })
}
function fmtUsd(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 })
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoTip({ content }: { content: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default">
            <Info className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[220px] text-xs leading-snug">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ── Inline variant for embedding in the feedback banner ──────────────────────
export async function InlineSpotPrices() {
  const [p999, goldUsd] = await Promise.all([
    latestPrice("999"),
    fetchGoldUsd(),
  ])

  if (!p999 && !goldUsd) return null

  const changeColor = !goldUsd ? "" : goldUsd.change >= 0 ? "text-[var(--color-success)]" : "text-destructive"

  return (
    <div className="flex items-center gap-2 text-[11px]">
      {p999 && (
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">India</span>
          <span className="font-semibold tabular-nums text-foreground">₹{fmtInr(p999.pricePerGram)}/g</span>
        </div>
      )}
      {p999 && goldUsd && <div className="h-3 w-px bg-border shrink-0" />}
      {goldUsd && (
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Intl.</span>
          <span className="font-semibold tabular-nums text-foreground">${fmtUsd(goldUsd.price)}/oz</span>
          <span className={`tabular-nums ${changeColor}`}>
            ({goldUsd.changePct >= 0 ? "+" : ""}{goldUsd.changePct.toFixed(2)}%)
          </span>
        </div>
      )}
    </div>
  )
}

// ── Full-row component (kept for standalone use) ──────────────────────────────
export async function SpotPriceBar() {
  const [p999, p916, goldUsd] = await Promise.all([
    latestPrice("999"),
    latestPrice("916"),
    fetchGoldUsd(),
  ])

  const hasIndia = p999 || p916
  const hasUsd = goldUsd !== null

  if (!hasIndia && !hasUsd) return null

  const changeColor =
    !goldUsd ? "" :
    goldUsd.change >= 0 ? "text-[var(--color-success)]" : "text-destructive"

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">

      {/* India Spot */}
      {hasIndia && p999 && (
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">India Spot</span>
            <InfoTip
              content={
                <>
                  <p className="font-medium mb-0.5">Source: Mia by Tanishq</p>
                  <p>Prices manually recorded. Last updated: {fmtDate(p999.priceDate)}.</p>
                </>
              }
            />
          </div>
          <span className="text-[10px] text-muted-foreground">999 (24K)</span>
          <span className="text-[11px] font-semibold tabular-nums text-foreground">
            ₹{fmtInr(p999.pricePerGram)}<span className="text-muted-foreground font-normal">/g</span>
          </span>
        </div>
      )}

      {/* Divider */}
      {hasIndia && hasUsd && (
        <div className="h-4 w-px bg-border mx-2 shrink-0" />
      )}

      {/* Intl Spot */}
      {hasUsd && goldUsd && (
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Gold (Intl.)</span>
            <InfoTip
              content={
                <>
                  <p className="font-medium mb-0.5">Source: Yahoo Finance (GC=F)</p>
                  <p>International gold futures in USD. Refreshes every 15 min.</p>
                </>
              }
            />
          </div>
          <span className="text-[11px] font-semibold tabular-nums text-foreground">
            ${fmtUsd(goldUsd.price)}<span className="text-muted-foreground font-normal">/oz</span>
          </span>
          <span className={`text-[11px] tabular-nums ${changeColor}`}>
            {goldUsd.change >= 0 ? "+" : ""}{fmtUsd(goldUsd.change)} ({goldUsd.changePct >= 0 ? "+" : ""}{goldUsd.changePct.toFixed(2)}%)
          </span>
        </div>
      )}

    </div>
  )
}
