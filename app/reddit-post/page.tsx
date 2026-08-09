"use client"

import { useState, useCallback } from "react"
import { Copy, Check, FileText, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const INITIAL_POST = `**TITLE:**
Built a free tool to track physical gold purchases with credit card rewards — open to feedback from this community

---

**Disclaimer upfront:** This is not a startup. No monetisation, no ads, no data selling. I built this entirely for myself because I was frustrated not knowing what my physical gold actually cost me after cashback and reward points. Posting here to see if anyone else in this community finds it useful or has feedback.

---

## The problem I was trying to solve

I buy physical gold through Ajio, Myntra, Tanishq etc. using cards like HSBC TravelOne, PhonePe SBI, CRED IndusInd RuPay. Each purchase has a different cashback %, reward points multiplier, or coupon. By the time everything credits 45–90 days later, I had no clean way to answer: **what did I actually pay per gram?**

Spreadsheets work but they get unwieldy fast — especially when you are tracking pending vs credited cashback, different purities, and want to compare your effective cost against the bullion rate on the day you bought.

---

## What I built — GramFolio

Screenshots below, but the short version:

- Logs every purchase — brand, website, weight, purity, price paid
- Tracks all reward types separately — cashback %, reward points, gift vouchers, SuperCoins, coupons
- Calculates your real **effective cost per gram** after every reward
- Shows bullion rate on the day you bought vs your effective price paid
- Tracks cashback status per purchase — pending, credited, verified, missing
- Dashboard with insights — which card has saved you the most, which website gave the best effective rate
- Timeline of every purchase with full cost breakdown per entry
- P&L against today's bullion rate across the whole portfolio

---

## Want to try a live demo?

You can log in right now with a read-only demo account:

> **URL:** https://v0-gramfolio.vercel.app/
> **Email:** demo@gramfolio.app
> **Password:** GramFolio@Demo

Sessions last 15 minutes and the data is sample data only — you cannot make changes. Just enough to get a feel for the screens.

---

## Want a real account?

**DM me your email** and I will send you an invite link. Invite-only for now — I want to keep it small, get honest feedback, and not break things for a large group.

---

## What I am thinking of building next

- Upload a purchase invoice (PDF or photo) and have AI auto-fill the purchase form
- Automatic bullion rate pull so you do not have to enter it manually

Happy to hear what you think — whether it is useful, what is missing, or if you would just stick with a spreadsheet.`

// Minimal markdown → HTML renderer (handles the subset used in the post)
function renderMarkdown(md: string): string {
  return md
    // Headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Horizontal rule
    .replace(/^---$/gm, "<hr />")
    // Blockquote
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // Unordered list items — wrap in <ul> after
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    // Paragraphs — double newlines
    .split(/\n{2,}/)
    .map((block) => {
      if (/^<(h[1-3]|ul|hr|blockquote)/.test(block.trim())) return block.trim()
      return `<p>${block.trim().replace(/\n/g, "<br />")}</p>`
    })
    .join("\n")
}

export default function RedditPostPage() {
  const [markdown, setMarkdown] = useState(INITIAL_POST)
  const [preview, setPreview] = useState(true)
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }, [markdown])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Reddit Post Draft</span>
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400">
            r/CreditCardsIndia
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreview((v) => !v)}
            className="gap-1.5 text-xs"
          >
            {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {preview ? "Hide preview" : "Show preview"}
          </Button>
          <Button size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy markdown"}
          </Button>
        </div>
      </header>

      {/* Editor / Preview */}
      <div className={`grid h-[calc(100svh-53px)] ${preview ? "grid-cols-2" : "grid-cols-1"}`}>
        {/* Editor */}
        <div className="flex flex-col border-r border-border">
          <div className="border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Markdown
          </div>
          <Textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="flex-1 resize-none rounded-none border-0 font-mono text-sm leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 p-5"
            spellCheck={false}
          />
        </div>

        {/* Preview */}
        {preview && (
          <div className="flex flex-col overflow-hidden">
            <div className="border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Preview
            </div>
            <div
              className="prose prose-sm dark:prose-invert max-w-none flex-1 overflow-y-auto p-6 
                [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:mb-3 [&_h1]:mt-4
                [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-foreground
                [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4
                [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-foreground [&_p]:mb-3
                [&_ul]:my-2 [&_ul]:pl-5
                [&_li]:text-sm [&_li]:leading-relaxed [&_li]:mb-1 [&_li]:text-foreground [&_li]:list-disc
                [&_strong]:font-semibold [&_strong]:text-foreground
                [&_hr]:border-border [&_hr]:my-4
                [&_blockquote]:border-l-2 [&_blockquote]:border-amber-500 [&_blockquote]:pl-4 
                [&_blockquote]:text-sm [&_blockquote]:text-muted-foreground [&_blockquote]:italic [&_blockquote]:my-3"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
