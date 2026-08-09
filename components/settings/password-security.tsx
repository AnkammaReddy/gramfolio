'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { setPassword, setRecoveryPin } from '@/app/actions/settings-password'
import { useIsDemo } from '@/components/demo-mode-provider'

export function PasswordSecurity({ hasPinSet = true }: { hasPinSet?: boolean }) {
  const isDemo = useIsDemo()
  const [pending, startTransition] = useTransition()

  // Password section state
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  // PIN section state — auto-expand if PIN not yet set
  const [showPinForm, setShowPinForm] = useState(!hasPinSet)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')

  function handleSetPassword() {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    startTransition(async () => {
      try {
        await setPassword(newPassword)
        toast.success('Password changed successfully')
        setNewPassword('')
        setConfirmPassword('')
        setShowPasswordForm(false)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to change password')
      }
    })
  }

  function handleSetPin() {
    if (pin !== confirmPin) {
      toast.error('PINs do not match')
      return
    }

    if (!/^\d{4,6}$/.test(pin)) {
      toast.error('PIN must be 4-6 digits')
      return
    }

    startTransition(async () => {
      try {
        await setRecoveryPin(pin)
        toast.success('Recovery PIN set successfully')
        setPin('')
        setConfirmPin('')
        setShowPinForm(false)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to set PIN')
      }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
          <CardDescription>Update your login password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showPasswordForm ? (
            <Button
              onClick={() => setShowPasswordForm(true)}
              disabled={isDemo}
              title={isDemo ? 'Read-only in demo mode' : undefined}
              variant="outline"
              className="w-full"
            >
              Change Password
            </Button>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSetPassword}
                  disabled={pending}
                  className="flex-1"
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Password
                </Button>
                <Button
                  onClick={() => {
                    setShowPasswordForm(false)
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recovery PIN Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recovery PIN</CardTitle>
          <CardDescription>Set a PIN to recover your account if you forget your password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showPinForm ? (
            <Button
              onClick={() => setShowPinForm(true)}
              disabled={isDemo}
              title={isDemo ? 'Read-only in demo mode' : undefined}
              variant="outline"
              className="w-full"
            >
              Set Recovery PIN
            </Button>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="pin">PIN (4-6 digits)</Label>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 4-6 digit PIN"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Only numbers allowed. Example: 123456
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPin">Confirm PIN</Label>
                <Input
                  id="confirmPin"
                  type="password"
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Confirm PIN"
                  maxLength={6}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSetPin}
                  disabled={pending}
                  className="flex-1"
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save PIN
                </Button>
                <Button
                  onClick={() => {
                    setShowPinForm(false)
                    setPin('')
                    setConfirmPin('')
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
