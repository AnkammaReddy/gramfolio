"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Coins, Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetPasswordWithToken } from "@/app/actions/recover-password"
import { cn } from "@/lib/utils"

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
            className={cn("h-1 flex-1 rounded-full transition-colors", i < score ? level.color : "bg-muted")}
          />
        ))}
      </div>
      <p className={cn("text-[11px]", score <= 1 ? "text-destructive" : score <= 2 ? "text-amber-500" : "text-[var(--color-success)]")}>
        {level.label}
      </p>
    </div>
  )
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") ?? ""
  const [isPending, startTransition] = useTransition()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  if (!token) {
    return (
      <div className="flex min-h-svh items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">Invalid or missing reset link.</p>
          <Link href="/forgot-password" className="text-sm font-medium underline underline-offset-4">
            Start over
          </Link>
        </div>
      </div>
    )
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error("Passwords do not match.")
      return
    }

    startTransition(async () => {
      try {
        await resetPasswordWithToken(token, password)
        toast.success("Password reset successfully. Please sign in.")
        router.push("/sign-in")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Something went wrong.")
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
            Set your<br />new password.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed text-balance">
            Choose a strong password you have not used before.
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
            <h2 className="text-2xl font-bold tracking-tight">Set new password</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a strong password for your account.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="pr-10"
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
              <PasswordStrength password={password} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className={cn(confirm && password !== confirm && "border-destructive focus-visible:ring-destructive")}
              />
              {confirm && password !== confirm && (
                <p className="text-[11px] text-destructive">Passwords do not match.</p>
              )}
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Reset password
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
