import { Clock, Plus } from "lucide-react"
import { getPurchases } from "@/app/actions/purchases"
import { getGoldPrices } from "@/app/actions/gold-prices"
import { PageHeader } from "@/components/page-header"
import { InvestmentTimeline } from "@/components/timeline/investment-timeline"
import { TimelineSummary } from "@/components/timeline/timeline-summary"
import { EmptyState } from "@/components/empty-state"
import { ButtonLink } from "@/components/ui/button-link"

export default async function TimelinePage() {
  const [purchases, prices] = await Promise.all([getPurchases(), getGoldPrices()])
  return (
    <div className="space-y-6">
      <PageHeader title="Investment Timeline" description="Your purchases in chronological order" />
      {purchases.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Your timeline is empty"
          description="Add purchases to build a chronological view of your gold investment journey."
          action={
            <ButtonLink href="/purchases/new">
              <Plus className="h-4 w-4" />
              Add a purchase
            </ButtonLink>
          }
        />
      ) : (
        <>
          {/* <TimelineSummary purchases={purchases} prices={prices} /> */}
          <InvestmentTimeline purchases={purchases} prices={prices} />
        </>
      )}
    </div>
  )
}
