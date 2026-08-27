"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, type ReactNode } from "react"
import { navItems } from "@/lib/nav"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Coins, Lightbulb, LineChart, Menu, LogOut, MessageSquare, Settings as SettingsIcon, ShieldAlert, TrendingUp } from "lucide-react"

function titleFor(pathname: string) {
  const match = [...navItems]
    .filter((i) => (i.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(i.href)))
    .sort((a, b) => b.href.length - a.href.length)[0]
  return match?.title ?? "Dashboard"
}

export function AppHeader({
  user,
  isAdmin = false,
  isDemo = false,
  spotPrices,
}: {
  user: { name?: string | null; email?: string | null; displayName?: string | null }
  isAdmin?: boolean
  isDemo?: boolean
  spotPrices?: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  // Prefer displayName → name → email for label and initials
  const label = user.displayName || user.name || user.email || "U"
  const initials = label
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur sm:gap-3 sm:px-4 lg:h-16 lg:px-6">
      {/* Mobile menu */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" className="lg:hidden shrink-0" aria-label="Open menu" />
          }
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-16 items-center gap-2 px-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Coins className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">GramFolio</span>
          </div>
          <nav className="px-3 py-2">
            <ul className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active =
                  item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/15 text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      {item.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
            {isAdmin && (
              <ul className="mt-3 flex flex-col gap-1">
                <li className="px-3 py-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Admin
                  </span>
                </li>
                <li>
                  <Link
                    href="/admin/growth"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      pathname === "/admin/growth"
                        ? "bg-primary/15 text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <TrendingUp className="h-[18px] w-[18px]" />
                    Members & growth
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/gold-prices"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      pathname === "/admin/gold-prices"
                        ? "bg-primary/15 text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <LineChart className="h-[18px] w-[18px]" />
                    Bullion Prices
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/feedback"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      pathname === "/admin/feedback"
                        ? "bg-primary/15 text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <MessageSquare className="h-[18px] w-[18px]" />
                    Feedback
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/insights"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      pathname === "/admin/insights"
                        ? "bg-primary/15 text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Lightbulb className="h-[18px] w-[18px]" />
                    Insights
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/security-logs"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      pathname === "/admin/security-logs"
                        ? "bg-primary/15 text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <ShieldAlert className="h-[18px] w-[18px]" />
                    Security Logs
                  </Link>
                </li>
              </ul>
            )}
          </nav>
        </SheetContent>
      </Sheet>

      <h1 className="min-w-0 shrink truncate text-base font-semibold tracking-tight">
        {titleFor(pathname)}
      </h1>

      {/* Spot prices — fills the header gap; visible on mobile + desktop */}
      <div className="ml-auto min-w-0 flex-1 overflow-hidden px-1 sm:px-2">
        <div className="flex justify-end">{spotPrices}</div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu" />
            }
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/15 text-xs font-medium text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
            <DropdownMenuItem render={<Link href="/settings" />}>
              <SettingsIcon className="h-4 w-4" />
              Profile & Settings
            </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
