# Architecture

SriCalendar is a client-side React application with two coordinated persistence layers. IndexedDB is the immediate source for interaction; Neon PostgreSQL is the durable, cross-device source of truth.

```text
                         cloud refresh
                    ┌────────────────────┐
                    ▼                    │
React UI ──read──▶ Dexie/IndexedDB ◀── conflict resolver
   │                 │                         ▲
   │ optimistic      │ 500 ms debounced       │ newer updated_at
   └────write────────┘ full-record upsert ─▶ Neon Data API
                                                │
                                   Neon PostgreSQL + RLS
```

## Read flow

1. `useDailyData(userId, dateKey)` subscribes to the compound IndexedDB key and renders it immediately.
2. TanStack Query requests exactly the same `user_id` and `date_key` through Neon’s PostgREST-compatible Data API.
3. `chooseNewest` compares `updated_at`. A queued local edit (`sync_pending = 1`) is protected from being replaced.
4. The resolved record is written to Dexie, which updates the UI reactively.

Month navigation fetches the visible date range so task dots and stickers also appear for historical dates.

## Write and recovery flow

Every mutation transforms a complete `DailyData` record, gives it a new ISO `updated_at`, marks it pending, and writes it to Dexie before any network request. `scheduleSync` maintains a separate 500 ms timer per user/date pair. Neon receives a full-record upsert using the unique `(user_id, date_key)` constraint. Failed requests retry three times with backoff; remaining failures preserve the pending local record and show Offline Mode. The online event runs `flushPending`.

This is last-write-wins at record granularity. It is deterministic and ideal for the intended single-user workflow. Editing one day never writes another date.

## Historical data guarantee

`date_key` is generated as local `yyyy-MM-dd`, never from `toISOString()` (which can shift dates near midnight). Both databases index `user_id + date_key`, and every query and update includes both values. Opening `2024-01-15` in 2026 therefore loads only that exact record—including its original task completion states, notes, stickers, and posts. Data changes only when the user explicitly edits that selected date.

There is no expiry, rolling deletion, or “current day” overwrite. Authentication identifiers are stored as text so the calendar remains portable across standard OAuth/OIDC identity systems.

## Privacy and RLS

The browser receives only public Neon Auth and Data API endpoints. Neon validates the signed-in JWT, and PostgreSQL exposes its subject through `auth.user_id()`. Each `daily_data` policy compares it with `user_id`; profile policies compare it with `id`. SELECT, INSERT, UPDATE, and DELETE are separately protected. UPDATE also includes `WITH CHECK`, preventing ownership from being reassigned.

The client creates its profile on first visit. The insert policy accepts it only when the requested profile ID equals `auth.user_id()`.

## Module boundaries

- `src/lib`: external clients and synchronization rules
- `src/hooks`: React-facing auth, calendar, daily-data, and reconnection orchestration
- `src/store`: small UI/session/navigation state only
- `src/components`: presentation and user interactions
- `neon/schema.sql`: repeatable database schema, grants, policies, and indexes
- `neon/ugc_schema.sql`: repeatable Creator HQ, Studio, Business, and Knowledge schema, grants, policies, and indexes

## Creator workspace synchronization

The Creator HQ, Studio, Business, and Knowledge workspaces use the same offline-first approach in a separate Dexie database. Each collection stores a complete row locally, marks it `sync_pending`, and debounces a Neon upsert. Deletes are placed in a durable local queue until cloud confirmation. The user’s onboarding choices live in both the local cache and their private `profiles.settings` JSON, so a new phone does not repeat setup or duplicate starter content.

Sensitive content is never persisted in Zustand. Daily content stays in IndexedDB and owner-protected Neon rows.

## Offline application shell and portable backups

`public/sw.js` caches only same-origin application assets. Neon requests remain network-controlled, while calendar writes continue through Dexie when offline. The web app manifest allows installation from a supported phone or desktop browser without an app-store account.

The Data Vault exports all local daily records as schema-versioned JSON. Restore validates the file, binds every record to the currently authenticated user, writes it to IndexedDB, and queues cloud synchronization. This portable copy is especially important on a free database tier, which does not include managed backups.
