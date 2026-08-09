import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { PurchaseForm } from "@/components/purchases/purchase-form"
import { getPurchase } from "@/app/actions/purchases"

export default async function EditPurchasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numId = Number(id)
  if (Number.isNaN(numId)) notFound()
  const data = await getPurchase(numId)
  if (!data) notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Purchase"
        description={`${data.purchase.brand ?? "Gold"} • ${data.purchase.purchaseDate}`}
      />
      <PurchaseForm purchase={data.purchase} initialComponents={data.components} />
    </div>
  )
}
