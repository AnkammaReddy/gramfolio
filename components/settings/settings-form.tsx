"use client"

import { useState, useTransition } from "react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Pencil, Check, X, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { saveSettings } from "@/app/actions/settings"
import { useIsDemo } from "@/components/demo-mode-provider"
import { PasswordSecurity } from "./password-security"

import type { SettingsDTO } from "@/lib/types"



const RANGES = [
  { value: "1m", label: "1 Month" },
  { value: "3m", label: "3 Months" },
  { value: "6m", label: "6 Months" },
  { value: "1y", label: "1 Year" },
  { value: "all", label: "All Time" },
]

export function SettingsForm({
  settings,
  email,
  name,
  hasPinSet,
}: {
  settings: SettingsDTO
  email: string
  name: string
  hasPinSet: boolean
}) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const isDemo = useIsDemo()
  const [pending, startTransition] = useTransition()
  const [displayName, setDisplayName] = useState(settings.displayName ?? "")
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(settings.displayName ?? "")
  const [currency, setCurrency] = useState(settings.currency)
  const [graphMode, setGraphMode] = useState(settings.graphMode)
  const [dateRange, setDateRange] = useState(settings.defaultDateRange)

  function handleSave() {
    startTransition(async () => {
      try {
        await saveSettings({
          displayName: displayName || null,
          currency,
          graphMode,
          defaultDateRange: dateRange,
          theme: theme ?? "system",
        })
        toast.success("Settings saved")
        router.refresh()
      } catch {
        toast.error("Failed to save settings")
      }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name — read-only, from auth */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} disabled className="disabled:opacity-70" />
          </div>
          {/* Email — read-only, from auth */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled className="disabled:opacity-70" />
          </div>
          {/* Display Name — editable inline */}
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Display Name</Label>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  id="displayName"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Enter a display name"
                  autoFocus
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0"
                  onClick={() => {
                    setDisplayName(draftName)
                    setEditingName(false)
                    // Immediately persist so it survives sign-out
                    startTransition(async () => {
                      try {
                        await saveSettings({
                          displayName: draftName || null,
                          currency,
                          graphMode,
                          defaultDateRange: dateRange,
                          theme: theme ?? "system",
                        })
                        toast.success("Display name saved")
                        router.refresh()
                      } catch {
                        toast.error("Failed to save display name")
                      }
                    })
                  }}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0"
                  onClick={() => {
                    setDraftName(displayName)
                    setEditingName(false)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={displayName || ""}
                  disabled
                  placeholder="Not set"
                  className="flex-1 disabled:opacity-70"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0"
                  onClick={() => {
                    setDraftName(displayName)
                    setEditingName(true)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Shown in the app instead of your full name.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferences</CardTitle>
          <CardDescription>Defaults applied across the app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" value="₹ Indian Rupee (INR)" disabled className="disabled:opacity-70" />
          </div>
          <div className="space-y-1.5">
            <Label>Default Graph Mode</Label>
            <Select value={graphMode} onValueChange={(v) => setGraphMode(v as "purchase" | "effective")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="purchase">Purchase Price</SelectItem>
                <SelectItem value="effective">Effective Cost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Default Dashboard Range</Label>
            <Select value={dateRange} onValueChange={(v) => setDateRange((v as string) ?? dateRange)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Theme</Label>
            <Select value={theme ?? "light"} onValueChange={(v) => setTheme((v as string) ?? "light")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-2 flex items-center gap-3">
        <Button onClick={handleSave} disabled={pending || isDemo} title={isDemo ? "Read-only in demo mode" : undefined}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
        {isDemo && <p className="text-xs text-muted-foreground">Read-only in demo mode.</p>}
      </div>

      {/* PIN nudge — shown only when PIN has not been set */}
      {!hasPinSet && !isDemo && (
        <div className="lg:col-span-2 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-foreground">Recovery PIN not set</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Set a 4–6 digit PIN below so you can recover your account if you ever forget your password.
            </p>
          </div>
        </div>
      )}

      {/* Password & Security Section */}
      <div className="lg:col-span-2">
        <PasswordSecurity hasPinSet={hasPinSet} />
      </div>
    </div>
  )
}
