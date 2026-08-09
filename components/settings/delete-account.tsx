"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deleteAccount } from "@/app/actions/account"
import { signOut } from "@/lib/auth-client"
import { useIsDemo } from "@/components/demo-mode-provider"

export function DeleteAccount() {
  const router = useRouter()
  const isDemo = useIsDemo()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleOpenChange(next: boolean) {
    if (pending) return
    setOpen(next)
    if (!next) {
      setPassword("")
      setShowPassword(false)
    }
  }

  function handleDelete() {
    if (!password) {
      toast.error("Enter your password to confirm")
      return
    }

    startTransition(async () => {
      try {
        await deleteAccount(password)
        toast.success("Account deleted")
        await signOut()
        router.replace("/sign-in")
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete account"
        if (message === "DEMO_READ_ONLY") {
          toast.error("Demo account cannot be deleted")
        } else {
          toast.error(message)
        }
      }
    })
  }

  return (
    <>
      <Card className="border-destructive/40 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Delete Account</CardTitle>
          <CardDescription>
            Permanently remove your login. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setOpen(true)}
            disabled={isDemo}
            title={isDemo ? "Read-only in demo mode" : undefined}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              Your profile, password, sessions, and settings will be permanently deleted. Purchases
              remain stored with a delinked user id and will not appear if you create a new account
              with the same email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 py-2">
            <Label htmlFor="delete-password">Confirm with your password</Label>
            <div className="relative">
              <Input
                id="delete-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Current password"
                autoComplete="current-password"
                disabled={pending}
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending || !password}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
