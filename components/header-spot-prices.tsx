import type { GoldPriceDTO } from "@/lib/types"
import { SpotPriceSourceInfo } from "@/components/spot-price-source-info"

/** Yahoo Finance international gold spot (USD/oz). Fails gracefully. */
async function fetchGoldUsd(): Promise<{ price: number; changePct: number } | null> {
  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=1d",
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 900 },
      },
    )
    if (!res.ok) return null
    const data = await res.json()
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta?.regularMarketPrice) return null
    const price = meta.regularMarketPrice as number
    const prev = (meta.chartPreviousClose ?? meta.previousClose ?? price) as number
    const changePct = prev !== 0 ? ((price - prev) / prev) * 100 : 0
    return { price, changePct }
  } catch {
    return null
  }
}

function fmtInr(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 })
}
function fmtUsd(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 })
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

function latestByPurity(prices: GoldPriceDTO[], purity: string) {
  return prices.find((p) => p.purity === purity) ?? null
}

/**
 * Compact spot prices for the sticky app header gap — mobile + desktop.
 */
export async function HeaderSpotPrices({ prices }: { prices: GoldPriceDTO[] }) {
  const india = latestByPurity(prices, "999") ?? latestByPurity(prices, "916")
  const goldUsd = await fetchGoldUsd()

  if (!india && !goldUsd) return null

  const changeColor =
    !goldUsd ? "" : goldUsd.changePct >= 0 ? "text-[var(--color-success)]" : "text-destructive"

  return (
    <div className="flex items-center justify-end gap-1.5 overflow-hidden text-[10px] sm:gap-2 sm:text-[11px]">
      {india && (
        <div className="flex min-w-0 items-center gap-0.5 whitespace-nowrap sm:gap-1">
          <span className="hidden font-semibold uppercase tracking-wide text-muted-foreground sm:inline">
            India
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            ₹{fmtInr(india.pricePerGram)}
            <span className="text-muted-foreground font-normal">/g</span>
          </span>
        </div>
      )}
      {india && goldUsd && <div className="h-3 w-px shrink-0 bg-border" />}
      {goldUsd && (
        <div className="flex min-w-0 items-center gap-0.5 whitespace-nowrap sm:gap-1">
          <span className="hidden font-semibold uppercase tracking-wide text-muted-foreground sm:inline">
            Intl.
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            ${fmtUsd(goldUsd.price)}
            <span className="text-muted-foreground font-normal">/oz</span>
          </span>
          <span className={`hidden tabular-nums sm:inline ${changeColor}`}>
            ({goldUsd.changePct >= 0 ? "+" : ""}
            {goldUsd.changePct.toFixed(1)}%)
          </span>
        </div>
      )}
      <SpotPriceSourceInfo indiaUpdated={india ? fmtDate(india.priceDate) : null} />
    </div>
  )
}
