import type { ContentPillar, Goal, HookItem, ProductionChecklist, MediaKitProfile } from '../types/ugc';

/** A creator's private profile, persisted on-device and used to preconfigure the whole workspace. */
export interface OnboardingProfile {
  name: string;
  niches: string[];
  goal: number;
  experience: string;
  onboarded: boolean;
}

const PROFILE_KEY = 'sri_onboarding_profile_v1';

export function loadProfile(): OnboardingProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as OnboardingProfile) : null;
  } catch { return null; }
}

export function saveProfile(profile: OnboardingProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export const GOAL_OPTIONS = [
  { label: 'Side income', value: 500, emoji: '🌱', note: 'A few hundred dollars a month on top of the day job.' },
  { label: 'Part-time pay', value: 1500, emoji: '💪', note: 'Like a steady part-time job. A few deals a week.' },
  { label: 'Full-time goal', value: 3000, emoji: '🚀', note: 'Replace a salary. Retainers + repeat clients.' },
  { label: 'Dream big', value: 5000, emoji: '👑', note: 'Established creator territory. Direct deals + usage rights.' },
];

export const EXPERIENCE_OPTIONS = [
  { label: 'Brand new', value: 'new', emoji: '🌱', note: 'Never made a paid UGC video yet.' },
  { label: 'A few videos done', value: 'some', emoji: '🎬', note: 'Made some content, maybe 1–5 paid deals.' },
  { label: 'Consistent creator', value: 'consistent', emoji: '🔥', note: 'Regular content, some repeat clients.' },
  { label: 'Professional', value: 'pro', emoji: '👑', note: 'UGC is (or is becoming) my main income.' },
];

/** Plain-English niche picker options, ordered so the suggested order is clear. */
export const NICHE_OPTIONS = [
  { value: 'fitness', label: 'Fitness & wellness', emoji: '💪', tagline: 'Workouts, mindset, healthy habits' },
  { value: 'beauty', label: 'Beauty & lifestyle', emoji: '💄', tagline: 'Makeup, skincare, everyday glow' },
  { value: 'fashion', label: 'Fashion & style', emoji: '👗', tagline: 'Outfits, finds, capsule wardrobes' },
  { value: 'food', label: 'Food & cooking', emoji: '🍳', tagline: 'Recipes, hacks, weeknight dinners' },
  { value: 'travel', label: 'Travel', emoji: '✈️', tagline: 'Hidden gems, itineraries, honest guides' },
  { value: 'tech', label: 'Tech & gadgets', emoji: '📱', tagline: 'Reviews, setups, budget picks' },
  { value: 'parenting', label: 'Parenting', emoji: '👶', tagline: 'Sane routines, honest moments' },
  { value: 'finance', label: 'Money & finance', emoji: '💰', tagline: 'Side hustles, saving, smart money' },
  { value: 'lifestyle', label: 'Everyday lifestyle', emoji: '☕', tagline: 'Day-in-the-life, routines, vibes' },
];

export const NICHE_TAGLINES: Record<string, string> = Object.fromEntries(NICHE_OPTIONS.map((n) => [n.value, n.tagline]));

/** Starter content pillars scaffolded from the chosen niches. */
export function starterPillars(niches: string[]): Array<Omit<ContentPillar, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'>> {
  const pillars: Array<Omit<ContentPillar, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'>> = [
    { name: 'Education', description: 'Teach something useful in under 60 seconds', target_audience: `People who want ${niches[0] ?? 'lifestyle'} tips without the fluff`, content_promise: 'One clear, useful lesson per video', offer_angle: 'Practical + friendly, never preachy', example_topics: ['mistakes to avoid', 'my exact routine', 'the fix nobody shares'], goals: '', target_mix: 40 },
    { name: 'Connection', description: 'Share the real, relatable human side', target_audience: 'The community that vibes with you', content_promise: 'Feel seen, not sold to', offer_angle: 'Honest behind-the-curtain moments', example_topics: ['day in the life', 'failures & lessons', 'small wins'], goals: '', target_mix: 30 },
    { name: 'Trends & growth', description: 'Ride trends and fresh angles for reach', target_audience: 'The curious, trend-aware audience', content_promise: 'Hot takes and new perspectives', offer_angle: 'First-mover on what is next', example_topics: ['trend reactions', 'contrarian takes', 'predictions'], goals: '', target_mix: 30 },
  ];
  return pillars;
}

/** Starter goals scaffolded from the monthly income target. */
export function starterGoals(goalValue: number): Array<Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'>> {
  return [
    { type: 'revenue', name: `Earn $${goalValue.toLocaleString()} / month from UGC`, target: goalValue, current_progress: 0, status: 'active', deadline: null },
    { type: 'content', name: 'Publish 8 short-form videos', target: 8, current_progress: 0, status: 'active', deadline: null },
    { type: 'audience', name: 'Reach 1,000 followers', target: 1000, current_progress: 0, status: 'active', deadline: null },
    { type: 'skill', name: 'Land my first 3 paid deals', target: 3, current_progress: 0, status: 'active', deadline: null },
  ];
}

/** Proven hook starters per niche, seeded into the hook library as "winning" so the AI learns fast. */
export function starterHooks(niches: string[]): Array<Omit<HookItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'>> {
  const bank: Record<string, Array<{ content: string; type: string }>> = {
    fitness: [
      { content: "This 3-move set is the only thing I do before coffee.", type: 'Question' },
      { content: 'Nobody tells you the hardest part of getting fit is day 6.', type: 'Myth-Bust' },
      { content: 'Why most home workouts fail before week 2 (and the fix).', type: 'Question' },
      { content: 'I tested 5 free workout apps so you do not have to.', type: 'Big Promise' },
    ],
    beauty: [
      { content: 'The beauty trick dermatologists never say out loud.', type: 'Curiosity Gap' },
      { content: 'Why your makeup always looks different in photos.', type: 'Question' },
      { content: '3 clean-girl makeup mistakes ruining your base.', type: 'List' },
      { content: 'I tried the viral serum for 30 days, here is the truth.', type: 'Story' },
    ],
    fashion: [
      { content: 'The 5 pieces that make every outfit look expensive.', type: 'Big Promise' },
      { content: 'Why your closet feels full but you have nothing to wear.', type: 'Question' },
      { content: 'A capsule wardrobe is a scam unless you do this.', type: 'Myth-Bust' },
      { content: 'I styled one dress 5 ways so you do not have to.', type: 'Story' },
    ],
    food: [
      { content: 'The 20-minute dinner that beats any takeout.', type: 'Big Promise' },
      { content: 'Why your meals never taste like the recipe videos.', type: 'Question' },
      { content: '3 cooking mistakes that make food taste average.', type: 'List' },
    ],
    travel: [
      { content: 'The hidden-gem itinerary nobody posts about.', type: 'Curiosity Gap' },
      { content: '3 travel mistakes I keep seeing everyone make.', type: 'List' },
      { content: 'Why this city is better off-season.', type: 'Myth-Bust' },
    ],
    tech: [
      { content: 'The budget gadget that replaced my $500 setup.', type: 'Big Promise' },
      { content: '3 tech settings everyone should change first.', type: 'List' },
    ],
    parenting: [
      { content: 'The 10-minute routine that saved our mornings.', type: 'Story' },
      { content: 'Why the toddler phase is harder than everyone says.', type: 'Relatable' },
    ],
    finance: [
      { content: 'The $1,000 side income nobody talks about.', type: 'Big Promise' },
      { content: '3 money habits that quietly changed everything.', type: 'List' },
    ],
    lifestyle: [
      { content: 'A realistic day in the life, no filters.', type: 'Story' },
      { content: '3 small habits that make the day feel calmer.', type: 'List' },
    ],
  };
  const out: Array<Omit<HookItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'>> = [];
  for (const niche of niches) {
    for (const hook of bank[niche] ?? bank.lifestyle ?? []) {
      out.push({ type: hook.type, content: hook.content, niche, platform: 'tiktok', performance_notes: 'Seeded starter — proven pattern for this niche.', status: 'winning', times_used: 1 });
    }
  }
  return out;
}

/** Starter shoot + edit checklists so she can film day one. */
export function starterChecklists(): Array<Omit<ProductionChecklist, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'>> {
  return [
    {
      name: 'Shoot day essentials',
      category: 'filming',
      items: [
        { id: 's1', text: 'Phone charged + cleaned lens', checked: false },
        { id: 's2', text: 'Ring light or window light facing me', checked: false },
        { id: 's3', text: 'Phone on tripod, eye level, portrait mode', checked: false },
        { id: 's4', text: 'Mic clipped in, test a 5-second clip', checked: false },
        { id: 's5', text: 'Film the hook 2–3 times (pick the best)', checked: false },
        { id: 's6', text: 'Get 2 b-roll beats for cutaways', checked: false },
      ],
    },
    {
      name: 'Edit & publish',
      category: 'editing',
      items: [
        { id: 'e1', text: 'Cut every 4–6 seconds', checked: false },
        { id: 'e2', text: 'On-beat captions, readable size', checked: false },
        { id: 'e3', text: 'Loop the ending to the opening frame', checked: false },
        { id: 'e4', text: 'Caption + 8 hashtags ready', checked: false },
        { id: 'e5', text: 'Post in the best time slot', checked: false },
      ],
    },
  ];
}

/** Starter media kit profile with a rate card guided by the niche + experience. */
export function starterMediaKit(niches: string[], experience: string): Omit<MediaKitProfile, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'> {
  const base = experience === 'new' ? 150 : experience === 'some' ? 200 : experience === 'consistent' ? 300 : 500;
  return {
    display_name: null,
    tagline: `${NICHE_TAGLINES[niches[0] ?? 'lifestyle'] ?? 'Authentic everyday content'} — short-form UGC that sounds like a real person.`,
    bio: '',
    email: null,
    location: null,
    niche: niches[0] ?? 'lifestyle',
    audience_demographics: {},
    rates: [
      { id: 'r1', name: 'Short-form video (30–60s)', price: base, includes: '1 video, 2 hooks, organic use', negotiable: true },
      { id: 'r2', name: 'Video + paid-ad usage (90 days)', price: Math.round(base * 1.5), includes: '1 video + paid ad rights', negotiable: true },
      { id: 'r3', name: '3-video package', price: Math.round(base * 2.7), includes: '3 videos, organic use, one revision round', negotiable: true },
    ],
    past_collabs: [],
    availability: 'Accepts new brand work',
    form_factor: 'vertical 9:16',
    currency: 'USD',
  };
}
