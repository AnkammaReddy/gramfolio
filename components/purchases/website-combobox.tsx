"use client"

import { useEffect, useRef, useState } from "react"
import { WEBSITES } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface WebsiteComboboxProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export function WebsiteCombobox({ value, onChange, disabled, placeholder }: WebsiteComboboxProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filtered = WEBSITES.filter(
    (s) => s.toLowerCase() !== value.toLowerCase() &&
      (value.trim() === "" || s.toLowerCase().includes(value.toLowerCase()))
  )

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? "e.g. Flipkart"}
        disabled={disabled}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-md border bg-popover py-1 shadow-md">
          {filtered.map((site) => (
            <li
              key={site}
              className={cn(
                "cursor-pointer px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
              )}
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(site)
                setOpen(false)
              }}
            >
              {site}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
