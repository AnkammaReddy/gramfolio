"use client"

import { createContext, useContext } from "react"
import { formatCurrency } from "@/lib/format"

const CurrencyContext = createContext<string>("INR")

export function CurrencyProvider({
  currency,
  children,
}: {
  currency: string
  children: React.ReactNode
}) {
  return <CurrencyContext.Provider value={currency}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  return useContext(CurrencyContext)
}

/** Convenience hook returning a bound currency formatter. */
export function useMoney() {
  const currency = useCurrency()
  return (value: number, opts?: { compact?: boolean }) => formatCurrency(value, currency, opts)
}
