"use client"

import { useState } from "react"
import { format, parse, isValid } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field } from "./field"
import { cn } from "@/lib/utils"

/** Convert ISO "yyyy-MM-dd" → display "dd/MM/yyyy" */
function toDisplay(iso: string): string {
  if (!iso) return ""
  try {
    const d = new Date(iso + "T00:00:00")
    if (!isValid(d)) return ""
    return format(d, "dd/MM/yyyy")
  } catch {
    return ""
  }
}

/** Convert display "dd/MM/yyyy" → ISO "yyyy-MM-dd" */
function toISO(display: string): string {
  if (!display || display.length < 10) return ""
  try {
    const d = parse(display, "dd/MM/yyyy", new Date())
    if (!isValid(d)) return ""
    return format(d, "yyyy-MM-dd")
  } catch {
    return ""
  }
}

export function DateField({
  label,
  id,
  value,
  onChange,
  required,
  compact,
}: {
  label: string
  id: string
  value: string
  onChange: (isoDate: string) => void
  required?: boolean
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState<string | null>(null)

  // Derive display: prefer what the user is typing, otherwise format the ISO value
  const displayValue = typed !== null ? typed : toDisplay(value)

  // Parse value back to Date for the calendar
  const selectedDate: Date | undefined = value
    ? (() => {
        const d = new Date(value + "T00:00:00")
        return isValid(d) ? d : undefined
      })()
    : undefined

  const handleTyped = (raw: string) => {
    setTyped(raw)
    if (raw.length === 10) {
      const iso = toISO(raw)
      if (iso) {
        onChange(iso)
        setTyped(null) // normalized — let value drive display
      }
    }
    if (!raw) {
      onChange("")
      setTyped(null)
    }
  }

  const handleCalendarSelect = (day: Date | undefined) => {
    if (!day) return
    onChange(format(day, "yyyy-MM-dd"))
    setTyped(null)
    setOpen(false)
  }

  return (
    <Field label={label} htmlFor={id} compact={compact}>
      <Popover open={open} onOpenChange={setOpen}>
        <div className="flex w-full gap-1.5">
          <Input
            id={id}
            type="text"
            inputMode="numeric"
            placeholder="dd/mm/yyyy"
            value={displayValue}
            onChange={(e) => handleTyped(e.target.value)}
            required={required}
            className="min-w-0 flex-1"
            maxLength={10}
          />
          <PopoverTrigger>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={`Pick ${label}`}
              className={cn(
                "shrink-0",
                selectedDate ? "text-primary border-primary/40" : "text-muted-foreground",
              )}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-auto p-0" align="start" side="bottom">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleCalendarSelect}
            defaultMonth={selectedDate}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>
    </Field>
  )
}
