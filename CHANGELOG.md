# Changelog

## 1.15.0 — 30 August 2026

Today shows up the moment it has work, and a gentle popup does the nagging for you.

- Today's calendar cell now glows when it has open items: a soft pulsing coral ring, a gradient day-number and a little pulsing badge that counts exactly how many things are still open (unfinished tasks, unpublished posts, production cards due today). When you finish everything, today settles into a calm mint "all done" ring instead.
- Week view marks today the same way, with a coral ring around the day header.
- A friendly reminder card slides in once a day (when today actually has open work): it lists your unfinished tasks with tappable checkboxes that complete instantly and update the calendar badge right there, plus scheduled posts and any production cards due today. "Open today" jumps the calendar to today and tucks the card away, and the close button dismisses it for the rest of the day.
- It never blocks you: no modal, no repeating popups, nothing on a day you've already knocked out. 83/83 tests passing.

## 1.14.0 — 30 August 2026

Money Flow: the funnel between outreach and paid, plus a 6-month cash-flow projection.

- New "Money Flow" tab under Business: every deal becomes a stage in a funnel (New lead → Pitched → Negotiating → Booked → Delivered → Passed) with count and value per stage, so it is obvious where money is stuck.
- Conversion stats that decide themselves: win rate (booked + delivered ÷ decided), average booked/dealt-of-closed deal size, expected pipeline value (probability-weighted) and outstanding invoices at full value.
- A 6-month cash-flow projection chart and table: paid money lands by issue date, invoiced-but-unpaid by due date, and open deals by their deadline weighted by estimated probability. Deals without a deadline hold their value in a separate "set a deadline" total instead of faking a month.
- Deadlines before the window clamp into the current month so nothing silently falls off the projection, and declined deals are excluded everywhere.
- Pure deterministic engine (`moneyFlow.ts`) with 15 new unit tests covering win-rate math, probability weighting, currency conversion to USD and month bucketing. 83/83 tests passing.

## 1.13.0 — 30 August 2026

Client Work and a persisted outreach CRM: the money pipeline now tracks every deliverable to the paid payout, and brand outreach no longer evaporates on refresh.

- New "Client Work" tab under Business: every asset inside a deal as its own tracked deliverable (quantity, due date, value, notes, platform), routed through a clean pipeline — contracted → filmed → submitted → revision (revision loops back to filming) → approved → published → paid — with a one-tap advance button per row.
- Revisions count themselves: every time a deliverable swings back to revision it records a revision, so your "this brand is revision-hungry" signal builds automatically.
- Link a published result to a deliverable: log the post in What Worked from inside it (title, platform, date), one tap auto-links it and marks the deliverable published. Existing results can be linked too and unlinked anytime.
- Client work shows up at a glance: the Business dashboard adds a "Client Work" section (awaiting feedback, approved but unpaid, due/overdue, still to film) so nothing sits unpaid.
- Brand Directory outreach is now a real CRM: status, channel, contact, sent/last-touch/follow-up dates and notes save per brand instead of vanishing on refresh. Changing a brand's status auto-schedules its next follow-up 5 days out; snooze defers one by 3 days.
- A "follow-ups due" strip sits at the top of the directory (overdue highlighted in coral), and the daily brief raises a high-priority nudge whenever a brand follow-up is due, so threads never go cold.
- Both new stores (ugc_deliverables, outreach) go through the same offline-first path: local Dexie, Neon schema (idempotent tables + indexes + RLS + grant) and typed API contract. 68/68 tests passing.

## 1.12.0 — 29 August 2026

What Worked: a results log that turns real numbers into a repeatable formula.

- New "What Worked" tab under Knowledge: log per-post outcomes (date, platform, format, hook style, pillar, angle, views, likes, comments, shares, saves, followers gained) by hand or by picking a post you already marked published, so the flow from posting to learning stays one tap.
- The Winning Formula panel turns the log into decisions: it finds the hook styles, pillars, formats and angles with the strongest engagement-rate lift over your baseline, flags the ones running at half your average, and writes plain-English coach notes ("Lead with Question hooks. It is your strongest move right now.").
- The daily brief adds a "winning pattern" nudge as soon as four logged posts show a clear winner, so the formula feeds straight into planning.
- Full offline-first persistence: content_results ships through the same local Dexie store, Neon schema (idempotent table + index + RLS + grant) and typed API contract as every other workspace.
- Nudges only appear once the signal is real (a pattern needs 2+ posts), and the engine is pure deterministic math so it stays honest at 0 posts.

## 1.11.2 — 24 August 2026

Full codebase review: logic fixes, deduplication, and LLM efficiency.

Logic fixes:

- Instagram evening window (`Thursday–Saturday`) never matched because `dayInWindow` compares full weekday names; abbreviated range was unreachable.
- South Africa region now maps to country code `ZA` in live trend fetching (previously fell through to US trends).
- Google Trends traffic parsing handles `2,000+`, `500K+`, `1M+` formats instead of truncating to single digits.
- Weekly-plan fallback hooks no longer render glued words ("yourtopic"); template fills use a clean generic topic.
- `fillTemplate` now resolves spaced and slashed placeholders (`{common mistake}`, `{morning/night}`) instead of leaking raw tokens into hook previews.
- Duplicate trend id `in-parenting-1` renamed to `in-parenting-3` so React keys, dedupe and AI merges no longer collide.
- Removed a no-op sort and an unreachable token key (`lonel_y`) from the hook picker; fixed `{lonely}` rendering as "that thing".
- Dis-Chem brand entry no longer lists competitor Clicks' exclusive brands as its own products.
- Video upload abort signal now reaches both Gemini upload requests.
- Trend cache evicts expired entries instead of growing unbounded.

Deduplication:

- Single shared `seededHash` util used by creator brain and script brain.
- Idea Bank spark hooks sample from the shared 240-hook library instead of a private copy that had drifted.
- Deleted the unused multi-provider script module (~130 lines): it was never wired in, stored API keys in plaintext localStorage, and referenced an invalid model id.

LLM efficiency (prompt caching + token budget):

- All Gemini calls now send persona/voice rules as a stable `systemInstruction` (`BRAIN_SYSTEM`, `COACH_SYSTEM`, `SCOUT_SYSTEM`) so the request prefix is byte-identical per call type — ideal for implicit prompt caching. User turns carry only variable data.
- Every call sets an explicit `maxOutputTokens` sized to its schema (400–1800) plus a tuned temperature; no more unbounded generations on the free tier.
- Rate suggestion no longer asks the model to regenerate curated addon constants; they are merged locally after parsing.
- Schema descriptions trimmed where they duplicated prompt instructions.

Docs:

- README feature list refreshed for Pipeline, Weekly Planner, Trend Pulse v2, Brand Directory, and the human-voice AI rules.
- Architecture guide gains an "AI layer" section documenting the caching/token strategy and module boundaries.

## 1.11.1 — 22 August 2026

De-AI'd all generated content: removed every em dash from user-facing strings, replaced corporate phrasing ("Retention Architecture" → "Hook + Stakes + Payoff", "natural usage shots", "distribution signal", "Leverage recency bias") with natural language, and encoded "no em dashes, no corporate speak" into all AI prompts. 50/50 tests pass.

## 1.11.0 — 21 August 2026

Trend Flow v2.0 rebuild across four phases: expanded trend catalog with a South Africa region and ZAR benchmarks; live trend fetching (TikTok, Google Trends, Reddit, YouTube); a 5-beat UGC script engine with niche beat guides and hook starters; Content Pipeline view with bottleneck detection; Weekly Planner with one-click calendar scheduling; Trend Pulse rebuilt with date picking, expandable trend details, and schedule-to-everything actions (calendar post + production card + script draft); Studio tabs reorganised around Pipeline first.

## 1.10.0 — 20 August 2026

Brand Directory with 61 verified brands, ready-to-send messages, key products/events, status tracking, outreach tips, and a creator workflow tab. Hook library expanded to 240 templates. 50/50 tests passing.

## 1.9.0 — 20 August 2026

- Completed a production audit of the Neon-backed creator workspace.
- Added missing currency, income-stream, and media-kit social fields to the idempotent UGC schema migration.
- Scoped UGC reconciliation explicitly to the authenticated user.
- Hardened offline profile loading and removed the unused duplicate first-name modal.
- Verified TypeScript, the full test suite, production build, and Vercel deployment.
