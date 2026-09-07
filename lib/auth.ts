import { betterAuth } from "better-auth"
import { admin } from "better-auth/plugins"
import { Pool } from "pg"

const DEMO_USER_ID = "demo-gramfolio-user"
const DEMO_MAX_SESSIONS = 10

// Vercel sets VERCEL_PROJECT_PRODUCTION_URL (and we set BETTER_AUTH_URL) to the
// STABLE production domain on every environment, including Preview deployments.
// On Preview, that means both would point at gramfolio.in instead of the preview's
// own dynamic *.vercel.app URL — so they must be skipped there, or baseURL never
// matches the preview's real origin and Better Auth rejects it with "Invalid origin".
function getBaseURL() {
  const isPreview = process.env.VERCEL_ENV === "preview"
  if (!isPreview && process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL
  if (!isPreview && process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return process.env.V0_RUNTIME_URL || "http://localhost:3000"
}

const trustedOrigins = [
  process.env.V0_RUNTIME_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  // Vercel's stable per-branch alias, distinct from the per-deployment VERCEL_URL hash.
  process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : undefined,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined,
  process.env.BETTER_AUTH_URL,
  // Safety net: trusts any *.vercel.app deployment of this exact project (preview
  // hash URLs, branch aliases) without trusting unrelated apps on the shared
  // vercel.app domain.
  "https://gold-portfolio-tracker-*.vercel.app",
  // Production domains
  "https://gramfolio.in",
  "https://www.gramfolio.in",
  "https://v0-gramfolio.vercel.app",
  // v0 sandbox previews — wildcard matches any subdomain
  "https://*.vusercontent.net",
  "https://v0.dev",
  "https://v0.app",
  // localhost
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
].filter(Boolean) as string[]

// Apply cross-site cookie settings in the v0 preview iframe (no VERCEL_ENV at all)
// OR during real Vercel Preview deployments. VERCEL_ENV is the reliable Vercel-provided
// flag for this — VERCEL_PROJECT_PRODUCTION_URL is present on Preview too, so it cannot
// be used to distinguish preview from production.
const isV0Preview = !process.env.VERCEL_ENV && !process.env.BETTER_AUTH_URL

const isVercelPreviewDeploy = process.env.VERCEL_ENV === "preview"

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  baseURL: getBaseURL(),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [admin()],
  session: {
    expiresIn: 60 * 60 * 24 * 7,        // 7 days for real members
    updateAge: 60 * 60 * 2,              // refresh session every 2 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,                    // re-validate with DB every 5 min
    },
  },
  // Google Sign-In kept ready but disabled until credentials are provided.
  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : undefined,
  advanced: {
    ...(isVercelPreviewDeploy
      ? {
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        }
      : {}),
    ...(isV0Preview || process.env.NODE_ENV === "development"
      ? {
          useSecureCookies: false,
          defaultCookieAttributes: {
            sameSite: "lax" as const,
            secure: false,
          },
        }
      : {}),
  },
})
