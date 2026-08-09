"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { userSetPassword } from "@/app/actions/user-set-password"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Lock } from "lucide-react"
import { toast } from "sonner"

export function SetPasswordClient() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const passwordsMatch = password === confirmPassword
  const isValidPassword = password.length >= 8
  const canSubmit = passwordsMatch && isValidPassword && !isLoading

  async function handleSetPassword() {
    if (!canSubmit) return

    setIsLoading(true)
    try {
      const result = await userSetPassword(password)

      if (result.success) {
        toast.success("Password set successfully!")
        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          router.push("/")
          router.refresh()
        }, 500)
      } else {
        toast.error(result.message || "Failed to set password")
      }
    } catch (error) {
      console.error("[v0] Error:", error)
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-5 w-5 text-primary" />
          <CardTitle>Set Your Password</CardTitle>
        </div>
        <CardDescription>
          Create a strong password for your account. You received a temporary password from your administrator.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Password Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium">New Password</label>
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Enter password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            {password.length === 0 ? "At least 8 characters required" : `${password.length} characters`}
          </p>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Confirm Password</label>
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            className="font-mono"
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSubmit) {
                handleSetPassword()
              }
            }}
          />
        </div>

        {/* Password Validation */}
        <div className="space-y-1.5 text-sm">
          {password.length > 0 && (
            <div className="flex items-center gap-2">
              {isValidPassword ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              )}
              <span className={isValidPassword ? "text-green-600" : "text-amber-600"}>
                {isValidPassword ? "Strong password" : "At least 8 characters"}
              </span>
            </div>
          )}
          {confirmPassword.length > 0 && (
            <div className="flex items-center gap-2">
              {passwordsMatch ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className={passwordsMatch ? "text-green-600" : "text-red-600"}>
                {passwordsMatch ? "Passwords match" : "Passwords do not match"}
              </span>
            </div>
          )}
        </div>

        {/* Show Password Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm text-muted-foreground">Show password</span>
        </label>

        {/* Submit Button */}
        <Button
          onClick={handleSetPassword}
          disabled={!canSubmit}
          className="w-full"
          size="lg"
        >
          {isLoading ? "Setting password..." : "Set Password"}
        </Button>

        {/* Info */}
        <div className="p-3 rounded-lg bg-muted/40 border border-border">
          <p className="text-xs text-muted-foreground">
            After setting your password, you'll be redirected to your dashboard. Make sure to remember this password for future logins.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
