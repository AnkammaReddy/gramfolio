# GramFolio — agent guide

Use this file plus `.cursor/rules/*.mdc` when changing the app. Prefer the rules for day-to-day coding; this file is the map.

## What this app is

GramFolio tracks **physical gold** buys and **card rewards/cashback**. Multi-user on Neon; gold **spot/bullion prices are shared**; portfolio rows are per-user.

## Where to change things

| Task | Start here |
|------|------------|
| Schema / columns | `lib/db/schema.ts` → then `lib/types.ts`, `lib/mappers.ts`, `lib/validation.ts` |
| Purchases / rewards | `app/actions/purchases.ts`, `components/purchases/` |
| Portfolio math / charts | `lib/calculations.ts`, `lib/analytics.ts`, `components/charts/` |
| Gold prices (global) | `app/actions/gold-prices.ts`, `app/(app)/admin/gold-prices/` |
| Auth / demo | `lib/auth.ts`, `lib/auth-config.ts`, `lib/session.ts`, `middleware.ts` |
| Settings / PIN / password | `app/actions/settings*.ts`, `app/actions/recover-password.ts`, `components/settings/` |
| Account deletion | `app/actions/account.ts`, `components/settings/delete-account.tsx`, `docs/account-deletion.md` |
| Admin messages | `app/actions/messages.ts`, `lib/message-crypto.ts`, `app/(app)/messages/`, `app/(app)/admin/messages/` |
| Nav / shell | `lib/nav.ts`, `components/app-sidebar.tsx`, `app/(app)/layout.tsx` |
| Admin | `app/(app)/admin/*`, matching actions |

## Conventions

1. Server Components load data by calling server actions; client components call actions for mutations + toast errors.
2. Always scope user data by `userId`. No Neon RLS.
3. Mutating actions: `assertNotDemo(userId)`.
4. Return DTOs from mappers, not raw DB rows.
5. Use `pnpm` for scripts.
6. Do not add hardcoded DB URLs or secrets.

## Incomplete / easy traps

- Delete account: Settings UI hard-deletes session/account/user_settings/user; purchases keep orphan `userId`. Privacy copy may still say “all associated data” via email — align when shipping.
- Invite actions exist (`app/actions/invites.ts`) but admin invite UI is incomplete; signup is **not** invite-gated in code.
- `/import` and `/export` exist but are not in the sidebar (`lib/nav.ts`).
- `next.config.mjs` may ignore TypeScript build errors — fix types in touched files anyway.
- Some tables used via raw SQL (`demo_logins`, `user.banned`) may be missing from Drizzle schema — check Neon before assuming.

## Env

Required: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `MESSAGE_ENCRYPTION_KEY` (32-byte base64 — encrypts admin conversation bodies). Optional: `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

## Local / Cloud Agent dev

`.cursor/` defines a self-contained environment (no external DB or secrets needed by default):
- `install.sh` — if a `DATABASE_URL` secret/env is set (e.g. a Neon dev-branch URL) it is used as-is and the local Postgres is skipped; otherwise it starts a local Postgres, applies `scripts/dev-schema.sql`, and uses that. Then `pnpm install` (frozen) and writes `.env.local` (chosen `DATABASE_URL` + `BETTER_AUTH_SECRET` + `MESSAGE_ENCRYPTION_KEY`, reusing any existing values).
- `start.sh` — starts the local Postgres cluster on boot (no-op when an external `DATABASE_URL` is configured); the `dev` terminal runs `pnpm dev`.
- To point at Neon: add your dev-branch URL (include `?sslmode=require`) as a `DATABASE_URL` secret, then re-run install. If egress is restricted, allowlist the Neon host (`*.neon.tech`).
- `scripts/dev-schema.sql` mirrors `lib/db/schema.ts` plus the raw-SQL extras (`user.banned`/`banReason`/`banExpires`, `session.impersonatedBy`, `demo_logins`). Keep it in sync when you change the schema. There is no Drizzle Kit migration pipeline.
- pnpm is pinned to 9 via `packageManager`; the lockfile stores `overrides` (hono) that pnpm 10 no longer reads from `package.json`.
