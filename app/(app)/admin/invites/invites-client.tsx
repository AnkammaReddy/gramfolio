"use client"

import { useState } from "react"
import { adminResetUserPassword } from "@/app/actions/admin-password-reset"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Key, RefreshCw, Eye, EyeOff, ShieldCheck, User, Copy, Check } from "lucide-react"
import { toast } from "sonner"
type UserRow = {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
  banned: boolean
  purchase_count: number
  purchase_total: string
}

function formatDate(d: Date | null) {
  if (!d) return "—"
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d))
}

export function InvitesClient({
  users,
  currentUserId,
}: {
  users: UserRow[]
  currentUserId: string
}) {
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [isResetting, setIsResetting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordCopied, setPasswordCopied] = useState(false)

  function generateRandomPassword() {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
    const lower = "abcdefghjkmnpqrstuvwxyz"
    const digits = "23456789"
    const symbols = "@#$%&!"
    const all = upper + lower + digits + symbols
    // Guarantee at least one of each character class
    const password = [
      upper[Math.floor(Math.random() * upper.length)],
      lower[Math.floor(Math.random() * lower.length)],
      digits[Math.floor(Math.random() * digits.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      ...Array.from({ length: 8 }, () => all[Math.floor(Math.random() * all.length)]),
    ]
    // Shuffle
    return password.sort(() => Math.random() - 0.5).join("")
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(newPassword)
    setPasswordCopied(true)
    setTimeout(() => setPasswordCopied(false), 2000)
  }

  async function handleResetPassword() {
    if (!selectedUserId || !newPassword.trim()) {
      toast.error("Please enter a password.")
      return
    }

    setIsResetting(true)
    try {
      await adminResetUserPassword(selectedUserId, newPassword)
      toast.success("Password reset successfully.")
      setResetPasswordOpen(false)
      setSelectedUserId(null)
      setNewPassword("")
    } catch (error) {
      toast.error("Failed to reset password.")
      console.error(error)
    } finally {
      setIsResetting(false)
    }
  }

  function openResetPassword(userId: string) {
    setSelectedUserId(userId)
    setNewPassword(generateRandomPassword())
    setShowPassword(true)
    setPasswordCopied(false)
    setResetPasswordOpen(true)
  }

  const fmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground mt-1">{users.length} member{users.length !== 1 ? "s" : ""} registered</p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => (
          <Card key={u.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate leading-tight">
                    {u.name}
                    {u.id === currentUserId && (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{u.email}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {u.role === "admin" ? (
                    <Badge variant="default" className="gap-1 text-[10px] h-5 px-1.5">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">Member</Badge>
                  )}
                  {u.banned && (
                    <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Banned</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3 pt-0">
              {/* Purchase aggregations */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Purchases</p>
                  <p className="text-lg font-semibold tabular-nums">{u.purchase_count}</p>
                </div>
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total spent</p>
                  <p className="text-lg font-semibold tabular-nums truncate">
                    {u.purchase_count > 0 ? fmt.format(Number(u.purchase_total)) : "—"}
                  </p>
                </div>
              </div>
              {/* Meta + actions */}
              <div className="flex items-center justify-between mt-auto pt-1">
                <p className="text-[11px] text-muted-foreground">Joined {formatDate(u.createdAt)}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs gap-1.5"
                  onClick={() => openResetPassword(u.id)}
                  title="Reset password"
                >
                  <Key className="h-3 w-3" />
                  Reset pwd
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              A random password has been generated for{" "}
              <span className="font-medium text-foreground">
                {users.find((u) => u.id === selectedUserId)?.email || "this user"}
              </span>
              . Copy it and share it with them — they will be prompted to set their own password on next login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isResetting}
                  className="font-mono pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setNewPassword(generateRandomPassword())}
                disabled={isResetting}
                title="Generate new password"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={copyPassword}
                disabled={isResetting}
                title="Copy password"
              >
                {passwordCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              You can edit the password, regenerate it, or copy it to share with the user.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordOpen(false)} disabled={isResetting}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={isResetting || !newPassword.trim()}>
              {isResetting ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
