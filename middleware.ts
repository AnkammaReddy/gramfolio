import { NextRequest, NextResponse } from "next/server"
import { AUTH_DISABLED } from "@/lib/auth-config"

// Public routes that do not require a session
const PUBLIC_PATHS = [
  "/",
  "/faq",
  "/how-it-works",
  "/privacy",
  "/terms",
  "/robots.txt",
  "/sitemap.xml",
  "/sign-in",
  "/sign-up",
  "/api/auth",
  "/invite",
  "/set-password",
  "/forgot-password",
  "/reset-password",
  "/manifest.webmanifest",
]

// Allowed vercel.app hostnames — your stable named URLs that should never be blocked
// e.g. "v0-gramfolio.vercel.app"
const ALLOWED_VERCEL_HOSTNAMES: string[] = [
  "v0-gramfolio.vercel.app",
  // add any other stable aliases here
]

// Random preview deployment URLs follow the pattern:
//   <project-name>-<random alphanum 9+ chars>.vercel.app
// e.g. gold-portfolio-tracker-web-i9k0r38u2.vercel.app
// Your stable URL "v0-gramfolio.vercel.app" has no such suffix and won't match.
const PREVIEW_URL_PATTERN = /-[a-z0-9]{9,}\.vercel\.app$/

// Known bad bot / scanner user-agent patterns
const BOT_UA_PATTERNS = [
  /python-requests/i,
  /go-http-client/i,
  /curl\//i,
  /wget\//i,
  /scrapy/i,
  /nikto/i,
  /sqlmap/i,
  /masscan/i,
  /zgrab/i,
  /nuclei/i,
  /nmap/i,
  /dirbuster/i,
  /hydra/i,          // brute-force tool
  /medusa/i,         // brute-force tool
  /burpsuite/i,
]

// Matches only exact path or sub-paths with a real "/" boundary
function isPublic(pathname: string) {
  if (pathname.includes(".segments")) return false
  return PUBLIC_PATHS.some((p) => {
    if (p === "/") return pathname === "/"
    return pathname === p || pathname.startsWith(p + "/")
  })
}

function isBotUserAgent(ua: string | null): boolean {
  if (!ua) return false
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(ua))
}

export function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl

  // --- Block random hash preview deployment URLs ---
  // Bots discovered URLs like gold-portfolio-tracker-web-i9k0r38u2.vercel.app
  // Block any *.vercel.app hostname that matches the random preview hash pattern
  // BUT explicitly allow stable named URLs like v0-gramfolio.vercel.app
  if (
    PREVIEW_URL_PATTERN.test(hostname) &&
    !ALLOWED_VERCEL_HOSTNAMES.includes(hostname)
  ) {
    return new NextResponse(
      "This preview deployment is not publicly accessible.",
      { status: 403 },
    )
  }

  // --- Block Next.js PPR segment probes ---
  if (pathname.includes(".segments") || pathname.includes("__PAGE__") || pathname.includes("__SEGMENT__")) {
    return new NextResponse(null, { status: 404 })
  }

  // --- Block known bad bot user-agents ---
  const ua = request.headers.get("user-agent")
  if (isBotUserAgent(ua)) {
    return new NextResponse(null, { status: 403 })
  }

  // --- Block requests with no user-agent on sensitive auth routes ---
  if (!ua && (pathname.startsWith("/sign-in") || pathname.startsWith("/forgot-password") || pathname.startsWith("/sign-up"))) {
    return new NextResponse(null, { status: 403 })
  }

  // Let public routes through unconditionally
  if (isPublic(pathname)) return NextResponse.next()

  // When auth is disabled (sandbox / dev preview) skip all session checks
  if (AUTH_DISABLED) return NextResponse.next()

  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals, static assets, and crawl files
    "/((?!_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)",
  ],
}
