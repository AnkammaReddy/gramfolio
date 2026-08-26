"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { navItems } from "@/lib/nav"
import { cn } from "@/lib/utils"
import { Coins, ShieldCheck, MessageSquare, MessageCircle, LineChart, Activity, ShieldAlert, Lightbulb } from "lucide-react"

export function AppSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname()

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-sidebar lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Coins className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-none">GramFolio</span>
          <span className="text-xs text-muted-foreground">Your Gram Ledger</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active =
              item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
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
          {isAdmin && (
            <>
              <li className="mt-3 px-3 py-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Admin
                </span>
              </li>
              <li>
                <Link
                  href="/admin/members"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === "/admin/members"
                      ? "bg-primary/15 text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <ShieldCheck className="h-[18px] w-[18px]" />
                  Members
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/gold-prices"
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
                  href="/admin/messages"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === "/admin/messages"
                      ? "bg-primary/15 text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <MessageCircle className="h-[18px] w-[18px]" />
                  Conversations
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/feedback"
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
                  href="/admin/sessions"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === "/admin/sessions"
                      ? "bg-primary/15 text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Activity className="h-[18px] w-[18px]" />
                  Sessions
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/insights"
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
            </>
          )}
        </ul>
      </nav>
    </aside>
  )
}
