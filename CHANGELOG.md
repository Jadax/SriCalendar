# Changelog

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
