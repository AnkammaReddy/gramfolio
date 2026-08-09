/**
 * Preview-only authentication bypass.
 *
 * While `AUTH_DISABLED` is `true`, the app skips the sign-in requirement and
 * scopes all data to a single fixed demo user so you can explore every feature
 * without logging in. No auth code is removed — set this back to `false`
 * (and add `BETTER_AUTH_SECRET`) to re-enable real email/password auth.
 */
export const AUTH_DISABLED = false

/** The user that all data is attributed to while auth is bypassed. */
export const DEMO_USER = {
  id: "demo-user",
  name: "Demo User",
  email: "demo@aurum.app",
}

/** The real DB user ID used for the live demo account. */
export const DEMO_USER_DB_ID = "demo-gramfolio-user"

/**
 * Throws a user-friendly error if the caller is the demo account.
 * Call this at the top of any server action that mutates data.
 */
export function assertNotDemo(userId: string): void {
  if (userId === DEMO_USER.id || userId === DEMO_USER_DB_ID) {
    throw new Error("DEMO_READ_ONLY")
  }
}
