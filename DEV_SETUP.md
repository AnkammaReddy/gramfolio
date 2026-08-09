# Development Environment Setup

## Database Configuration

**Dev Database**: `dev` (isolated from production `neondb`)
- **Connection String**: Already configured in `.env.local`
- **Location**: Same Neon project (`ep-wandering-river-atzfzco8`)

## What's Different Between Dev and Production

- **Dev uses**: `dev` database in `.env.local`
- **Production uses**: `neondb` database (Vercel env vars)
- **Isolation**: Complete — changes in dev DO NOT affect production users

## Data Sync

The dev database has the same schema as production but:
- **Sensitive data excluded**: No user passwords, sessions, or auth tokens copied
- **Reference data available**: Gold prices, brands, credit cards (publicly shared data) are available
- **User data**: Only demo accounts available

## First Time Setup

1. **Dev database is ready** — `.env.local` points to it
2. **Start the dev server**: `npm run dev` or `pnpm dev`
3. **Create test accounts**: Sign up fresh accounts in dev — they won't affect production
4. **Test freely**: All changes stay in dev database

## Important Notes

✅ **Safe**: Dev changes never touch production  
✅ **Isolated**: Different database completely  
✅ **Passwords**: Your production password hashes are NOT in dev  
✅ **Sessions**: Production sessions are NOT in dev  

Never commit `.env.local` to git — it contains credentials.
