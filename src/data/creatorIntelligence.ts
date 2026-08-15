/** Research-backed creator intelligence (2026 data distilled from marketplaces, benchmarks and retention studies). */

/** UGC rate tiers — used by the money pipeline and rate-card intelligence. */
export interface RateTier { id: string; label: string; min: number; max: number; note: string }
export const RATE_TIERS: RateTier[] = [
  { id: 'beginner', label: 'Just starting', min: 100, max: 250, note: 'First 5–10 deals, building reviews and samples.' },
  { id: 'intermediate', label: 'Established beginner', min: 250, max: 500, note: 'Portfolio + a few happy clients.' },
  { id: 'experienced', label: 'Experienced', min: 500, max: 3000, note: 'Proven track record, clear niche, repeat brands.' },
];

/** Usage-rights add-ons quoted separately from the base rate (2026 market standard). */
export const USAGE_ADDONS = [
  { id: 'organic', label: 'Organic only (included)', pct: 0, note: 'Brand posts it naturally for 30–90 days.' },
  { id: 'paid30', label: 'Paid ads · 30 days', pct: 0.25, note: 'Brand runs it as a Meta/TikTok ad for one month.' },
  { id: 'paid90', label: 'Paid ads · 90 days', pct: 0.5, note: 'Most common ad-rights term.' },
  { id: 'whitelist', label: 'Whitelisting / Spark ads', pct: 0.6, note: 'Ads run from your handle — charge a premium.' },
  { id: 'perpetual', label: 'Perpetual buyout', pct: 1, note: 'Brand owns unlimited use forever — 2–4× the base.' },
];

/** Package bundles — bundles of 3–5 videos raise deal value and lock in volume. */
export const PACKAGE_TIERS = [
  { id: 'single', label: '1 video', videos: 1, discount: 0 },
  { id: 'triple', label: '3-video bundle', videos: 3, discount: 0.1 },
  { id: 'pack', label: '5-video bundle', videos: 5, discount: 0.2 },
];

/** Best time to post per platform (2026 studies — Buffer, Metricool, Later, Upgrow). */
export interface PostWindow { day: string; start: string; end: string; note: string }
export const BEST_TIMES: Record<string, PostWindow[]> = {
  tiktok: [
    { day: 'Sunday', start: '9:00 AM', end: '9:00 AM', note: 'Single best slot of the week for reach.' },
    { day: 'Monday', start: '1:00 PM', end: '1:00 PM', note: 'Strong second — lunch-scroll momentum.' },
    { day: 'Weekday', start: '6:00 PM', end: '9:00 PM', note: 'Evenings are consistently high-engagement.' },
  ],
  instagram: [
    { day: 'Tuesday', start: '10:00 AM', end: '1:00 PM', note: 'Top reach window for Reels.' },
    { day: 'Wednesday', start: '10:00 AM', end: '1:00 PM', note: 'Strong for services + educational content.' },
    { day: 'Thu–Sat', start: '7:00 PM', end: '9:00 PM', note: 'Evening entertainment window.' },
  ],
  reels: [
    { day: 'Tuesday', start: '10:00 AM', end: '1:00 PM', note: 'Highest reach window.' },
    { day: 'Wednesday', start: '10:00 AM', end: '1:00 PM', note: 'Strong for B2B and services.' },
    { day: 'Tuesday–Thursday', start: '7:00 PM', end: '9:00 PM', note: 'Best for entertainment posts.' },
  ],
  youtube: [
    { day: 'Monday', start: '6:00 PM', end: '9:00 PM', note: 'Best Shorts window.' },
    { day: 'Tuesday', start: '6:00 PM', end: '9:00 PM', note: 'Evening viewing peaks.' },
  ],
  linkedin: [
    { day: 'Thursday', start: '10:00 AM', end: '11:00 AM', note: 'Professional lunch-hour momentum.' },
    { day: 'Friday', start: '10:00 AM', end: '11:00 AM', note: 'End-of-week business browse.' },
  ],
  x: [
    { day: 'Tuesday', start: '9:00 PM', end: '9:00 PM', note: 'Late-night conversation peak.' },
    { day: 'Wednesday', start: '9:00 PM', end: '9:00 PM', note: 'Strong second window.' },
  ],
  pinterest: [
    { day: 'Weekend', start: '9:00 AM', end: '11:00 AM', note: 'Planning-mode browsing.' },
  ],
};

/** The UGC marketplace ladder — which platform to join at which stage. */
export interface PlatformStep { name: string; url: string; stage: string; what: string; note: string }
export const PLATFORM_LADDER: PlatformStep[] = [
  { name: 'Billo', url: 'https://billo.co', stage: 'Day 1', what: 'First paid UGC work', note: 'No portfolio or followers needed. ~70%+ creator approval. $30–$150 per video.' },
  { name: 'JoinBrands', url: 'https://joinbrands.com', stage: 'Day 1', what: 'Volume + reviews', note: 'Free, huge brief flow, single-click applying. Builds your track record fast.' },
  { name: 'Fiverr', url: 'https://fiverr.com', stage: 'Week 1', what: 'Passive discovery', note: 'List a gig, let brands find you. Free to set up.' },
  { name: 'Collabstr', url: 'https://collabstr.com', stage: 'After 5–10 videos', what: 'Set your own rates', note: 'No approval gatekeeping. You control pricing.' },
  { name: 'Insense', url: 'https://insense.com', stage: 'After 5–10 videos', what: '$200–$2,000 projects', note: 'Selective approval, higher budgets, paid-ad workflows.' },
  { name: 'Trend', url: 'https://trend.io', stage: 'After 5–10 videos', what: 'Premium brands', note: 'Vetted pool, brand-direct briefs, fast payments.' },
];

/** Hook science — the retention data every co-pilot answer should respect. */
export const HOOK_SCIENCE = [
  'The scroll decision happens in the first 1.3 seconds — open mid-action or with an incomplete visual.',
  'Question hooks lift comments 20–35% and keep completion high.',
  'On-screen text in the first 3 seconds wins the sound-off viewers.',
  'Pattern interrupts hold 15–25% better than slow builds.',
  'Educational content converts with direct value statements, not mystery.',
  '3-second retention is 30–50% of distribution impact — the hook is the whole game.',
  'Reels of 15–30 seconds hit 70–80% completion; longer only for saves/shares.',
];

/** Money-pipeline stages — how a deal actually moves from cold outreach to paid. */
export const MONEY_STAGES = [
  { id: 'cold', label: 'New lead', emoji: '💡', hint: 'Brand found, no outreach yet. Pitch them today.' },
  { id: 'contacted', label: 'Pitched', emoji: '📨', hint: 'Your pitch is out. Follow up in 3–5 days.' },
  { id: 'negotiating', label: 'Negotiating', emoji: '🤝', hint: 'Agree on scope + usage rights, then send a 50% deposit invoice.' },
  { id: 'accepted', label: 'Booked', emoji: '📅', hint: 'Signed. Shoot to the brief, deliver fast, invoice the balance.' },
  { id: 'delivered', label: 'Delivered', emoji: '📦', hint: 'Files sent. Send the final invoice and request a testimonial.' },
  { id: 'declined', label: 'Passed', emoji: '🚫', hint: 'Not this time — note why and keep the relationship warm.' },
] as const;

/** Hook archetype → plain-English explanation for the co-pilot. */
export const HOOK_WHY: Record<string, string> = {
  'Question': 'Questions create a response impulse — viewers answer in their head and comment more.',
  'Curiosity Gap': 'Withholds the payoff so the brain needs to close the loop.',
  'Big Promise': 'States the reward up front — strong for how-to and education.',
  'Story': 'Narrative pull keeps people watching to find out what happens.',
  'Relatable': 'Mirrors the viewer\u2019s own life, so the ad stops feeling like an ad.',
  'Myth-Bust': 'Contrarian energy interrupts the scroll and stakes a clear claim.',
  'Contrarian': 'Says the unpopular thing — people stay to see if you back it up.',
  'Stat & Number': 'Numbers feel factual and specific, building instant trust.',
  'Authority & How-to': 'Direct value: the viewer knows they\u2019ll leave with something.',
  'Challenge': 'Invites participation — comments and tags go up.',
  'Trend & Culture': 'Rides existing momentum in the feed.',
  'Danger & Stakes': 'Raises what could go wrong — high attention, high tension.',
  'Action': 'Moves fast and keeps pace with short attention spans.',
  'Reward': 'Promises the outcome viewers actually want.',
  'Proof': 'Evidence-based — great for product trust.',
  'Empathy': 'Shows you understand their frustration before pitching.',
  'Mystery': 'Hides the reveal just long enough.',
  'Relevance': 'Talks about what they care about right now.',
  'Tension': 'Keeps a thread pulling through the whole video.',
  'Narrative': 'Tells a story with a beginning, middle, payoff.',
};

/** Plain-English niches with content ideas per pillar (used by onboarding + brain). */
export const NICHES = ['fitness', 'beauty', 'fashion', 'food', 'travel', 'tech', 'parenting', 'finance', 'gaming', 'lifestyle'] as const;
