import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} GramFolio · gramfolio.in
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <Link href="/how-it-works" className="hover:text-foreground transition-colors">
            How it works
          </Link>
          <Link href="/faq" className="hover:text-foreground transition-colors">
            FAQ
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/sign-in" className="hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link href="/sign-up" className="hover:text-foreground transition-colors">
            Create account
          </Link>
        </nav>
      </div>
    </footer>
  )
}
