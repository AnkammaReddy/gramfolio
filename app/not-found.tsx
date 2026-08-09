import Link from "next/link"
import { Coins } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-6">
        <Coins className="h-7 w-7" />
      </div>
      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-2">404</p>
      <h1 className="text-2xl font-semibold tracking-tight text-balance">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground text-balance max-w-xs">
        This page does not exist or has been moved.
      </p>
      <Button render={<Link href="/" />} className="mt-6">
        Go to dashboard
      </Button>
    </div>
  )
}
