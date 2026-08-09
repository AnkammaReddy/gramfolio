import { betterAuth } from "better-auth"
import { admin } from "better-auth/plugins"
import { Pool } from "pg"

const DEMO_USER_ID = "demo-gramfolio-user"
const DEMO_MAX_SESSIONS = 10

function getBaseURL() {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return process.env.V0_RUNTIME_URL || "http://localhost:3000"
}

const trustedOrigins = [
  process.env.V0_RUNTIME_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined,
  process.env.BETTER_AUTH_URL,
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

// Apply cross-site cookie settings in the v0 preview iframe (no deployment
// env vars at all) OR during Vercel preview deployments (VERCEL_URL is set
// but VERCEL_PROJECT_PRODUCTION_URL is not — meaning it is a branch deploy).
// In stable production both vars are set so we use normal Lax cookies.
const isV0Preview =
  !process.env.VERCEL_URL &&
  !process.env.VERCEL_PROJECT_PRODUCTION_URL &&
  !process.env.BETTER_AUTH_URL

const isVercelPreviewDeploy =
  !!process.env.VERCEL_URL && !process.env.VERCEL_PROJECT_PRODUCTION_URL

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
