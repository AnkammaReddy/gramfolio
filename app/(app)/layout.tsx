export const dynamic = 'force-dynamic'

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { getCurrentUser } from "@/lib/session"
import { getSettings } from "@/app/actions/settings"
import { getGoldPrices } from "@/app/actions/gold-prices"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { HeaderSpotPrices } from "@/components/header-spot-prices"
import { GraphModeProvider } from "@/components/graph-mode-provider"
import { CurrencyProvider } from "@/components/currency-provider"
import { DemoModeProvider } from "@/components/demo-mode-provider"
import { db } from "@/lib/db"
import { user as userTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { AUTH_DISABLED } from "@/lib/auth-config"
import { TalkToAdminFab } from "@/components/messages/talk-to-admin-fab"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")

  const [settings, prices] = await Promise.all([getSettings(), getGoldPrices()])

  // Determine admin role — when auth is disabled, default to admin so the nav is visible
  let isAdmin = AUTH_DISABLED
  let isDemo = false
  if (!AUTH_DISABLED) {
    const [row] = await db
      .select({ role: userTable.role })
      .from(userTable)
      .where(eq(userTable.id, user.id))
    isAdmin = row?.role === "admin"
    isDemo = row?.role === "demo"
  }

  return (
    <DemoModeProvider isDemo={isDemo}>
    <CurrencyProvider currency={settings.currency}>
      <GraphModeProvider initialMode={settings.graphMode}>
        <div className="flex min-h-svh bg-background">
          <AppSidebar isAdmin={isAdmin} />
          <div className="flex min-w-0 flex-1 flex-col">
            <AppHeader
              user={{ name: user.name, email: user.email, displayName: settings.displayName ?? null }}
              isAdmin={isAdmin}
              isDemo={isDemo}
              spotPrices={
                <Suspense fallback={null}>
                  <HeaderSpotPrices prices={prices} />
                </Suspense>
              }
            />
            {isDemo && (
              <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs text-amber-700 dark:text-amber-400">
                You are viewing a read-only demo account. Data shown is sample data only.
              </div>
            )}
            <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
            {!isAdmin && <TalkToAdminFab />}
          </div>
        </div>
      </GraphModeProvider>
    </CurrencyProvider>
    </DemoModeProvider>
  )
}
