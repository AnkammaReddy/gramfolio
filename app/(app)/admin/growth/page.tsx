import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { AUTH_DISABLED } from "@/lib/auth-config";
import { getAdminGrowthData } from "@/app/actions/admin-growth";
import { GrowthDashboardClient } from "./growth-dashboard-client";

export default async function AdminGrowthPage() {
  noStore();

  if (!AUTH_DISABLED) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/sign-in");
    const [u] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id));
    if (!u || u.role !== "admin") redirect("/dashboard");
  }

  const data = await getAdminGrowthData();

  return <GrowthDashboardClient data={data} />;
}
