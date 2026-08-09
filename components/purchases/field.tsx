import { Label } from "@/components/ui/label"

export function Field({
  label,
  htmlFor,
  children,
  compact,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
  compact?: boolean
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <Label htmlFor={htmlFor} className={compact ? "text-xs" : undefined}>
          {label}
        </Label>
      )}
      {children}
    </div>
  )
}
