import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user as userTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { AUTH_DISABLED } from "@/lib/auth-config"
import { PageHeader } from "@/components/page-header"
import { GoldPriceManager } from "@/components/gold-prices/gold-price-manager"
import { getGoldPrices } from "@/app/actions/gold-prices"

export default async function GoldPricesPage() {
  if (!AUTH_DISABLED) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect("/sign-in")
    const [row] = await db
      .select({ role: userTable.role })
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
    if (row?.role !== "admin") redirect("/dashboard")
  }

  const prices = await getGoldPrices()
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bullion Prices"
        description="Manage daily 24K gold prices shared across all members"
      />
      <GoldPriceManager prices={prices} />
    </div>
  )
}
