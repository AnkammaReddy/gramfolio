"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Coins, Loader2, Eye, EyeOff, Info } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { verifyRecoveryPin } from "@/app/actions/recover-password"

export function ForgotPasswordForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState("")
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [pinNotSetError, setPinNotSetError] = useState(false)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Frontend validation — catch empty/invalid inputs before server call
    const trimmedEmail = email.trim()
    const trimmedPin = pin.trim()

    if (!trimmedEmail) {
      toast.error("Please enter your email address.")
      return
    }

    if (!trimmedPin) {
      toast.error("Please enter your recovery PIN.")
      return
    }

    // Basic email format check
    if (!trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      toast.error("Please enter a valid email address.")
      return
    }

    // PIN must be 4-6 digits
    if (trimmedPin.length < 4 || trimmedPin.length > 6) {
      toast.error("PIN must be 4-6 digits.")
      return
    }

    if (!/^\d+$/.test(trimmedPin)) {
      toast.error("PIN must contain only numbers.")
      return
    }

    startTransition(async () => {
      try {
        const { resetToken } = await verifyRecoveryPin(trimmedEmail, trimmedPin)
        toast.success("PIN verified. Set your new password.")
        router.push(`/reset-password?token=${resetToken}`)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Something went wrong."
        if (errorMsg === "NO_PIN_SET") {
          setPinNotSetError(true)
        } else if (errorMsg.includes("Too many attempts")) {
          toast.error("Too many failed attempts. Please try again in 15 minutes.")
        } else {
          toast.error(errorMsg)
        }
      }
    })
  }

  return (
    <div className="flex min-h-svh bg-background">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary/8 border-r border-border px-12 py-14">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Coins className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">GramFolio</span>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-balance leading-snug">
            Recover access<br />to your account.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed text-balance">
            Enter your email and the recovery PIN you set in your profile to reset your password.
          </p>
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
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold tracking-tight">Forgot password?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your email and recovery PIN to continue.
            </p>
          </div>

          {pinNotSetError && (
            <div className="mb-4 rounded-lg border border-border bg-muted/50 p-4 text-sm space-y-2">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
                No recovery PIN found
              </div>
              <p className="text-muted-foreground leading-relaxed">
                This account does not have a recovery PIN set. If you have no purchases on this account, the easiest path is to{" "}
                <Link href="/sign-up" className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                  create a new account
                </Link>.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                If you have purchases and need to merge accounts, sign in and submit a request via the{" "}
                <span className="font-medium text-foreground">Feedback</span> section once you regain access.
              </p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pin">Recovery PIN</Label>
              <div className="relative">
                <Input
                  id="pin"
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="4-6 digit PIN"
                  required
                  inputMode="numeric"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Set your recovery PIN in Profile &amp; Settings.
              </p>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Verify PIN
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/sign-in" className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
