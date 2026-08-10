# Free Personal-Use Setup

SriCalendar’s intended setup costs `$0/month` and requires no paid add-on:

| Part | Free choice | Why it fits |
|---|---|---|
| Source code | GitHub Free private repository | Version history and Vercel connection |
| Website | Vercel Hobby | Personal static hosting, HTTPS, CDN, and Git deployments |
| Database and login | Neon Free | PostgreSQL, Neon Auth, Data API, RLS, scale-to-zero, and many project slots |
| Offline storage | Browser IndexedDB through Dexie | Instant on-device access and queued writes |
| Installed experience | Web App Manifest + service worker | No app-store or developer-account fee |
| Backups | SriCalendar Data Vault | Portable JSON without a backup subscription |

Official references: [Neon pricing](https://neon.com/pricing), [Neon Data API RLS](https://neon.com/docs/guides/row-level-security), and [Vercel Hobby](https://vercel.com/docs/plans/hobby).

## Why Neon fits

Neon Free currently offers far more project capacity than the previous two-project backend limit, 0.5 GB per project, scale-to-zero compute, Neon Auth, and a short instant-restore window. A single-user calendar will use only a tiny fraction of those limits. Idle compute wakes automatically when the app makes a Data API request.

Neon’s Data API is PostgREST-compatible, so the existing full-record upsert and RLS architecture remains portable. Authentication data lives in Neon’s `neon_auth` schema, while application rows remain in `public`.

The official `@neondatabase/neon-js` package is currently beta. SriCalendar pins the SDK through the lockfile and overrides its Better Auth dependency to the current patched release. GitHub Actions and monthly Dependabot checks will surface future stable SDK upgrades.

## Longevity checklist

1. Commit `package-lock.json` for reproducible builds.
2. Review monthly Dependabot updates; do not auto-merge authentication major versions.
3. Run type checking, tests, a production build, login, offline editing, and a historical-date check before each release.
4. Apply database changes as versioned SQL migrations and never bulk-delete old `date_key` rows.
5. Export a Data Vault backup before schema, Auth, or Data API changes.
6. Keep database connection strings and Neon API keys out of Vercel’s `VITE_` variables.

The backend boundary remains isolated in `src/lib/neonClient.ts` and `src/lib/syncEngine.ts`. A future provider migration would not require rewriting the calendar UI or local Dexie database.
