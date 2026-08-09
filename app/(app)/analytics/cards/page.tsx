import { CreditCard } from "lucide-react"
import { getPurchases } from "@/app/actions/purchases"
import { getGoldPrices } from "@/app/actions/gold-prices"
import { getSettings } from "@/app/actions/settings"
import { generateCardInsights } from "@/lib/insights"
import { PageHeader } from "@/components/page-header"
import { AnalyticsView } from "@/components/analytics/analytics-view"
import { EmptyState } from "@/components/empty-state"

export default async function CardsAnalyticsPage() {
  const [purchases, prices, settings] = await Promise.all([
    getPurchases(),
    getGoldPrices(),
    getSettings(),
  ])
  const currency = settings?.currency ?? "INR"
  const insights = generateCardInsights(purchases, prices, currency)

  return (
    <div className="space-y-6">
      <PageHeader title="Credit Card Analytics" description="Spend, rewards, and cashback by card" />
      {purchases.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No card data yet"
          description="Add purchases with credit card details to analyze reward performance by card."
        />
      ) : (
        <AnalyticsView purchases={purchases} prices={prices} dimension="card" cardInsights={insights} />
      )}
    </div>
  )
}
