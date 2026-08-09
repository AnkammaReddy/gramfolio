import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { AuthForm } from "@/components/auth-form"
import { validateInviteToken } from "@/app/actions/invites"

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  try {
    const session = await getSession()
    if (session?.user) redirect("/dashboard")
  } catch {
    // session lookup failed — proceed to sign-up form
  }

  // If a token is present, still validate and prefill email as a convenience
  if (token) {
    const result = await validateInviteToken(token)
    if (result.valid) {
      return <AuthForm mode="sign-up" inviteToken={token} prefillEmail={result.email ?? undefined} />
    }
  }

  return <AuthForm mode="sign-up" />
}
