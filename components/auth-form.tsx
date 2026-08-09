"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { consumeInviteToken } from "@/app/actions/invites"
import { enforceDemoSessionLimit } from "@/app/actions/demo"
import { checkSignupRateLimit } from "@/app/actions/signup-rate-limit"
import { isDisposableEmail } from "@/lib/blocked-email-domains"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Coins, Loader2, Eye, EyeOff, TrendingUp, ShieldCheck, BarChart3, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const DEMO_EMAIL = "demo@gramfolio.app"
const DEMO_PASSWORD = "GramFolio@Demo"

// Disposable/throwaway email domains to block
const BLOCKED_DOMAINS = [
  "mailinator.com", "guerrillamail.com", "temp-mail.org", "throwam.com",
  "yopmail.com", "trashmail.com", "sharklasers.com", "guerrillamailblock.com",
  "grr.la", "spam4.me", "tempinbox.com", "fakeinbox.com", "mailnull.com",
  "maildrop.cc", "dispostable.com", "tempr.email", "discard.email",
]

function validateEmail(email: string): string | null {
  const lower = email.toLowerCase().trim()
  const domain = lower.split("@")[1]
  if (!domain) return "Enter a valid email address."
  if (BLOCKED_DOMAINS.includes(domain)) return "Disposable email addresses are not allowed."
  return null
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters."
  if (!/[A-Z]/.test(password)) return "Include at least one uppercase letter."
  if (!/[0-9]/.test(password)) return "Include at least one number."
  return null
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const levels = [
    { label: "Too short", color: "bg-destructive" },
    { label: "Weak", color: "bg-destructive" },
    { label: "Fair", color: "bg-amber-500" },
    { label: "Good", color: "bg-amber-400" },
    { label: "Strong", color: "bg-[var(--color-success)]" },
  ]
  const level = levels[score]
  if (!password) return null
  return (
    <div className="space-y-1.5 mt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < score ? level.color : "bg-muted",
            )}
          />
        ))}
      </div>
      <p className={cn("text-[11px]", score <= 1 ? "text-destructive" : score <= 2 ? "text-amber-500" : "text-[var(--color-success)]")}>
        {level.label}
      </p>
    </div>
  )
}

export function AuthForm({
  mode,
  inviteToken,
  prefillEmail,
}: {
  mode: "sign-in" | "sign-up"
  inviteToken?: string
  prefillEmail?: string
}) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState(prefillEmail ?? "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [consent, setConsent] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; name?: string; consent?: string }>({})

  const isSignUp = mode === "sign-up"
  const searchParams = useSearchParams()

  const DEMO_DISABLED = false

  useEffect(() => {
    if (!isSignUp && searchParams.get("demo") === "1") {
      if (DEMO_DISABLED) {
        toast.error("Demo access is temporarily disabled for security reasons.")
        return
      }
      runDemoSignIn()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function runDemoSignIn() {
    if (DEMO_DISABLED) {
      toast.error("Demo access is temporarily disabled for security reasons.")
      return
    }
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setLoading(true)
    try {
      const result = await authClient.signIn.email({ email: DEMO_EMAIL, password: DEMO_PASSWORD })
      if (result.error) throw new Error(result.error.message || "Could not sign in to demo account.")
      await enforceDemoSessionLimit()
      toast.success("Signed in as demo user. Look around!")
      await new Promise((r) => setTimeout(r, 300))
      window.location.href = "/settings"
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(message && message !== "[object Event]" ? message : "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  function tryDemo() {
    window.location.href = "/sign-in?demo=1"
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Client-side validation for sign-up
    if (isSignUp) {
      const errors: typeof fieldErrors = {}
      if (!name.trim() || name.trim().length < 2) errors.name = "Enter your full name (at least 2 characters)."
      const emailErr = validateEmail(email)
      if (emailErr) errors.email = emailErr
      const pwErr = validatePassword(password)
      if (pwErr) errors.password = pwErr
      if (!consent) errors.consent = "You must agree to the Privacy Policy and Terms of Service."
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        return
      }
    }
    setFieldErrors({})
    setLoading(true)

    try {
      if (isSignUp) {
        if (isDisposableEmail(email.trim())) {
          throw new Error("Sign-ups with disposable or temporary email addresses are not allowed. Please use a permanent email address.")
        }

        const rateLimit = await checkSignupRateLimit()
        if (!rateLimit.allowed) throw new Error(rateLimit.message)

        const { data, error } = await authClient.signUp.email({ email: email.trim(), password, name: name.trim() })
        if (error) throw new Error(error.message || "Could not create account. Please try again.")
        if (inviteToken && data?.user?.id) {
          await consumeInviteToken(inviteToken, data.user.id)
        }
        toast.success("Account created. Welcome to GramFolio. Please configure your preferences.")
        await new Promise((r) => setTimeout(r, 300))
        window.location.href = "/settings"
      } else {
        // Block demo credentials while demo is disabled
        if (DEMO_DISABLED && email.toLowerCase().trim() === DEMO_EMAIL) {
          throw new Error("Demo access is temporarily disabled for security reasons.")
        }
        const { error } = await authClient.signIn.email({ email: email.trim(), password })
        if (error) throw new Error(error.message || "Invalid email or password.")
        if (email.toLowerCase().trim() === DEMO_EMAIL) {
          await enforceDemoSessionLimit()
        }
        toast.success("Signed in.")
        await new Promise((r) => setTimeout(r, 300))
        window.location.href = "/settings"
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : null
      if (message === "DEMO_READ_ONLY") {
        toast.error("Demo account is read-only. Sign up for a free account to save data.")
      } else {
        toast.error(message && message !== "[object Event]" ? message : "Something went wrong. Please try again.")
      }
      setLoading(false)
    }
  }

  const features = [
    { icon: TrendingUp, text: "Track every gram you own" },
    { icon: BarChart3, text: "Visualise P&L across purities" },
    { icon: ShieldCheck, text: "Monitor cashback & rewards" },
  ]

  return (
    <div className="flex min-h-svh bg-background">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary/8 border-r border-border px-12 py-14">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Coins className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">GramFolio</span>
        </div>
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground text-balance leading-snug">
              Your gold portfolio,<br />always in your hands.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed text-balance">
              Track purchases across brands, monitor bullion prices, and see the real return on every gram — including cashback and rewards.
            </p>
          </div>
          <ul className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm text-foreground">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">gramfolio.in</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo — mobile only */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Coins className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">GramFolio</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">Your Gram Ledger</p>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignUp
                ? "Start tracking your gold portfolio today."
                : "Sign in to view your portfolio."}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: undefined })) }}
                  placeholder="Jim Rogers"
                  required
                  autoComplete="name"
                  className={cn(fieldErrors.name && "border-destructive focus-visible:ring-destructive")}
                />
                {fieldErrors.name && <p className="text-[11px] text-destructive">{fieldErrors.name}</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })) }}
                placeholder="you@example.com"
                required
                autoComplete="email"
                readOnly={isSignUp && !!prefillEmail}
                className={cn(fieldErrors.email && "border-destructive focus-visible:ring-destructive")}
              />
              {fieldErrors.email && <p className="text-[11px] text-destructive">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })) }}
                  placeholder="••••••••"
                  required
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className={cn("pr-10", fieldErrors.password && "border-destructive focus-visible:ring-destructive")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {isSignUp && <PasswordStrength password={password} />}
              {fieldErrors.password && <p className="text-[11px] text-destructive">{fieldErrors.password}</p>}
            </div>

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => { setConsent(e.target.checked); setFieldErrors((p) => ({ ...p, consent: undefined })) }}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    I agree to the{" "}
                    <Link href="/privacy" target="_blank" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                      Privacy Policy
                    </Link>
                    {" "}and{" "}
                    <Link href="/terms" target="_blank" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                      Terms of Service
                    </Link>
                    . I understand this is a personal finance tracking tool and not financial advice.
                  </span>
                </label>
                {fieldErrors.consent && <p className="text-[11px] text-destructive">{fieldErrors.consent}</p>}
              </div>
            )}

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isSignUp ? "Create account" : "Sign in"}
            </Button>

          </form>

          {!isSignUp && (
            <div className="text-center mt-2">
              <Link href="/forgot-password" className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors">
                Forgot password?
              </Link>
            </div>
          )}

          {!isSignUp && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-2 text-[11px] text-muted-foreground">or</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={runDemoSignIn}
              >
                {loading
                  ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  : <ShieldAlert className="h-4 w-4 mr-2 text-primary" />
                }
                Explore with demo account
              </Button>
              <p className="text-center text-[11px] text-muted-foreground mt-1.5">
                Read-only &middot; 15 min session &middot; no sign-up needed
              </p>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? (
              <>Already have an account?{" "}
                <Link href="/sign-in" className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors">Sign in</Link>
              </>
            ) : (
              <>Don&apos;t have an account?{" "}
                <Link href="/sign-up" className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors">Sign up</Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
