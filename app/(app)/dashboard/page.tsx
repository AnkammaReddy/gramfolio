import { Coins, Plus } from "lucide-react"
import { getPurchases } from "@/app/actions/purchases"
import { getGoldPrices } from "@/app/actions/gold-prices"
import { getSettings } from "@/app/actions/settings"
import { generateInsights } from "@/lib/insights"
import { PageHeader } from "@/components/page-header"
import { KpiGrid } from "@/components/dashboard/kpi-grid"
import { DashboardCharts } from "@/components/charts/dashboard-charts"
import { InsightsPanel } from "@/components/dashboard/insights-panel"
import { EmptyState } from "@/components/empty-state"
import { ButtonLink } from "@/components/ui/button-link"
import { DashboardFeedbackBanner } from "@/components/dashboard/feedback-banner"
import { CommunityInsightBanner } from "@/components/dashboard/community-insight-banner"
import { getActiveInsight } from "@/app/actions/community-insight"

export default async function DashboardPage() {
  const [purchases, prices, settings, activeInsight] = await Promise.all([
    getPurchases(),
    getGoldPrices(),
    getSettings(),
    getActiveInsight(),
  ])
  const insights = generateInsights(purchases, prices, settings.currency)

  return (
    <div className="space-y-3">
      <PageHeader
        description="Your gold portfolio at a glance"
        actions={
          <ButtonLink href="/purchases/new" size="sm">
            <Plus className="h-4 w-4" />
            Add Purchase
          </ButtonLink>
        }
      />

      {purchases.length === 0 ? (
        <EmptyState
          icon={Coins}
          title="No purchases yet"
          description="Add your first gold purchase to see your portfolio value, profit/loss, cashback tracking, and analytics come to life."
          action={
            <ButtonLink href="/purchases/new">
              <Plus className="h-4 w-4" />
              Add your first purchase
            </ButtonLink>
          }
        />
      ) : (
        <>
          <DashboardFeedbackBanner />
          {activeInsight && <CommunityInsightBanner insight={activeInsight} />}
          <InsightsPanel insights={insights} />
          <KpiGrid purchases={purchases} prices={prices} />
          <DashboardCharts purchases={purchases} prices={prices} />
        </>
      )}
    </div>
  )
}
