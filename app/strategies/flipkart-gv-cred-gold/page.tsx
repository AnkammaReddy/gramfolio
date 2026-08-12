import type { Metadata } from "next"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import { ButtonLink } from "@/components/ui/button-link"
import { CRED_APP_REFERRAL, SBI_CASHBACK_REFERRAL } from "@/lib/referrals"

export const metadata: Metadata = {
  title: "CRED Flipkart GV + card rewards stack for physical gold",
  description:
    "A personal strategy: buy discounted Flipkart gift vouchers on CRED Deal of the Day, pay with CRED IndusInd RuPay Credit Card or SBI Cashback Credit Card, then use the GVs toward physical gold coins.",
  alternates: { canonical: "/strategies/flipkart-gv-cred-gold" },
}

const STEPS = [
  {
    title: "1. Buy Flipkart GVs on CRED Deal of the Day",
    text: "Flipkart gift vouchers are sold inside CRED — not on Flipkart itself. When CRED runs Deal of the Day on these GVs, the face-value discount is often roughly 3.5% to 5%. Open CRED and check the Deal of the Day / store offers for Flipkart vouchers.",
  },
  {
    title: "2. Pay with a 5% rewarding card",
    text: "Two cards that have been working for this buy: CRED IndusInd RuPay Credit Card (~5% CRED points on favourable MCCs) or SBI Cashback Credit Card (~5% cashback on online spends, subject to category caps and T&Cs). Pick one — both stack with the CRED GV discount on the same purchase.",
  },
  {
    title: "3. Stack to roughly 8.5% to 10%",
    text: "Example: ~3.5–5% off on the GV in CRED + ~5% from CRED points or SBI cashback ≈ ~8.5–10% effective discount on the cash that becomes Flipkart GV balance — before you spend it on gold.",
  },
  {
    title: "4. Spend the GVs on physical gold coins",
    text: "Redeem the Flipkart gift voucher toward gold coin purchases where Flipkart GVs are accepted. Log the gold buy in GramFolio with the voucher savings and the card reward (CRED points or SBI cashback) separately so your effective cost per gram stays honest.",
  },
]

export default function FlipkartGvCredGoldStrategyPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-14">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Strategy · Published 12 Aug 2026
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          Buy Flipkart GVs on CRED, pay with a 5% card
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          A personal playbook: pick up discounted Flipkart gift vouchers from
          CRED Deal of the Day, pay with CRED IndusInd RuPay Credit Card or SBI
          Cashback Credit Card for the ~5% card reward stack, then spend the GVs
          on physical gold coins. Offers, MCCs, and reward rates change — treat
          this as one working stack, not advice.
        </p>

        <ol className="mt-10 space-y-8 border-t border-border pt-8">
          {STEPS.map(({ title, text }) => (
            <li key={title} className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </li>
          ))}
        </ol>

        <section className="mt-10 space-y-4 border-t border-border pt-8">
          <h2 className="text-base font-semibold text-foreground">Referrals on this page</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            GramFolio is free to use. Referral and contribute links help keep
            hosting running.
          </p>
          <ul className="space-y-3 text-sm">
            <li className="space-y-1">
              <p className="text-muted-foreground leading-relaxed">
                CRED app invite (Refer &amp; Earn) — not a dedicated IndusInd
                card apply URL. If CRED IndusInd RuPay Credit Card is offered
                inside CRED after you join, that is one card used in this stack.
              </p>
              <a
                href={CRED_APP_REFERRAL.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-amber-700 underline underline-offset-4 hover:opacity-80 dark:text-amber-400"
              >
                Join CRED via this invite
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </li>
            <li className="space-y-1">
              <p className="text-muted-foreground leading-relaxed">
                SBI Cashback Credit Card invite — the other ~5% cashback option
                for this stack.
              </p>
              <a
                href={SBI_CASHBACK_REFERRAL.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-amber-700 underline underline-offset-4 hover:opacity-80 dark:text-amber-400"
              >
                Apply for SBI Cashback Credit Card
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </li>
          </ul>
        </section>

        <section className="mt-10 space-y-2 border-t border-border pt-8">
          <h2 className="text-base font-semibold text-foreground">Caveats</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground leading-relaxed">
            <li>CRED Deal of the Day discounts and eligible vouchers change often.</li>
            <li>
              Card reward % depends on MCC, online vs offline, monthly caps, and
              current CRED / SBI / bank T&amp;Cs.
            </li>
            <li>
              CRED points value depends on how you redeem; SBI cashback is usually
              statement credit — model both honestly in GramFolio.
            </li>
            <li>This is a personal strategy write-up, not financial advice.</li>
          </ul>
        </section>

        <div className="mt-12 rounded-xl border border-border bg-primary/5 px-5 py-5">
          <h2 className="text-sm font-semibold text-foreground">Track the stack in GramFolio</h2>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            Log the gold purchase, attach gift-voucher savings and the card
            reward (CRED points or SBI cashback), and compare effective cost per
            gram with the bullion rate.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href="/sign-up">Create account</ButtonLink>
            <ButtonLink href="/sign-in?demo=1" variant="outline">
              Try demo
            </ButtonLink>
            <ButtonLink href="/how-it-works" variant="ghost">
              How it works
            </ButtonLink>
          </div>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          More context:{" "}
          <Link
            href="/faq"
            className="text-foreground underline underline-offset-4 hover:text-primary"
          >
            FAQ
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  )
}
