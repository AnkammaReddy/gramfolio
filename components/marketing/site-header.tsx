import Link from "next/link"
import { Coins } from "lucide-react"
import { ButtonLink } from "@/components/ui/button-link"

export function SiteHeader() {
  return (
    <header className="border-b border-border/80 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Coins className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight group-hover:text-primary transition-colors">
            GramFolio
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/how-it-works"
            className="hidden sm:inline-flex px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            How it works
          </Link>
          <Link
            href="/faq"
            className="hidden sm:inline-flex px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            FAQ
          </Link>
          <ButtonLink href="/sign-in" variant="ghost" size="sm">
            Sign in
          </ButtonLink>
          <ButtonLink href="/sign-in?demo=1" size="sm">
            Try demo
          </ButtonLink>
        </nav>
      </div>
    </header>
  )
}
