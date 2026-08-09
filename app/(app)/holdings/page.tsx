import { Coins, Plus } from "lucide-react"
import { getPurchases } from "@/app/actions/purchases"
import { getGoldPrices } from "@/app/actions/gold-prices"
import { PageHeader } from "@/components/page-header"
import { HoldingsTable } from "@/components/holdings/holdings-table"
import { EmptyState } from "@/components/empty-state"
import { ButtonLink } from "@/components/ui/button-link"

export default async function HoldingsPage() {
  const [purchases, prices] = await Promise.all([getPurchases(), getGoldPrices()])

  return (
    <div className="space-y-6">
      <PageHeader title="Holdings" description="Your current gold positions by brand" />
      {purchases.length === 0 ? (
        <EmptyState
          icon={Coins}
          title="No holdings yet"
          description="Add purchases to see your aggregated holdings, average cost, and returns."
          action={
            <ButtonLink href="/purchases/new">
              <Plus className="h-4 w-4" />
              Add a purchase
            </ButtonLink>
          }
        />
      ) : (
        <HoldingsTable purchases={purchases} prices={prices} />
      )}
    </div>
  )
}
