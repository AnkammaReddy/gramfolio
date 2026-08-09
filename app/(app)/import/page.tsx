import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { CsvImport } from "@/components/import/csv-import"

export const metadata: Metadata = { title: "Import" }

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Purchases"
        description="Upload a CSV, map your columns, preview, then import."
      />
      <CsvImport />
    </div>
  )
}
