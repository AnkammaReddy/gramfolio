import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { CsvExport } from "@/components/export/csv-export"
import { getPurchases } from "@/app/actions/purchases"
import { getGoldPrices } from "@/app/actions/gold-prices"

export const metadata: Metadata = { title: "Export" }

export default async function ExportPage() {
  const [purchases, prices] = await Promise.all([getPurchases(), getGoldPrices()])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Export Data"
        description="Download your purchases, cashback, gold prices, portfolio, and analytics as CSV."
      />
      <CsvExport purchases={purchases} prices={prices} />
    </div>
  )
}
