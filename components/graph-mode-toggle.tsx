"use client"

import { useGraphMode } from "@/components/graph-mode-provider"
import { cn } from "@/lib/utils"

export function GraphModeToggle({ className }: { className?: string }) {
  const { mode, setMode, pending } = useGraphMode()
  const options: { value: "purchase" | "effective"; label: string }[] = [
    { value: "purchase", label: "Purchase" },
    { value: "effective", label: "Effective" },
  ]

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-border bg-muted p-0.5 text-xs font-medium",
        pending && "opacity-70",
        className,
      )}
      role="group"
      aria-label="Cost comparison mode"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setMode(o.value)}
          className={cn(
            "rounded-md px-3 py-1.5 transition-colors",
            mode === o.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={mode === o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
