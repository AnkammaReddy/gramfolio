import { Globe } from "lucide-react"
import { getPurchases } from "@/app/actions/purchases"
import { getGoldPrices } from "@/app/actions/gold-prices"
import { PageHeader } from "@/components/page-header"
import { AnalyticsView } from "@/components/analytics/analytics-view"
import { EmptyState } from "@/components/empty-state"

export default async function WebsitesAnalyticsPage() {
  const [purchases, prices] = await Promise.all([getPurchases(), getGoldPrices()])
  return (
    <div className="space-y-6">
      <PageHeader title="Website Analytics" description="Spend, weight, and savings by store" />
      {purchases.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No website data yet"
          description="Add purchases with website details to compare acquisition costs across stores."
        />
      ) : (
        <AnalyticsView purchases={purchases} prices={prices} dimension="website" />
      )}
    </div>
  )
}
