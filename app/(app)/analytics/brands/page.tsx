import { Tag } from "lucide-react"
import { getPurchases } from "@/app/actions/purchases"
import { getGoldPrices } from "@/app/actions/gold-prices"
import { PageHeader } from "@/components/page-header"
import { AnalyticsView } from "@/components/analytics/analytics-view"
import { EmptyState } from "@/components/empty-state"

export default async function BrandsAnalyticsPage() {
  const [purchases, prices] = await Promise.all([getPurchases(), getGoldPrices()])
  return (
    <div className="space-y-6">
      <PageHeader title="Brand Analytics" description="Weight, investment, and current value by brand" />
      {purchases.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No brand data yet"
          description="Add purchases with brand details to see holdings and value by brand."
        />
      ) : (
        <AnalyticsView purchases={purchases} prices={prices} dimension="brand" />
      )}
    </div>
  )
}
