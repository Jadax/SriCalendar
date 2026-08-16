# Neon + Vercel Deployment

## 1. Create the free Neon project

1. Sign in at [console.neon.tech](https://console.neon.tech) and choose **New project**.
2. Name it `SriCalendar`, keep PostgreSQL’s current default version, choose the nearest available region, and select the **Free** plan.
3. Never paste the database connection string into frontend code or a `VITE_` variable.

## 2. Enable Neon Auth

1. Open the project’s **Auth** page and choose **Set up Neon Auth** on the production branch.
2. Enable **Email and password**.
3. Enable **Google**. Neon’s shared OAuth credentials are fine for personal use; custom Google credentials can be added later if desired.
4. Add these trusted application origins/redirects when prompted:
   - `http://localhost:5173`
   - `http://localhost:5173/auth/callback`
   - `https://sri-calendar.vercel.app`
   - `https://sri-calendar.vercel.app/auth/callback`
5. Copy the public Auth endpoint shown by Neon. It ends with `/neondb/auth` and becomes `VITE_NEON_AUTH_URL`.

## 3. Enable the Data API and RLS grants

1. Open **Data API** for the production branch and enable it.
2. Choose **Neon Auth** as the authentication provider.
3. Enable **Grant public schema access to authenticated users**. This creates the `authenticated` role permissions expected by the schema.
4. Copy the public Data API endpoint. It ends with `/neondb/rest/v1` and becomes `VITE_NEON_DATA_API_URL`.
5. Open Neon’s SQL Editor, select the production branch/database, paste all of [`neon/schema.sql`](neon/schema.sql), and run it once.
6. Paste all of [`neon/ugc_schema.sql`](neon/ugc_schema.sql) into the same SQL Editor and run it once. This creates the Creator HQ, Studio, Business, and Knowledge tables and safely upgrades Idea Bank scoring columns.
7. Verify `profiles`, `daily_data`, `content_ideas`, and `invoices` exist and that RLS is enabled on every public app table.

Neon’s Data API validates the Neon Auth JWT and exposes its subject through `auth.user_id()`. Every SriCalendar policy compares that value with the row owner.

## 4. Configure locally

Create `.env.local`:

```env
VITE_NEON_AUTH_URL=https://YOUR_AUTH_ENDPOINT/neondb/auth
VITE_NEON_DATA_API_URL=https://YOUR_DATA_API_ENDPOINT/neondb/rest/v1
```

Then verify:

```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

## 5. Configure the existing Vercel project

Open Vercel → `sri-calendar` → Settings → Environment Variables. Add both variables to **Production**, **Preview**, and **Development**:

- `VITE_NEON_AUTH_URL`
- `VITE_NEON_DATA_API_URL`

Redeploy the latest production deployment. Vite reads these values at build time, so a redeploy is required after any endpoint change. The existing live URL remains [sri-calendar.vercel.app](https://sri-calendar.vercel.app).

## Release checks

- Email/password registration and Google sign-in return to `/app/home` (Creator HQ).
- Anonymous visitors are redirected from `/app/*`.
- Two test users cannot see or modify each other’s rows.
- An offline edit remains visible, shows Offline Mode, and synchronizes after reconnection.
- A historical date retains the exact tasks, completion states, notes, stickers, and posts.
- Data Vault export and restore work before any schema migration.
- Creator HQ can add an idea and it remains after a refresh; the new data is visible on another signed-in device after syncing.

Keep the JSON Data Vault backup even though Neon Free includes a short restore window. Portable backups protect against accidental project or account changes and make future migrations straightforward.
