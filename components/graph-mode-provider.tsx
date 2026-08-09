"use client"

import { createContext, useContext, useOptimistic, useTransition } from "react"
import { setGraphMode } from "@/app/actions/settings"
import type { GraphMode } from "@/lib/types"

type Ctx = {
  mode: GraphMode
  setMode: (mode: GraphMode) => void
  pending: boolean
}

const GraphModeContext = createContext<Ctx | null>(null)

export function GraphModeProvider({
  initialMode,
  children,
}: {
  initialMode: GraphMode
  children: React.ReactNode
}) {
  const [pending, startTransition] = useTransition()
  const [mode, setOptimistic] = useOptimistic(initialMode)

  function setMode(next: GraphMode) {
    startTransition(async () => {
      setOptimistic(next)
      await setGraphMode(next)
    })
  }

  return (
    <GraphModeContext.Provider value={{ mode, setMode, pending }}>
      {children}
    </GraphModeContext.Provider>
  )
}

export function useGraphMode() {
  const ctx = useContext(GraphModeContext)
  if (!ctx) throw new Error("useGraphMode must be used within GraphModeProvider")
  return ctx
}
