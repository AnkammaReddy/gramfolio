import { Suspense } from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { AuthForm } from "@/components/auth-form"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to GramFolio or try the read-only demo portfolio.",
  alternates: { canonical: "/sign-in" },
}

export default async function SignInPage() {
  const session = await getSession()
  if (session?.user) redirect("/dashboard")
  return (
    <Suspense>
      <AuthForm mode="sign-in" />
    </Suspense>
  )
}
