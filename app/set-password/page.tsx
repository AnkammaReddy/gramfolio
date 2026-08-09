import { Metadata } from "next"
import { SetPasswordClient } from "./set-password-client"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Set Your Password",
}

export default async function SetPasswordPage() {
  // Ensure user is authenticated
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect("/sign-in")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <SetPasswordClient />
    </div>
  )
}
