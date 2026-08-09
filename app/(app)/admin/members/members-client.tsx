"use client"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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

export function MembersClient({
  users,
  currentUserId,
}: {
  users: UserRow[]
  currentUserId: string
}) {
  const fmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {users.length} member{users.length !== 1 ? "s" : ""} registered
        </p>
      </div>

      <Separator />

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Member</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Purchases</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total spent</th>
              <th className="hidden md:table-cell px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr
                key={u.id}
                className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
              >
                {/* Member name + email — on mobile also shows role badge + action inline */}
                <td className="px-4 py-3">
                  <p className="font-medium leading-tight">
                    {u.name}
                    {u.id === currentUserId && (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                  {/* Mobile-only: banned badge */}
                  {u.banned && (
                    <div className="mt-1.5 sm:hidden">
                      <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Banned</Badge>
                    </div>
                  )}
                </td>
                {/* Banned badge — desktop */}
                
                {/* Purchase count */}
                <td className="px-4 py-3 text-right tabular-nums font-medium">
                  {u.purchase_count}
                </td>
                {/* Total spent */}
                <td className="px-4 py-3 text-right tabular-nums">
                  {u.purchase_count > 0 ? fmt.format(Number(u.purchase_total)) : "—"}
                </td>
                {/* Joined — hidden on mobile */}
                <td className="hidden md:table-cell px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                  {formatDate(u.createdAt)}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>


    </div>
  )
}
