import "server-only"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { AUTH_DISABLED, DEMO_USER } from "@/lib/auth-config"

export async function getSession() {
  try {
    return await auth.api.getSession({ headers: await headers() })
  } catch {
    return null
  }
}

/**
 * Returns the current user, honoring the AUTH_DISABLED preview bypass.
 * Returns `null` only when auth is enabled and there is no active session.
 */
export async function getCurrentUser() {
  if (AUTH_DISABLED) return DEMO_USER
  const session = await getSession()
  return session?.user ?? null
}

export async function getUserId() {
  if (AUTH_DISABLED) return DEMO_USER.id
  const session = await getSession()
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}
