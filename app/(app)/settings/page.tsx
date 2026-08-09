import { PageHeader } from "@/components/page-header"
import { SettingsForm } from "@/components/settings/settings-form"
import { getSettings } from "@/app/actions/settings"
import { getSession, getUserId } from "@/lib/session"
import { db } from "@/lib/db"
import { userSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export default async function SettingsPage() {
  const [settings, session, userId] = await Promise.all([getSettings(), getSession(), getUserId()])

  // Query recoveryPin directly from DB — it is intentionally excluded from SettingsDTO
  const [row] = await db
    .select({ recoveryPin: userSettings.recoveryPin })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))

  const hasPinSet = row?.recoveryPin != null && row.recoveryPin !== ""

  return (
    <div className="space-y-6">
      <PageHeader title="Profile & Settings" description="Manage your profile, preferences and account security" />
      <SettingsForm
        settings={settings}
        email={session?.user?.email ?? ""}
        name={session?.user?.name ?? ""}
        hasPinSet={hasPinSet}
      />
    </div>
  )
}
