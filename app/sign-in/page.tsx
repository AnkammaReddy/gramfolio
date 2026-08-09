import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { AuthForm } from "@/components/auth-form"

export default async function SignInPage() {
  const session = await getSession()
  if (session?.user) redirect("/settings")
  return (
    <Suspense>
      <AuthForm mode="sign-in" />
    </Suspense>
  )
}
