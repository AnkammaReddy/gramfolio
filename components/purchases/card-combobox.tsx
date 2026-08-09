"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { getCreditCards } from "@/app/actions/credit-cards"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface CardComboboxProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export function CardCombobox({ value, onChange, disabled, placeholder }: CardComboboxProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch suggestions whenever the input value changes
  useEffect(() => {
    if (!value.trim()) {
      // Show all cards when field is focused but empty
      startTransition(async () => {
        const cards = await getCreditCards()
        setSuggestions(cards)
      })
      return
    }
    startTransition(async () => {
      const cards = await getCreditCards(value)
      setSuggestions(cards)
    })
  }, [value])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filtered = suggestions.filter(
    (s) => s.toLowerCase() !== value.toLowerCase(),
  )

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? "e.g. HDFC Regalia"}
        disabled={disabled}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-md border bg-popover py-1 shadow-md">
          {filtered.map((card) => (
            <li
              key={card}
              className={cn(
                "cursor-pointer px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
              )}
              onMouseDown={(e) => {
                e.preventDefault() // prevent blur before click
                onChange(card)
                setOpen(false)
              }}
            >
              {card}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
