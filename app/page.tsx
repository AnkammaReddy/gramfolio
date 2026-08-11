import type { Metadata } from "next"
import { redirect } from "next/navigation"
import {
  BarChart3,
  Coins,
  CreditCard,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import { ButtonLink } from "@/components/ui/button-link"
import { getSession } from "@/lib/session"
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME} — Track physical gold & card rewards`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} — Track physical gold & card rewards`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
}

const highlights = [
  {
    icon: Coins,
    title: "Every purchase, one ledger",
    text: "Log brand, weight, purity, and price from Ajio, Tanishq, Myntra, and more.",
  },
  {
    icon: CreditCard,
    title: "Rewards that actually count",
    text: "Track cashback, points, vouchers, SuperCoins, and coupons against each buy.",
  },
  {
    icon: TrendingUp,
    title: "Effective cost per gram",
    text: "See what you really paid after rewards — then compare to the bullion rate.",
  },
  {
    icon: BarChart3,
    title: "Portfolio clarity",
    text: "Dashboard, holdings, and timeline views so your gold position stays readable.",
  },
]

export default async function LandingPage() {
  const session = await getSession()
  if (session?.user) redirect("/dashboard")

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
        },
      },
    ],
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.72_0.13_78_/_0.14),_transparent_55%)]"
          />
          <div className="relative mx-auto max-w-5xl px-6 py-16 sm:py-24">
            <p className="text-sm font-medium text-primary">gramfolio.in</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl text-balance">
              GramFolio
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground leading-relaxed text-pretty">
              Track physical gold buys and credit-card rewards in one place — so you
              know your real effective cost per gram. Not a digital gold buying app.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/sign-up" size="lg">
                Create account
              </ButtonLink>
              <ButtonLink href="/how-it-works" variant="outline" size="lg">
                How it works
              </ButtonLink>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Free to start. Prefer a look first? Use Try demo in the header — read-only sample data.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-14 sm:py-16">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Built for physical gold shoppers
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Spreadsheets break down once cashback lands weeks later and every card
            credits differently. GramFolio keeps purchases, rewards, and bullion
            context together.
          </p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {highlights.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-border bg-primary/5">
          <div className="mx-auto max-w-5xl px-6 py-12 sm:py-14">
            <h2 className="text-xl font-semibold tracking-tight">
              Not sure where to start?
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground leading-relaxed">
              Create a free account when you&apos;re ready, or try the read-only demo from
              the header anytime.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/sign-up">Create account</ButtonLink>
              <ButtonLink href="/faq" variant="outline">
                FAQ
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
