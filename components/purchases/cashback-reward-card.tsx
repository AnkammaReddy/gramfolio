"use client"

import { BadgePercent } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field } from "./field"
import { formatCurrency } from "@/lib/format"
import { useCurrency } from "@/components/currency-provider"

export function CashbackRewardCard({
  percentage,
  expectedValue,
  purchasePrice,
  cashbackCredited,
  onPercentageChange,
  onExpectedChange,
  onCashbackCreditedChange,
}: {
  percentage: number
  expectedValue: number
  purchasePrice: number
  cashbackCredited: number
  onPercentageChange: (v: number) => void
  onExpectedChange: (v: number) => void
  onCashbackCreditedChange: (v: number) => void
}) {
  const currency = useCurrency()
  const fmt = (v: number) => formatCurrency(v, currency)

  const handlePercentageChange = (val: number) => {
    onPercentageChange(val)
    if (purchasePrice > 0) {
      onExpectedChange(Math.round(((purchasePrice * val) / 100) * 100) / 100)
    }
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15">
            <BadgePercent className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-primary">Cashback</h3>
        </div>

        <div className="grid gap-3 grid-cols-2">
          {/* % */}
          <Field label="Cashback %" htmlFor="cb-pct" compact>
            <div className="relative">
              <Input
                id="cb-pct"
                type="number"
                placeholder="e.g. 5"
                value={percentage || ""}
                onChange={(e) => handlePercentageChange(parseFloat(e.target.value) || 0)}
                step="0.01"
                className="pr-7"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
          </Field>

          {/* Expected */}
          <Field label="Expected" htmlFor="cb-exp" compact>
            <Input
              id="cb-exp"
              type="number"
              placeholder="Auto"
              value={expectedValue || ""}
              onChange={(e) => onExpectedChange(parseFloat(e.target.value) || 0)}
              step="0.01"
            />
          </Field>
        </div>

        {/* Inline hint */}
        {purchasePrice > 0 && percentage > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {percentage}% of {fmt(purchasePrice)}{" "}
            = <span className="font-medium text-foreground">{fmt((purchasePrice * percentage) / 100)}</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}
