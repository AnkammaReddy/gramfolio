# Aurum — Gold Portfolio & Reward Optimizer

A premium personal portfolio tracker for **physical 24K gold coins and bars**, focused on optimizing
credit-card reward strategies and tracking cashback. Built for a single user today, architected for
multi-user and multi-asset (silver, platinum, SGB, ETF) in the future.

## Tech Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (Base UI variant)
- **Neon** (Postgres) + **Drizzle ORM**
- **Better Auth** (email/password, Google-ready)
- **Recharts** for data visualization
- **Zod** for validation, **Server Actions** for all mutations

## Features

- **Dashboard** — 10 KPI cards, 9 interactive charts (date-filterable), auto-generated insights & notifications
- **Purchases** — full CRUD with normalized reward components (gift vouchers, cashback, reward points, SuperCoins, coupons)
- **Holdings** — aggregated positions by brand/category with average cost, current value, and return %
- **Daily Gold Price** — manual entry now, architected for future auto-fetch/scrape
- **Cashback Tracker** — pending/overdue/missing tracking with verification
- **Analytics** — by credit card, website, and brand, each with a top performer
- **Timeline** — chronological investment journey
- **CSV Import** — interactive column mapping, validation, and preview
- **CSV Export** — purchases, cashback, gold prices, portfolio, analytics
- **Settings** — currency, default graph mode, dashboard range, theme
- **Graph mode** — switch all charts between Purchase Price and Effective Cost (persisted)
- **Dark mode**, responsive (mobile/tablet/desktop), PWA manifest

## Environment Variables

| Variable             | Required | Notes                                                              |
| -------------------- | -------- | ------------------------------------------------------------------ |
| `DATABASE_URL`       | Yes      | Auto-provisioned by the Neon integration. Used by Drizzle + Better Auth. |
| `BETTER_AUTH_SECRET` | Yes      | Random string ≥ 32 chars. Generate with `openssl rand -base64 32`. |
| `BETTER_AUTH_URL`    | No       | Only needed for a fully custom domain.                             |

> **Authentication will not work until `BETTER_AUTH_SECRET` is set.** Add it in Project Settings → Vars.

### Enabling Google Sign-In (optional)

Email/password is enabled by default. To enable Google:

1. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to your env vars.
2. In `lib/auth.ts`, uncomment the `socialProviders.google` block.

## Database

Tables are created in Neon via SQL (no Drizzle Kit migrations in this setup):

- `purchases` — purchase + payment details, with an `assetType` column for future asset classes
- `reward_components` — normalized reward breakdown per purchase
- `gold_prices` — daily bullion price per gram (by asset/purity)
- `user_settings` — per-user preferences
- Better Auth tables: `user`, `session`, `account`, `verification`

The Drizzle schema lives in `lib/db/schema.ts`. Every app query is scoped by `userId`
(there is no RLS on Neon — scoping is enforced in every server action).

### Re-creating the schema

The DDL is applied directly against Neon. If you fork this project to a fresh Neon database,
run the `CREATE TABLE` statements from `lib/db/schema.ts` (translated to SQL) against your database,
or reapply them through the Neon SQL console.

## Getting Started

```bash
pnpm install
pnpm dev
```

Then open the app, create an account at `/sign-up`, and start adding purchases — or use **Import**
to bulk-load from CSV. Download the CSV template from the Import page to see the expected format.

## Architecture Notes

- **Calculations** (`lib/calculations.ts`) and **analytics** (`lib/analytics.ts`) are pure functions —
  easy to unit test and reused across dashboard, holdings, analytics, and timeline.
- **Effective cost** = purchase price − (cashback + reward value + voucher + SuperCoins + coupons).
  Graph mode toggles whether charts compare against purchase price or effective cost.
- **Future-ready**: the `assetType` column and normalized reward model mean silver, platinum,
  SGBs, and ETFs can be added without a schema redesign.

## Deployment (Vercel)

1. Push to GitHub and import the repo in Vercel (or use **Publish** in v0).
2. Ensure the **Neon** integration is connected (provides `DATABASE_URL`).
3. Add `BETTER_AUTH_SECRET` in Project Settings → Environment Variables.
4. Deploy. Better Auth auto-detects the production URL via `VERCEL_PROJECT_PRODUCTION_URL`.
