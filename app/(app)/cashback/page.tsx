import { Gift, Plus } from "lucide-react"
import { getPurchases } from "@/app/actions/purchases"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CashbackTracker } from "@/components/cashback/cashback-tracker"
import { RewardPointsTracker } from "@/components/cashback/reward-points-tracker"
import { EmptyState } from "@/components/empty-state"
import { ButtonLink } from "@/components/ui/button-link"
import { PageHeader } from "@/components/page-header"

export default async function CashbackPage() {
  const purchases = await getPurchases()
  const hasCashback = purchases.some((p) => p.cashbackExpected > 0 || p.cashbackReceived > 0)
  const hasRewards = purchases.some((p) => p.rewardPointsExpected > 0 || p.rewardValue > 0)
  const hasData = hasCashback || hasRewards

  return (
    <div className="space-y-6">
      <PageHeader description="Track your cashback and credit card reward points" />

      {!hasData ? (
        <EmptyState
          icon={Gift}
          title="No rewards to track"
          description="Add purchases with expected cashback or credit card rewards to monitor them here."
          action={
            <ButtonLink href="/purchases/new">
              <Plus className="h-4 w-4" />
              Add a purchase
            </ButtonLink>
          }
        />
      ) : (
        <Tabs defaultValue={hasCashback ? "cashback" : "rewards"} className="space-y-6">
          <TabsList>
            {hasCashback && <TabsTrigger value="cashback">Cashback</TabsTrigger>}
            {hasRewards && <TabsTrigger value="rewards">CC Reward Points</TabsTrigger>}
          </TabsList>

          {hasCashback && (
            <TabsContent value="cashback" className="space-y-6">
              <CashbackTracker purchases={purchases} />
            </TabsContent>
          )}

          {hasRewards && (
            <TabsContent value="rewards" className="space-y-6">
              <RewardPointsTracker purchases={purchases} />
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  )
}
