import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import { ButtonLink } from "@/components/ui/button-link"

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about GramFolio: physical gold tracking, credit card rewards, demo access, and how it differs from digital gold apps.",
  alternates: { canonical: "/faq" },
}

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is GramFolio?",
    a: "GramFolio is a personal finance tracker for physical gold purchases. It helps you log buys, attach credit-card rewards and cashback, and see your real effective cost per gram.",
  },
  {
    q: "Is GramFolio a digital gold buying app?",
    a: "No. GramFolio does not sell gold, run SIPs, or store bullion for you. It is a ledger and analytics tool for gold you already buy elsewhere (jewellery, coins, bars, online store purchases).",
  },
  {
    q: "How is GramFolio different from GFolio or other digital gold apps?",
    a: "Those apps help you buy and hold digital gold. GramFolio is for people who buy physical gold with cards and want to track purchase price, rewards, cashback status, and portfolio performance in one place.",
  },
  {
    q: "What does “effective cost per gram” mean?",
    a: "It is roughly purchase price minus vouchers, SuperCoins, reward value, and cashback — then expressed per gram. That is the number you can compare against the bullion rate on the day you bought.",
  },
  {
    q: "Can I try GramFolio before signing up?",
    a: "Yes. Use Try demo on the sign-in page for a read-only sample portfolio. You cannot change demo data.",
  },
  {
    q: "Is my purchase data private?",
    a: "Your portfolio rows are scoped to your account. See the Privacy Policy for what we collect and how we use it.",
  },
  {
    q: "Who is GramFolio for?",
    a: "People in India (and elsewhere) who buy physical gold online or offline with reward cards and want a cleaner answer than a spreadsheet for “what did I actually pay per gram?”",
  },
]

export default function FaqPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a,
      },
    })),
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-14">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">FAQ</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Short answers about what GramFolio is — and what it is not. More detail:{" "}
          <Link
            href="/how-it-works"
            className="text-foreground underline underline-offset-4 hover:text-primary"
          >
            How it works
          </Link>
          .
        </p>

        <div className="mt-10 space-y-8 border-t border-border pt-8">
          {FAQS.map(({ q, a }) => (
            <section key={q} className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">{q}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <ButtonLink href="/sign-up">Create account</ButtonLink>
          <ButtonLink href="/sign-in?demo=1" variant="outline">
            Try demo
          </ButtonLink>
          <ButtonLink href="/privacy" variant="ghost">
            Privacy Policy
          </ButtonLink>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
