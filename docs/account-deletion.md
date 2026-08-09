# Account deletion — process

Branch feature (not necessarily on `main` yet)  
Action: `app/actions/account.ts` → `deleteAccount(password)`  
UI: Profile & Settings → **Delete Account** (`components/settings/delete-account.tsx`)

## Product rules

1. **Hard-delete identity only:** `session`, `account`, `user_settings` (if present), `user`.
2. **`user_settings` is optional** — many users never have a row; delete is a no-op when missing (must not fail).
3. **Purchases stay** — rows keep the old `userId` (delinked / orphaned). Same for reward components, feedback, insight reactions. They will not show under a newly registered account with the same email.
4. **No credentials provider filter** — password hash is on the `account` row that has `password IS NOT NULL` (not `providerId = 'credential'`).
5. **Always write `security_logs`** — attempt / success / failure.
6. **Demo accounts cannot delete** — `assertNotDemo` + UI disabled.

## End-to-end flow

```
Profile & Settings → Delete Account
        │
        │  password confirm dialog
        ▼
deleteAccount(password)
        │
        ├─ Session → userId + email; reject demo
        ├─ security_logs: account_delete_attempt
        ├─ Load account row WHERE userId AND password IS NOT NULL
        ├─ verifyPassword
        │     └─ fail → account_delete_failed
        ├─ TRANSACTION:
        │     DELETE session WHERE userId
        │     DELETE account WHERE userId
        │     DELETE user_settings WHERE userId   ← 0 rows OK
        │     DELETE user WHERE id
        ├─ security_logs: account_delete_success
        └─ Client: signOut → /sign-in
```

## Deleted vs retained

| Data | Action |
|------|--------|
| `session` | Hard delete |
| `account` | Hard delete |
| `user_settings` | Hard delete if row exists |
| `user` | Hard delete |
| `purchases` / `reward_components` | Keep; orphan `userId` |
| `gold_prices`, `feedback`, `insight_reactions` | Keep; may still reference old `userId` |
| `security_logs` | New rows written; historical rows kept |

## Security log event types

- `account_delete_attempt`
- `account_delete_success`
- `account_delete_failed` (details.reason: `password_required` \| `no_password_hash` \| `incorrect_password`)

Visible to admins at `/admin/security-logs`.
