"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { getBrands } from "@/app/actions/brands"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface BrandComboboxProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export function BrandCombobox({ value, onChange, disabled, placeholder }: BrandComboboxProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    startTransition(async () => {
      const results = await getBrands(value.trim() || undefined)
      setSuggestions(results)
    })
  }, [value])

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
        placeholder={placeholder ?? "e.g. Tanishq"}
        disabled={disabled}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-md border bg-popover py-1 shadow-md">
          {filtered.map((brand) => (
            <li
              key={brand}
              className={cn(
                "cursor-pointer px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
              )}
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(brand)
                setOpen(false)
              }}
            >
              {brand}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
