import Link from "next/link"
import { Coins } from "lucide-react"

export const metadata = {
  title: "Privacy Policy — GramFolio",
  description: "How GramFolio collects, uses, and protects your personal data.",
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

export default function PrivacyPage() {
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 border-t border-border pt-8">
          <Section title="1. Overview">
            <p>
              GramFolio (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a personal finance tracking tool for physical gold and precious metal purchases. This Privacy Policy explains what data we collect, how we use it, and your rights over it. By creating an account you agree to this policy.
            </p>
          </Section>

          <Section title="2. Data We Collect">
            <p>We collect only what is necessary to provide the service:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium text-foreground">Account data</span> — your name and email address provided at sign-up.</li>
              <li><span className="font-medium text-foreground">Portfolio data</span> — gold purchase records, weights, prices, cashback, and reward points you enter manually.</li>
              <li><span className="font-medium text-foreground">Session data</span> — authentication tokens stored in secure cookies to keep you signed in.</li>
              <li><span className="font-medium text-foreground">Usage data</span> — anonymous page view analytics via Vercel Analytics (no personally identifiable information).</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Data">
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and display your portfolio dashboard.</li>
              <li>To authenticate you and maintain your session.</li>
              <li>To improve the platform based on aggregated, anonymous usage patterns.</li>
            </ul>
            <p>We do not use your data for advertising, profiling, or any automated decision-making.</p>
          </Section>

          <Section title="4. Data Storage and Security">
            <p>
              All data is stored in a PostgreSQL database hosted on Neon (neon.tech), which is located in AWS data centres. Data is encrypted at rest and in transit. Authentication is handled by Better Auth with bcrypt password hashing.
            </p>
            <p>
              We take reasonable technical and organisational measures to protect your data. However, no system is completely secure and we cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="5. Data Sharing">
            <p>
              We do not sell, trade, or share your personal data with third parties, except:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium text-foreground">Infrastructure providers</span> — Vercel (hosting), Neon (database) — who process data solely to provide their services and are bound by their own privacy policies.</li>
              <li><span className="font-medium text-foreground">Legal obligations</span> — if required by Indian law or a valid court order.</li>
            </ul>
          </Section>

          <Section title="6. Your Rights">
            <p>Under the Information Technology Act, 2000 and SPDI Rules, 2011, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data via your account settings.</li>
              <li>Request deletion of your account and all associated data.</li>
            </ul>
            <p>
              To exercise these rights, email us at{" "}
              <a href="mailto:privacy@gramfolio.in" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                privacy@gramfolio.in
              </a>.
            </p>
          </Section>

          <Section title="7. Cookies">
            <p>
              We use only essential session cookies required for authentication. We do not use advertising, tracking, or third-party analytics cookies. No cookie consent banner is required for essential cookies under applicable law.
            </p>
          </Section>

          <Section title="8. Children">
            <p>
              GramFolio is not intended for users under 18 years of age. We do not knowingly collect data from minors.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>
              We may update this policy from time to time. When we do, we will update the &quot;Last updated&quot; date above. Continued use of GramFolio after changes constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              For any privacy-related questions, contact us at{" "}
              <a href="mailto:privacy@gramfolio.in" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                privacy@gramfolio.in
              </a>.
            </p>
          </Section>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex items-center justify-between">
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="/sign-up" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Back to sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
