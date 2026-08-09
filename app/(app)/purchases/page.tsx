import { Plus, Coins } from "lucide-react"
import { getPurchases } from "@/app/actions/purchases"
import { PageHeader } from "@/components/page-header"
import { PurchasesTable } from "@/components/purchases/purchases-table"
import { EmptyState } from "@/components/empty-state"
import { ButtonLink } from "@/components/ui/button-link"

export default async function PurchasesPage() {
  const purchases = await getPurchases()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchases"
        description="Manage your gold acquisitions"
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
          description="Start tracking your physical gold by adding your first purchase, or import a CSV."
          action={
            <ButtonLink href="/purchases/new">
              <Plus className="h-4 w-4" />
              Add your first purchase
            </ButtonLink>
          }
        />
      ) : (
        <PurchasesTable purchases={purchases} />
      )}
    </div>
  )
}
