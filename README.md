# SriCalendar 🌸

An offline-first, pastel content-planning calendar built for creators. SriCalendar keeps tasks, notes, stickers, and platform posts attached to their exact date forever—even when the device is offline.

![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript) ![Neon](https://img.shields.io/badge/Neon-Postgres-00E599) ![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite) ![PWA ready](https://img.shields.io/badge/offline-Dexie-8B5CF6)

## Features

- 📅 Month and creator-focused week views with permanent historical dates
- ✅ Sortable daily tasks, animated completion, swipe deletion, and final-task confetti
- 📝 Auto-saving notes and a platform content planner
- 🌸 36 creator-life mood stickers, profile photo upload, and automatic seasonal decoration
- ⚡ Instant IndexedDB reads, optimistic offline writes, and background cloud reconciliation
- 🔐 Neon Auth email/password and Google OAuth with owner-only Row Level Security
- 📱 Mobile bottom sheet and roomy desktop side panel
- 📲 Installable phone/desktop app shell with offline launch support
- 🛡️ Private JSON backup and restore through the in-app Data Vault
- 🔥 Consecutive-visit streaks, sync state, dark theme, and reduced-motion support
- 🎬 Video Assistant: drop in a phone clip and a free Gemini call drafts the title, caption, hook, hashtags and tags — clips stay on-device, only sent to Google transiently for analysis
- 🏠 Creator HQ, Studio, Business, and Knowledge workspaces for ideas, scripts, shoots, invoices, deals, goals, and analytics

## Tech stack

React 19, TypeScript strict mode, Vite 8, Tailwind CSS v4, shadcn-style design primitives, Neon Postgres/Auth/Data API, TanStack Query v5, Dexie, Zustand, date-fns, Framer Motion, dnd-kit, and Lucide.

## Getting Started

Prerequisites: Node.js 20.19+ and a free Neon project.

```bash
# Clone
git clone https://github.com/Jadax/SriCalendar.git
cd SriCalendar

# Install (the first command is only for recreating an empty Vite project)
npm create vite@latest . -- --template react-ts
npm install
npm install tailwindcss @tailwindcss/vite @neondatabase/neon-js @tanstack/react-query dexie date-fns framer-motion lucide-react zustand @dnd-kit/sortable @dnd-kit/core
npm install -D @types/react @types/react-dom typescript

# Run
npm run dev
```

For this completed repository, use only `npm install` followed by `npm run dev`; all packages are already declared.

1. Copy `.env.example` to `.env.local`.
2. Enable Neon Auth and the Data API, then add `VITE_NEON_AUTH_URL` and `VITE_NEON_DATA_API_URL`.
3. Run [`neon/schema.sql`](neon/schema.sql), then [`neon/ugc_schema.sql`](neon/ugc_schema.sql), in the Neon SQL Editor after enabling the Data API authenticated-role grants.
4. In Neon Auth, enable Email and Google and allow `http://localhost:5173` plus `https://sri-calendar.vercel.app`.
5. Start the app with `npm run dev`.

Never put a Neon database connection string or API key in a `VITE_` variable. Only the public Auth and Data API endpoints belong in browser environment variables; JWT validation plus RLS is the security boundary.

### Video Assistant (optional)

The Studio's Video Assistant auto-generates titles, descriptions, hooks, hashtags and tags from an uploaded clip using Google Gemini's free tier. To enable it:

1. Grab a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (no credit card required).
2. In AI Studio, restrict the key under "API restrictions" to your app's domain(s) — it ships in the client bundle like the Neon endpoints above.
3. Add it to `.env.local` as `VITE_GEMINI_API_KEY`.

Without a key, clips still record and save locally — only the AI analysis step is unavailable. Video files never leave the device except for the transient analysis upload to Google (auto-deleted from Google's servers within 48 hours; the app also deletes it immediately after a successful response). Clips themselves are stored only in this browser's IndexedDB and are never synced to Neon.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the local Vite server |
| `npm run typecheck` | Run strict TypeScript checks |
| `npm test` | Run the historical-date contract tests |
| `npm run build` | Type-check and produce `dist/` |
| `npm run preview` | Preview the production build |

## Live demo

Try the app at [sri-calendar.vercel.app](https://sri-calendar.vercel.app). No-login previews of each workspace:

- [Home](https://sri-calendar.vercel.app/preview/home) — Creator HQ: daily brief, weekly AI plan, money & analytics pulse
- [Studio](https://sri-calendar.vercel.app/preview/studio) — Idea Bank, Script Writer, Production Board, Checklists
- [Business](https://sri-calendar.vercel.app/preview/business) — Income, Brand Deals, Invoices
- [Knowledge](https://sri-calendar.vercel.app/preview/knowledge) — Goals, Growth Analytics
- [Calendar](https://sri-calendar.vercel.app/preview/today) — the content calendar, now showing production due dates

See [DEPLOYMENT.md](DEPLOYMENT.md) for the Neon + Vercel setup.

## Documentation

- [Architecture and synchronization](ARCHITECTURE.md)
- [Hooks and stores API](API_REFERENCE.md)
- [Pastel design system](STYLE_GUIDE.md)
- [Neon and Vercel deployment](DEPLOYMENT.md)
- [Free personal-use setup](FREE_SETUP.md)
