import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import { ButtonLink } from "@/components/ui/button-link"

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How GramFolio tracks physical gold purchases, card rewards, cashback, and effective cost per gram.",
  alternates: { canonical: "/how-it-works" },
}

const STEPS = [
  {
    title: "1. Log each gold purchase",
    text: "Add the date, brand or website, weight, purity, and what you paid. Keep one row per buy so history stays clean.",
  },
  {
    title: "2. Attach rewards and cashback",
    text: "Record cashback %, reward points, gift vouchers, SuperCoins, and coupons on the same purchase. Mark cashback as pending, credited, or missing as it lands.",
  },
  {
    title: "3. See effective cost per gram",
    text: "GramFolio subtracts reward value from the purchase price so you can compare your real cost with the bullion rate around that day.",
  },
  {
    title: "4. Review the portfolio",
    text: "Use the dashboard, holdings, timeline, and card/website insights to see which buys and cards actually saved you money.",
  },
]

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-14">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          How it works
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          GramFolio is a ledger for physical gold you buy with cards — not a place
          to purchase digital gold. Four steps cover the usual flow.
        </p>

        <ol className="mt-10 space-y-8 border-t border-border pt-8">
          {STEPS.map(({ title, text }) => (
            <li key={title} className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 rounded-xl border border-border bg-primary/5 px-5 py-5">
          <h2 className="text-sm font-semibold text-foreground">Try it with sample data</h2>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            Open the read-only demo from sign-in. No password hunting required on this
            page — use the demo button there.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href="/sign-up">Create account</ButtonLink>
            <ButtonLink href="/sign-in?demo=1" variant="outline">
              Try demo
            </ButtonLink>
            <ButtonLink href="/faq" variant="ghost">
              Read the FAQ
            </ButtonLink>
          </div>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Questions about privacy? See the{" "}
          <Link
            href="/privacy"
            className="text-foreground underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  )
}
