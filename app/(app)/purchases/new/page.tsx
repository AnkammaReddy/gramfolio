import { PageHeader } from "@/components/page-header"
import { PurchaseForm } from "@/components/purchases/purchase-form"
import { getPurchaseForDuplicate } from "@/app/actions/purchases"

interface Props {
  searchParams: Promise<{ from?: string }>
}

export default async function NewPurchasePage({ searchParams }: Props) {
  const { from } = await searchParams
  const fromId = from ? parseInt(from, 10) : null

  let duplicateSource: Awaited<ReturnType<typeof getPurchaseForDuplicate>> = null
  if (fromId && !isNaN(fromId)) {
    duplicateSource = await getPurchaseForDuplicate(fromId)
  }

  // Pre-fill everything from the source purchase.
  // Only reset tracking fields that belong to the new purchase lifecycle.
  const template = duplicateSource
    ? {
        purchase: {
          ...duplicateSource.purchase,
          id: undefined as unknown as number, // strip id so form treats this as a new purchase
          // Reset cashback/points tracking — these are specific to a purchase instance
          cashbackReceived: 0,
          cashbackCreditedDate: null,
          cashbackStatus: "Pending" as const,
          verified: false,
          pointsReceived: 0,
          pointsCreditedDate: null,
          pointsStatus: "Pending" as const,
          pointsVerified: false,
        },
        components: duplicateSource.components.map((c) => ({
          ...c,
          received: 0,
        })),
      }
    : null

  return (
    <div className="space-y-6">
      <PageHeader
        title={template ? "Duplicate Purchase" : "Add Purchase"}
        description={
          template
            ? "All fields pre-filled from your previous purchase — update whatever has changed."
            : "Record a new gold purchase"
        }
      />
      <PurchaseForm
        purchase={template?.purchase}
        initialComponents={template?.components}
        forceCreate
      />
    </div>
  )
}
