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

/** Hashtag pools per niche for the caption generator (platform-agnostic base + niche). */
export const NICHE_HASHTAGS: Record<string, string[]> = {
  fitness: ['fitnessjourney', 'homeworkout', 'gymtok', 'fitlife', 'wellness', 'workoutmotivation', 'fitnessreels'],
  beauty: ['skincare', 'beautytok', 'makeuptransformation', 'glowup', 'cleanbeauty', 'makeupforbeginners', 'beautyroutine'],
  fashion: ['fashiontok', 'outfitideas', 'styleinspo', 'ootd', 'thriftflip', 'fashionhacks', 'wardrobeessentials'],
  food: ['foodtok', 'easyrecipes', 'homecooking', 'foodies', 'mealprep', 'cookinghacks', 'comfortfood'],
  travel: ['traveltok', 'hiddengems', 'travelvlog', 'bucketlist', 'solotravel', 'itinerary', 'traveltips'],
  tech: ['techreview', 'gadgets', 'techlife', 'productivity', 'technews', 'smartphone', 'techtips'],
  parenting: ['momlife', 'parentinghacks', 'toddlerlife', 'momsoftiktok', 'familylife', 'momhacks', 'raisingkids'],
  finance: ['moneytok', 'personalfinance', 'budgeting', 'savingmoney', 'financialliteracy', 'sidehustle', 'investing'],
  gaming: ['gaming', 'gamer', 'gamergirl', 'indiegames', 'gamingcommunity', 'streamer', 'gameplay'],
  lifestyle: ['lifestyle', 'dailyvlog', 'aesthetic', 'selfimprovement', 'routine', 'mondaymotivation', 'lifestylecreator'],
};

/** Deliverable types the rate calculator reasons over (2026 market bands). */
export const DELIVERABLE_LABELS: Record<string, { label: string; factor: number; note: string }> = {
  short: { label: 'Short-form video (15–60s)', factor: 1, note: 'Reels/TikTok — the UGC workhorse.' },
  reel: { label: 'Short-form video (15–60s)', factor: 1, note: 'Reels/TikTok — the UGC workhorse.' },
  photo: { label: 'Photo set / static (3–5)', factor: 0.6, note: 'Feed posts, thumbnails, product close-ups.' },
  long: { label: 'Long-form video (3+ min)', factor: 2.5, note: 'Tutorials, unboxings, YouTube-style.' },
  bundle: { label: 'Multi-video bundle', factor: 3.5, note: 'Volume locks in value — see bundle discount.' },
};

/** Follower-band multipliers used on top of the experience tier. */
export const FOLLOWERS_BANDS = [
  { min: 0, max: 999, label: '< 1K', factor: 0.8 },
  { min: 1000, max: 9999, label: '1K–10K', factor: 1 },
  { min: 10000, max: 49999, label: '10K–50K', factor: 1.5 },
  { min: 50000, max: 199999, label: '50K–200K', factor: 2.2 },
  { min: 200000, max: Infinity, label: '200K+', factor: 3 },
];

/* ---------------------------------------------------------------------------
 * Trend Pulse — a region-aware "what's hot right now" radar.
 * The deterministic catalog is a curated watchlist per niche × region; the
 * Gemini smart mode swaps in a real-time scan and falls back to this.
 * ------------------------------------------------------------------------- */

export const TREND_REGIONS = [
  { id: 'sa', label: 'South Africa', flag: '🇿🇦', note: 'SA beauty, wellness & lifestyle — your home market.' },
  { id: 'india', label: 'India', flag: '🇮🇳', note: 'Fast-growing creator scene, value-first audiences.' },
  { id: 'africa', label: 'Africa', flag: '🌍', note: 'Exploding short-video adoption, local culture wins.' },
  { id: 'us', label: 'USA', flag: '🇺🇸', note: 'The most competitive feed — trends move fast.' },
  { id: 'uk', label: 'UK', flag: '🇬🇧', note: 'Strong budget + lifestyle content culture.' },
  { id: 'world', label: 'Global', flag: '🌐', note: 'Cross-region patterns that travel well.' },
] as const;

export type TrendRegion = (typeof TREND_REGIONS)[number]['id'];
export type TrendDirection = 'rising' | 'peaking' | 'falling';

export interface Trend {
  id: string;
  niche: string;
  region: TrendRegion;
  title: string;
  hook: string;
  angle: string;
  format: string;
  /** 0–100 — how hot the topic is right now. */
  momentum: number;
  direction: TrendDirection;
  /** 0–100 — estimated ceiling for viral reach. */
  virality: number;
  play: string;
  hashtags: string[];
  season?: string;
}

/** Curated trend watchlist. Updated periodically — the AI scan returns fresher picks when Gemini is on. */
export const TRENDS: Trend[] = [
  /* ---- global / world ---- */
  { id: 'w-fitness-1', niche: 'fitness', region: 'world', title: '10-minute mobility reset for desk jobs', hook: 'Your back pain is a 10-minute habit away.', angle: 'desk-worker rescue', format: 'follow-along', momentum: 78, direction: 'rising', virality: 68, play: 'Desk workers love easy follow-along routines they can do at home.', hashtags: ['mobility', 'deskjob', 'posture'], season: 'New Year reset' },
  { id: 'w-fitness-2', niche: 'fitness', region: 'world', title: '30-day walking challenge', hook: 'I walked 12,000 steps for 30 days. My resting heart rate dropped.', angle: '30-day experiment', format: 'POV diary', momentum: 84, direction: 'peaking', virality: 82, play: 'Step-count challenges are cheap to start and easy to binge-watch.', hashtags: ['walkchallenge', 'stepschallenge', 'walkingworkout'] },
  { id: 'w-beauty-1', niche: 'beauty', region: 'world', title: 'Drugstore vs luxury blind test', hook: 'The $9 dupe beat the $90 serum in my blind test.', angle: 'value showdown', format: 'side-by-side test', momentum: 88, direction: 'peaking', virality: 86, play: 'Blind tests create tension and a clear verdict, people love sharing these.', hashtags: ['dupe', 'skincaretest', 'beautytok'] },
  { id: 'w-beauty-2', niche: 'beauty', region: 'world', title: 'Skin cycling, demystified', hook: 'You do not need 9 products. You need this 4-night cycle.', angle: 'simplify the routine', format: 'GRWM + routine', momentum: 72, direction: 'rising', virality: 64, play: 'Simplification videos cut through routine overload.', hashtags: ['skincycling', 'skincareroutine', 'minimalistbeauty'] },
  { id: 'w-fashion-1', niche: 'fashion', region: 'world', title: 'The fit is wrong, not the jeans', hook: 'Your jeans are not too big. Your fit is wrong.', angle: 'styling myth-bust', format: 'styling fix', momentum: 80, direction: 'rising', virality: 74, play: 'Fix-it styling earns saves, the strongest growth signal.', hashtags: ['stylefix', 'denimhack', 'outfitideas'] },
  { id: 'w-fashion-2', niche: 'fashion', region: 'world', title: 'Thrift flip challenge', hook: 'Found it for $4. Made it a $120 piece.', angle: 'before/after value', format: 'flip tutorial', momentum: 76, direction: 'peaking', virality: 78, play: 'Transformation content keeps viewers until the reveal.', hashtags: ['thriftflip', 'diyfashion', 'upcycle'] },
  { id: 'w-food-1', niche: 'food', region: 'world', title: '3-ingredient high-protein dinner', hook: '3 ingredients, 12 minutes, 40g protein.', angle: 'effort-to-reward', format: 'recipe', momentum: 82, direction: 'peaking', virality: 72, play: 'Protein + speed answers the daily "what to eat" question.', hashtags: ['highprotein', 'quickdinner', 'mealideas'] },
  { id: 'w-food-2', niche: 'food', region: 'world', title: 'The "healthier swap" taste test', hook: 'I ordered the light version so you never have to.', angle: 'honest verdict', format: 'taste test', momentum: 70, direction: 'rising', virality: 68, play: 'Debates over fast-food "health" claims fuel comments.', hashtags: ['foodtest', 'fastfood', 'tastetest'] },
  { id: 'w-travel-1', niche: 'travel', region: 'world', title: 'The 3-day itinerary I actually used', hook: 'Stop planning for 40 hours. Use this 3-day template.', angle: 'effortless planning', format: 'itinerary breakdown', momentum: 74, direction: 'rising', virality: 66, play: 'Concrete itineraries get screenshotted, tagged and saved.', hashtags: ['itinerary', 'traveltips', 'weekendtrip'] },
  { id: 'w-travel-2', niche: 'travel', region: 'world', title: 'Overhyped vs worth it: viral spots', hook: 'The #1 viral spot was the worst hour of my trip.', angle: 'honest review', format: 'travel review', momentum: 78, direction: 'peaking', virality: 80, play: 'Calling out overrated places triggers strong opinions.', hashtags: ['traveltok', 'honestreviews', 'wanderlust'] },
  { id: 'w-tech-1', niche: 'tech', region: 'world', title: 'The AI workflow that saves an hour a day', hook: 'This AI workflow does in 4 minutes what took me an hour.', angle: 'workflow demo', format: 'screen demo', momentum: 86, direction: 'rising', virality: 76, play: 'Time-saving AI demos ride the productivity wave.', hashtags: ['aitools', 'productivity', 'workflow'] },
  { id: 'w-tech-2', niche: 'tech', region: 'world', title: 'Phone settings nobody changes', hook: 'Flip these 3 settings and the battery debate is over.', angle: 'quick wins', format: 'tips list', momentum: 72, direction: 'rising', virality: 62, play: 'Micro-tips are easy to film and quick to verify.', hashtags: ['techhacks', 'smartphonetips', 'settings'] },
  { id: 'w-parenting-1', niche: 'parenting', region: 'world', title: 'The sentence that ends most meltdowns', hook: 'One sentence ends most meltdowns in 20 seconds.', angle: 'de-escalation', format: 'advice + demo', momentum: 75, direction: 'rising', virality: 70, play: 'Frustrated parents save and share practical rescue lines.', hashtags: ['parentingtips', 'toddlerlife', 'momsoftiktok'] },
  { id: 'w-parenting-2', niche: 'parenting', region: 'world', title: 'Baby buys I would skip', hook: 'Nobody tells you half these baby buys are useless.', angle: 'honest haul', format: 'baby essentials', momentum: 70, direction: 'peaking', virality: 66, play: 'Regret lists resonate with sleep-deprived new parents.', hashtags: ['babyhaul', 'newparent', 'babyessentials'] },
  { id: 'w-finance-1', niche: 'finance', region: 'world', title: 'My budget was wrong the whole time', hook: 'I tracked spending for 3 months. My budget was wrong the whole time.', angle: 'money diary', format: 'finance story', momentum: 77, direction: 'rising', virality: 74, play: 'Honest money diaries build trust fast.', hashtags: ['budgeting', 'moneydiary', 'personalfinance'] },
  { id: 'w-finance-2', niche: 'finance', region: 'world', title: '3 income streams that pay in 30 days', hook: '3 income streams that pay within 30 days of starting.', angle: 'fast cash flows', format: 'step list', momentum: 80, direction: 'peaking', virality: 78, play: 'Fast-payout hustles attract viewers who want results now.', hashtags: ['sidehustle', 'incomestreams', 'moneytok'] },
  { id: 'w-gaming-1', niche: 'gaming', region: 'world', title: 'The setting change that fixed my aim', hook: 'One sensitivity change and my KD jumped.', angle: 'skill unlock', format: 'settings + gameplay', momentum: 74, direction: 'rising', virality: 68, play: 'Concrete improvement tips drive saves in gaming feeds.', hashtags: ['gamingtips', 'aimtraining', 'settings'] },
  { id: 'w-gaming-2', niche: 'gaming', region: 'world', title: 'The silent buff nobody mentions', hook: 'This silent change is why the meta feels different.', angle: 'meta breakdown', format: 'clip breakdown', momentum: 71, direction: 'peaking', virality: 65, play: 'People search for patch updates and want to know what changed.', hashtags: ['metachanges', 'gameupdate', 'gamingnews'] },
  { id: 'w-lifestyle-1', niche: 'lifestyle', region: 'world', title: 'The 6am routine that finally stuck', hook: 'The 6am routine that finally stuck (it is not what you think).', angle: 'realistic habits', format: 'routine vlog', momentum: 79, direction: 'rising', virality: 72, play: 'Real routines beat perfect-morning fantasies every time.', hashtags: ['morningroutine', 'habits', 'selfimprovement'] },
  { id: 'w-lifestyle-2', niche: 'lifestyle', region: 'world', title: 'The 5-minute bedtime tidy reset', hook: 'Do this before bed and wake up to a clean room.', angle: 'reset habit', format: 'ASMR reset', momentum: 73, direction: 'rising', virality: 60, play: 'Reset videos double as satisfying ASMR.', hashtags: ['resetwithme', 'cleaningreset', 'nightroutine'] },

  /* ---- india ---- */
  { id: 'in-fitness-1', niche: 'fitness', region: 'india', title: 'Desi home workout, no equipment', hook: 'No gym, no dumbbells, 15 minutes — arms done.', angle: 'budget fitness', format: 'follow-along', momentum: 82, direction: 'rising', virality: 74, play: 'Tier-2/3 cities want zero-equipment, zero-membership fitness.', hashtags: ['desiworkout', 'homeworkout', 'noequipment'], season: 'New Year reset' },
  { id: 'in-fitness-2', niche: 'fitness', region: 'india', title: '₹150 protein drink vs whey', hook: 'I compared the ₹150 protein drink to whey. The results surprised me.', angle: 'value nutrition', format: 'honest test', momentum: 76, direction: 'peaking', virality: 70, play: 'Protein debates split the feed — arguments drive comments.', hashtags: ['protein', 'fitnessindia', 'whey'] },
  { id: 'in-beauty-1', niche: 'beauty', region: 'india', title: '₹200 vs ₹2,000 serum test', hook: 'Same skin goal, 10× price gap. The cheap one won.', angle: 'value showdown', format: 'side-by-side test', momentum: 85, direction: 'peaking', virality: 82, play: 'Value-first beauty testing is the dominant Indian creator pattern.', hashtags: ['serumtest', 'skincareindia', 'budgetbeauty'] },
  { id: 'in-beauty-2', niche: 'beauty', region: 'india', title: 'Haldi glow ritual, modernized', hook: 'Your grandma\u2019s haldi pack, upgraded for oily skin.', angle: 'tradition × science', format: 'DIY + demo', momentum: 78, direction: 'rising', virality: 68, play: 'Blending heritage with skincare science feels new and personal.', hashtags: ['haldi', 'diyskincare', 'indianbeauty'] },
  { id: 'in-fashion-1', niche: 'fashion', region: 'india', title: 'Chikankari: market vs brand', hook: 'The ₹600 market chikankari vs the ₹3,000 brand — look closer.', angle: 'dupe test', format: 'fashion test', momentum: 74, direction: 'rising', virality: 72, play: 'Craft-honesty debates travel across Indian fashion feeds.', hashtags: ['chikankari', 'desifashion', 'fashiontest'] },
  { id: 'in-fashion-2', niche: 'fashion', region: 'india', title: 'Kurti-to-work styling', hook: 'Your weekend kurti is a Tuesday work look. Here is how.', angle: 'workwear remix', format: 'styling', momentum: 70, direction: 'rising', virality: 62, play: 'Office-wear remixes target the massive professional audience.', hashtags: ['workwear', 'kurtistyle', 'desiwear'] },
  { id: 'in-food-1', niche: 'food', region: 'india', title: 'Street-food style at home', hook: 'That ₹60 chaat? Make it cleaner at home in 10 minutes.', angle: 'recreate the hype', format: 'recipe recreate', momentum: 80, direction: 'rising', virality: 74, play: 'Street-food recreations tap nostalgia and hygiene worries.', hashtags: ['streetfood', 'homechaat', 'indianfood'], season: 'Festive season' },
  { id: 'in-food-2', niche: 'food', region: 'india', title: 'Ghee vs butter, the protein-era truth', hook: 'Instagram said ghee is the only fat. The label disagrees.', angle: 'myth-bust', format: 'food myth test', momentum: 76, direction: 'rising', virality: 66, play: 'Nutrition myth-busting gets shared as a public service.', hashtags: ['ghee', 'nutritionmyths', 'indianfood'] },
  { id: 'in-travel-1', niche: 'travel', region: 'india', title: 'Underrated weekend trip under ₹10k', hook: 'Skip Goa. This 3-day trip costs under ₹10,000 all in.', angle: 'budget itinerary', format: 'travel itinerary', momentum: 82, direction: 'rising', virality: 76, play: 'Budget itineraries are saved by every young planner in India.', hashtags: ['weekendgetaway', 'budgettravel', 'travelindia'] },
  { id: 'in-travel-2', niche: 'travel', region: 'india', title: 'Hidden gem 20 minutes from home', hook: 'I found a 400-year-old spot 20 minutes from home.', angle: 'local discovery', format: 'hidden gems', momentum: 72, direction: 'rising', virality: 64, play: 'Local-hidden-gem content turns every city into content.', hashtags: ['hiddengems', 'indiatravel', 'exploreindia'] },
  { id: 'in-tech-1', niche: 'tech', region: 'india', title: '₹15,000 phone vs ₹60,000 phone', hook: 'I used both for a month. The budget one won in 3 ways.', angle: 'budget comparison', format: 'comparison', momentum: 84, direction: 'peaking', virality: 78, play: 'Smartphone comparisons are evergreen and always debated.', hashtags: ['budgetphone', 'smartphoneindia', 'techcomparison'] },
  { id: 'in-tech-2', niche: 'tech', region: 'india', title: 'UPI safety mistakes', hook: 'This UPI setting is why money disappears — turn it off now.', angle: 'security rescue', format: 'security tips', momentum: 79, direction: 'rising', virality: 71, play: 'Money-safety warnings get mass-forwarded to family groups.', hashtags: ['upisecurity', 'onlinesafety', 'fintech'] },
  { id: 'in-parenting-1', niche: 'parenting', region: 'india', title: 'CBSE homework guilt', hook: 'Your 6-year-old does not need 3 hours of homework.', angle: 'pressure relief', format: 'parenting advice', momentum: 72, direction: 'rising', virality: 66, play: 'Academic-pressure relief resonates with millions of Indian parents.', hashtags: ['indianparents', 'schooling', 'parentingindia'] },
  { id: 'in-parenting-2', niche: 'parenting', region: 'india', title: 'Lunchbox hacks that come back empty', hook: '10 lunchbox ideas that come back empty, every time.', angle: 'practical wins', format: 'lunchbox ideas', momentum: 74, direction: 'rising', virality: 68, play: 'Lunchbox content is a daily-search ritual for parents.', hashtags: ['lunchboxideas', 'tiffin', 'momhacks'] },
  { id: 'in-finance-1', niche: 'finance', region: 'india', title: 'SIP vs lumpsum, real numbers', hook: 'I ran the actual 10-year numbers. SIP wins — here is why.', angle: 'data explainer', format: 'money explainer', momentum: 83, direction: 'rising', virality: 72, play: 'Real-number investing content out-performs generic stock talk.', hashtags: ['sip', 'investingindia', 'mutualfunds'] },
  { id: 'in-finance-2', niche: 'finance', region: 'india', title: 'Your first salary checklist', hook: 'Your first salary? Do these 4 things before spending any of it.', angle: 'first-job money', format: 'checklist', momentum: 81, direction: 'rising', virality: 76, play: 'First-salary advice is a rite of passage for the young workforce.', hashtags: ['firstsalary', 'moneytips', 'financialfreedom'] },
  { id: 'in-gaming-1', niche: 'gaming', region: 'india', title: 'BGMI settings that reduce lag', hook: 'These BGMI settings cut my ping drops in half.', angle: 'settings rescue', format: 'settings guide', momentum: 77, direction: 'rising', virality: 70, play: 'Settings guides target the huge mobile-battle-royale base.', hashtags: ['bgmi', 'mobilegaming', 'settingsguide'] },
  { id: 'in-gaming-2', niche: 'gaming', region: 'india', title: '₹40,000 budget gaming build', hook: 'A ₹40,000 build that runs your favourites at 60fps.', angle: 'budget build', format: 'build guide', momentum: 75, direction: 'rising', virality: 68, play: 'Budget builds answer the biggest question in Indian PC gaming.', hashtags: ['pcbuild', 'budgetgaming', 'indiangamer'] },
  { id: 'in-lifestyle-1', niche: 'lifestyle', region: 'india', title: 'Hostel room glow-up', hook: 'I transformed my ₹5,000/month hostel room for ₹800.', angle: 'budget makeover', format: 'room makeover', momentum: 78, direction: 'rising', virality: 72, play: 'Budget room makeovers are the dream content of every student.', hashtags: ['roommakeover', 'hostellife', 'roomdecor'] },
  { id: 'in-lifestyle-2', niche: 'lifestyle', region: 'india', title: 'The commute-time productivity hour', hook: 'Turn your 1-hour metro ride into your best work hour.', angle: 'time recovery', format: 'tips', momentum: 71, direction: 'rising', virality: 62, play: 'Commute hacks target millions of daily metro riders.', hashtags: ['productivity', 'commutelife', 'metro'] },

  /* ---- africa ---- */
  { id: 'af-fitness-1', niche: 'fitness', region: 'africa', title: 'The 5am city run', hook: '5am runs are free therapy. This is how I started.', angle: 'community running', format: 'vlog + tips', momentum: 74, direction: 'rising', virality: 66, play: 'Morning run culture is exploding across African cities.', hashtags: ['morningrun', 'africafitness', 'runningcommunity'] },
  { id: 'af-fitness-2', niche: 'fitness', region: 'africa', title: 'Bodyweight 30-day transformation', hook: 'No equipment, 30 days, real results — I filmed everything.', angle: 'proof over hype', format: 'transformation', momentum: 71, direction: 'rising', virality: 70, play: 'Honest no-gym transformations win trust in fitness feeds.', hashtags: ['bodyweight', '30daychallenge', 'transformation'] },
  { id: 'af-beauty-1', niche: 'beauty', region: 'africa', title: 'Shea butter vs retinol for scars', hook: 'The 100-year-old African staple outperformed my $40 serum.', angle: 'heritage vs science', format: 'comparison', momentum: 80, direction: 'rising', virality: 78, play: 'Ingredient-vs-ingredient tests feel both scientific and personal.', hashtags: ['sheabutter', 'skincareafrica', 'naturalbeauty'] },
  { id: 'af-beauty-2', niche: 'beauty', region: 'africa', title: 'The protective-style routine', hook: 'Your protective style fails because of this one step.', angle: 'haircare fix', format: 'routine', momentum: 76, direction: 'rising', virality: 66, play: 'Protective-style care is a high-search, high-save topic.', hashtags: ['protectivehairstyles', 'haircare', 'naturalhair'] },
  { id: 'af-fashion-1', niche: 'fashion', region: 'africa', title: 'Ankara maxi to office-fit', hook: 'The Ankara maxi hiding in your closet is a power office look.', angle: 'workwear remix', format: 'styling', momentum: 79, direction: 'rising', virality: 74, play: 'Local-fabric styling celebrates culture and solves office dressing.', hashtags: ['ankara', 'africanfashion', 'stylediaries'] },
  { id: 'af-fashion-2', niche: 'fashion', region: 'africa', title: 'Accra market haul, three fits', hook: 'Three full outfits for less than one fast-fashion top.', angle: 'thrift value', format: 'haul + try-on', momentum: 82, direction: 'peaking', virality: 80, play: 'Thrift hauls balance style and budget — the core African pattern.', hashtags: ['thrifthaul', 'accrafashion', 'africanstyle'] },
  { id: 'af-food-1', niche: 'food', region: 'africa', title: 'The jollof ranking', hook: 'I blind-tasted jollof from 5 kitchens. The winner surprised me.', angle: 'friendly rivalry', format: 'taste test', momentum: 86, direction: 'peaking', virality: 84, play: 'Jollof debates are guaranteed comment fuel across West Africa.', hashtags: ['jollof', 'nigerianfood', 'ghanafood'] },
  { id: 'af-food-2', niche: 'food', region: 'africa', title: 'Local fruit smoothie bowls', hook: 'Local fruit smoothie bowls that beat the $9 café version.', angle: 'café dupes', format: 'recipe', momentum: 72, direction: 'rising', virality: 62, play: 'Affordable café dupes using local fruit feel fresh and smart.', hashtags: ['smoothiebowl', 'africanfood', 'healthyrecipes'] },
  { id: 'af-travel-1', niche: 'travel', region: 'africa', title: 'Budget safari, Kenya', hook: 'A 2-day budget safari that does not break the trip budget.', angle: 'budget dream', format: 'itinerary', momentum: 78, direction: 'rising', virality: 76, play: 'Budget safaris make a bucket-list dream feel reachable.', hashtags: ['safari', 'kenya', 'travelafrica'] },
  { id: 'af-travel-2', niche: 'travel', region: 'africa', title: 'Why creators move to Accra', hook: 'Why Accra is the African city creators are moving to.', angle: 'city guide', format: 'city guide', momentum: 75, direction: 'rising', virality: 68, play: 'Creator relocation stories tap into the digital-nomad dream.', hashtags: ['accra', 'digitalnomad', 'africatech'] },
  { id: 'af-tech-1', niche: 'tech', region: 'africa', title: 'Mobile money is the blueprint', hook: 'Africa\u2019s mobile money built something the West is copying.', angle: 'proud explainer', format: 'explainer', momentum: 80, direction: 'rising', virality: 74, play: 'Fintech pride explains a system the world is adopting.', hashtags: ['mobilemoney', 'fintechafrica', 'mpesa'] },
  { id: 'af-tech-2', niche: 'tech', region: 'africa', title: 'Data-saving settings that halve bills', hook: 'These data settings halve my monthly bill.', angle: 'cost rescue', format: 'tips', momentum: 73, direction: 'rising', virality: 64, play: 'Data-cost hacks serve the mobile-first majority.', hashtags: ['datasaving', 'techhacks', 'africatech'] },
  { id: 'af-parenting-1', niche: 'parenting', region: 'africa', title: 'The story behind African names', hook: 'The name we give kids carries a whole story. Here are 5.', angle: 'culture + info', format: 'culture explainer', momentum: 69, direction: 'rising', virality: 58, play: 'Name-meaning content mixes pride, nostalgia and education.', hashtags: ['africannames', 'culture', 'parentingafrica'] },
  { id: 'af-parenting-2', niche: 'parenting', region: 'africa', title: 'School-run chaos, solved', hook: 'A 3-step morning plan that ends the school-run chaos.', angle: 'practical wins', format: 'tips', momentum: 70, direction: 'rising', virality: 62, play: 'School-run organisation is a daily pain for working parents.', hashtags: ['schoolrun', 'morningroutine', 'parentingtips'] },
  { id: 'af-finance-1', niche: 'finance', region: 'africa', title: 'First $1,000 from a side hustle', hook: 'I went from 0 to $1,000 in 90 days. Exact steps.', angle: 'money story', format: 'money story', momentum: 81, direction: 'rising', virality: 78, play: 'Side-hustle journeys are the most-saved finance content.', hashtags: ['sidehustle', 'financialfreedom', 'moneystory'] },
  { id: 'af-finance-2', niche: 'finance', region: 'africa', title: 'The send-and-save trick', hook: 'Transfer money the day you earn it, then forget it exists.', angle: 'habit hack', format: 'money hack', momentum: 76, direction: 'rising', virality: 70, play: 'Simple savings habits beat complex advice for most viewers.', hashtags: ['savingmoney', 'moneyhabits', 'financetips'] },
  { id: 'af-gaming-1', niche: 'gaming', region: 'africa', title: 'Esports is the new football', hook: 'African esports went from jokes to sold-out arenas.', angle: 'scene story', format: 'story + stats', momentum: 72, direction: 'rising', virality: 66, play: 'Scene-growth stories ride national pride and gaming hype.', hashtags: ['africaesports', 'gaming', 'esports'] },
  { id: 'af-gaming-2', niche: 'gaming', region: 'africa', title: 'Games your phone can run', hook: 'Your phone can run these at 60fps with 2 settings.', angle: 'budget gaming', format: 'tips', momentum: 70, direction: 'rising', virality: 62, play: 'Mobile-first gaming tips match the dominant device reality.', hashtags: ['mobilegaming', 'budgetgaming', 'gamingafrica'] },
  { id: 'af-lifestyle-1', niche: 'lifestyle', region: 'africa', title: 'Market day, the underrated routine', hook: 'Saturday market trips beat grocery apps on cost, quality and calm.', angle: 'simple living', format: 'vlog', momentum: 74, direction: 'rising', virality: 66, play: 'Slow-living market vlogs feel authentic and refreshing.', hashtags: ['marketday', 'simpleliving', 'lifestyle'] },
  { id: 'af-lifestyle-2', niche: 'lifestyle', region: 'africa', title: 'The village weekend reset', hook: 'A weekend in the village fixes what apps cannot.', angle: 'digital detox', format: 'vlog', momentum: 71, direction: 'rising', virality: 64, play: 'Homecoming content taps deep nostalgia and family bonds.', hashtags: ['villageweekend', 'homecoming', 'slowliving'] },

  /* ---- usa ---- */
  { id: 'us-fitness-1', niche: 'fitness', region: 'us', title: 'First-time gym starter kit', hook: 'I went to the gym for the first time at 27. Here is the full plan.', angle: 'anxiety rescue', format: 'guide', momentum: 76, direction: 'rising', virality: 70, play: 'Gym-anxiety content welcomes the beginner majority.', hashtags: ['gymforbeginners', 'fitnessjourney', 'gymxiety'] },
  { id: 'us-beauty-1', niche: 'beauty', region: 'us', title: 'Sephora vs drugstore blind test', hook: 'I blind-tested 12 pairs. The $9 one won twice.', angle: 'value showdown', format: 'blind test', momentum: 84, direction: 'peaking', virality: 80, play: 'Store-vs-store tests trigger instant shareability.', hashtags: ['sephora', 'drugstorebeauty', 'dupetest'] },
  { id: 'us-fashion-1', niche: 'fashion', region: 'us', title: 'The 20-piece capsule closet', hook: '37 pieces is a trap. Here is the 20-piece closet that works.', angle: 'minimalism', format: 'styling', momentum: 74, direction: 'rising', virality: 68, play: 'Capsule-closet math attracts over-shoppers and minimalists.', hashtags: ['capsulewardrobe', 'minimalism', 'closetcleanout'] },
  { id: 'us-food-1', niche: 'food', region: 'us', title: 'The secret luxury dupe at Trader Joe\u2019s', hook: 'The Trader Joe\u2019s item that is secretly a luxury dupe.', angle: 'hidden value', format: 'dupe test', momentum: 78, direction: 'peaking', virality: 72, play: 'Store-specific dupes drive in-store "go check" engagement.', hashtags: ['traderjoes', 'fooddupe', 'groceryhacks'] },
  { id: 'us-finance-1', niche: 'finance', region: 'us', title: 'Billionaire budget myths', hook: 'The "ramen noodle" wealth advice is why you stay broke.', angle: 'myth-bust', format: 'money myth test', momentum: 82, direction: 'rising', virality: 76, play: 'Calling out money myths gets shared as a wake-up call.', hashtags: ['wealth', 'moneymyths', 'personalfinance'] },
  { id: 'us-tech-1', niche: 'tech', region: 'us', title: 'The AI stack that replaced my assistant', hook: '4 AI tools that run my whole content pipeline.', angle: 'stack tour', format: 'stack tour', momentum: 80, direction: 'rising', virality: 72, play: 'AI stack tours are the new productivity flex.', hashtags: ['aitools', 'creatorstack', 'contentpipeline'] },

  /* ---- uk ---- */
  { id: 'uk-fashion-1', niche: 'fashion', region: 'uk', title: 'Charity-shop designer finds', hook: 'Found a designer coat in a charity shop for £12.', angle: 'thrift treasure', format: 'haul', momentum: 79, direction: 'rising', virality: 76, play: 'Charity-shop treasure hunts blend savings with style.', hashtags: ['charityshop', 'thriftfinds', 'ukfashion'] },
  { id: 'uk-beauty-1', niche: 'beauty', region: 'uk', title: 'Boots No7 vs luxury serum', hook: 'The Boots serum that outperformed my £60 one.', angle: 'high-street win', format: 'comparison', momentum: 77, direction: 'rising', virality: 70, play: 'High-street vs luxury is a national conversation.', hashtags: ['boots', 'skincareuk', 'highstreetbeauty'] },
  { id: 'uk-food-1', niche: 'food', region: 'uk', title: 'A week of dinners for £25', hook: 'A week of dinners for £25 — full plan.', angle: 'cost of living', format: 'meal prep', momentum: 74, direction: 'rising', virality: 66, play: 'Budget meal plans answer the cost-of-living squeeze.', hashtags: ['budgetmeals', 'mealprep', 'ukfood'] },
  { id: 'uk-lifestyle-1', niche: 'lifestyle', region: 'uk', title: 'The rain-proof routine', hook: 'Rain-proof your routine — 5 changes that changed my mood.', angle: 'weather survival', format: 'tips', momentum: 70, direction: 'rising', virality: 60, play: 'British weather hacks are endlessly relatable.', hashtags: ['ukweather', 'lifestyle', 'dailyroutine'] },

  /* ---- missing region/niche fills ---- */
  { id: 'us-parenting-1', niche: 'parenting', region: 'us', title: 'The bedtime routine that actually works', hook: 'Sleep training is a scam. This routine fixed it in 3 nights.', angle: 'sleep hack', format: 'routine vlog', momentum: 76, direction: 'rising', virality: 72, play: 'Sleep-deprived parents share anything that works.', hashtags: ['sleeptraining', 'momhacks', 'babyroutine'] },
  { id: 'us-parenting-2', niche: 'parenting', region: 'us', title: 'Screen time hacks that work', hook: 'I stopped fighting screen time. Here is what happened.', angle: 'modern parenting', format: 'storytime', momentum: 73, direction: 'rising', virality: 68, play: 'Screen-time guilt is the #1 parenting debate right now.', hashtags: ['screentime', 'parentingtips', 'modernmom'] },
  { id: 'us-lifestyle-1', niche: 'lifestyle', region: 'us', title: 'The Sunday reset that changed my week', hook: 'I reset every Sunday. Monday feels different now.', angle: 'weekly reset', format: 'ASMR reset', momentum: 80, direction: 'rising', virality: 74, play: 'Sunday reset content is the most-saved lifestyle format.', hashtags: ['sundayreset', 'weeklyreset', 'cleaningmotivation'] },
  { id: 'us-gaming-1', niche: 'gaming', region: 'us', title: 'The FPS boost that costs nothing', hook: 'This free setting gives you 30 more FPS instantly.', angle: 'performance unlock', format: 'settings guide', momentum: 74, direction: 'rising', virality: 70, play: 'Free performance tips dominate gaming feeds.', hashtags: ['fpsboost', 'pcgaming', 'settings'] },
  { id: 'uk-tech-1', niche: 'tech', region: 'uk', title: 'The broadband hack nobody uses', hook: 'Your broadband is slower than it should be. Fix this now.', angle: 'speed rescue', format: 'tips', momentum: 71, direction: 'rising', virality: 62, play: 'UK broadband frustration is a universal pain point.', hashtags: ['broadband', 'techuk', 'internetspeed'] },
  { id: 'uk-fitness-1', niche: 'fitness', region: 'uk', title: 'Couch to 5K: the honest truth', hook: 'I tried Couch to 5K for 30 days. Here is what nobody warns you about.', angle: 'honest review', format: 'vlog + tips', momentum: 75, direction: 'rising', virality: 66, play: 'Couch to 5K is the UKs most downloaded fitness programme.', hashtags: ['couchto5k', 'running', 'fitnessuk'] },
  { id: 'uk-parenting-1', niche: 'parenting', region: 'uk', title: 'The nursery swap that saved 200', hook: 'The 200 nursery essential that does nothing. Skip it.', angle: 'baby savings', format: 'honest haul', momentum: 72, direction: 'rising', virality: 64, play: 'Money-saving baby content resonates in the cost-of-living squeeze.', hashtags: ['nursery', 'babyessentials', 'parentinguk'] },
  { id: 'in-parenting-1', niche: 'parenting', region: 'india', title: 'The tiffin that kids actually eat', hook: 'My kid rejected every tiffin until I tried this one trick.', angle: 'lunchbox rescue', format: 'recipe tips', momentum: 78, direction: 'rising', virality: 72, play: 'Tiffin content is a daily ritual for Indian parents.', hashtags: ['tiffinideas', 'kidsfood', 'indianmoms'] },

  /* ---- south africa ---- */
  { id: 'sa-beauty-1', niche: 'beauty', region: 'sa', title: 'Clicks vs Dis-Chem skincare showdown', hook: 'I tested the same routine from both stores. One won by far.', angle: 'store showdown', format: 'side-by-side test', momentum: 84, direction: 'rising', virality: 80, play: 'Clicks vs Dis-Chem debates are the SA beauty equivalent of jollof wars.', hashtags: ['clicks', 'dischem', 'skincareza'] },
  { id: 'sa-beauty-2', niche: 'beauty', region: 'sa', title: 'R200 full face beat', hook: 'A full face of makeup for R200. It actually looks good.', angle: 'budget beauty', format: 'tutorial', momentum: 80, direction: 'rising', virality: 76, play: 'Budget beauty tutorials outperform luxury in SA feeds.', hashtags: ['budgetbeauty', 'makeuptutorial', 'saibeauty'] },
  { id: 'sa-beauty-3', niche: 'beauty', region: 'sa', title: 'Skin Functional honest review', hook: 'Skin Functional is everywhere. I tested it for 60 days.', angle: 'brand review', format: 'review vlog', momentum: 77, direction: 'rising', virality: 72, play: 'Local brand reviews drive massive engagement in SA.', hashtags: ['skinfunctional', 'skincarereview', 'beautysa'] },
  { id: 'sa-beauty-4', niche: 'beauty', region: 'sa', title: 'Summer SPF for darker skin', hook: 'Your sunscreen leaves a white cast. Here is the one that does not.', angle: 'product rescue', format: 'product test', momentum: 82, direction: 'rising', virality: 78, play: 'SPF content for darker skin is underserved and highly shareable.', hashtags: ['sunscreen', 'spfza', 'skincareforblackwomen'] },
  { id: 'sa-fitness-1', niche: 'fitness', region: 'sa', title: 'Home workout for load shedding', hook: 'Load shedding killed my gym routine. This home workout replaced it.', angle: 'load-shedding hack', format: 'follow-along', momentum: 76, direction: 'rising', virality: 70, play: 'Load shedding content is uniquely SA and always relevant.', hashtags: ['loadshedding', 'homeworkout', 'fitnessza'] },
  { id: 'sa-fitness-2', niche: 'fitness', region: 'sa', title: 'Pick n Pay protein haul', hook: 'The cheapest protein in South Africa. Full haul and taste test.', angle: 'budget nutrition', format: 'haul + review', momentum: 74, direction: 'rising', virality: 68, play: 'Budget protein content targets the massive gym community.', hashtags: ['proteinhaul', 'budgetfitness', 'gymza'] },
  { id: 'sa-fashion-1', niche: 'fashion', region: 'sa', title: 'Mr Price vs H&M quality test', hook: 'The R99 Mr Price top lasted longer than the R400 H&M one.', angle: 'dupe test', format: 'quality comparison', momentum: 80, direction: 'rising', virality: 76, play: 'SA fashion dupe tests are always debated in the comments.', hashtags: ['mrprice', 'fashionza', 'budgetfashion'] },
  { id: 'sa-fashion-2', niche: 'fashion', region: 'sa', title: 'Heritage Day outfit ideas', hook: 'Heritage Day is coming. Here are 5 fits that celebrate your roots.', angle: 'cultural style', format: 'styling', momentum: 78, direction: 'peaking', virality: 74, play: 'Heritage Day content spikes every September in SA.', hashtags: ['heritageday', 'saifashion', 'culturalstyle'], season: 'Heritage Day (Sep)' },
  { id: 'sa-food-1', niche: 'food', region: 'sa', title: 'The braai tier list', hook: 'Biltong, wors or sosatie — the braai tier list nobody asked for.', angle: 'ranking debate', format: 'tier list', momentum: 86, direction: 'rising', virality: 84, play: 'Braai debates are SA social media at its most passionate.', hashtags: ['braai', 'safood', 'biltong'] },
  { id: 'sa-food-2', niche: 'food', region: 'sa', title: 'R50 dinner for the whole family', hook: 'A full family dinner for R50. It is not what you think.', angle: 'budget meals', format: 'recipe', momentum: 82, direction: 'rising', virality: 78, play: 'Budget meal content is life-saving in the current economy.', hashtags: ['budgetmeals', 'cheapdinner', 'southafricanfood'] },
  { id: 'sa-food-3', niche: 'food', region: 'sa', title: 'Checkers Sixty60 vs Woolies Dash', hook: 'I ordered the same basket from both. The winner shocked me.', angle: 'delivery showdown', format: 'comparison', momentum: 79, direction: 'rising', virality: 74, play: 'Delivery app comparisons are highly relevant to urban SA.', hashtags: ['checkers', 'woolworths', 'fooddelivery'] },
  { id: 'sa-tech-1', niche: 'tech', region: 'sa', title: 'Best prepaid data deals right now', hook: 'These 3 data deals saved me R300 a month.', angle: 'savings rescue', format: 'tips', momentum: 80, direction: 'rising', virality: 72, play: 'Data cost is the #1 tech pain point for SA consumers.', hashtags: ['datadeals', 'techtips', 'southafricatech'] },
  { id: 'sa-tech-2', niche: 'tech', region: 'sa', title: 'Load shedding gadget essentials', hook: 'These 3 gadgets survived every load shedding session this year.', angle: 'load-shedding prep', format: 'product review', momentum: 78, direction: 'peaking', virality: 70, play: 'Load shedding product reviews spike before summer.', hashtags: ['loadshedding', 'gadgets', 'eskom'], season: 'Load shedding season' },
  { id: 'sa-travel-1', niche: 'travel', region: 'sa', title: 'Cape Town on a budget', hook: '3 days in Cape Town for under R3,000. Full itinerary.', angle: 'budget travel', format: 'itinerary', momentum: 82, direction: 'rising', virality: 78, play: 'Budget itineraries for SA destinations get screenshotted constantly.', hashtags: ['capetown', 'travelza', 'budgettravel'] },
  { id: 'sa-travel-2', niche: 'travel', region: 'sa', title: 'Hidden gems in Joburg', hook: 'The spot in Joburg that looks like Europe. Nobody knows about it.', angle: 'hidden gems', format: 'local discovery', momentum: 76, direction: 'rising', virality: 72, play: 'Joburg hidden gems always surprise locals.', hashtags: ['joburg', 'hiddengems', 'southafricatravel'] },
  { id: 'sa-parenting-1', niche: 'parenting', region: 'sa', title: 'Load shedding routine with toddlers', hook: 'Load shedding with a toddler. The routine that saved my sanity.', angle: 'load-shedding parenting', format: 'tips + vlog', momentum: 75, direction: 'rising', virality: 68, play: 'Parenting + load shedding is the most relatable SA combination.', hashtags: ['toddlers', 'loadshedding', 'parentingsa'] },
  { id: 'sa-parenting-2', niche: 'parenting', region: 'sa', title: 'School fees vs homeschool', hook: 'I calculated 12 years of school fees. Then I looked at homeschool.', angle: 'money decision', format: 'money breakdown', momentum: 77, direction: 'rising', virality: 72, play: 'School fee content triggers emotional debates.', hashtags: ['schoolfees', 'homeschool', 'parentingza'] },
  { id: 'sa-finance-1', niche: 'finance', region: 'sa', title: 'Tax-free savings explained', hook: 'Your TFSA is losing money if you are doing this one thing wrong.', angle: 'money rescue', format: 'explainer', momentum: 78, direction: 'rising', virality: 70, play: 'TFSA content is the most-searched personal finance topic in SA.', hashtags: ['tfsa', 'investingsa', 'moneytips'] },
  { id: 'sa-finance-2', niche: 'finance', region: 'sa', title: 'Side hustles that pay in rands', hook: '3 side hustles that actually pay in rands. I tested all three.', angle: 'hustle review', format: 'money story', momentum: 82, direction: 'rising', virality: 76, play: 'Rands-based income content resonates more than USD-focused in SA.', hashtags: ['sidehustle', 'makemoney', 'southafricanfinance'] },
  { id: 'sa-lifestyle-1', niche: 'lifestyle', region: 'sa', title: 'Load shedding self-care routine', hook: 'Load shedding is annoying. This self-care routine makes it bearable.', angle: 'power outage hack', format: 'routine', momentum: 74, direction: 'rising', virality: 66, play: 'Turning load shedding into content is uniquely SA.', hashtags: ['selfcare', 'loadshedding', 'lifestyleza'] },
  { id: 'sa-lifestyle-2', niche: 'lifestyle', region: 'sa', title: 'Braai day essentials', hook: 'Your braai is missing these 3 things. Here is why.', angle: 'braai upgrade', format: 'tips', momentum: 80, direction: 'peaking', virality: 76, play: 'Braai content spikes around Heritage Day and December.', hashtags: ['braai', 'heritageday', 'southafricalifestyle'], season: 'Heritage Day / December' },
  { id: 'sa-gaming-1', niche: 'gaming', region: 'sa', title: 'Best gaming spots in SA', hook: 'The gaming cafe in Joburg that nobody talks about.', angle: 'local discovery', format: 'vlog', momentum: 72, direction: 'rising', virality: 64, play: 'Local gaming scene content is underserved in SA.', hashtags: ['gamingza', 'gamingcafe', 'southafricangaming'] },
  { id: 'sa-gaming-2', niche: 'gaming', region: 'sa', title: 'Gaming on load shedding', hook: 'Load shedding killed my gaming session. Here is the fix.', angle: 'power problem', format: 'tips', momentum: 74, direction: 'rising', virality: 68, play: 'Gaming + load shedding is the most relatable SA gaming content.', hashtags: ['loadshedding', 'gaming', 'gamingtips'] },

  /* ---- seasonal templates ---- */
  { id: 'season-ramadan-1', niche: 'lifestyle', region: 'world', title: 'Ramadan routine that does not burn you out', hook: 'The Ramadan schedule that keeps you productive and sane.', angle: 'routine optimiser', format: 'routine vlog', momentum: 78, direction: 'peaking', virality: 72, play: 'Ramadan content spikes every year with massive search volume.', hashtags: ['ramadan', 'ramadanroutine', 'fasting'], season: 'Ramadan' },
  { id: 'season-ramadan-2', niche: 'beauty', region: 'world', title: 'Ramadan skincare for fasting skin', hook: 'Fasting dehydrates your skin. Here is the 3-step fix.', angle: 'seasonal skincare', format: 'routine', momentum: 74, direction: 'peaking', virality: 68, play: 'Seasonal skincare adapts evergreen content to trending moments.', hashtags: ['ramadanskincare', 'hydrationskin', 'fasting'], season: 'Ramadan' },
  { id: 'season-blackfriday-1', niche: 'beauty', region: 'world', title: 'Black Friday beauty buys actually worth it', hook: 'Skip the noise. These 5 Black Friday beauty deals are the only ones that matter.', angle: 'curated deals', format: 'listicle', momentum: 85, direction: 'peaking', virality: 82, play: 'Black Friday content starts trending 3 weeks before the event.', hashtags: ['blackfriday', 'beautyal', 'skincaredeals'], season: 'Black Friday (Nov)' },
  { id: 'season-heritage-1', niche: 'fashion', region: 'sa', title: 'Heritage Day fit guide', hook: 'Heritage Day fits that celebrate every culture. Pick yours.', angle: 'cultural celebration', format: 'styling', momentum: 80, direction: 'peaking', virality: 78, play: 'Heritage Day content spikes every September in SA.', hashtags: ['heritageday', 'saifashion', 'celebration'], season: 'Heritage Day (Sep)' },
  { id: 'season-summer-1', niche: 'fitness', region: 'sa', title: 'Summer body myth', hook: 'Stop chasing a summer body. Chase a body that works in summer.', angle: 'myth-bust', format: 'motivation', momentum: 82, direction: 'rising', virality: 76, play: 'Summer body content is polarising and gets shared widely.', hashtags: ['summerbody', 'fitnessmotivation', 'bodypositive'], season: 'Summer (Dec-Feb)' },
  { id: 'season-newyear-1', niche: 'fitness', region: 'world', title: 'The resolution that actually sticks', hook: 'January resolutions fail by February. Here is the one that does not.', angle: 'habit science', format: 'tips', momentum: 84, direction: 'peaking', virality: 80, play: 'New Year resolution content has the highest search volume of the year.', hashtags: ['newyear', 'resolutions', 'habits'], season: 'New Year (Jan)' },

  /* ---- evergreen ---- */
  { id: 'evergreen-grwm-1', niche: 'beauty', region: 'world', title: 'GRWM: the honest version', hook: 'GRWM but I actually tell you what I think about each product.', angle: 'honest GRWM', format: 'GRWM', momentum: 76, direction: 'rising', virality: 70, play: 'GRWM is the #1 evergreen beauty format. Always performs.', hashtags: ['grwm', 'getreadywithme', 'honestreview'] },
  { id: 'evergreen-pov-1', niche: 'lifestyle', region: 'world', title: 'POV: you finally started the thing', hook: 'POV: You stopped overthinking and just started.', angle: 'motivation', format: 'POV', momentum: 74, direction: 'rising', virality: 68, play: 'POV content is the most versatile short-form format ever.', hashtags: ['pov', 'motivation', 'starttoday'] },
  { id: 'evergreen-dayin-1', niche: 'lifestyle', region: 'world', title: 'Day in my life as a full-time creator', hook: 'A real day in my life. No aesthetic. Just work.', angle: 'behind the curtain', format: 'day-in-my-life', momentum: 78, direction: 'rising', virality: 72, play: 'Day-in-my-life is the evergreen format that never dies.', hashtags: ['dayinmylife', 'creatorlife', 'behindthescenes'] },
  { id: 'evergreen-bangforbuck-1', niche: 'beauty', region: 'world', title: 'Best bang for your buck', hook: 'The cheapest product that performs like a luxury one.', angle: 'value pick', format: 'product review', momentum: 80, direction: 'rising', virality: 74, play: 'Value-for-money content always wins across demographics.', hashtags: ['bestbu', 'affordablebeauty', 'valuepick'] },
  { id: 'evergreen-saved-1', niche: 'food', region: 'world', title: 'The recipe you will actually make tonight', hook: 'Stop scrolling. This is the recipe you will actually cook tonight.', angle: 'quick recipe', format: 'recipe', momentum: 77, direction: 'rising', virality: 70, play: 'Recipe content with "tonight" in the hook gets 30% more saves.', hashtags: ['easyrecipe', 'dinnertonight', 'quickmeals'] },
];

/* ---------------------------------------------------------------------------
 * Regional benchmarks — "what top UGC creators charge in your market"
 * Based on 2026 marketplace data across Billo, JoinBrands, Collabstr and Insense.
 * ------------------------------------------------------------------------- */

export interface RegionalBenchmarkRow { label: string; low: number; high: number }
export interface RegionalBenchmark { region: TrendRegion; currency: string; symbol: string; note: string; rows: RegionalBenchmarkRow[] }

export const REGIONAL_BENCHMARKS: RegionalBenchmark[] = [
  { region: 'sa', currency: 'ZAR', symbol: 'R', note: 'Growing UGC scene. Clicks, Dis-Chem, Woolworths are the big brief-givers. Quote in rands, not dollars.', rows: [
    { label: 'Single short video (15-60s)', low: 1500, high: 5000 },
    { label: '3-video bundle', low: 4000, high: 12000 },
    { label: 'Paid-ad rights (90 days)', low: 800, high: 3000 },
    { label: 'Monthly retainer (4-8 videos)', low: 10000, high: 35000 },
  ]},
  { region: 'india', currency: 'INR', symbol: '\u20B9', note: 'Volume-first market. Quote packages, not singles — brands expect bundles.', rows: [
    { label: 'Single short video (15-60s)', low: 800, high: 2500 },
    { label: '3-video bundle', low: 2000, high: 6000 },
    { label: 'Paid-ad rights (90 days)', low: 400, high: 1500 },
    { label: 'Monthly retainer (4-8 videos)', low: 8000, high: 25000 },
  ]},
  { region: 'africa', currency: 'USD', symbol: '$', note: 'Fast-growing scene. International clients pay 2-3x local rates.', rows: [
    { label: 'Single short video (15-60s)', low: 50, high: 200 },
    { label: '3-video bundle', low: 120, high: 450 },
    { label: 'Paid-ad rights (90 days)', low: 25, high: 100 },
    { label: 'Monthly retainer (4-8 videos)', low: 400, high: 1500 },
  ]},
  { region: 'us', currency: 'USD', symbol: '$', note: 'Highest pay, most competition. Paid-ad rights are the profit lever.', rows: [
    { label: 'Single short video (15-60s)', low: 200, high: 800 },
    { label: '3-video bundle', low: 500, high: 2000 },
    { label: 'Paid-ad rights (90 days)', low: 100, high: 400 },
    { label: 'Monthly retainer (4-8 videos)', low: 2500, high: 10000 },
  ]},
  { region: 'uk', currency: 'GBP', symbol: '\u00A3', note: 'Strong budgets, style-heavy brands. Cost-of-living angles win.', rows: [
    { label: 'Single short video (15-60s)', low: 150, high: 600 },
    { label: '3-video bundle', low: 400, high: 1500 },
    { label: 'Paid-ad rights (90 days)', low: 75, high: 300 },
    { label: 'Monthly retainer (4-8 videos)', low: 2000, high: 8000 },
  ]},
  { region: 'world', currency: 'USD', symbol: '$', note: 'Blended benchmark for international or remote clients.', rows: [
    { label: 'Single short video (15-60s)', low: 100, high: 500 },
    { label: '3-video bundle', low: 250, high: 1200 },
    { label: 'Paid-ad rights (90 days)', low: 50, high: 250 },
    { label: 'Monthly retainer (4-8 videos)', low: 1000, high: 5000 },
  ]},
];

/** Region-aware hashtag packs layered on top of a trend's own tags. */
export const REGION_HASHTAGS: Record<TrendRegion, string[]> = {
  sa: ['southafrica', 'saiforward', 'trendinginsa', 'saicreator'],
  india: ['viralindia', 'reelsindia', 'trendingindia', 'instagrowth'],
  africa: ['africatiktok', 'trendinginafrica', 'africancreators'],
  us: ['usatiktok', 'trendingnow', 'creatorus'],
  uk: ['ukcreator', 'trendinguk', 'britishcreator'],
  world: ['fyp', 'trending', 'viral', 'creatorcommunity'],
};
