import type { Metadata } from "next"
import Link from "next/link"
import { Coins } from "lucide-react"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using GramFolio.",
  alternates: { canonical: "/terms" },
}

const LAST_UPDATED = "1 July 2025"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-2xl px-6 py-14">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Coins className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight group-hover:text-primary transition-colors">GramFolio</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Terms of Service</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 border-t border-border pt-8">
          <Section title="1. Acceptance">
            <p>
              By accessing or using GramFolio (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              GramFolio is a personal portfolio tracking tool that allows users to record and monitor physical gold and precious metal purchases, associated costs, cashback, and rewards. It is provided for personal, non-commercial use.
            </p>
            <p>
              GramFolio is not a financial advisor, broker, or investment platform. Nothing on the Service constitutes financial, investment, or legal advice.
            </p>
          </Section>

          <Section title="3. Accounts">
            <ul className="list-disc pl-5 space-y-1">
              <li>You must provide accurate information when creating an account.</li>
              <li>You are responsible for maintaining the confidentiality of your credentials.</li>
              <li>You must be at least 18 years old to use the Service.</li>
              <li>One account per person. Creating multiple accounts is not permitted.</li>
            </ul>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the Service for any unlawful purpose or in violation of any applicable law.</li>
              <li>Attempt to gain unauthorised access to any part of the Service or its infrastructure.</li>
              <li>Scrape, crawl, or systematically extract data from the Service.</li>
              <li>Use automated tools to create accounts or interact with the Service.</li>
              <li>Share your account credentials with others.</li>
            </ul>
          </Section>

          <Section title="5. Your Data">
            <p>
              You own the data you enter into GramFolio. We do not claim ownership over your
              portfolio entries. By using the Service you grant us a limited licence to store
              and process that data only to provide the Service to you.
            </p>
            <p>
              You can delete your account from Profile &amp; Settings (password required), or
              email{" "}
              <a
                href="mailto:folio@gramfolio.in"
                className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
              >
                folio@gramfolio.in
              </a>
              . Deleting your account removes your login identity; see the Privacy Policy for
              what is removed versus retained in de-linked form.
            </p>
          </Section>

          <Section title="6. Disclaimer of Warranties">
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, error-free, or that prices or calculations displayed are accurate or suitable for making financial decisions.
            </p>
            <p>
              Always verify bullion prices, cashback rates, and return calculations independently before making investment decisions.
            </p>
          </Section>

          <Section title="7. Limitation of Liability">
            <p>
              To the maximum extent permitted by applicable law, GramFolio and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service, including any reliance on data displayed.
            </p>
          </Section>

          <Section title="8. Availability and Changes">
            <p>
              We may modify, suspend, or discontinue any part of the Service at any time without notice. We may also update these Terms periodically. Continued use after changes constitutes acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="9. Governing Law">
            <p>
              These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana, India.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              For any questions about these Terms, contact us at{" "}
              <a href="mailto:folio@gramfolio.in" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                folio@gramfolio.in
              </a>.
            </p>
          </Section>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex items-center justify-between">
          <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">
            Privacy Policy
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
