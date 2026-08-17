import { generateText, isGeminiConfigured, type ResponseSchema } from './geminiClient';
import { CAPTION_TEMPLATES, CTA_TEMPLATES, HOOK_TEMPLATES } from '../data/hookTemplates';
import { BEST_TIMES, DELIVERABLE_LABELS, FOLLOWERS_BANDS, HOOK_SCIENCE, NICHE_HASHTAGS, PACKAGE_TIERS, RATE_TIERS, REGIONAL_BENCHMARKS, REGION_HASHTAGS, TRENDS, TREND_REGIONS, USAGE_ADDONS, type RegionalBenchmark, type Trend, type TrendRegion } from '../data/creatorIntelligence';
export type { Trend, RegionalBenchmark } from '../data/creatorIntelligence';
import { cap } from '../data/options';
import type {
  AnalyticsEntry, BoardCard, BrandDeal, ContentIdea, ContentPillar, Goal, HookItem, Invoice, MediaKitProfile,
} from '../types/ugc';

export { isGeminiConfigured } from './geminiClient';

/* ---------------------------------------------------------------------------
 * The creator brain — an offline-first decision engine that turns a creator's
 * workspace into plain-English "what to do next" guidance. Every rule has a
 * Gemini smart-mode upgrade that falls back to these deterministic rules.
 * ------------------------------------------------------------------------- */

export interface BriefAction { label: string; to: string }

export interface BriefNudge {
  id: string;
  emoji: string;
  title: string;
  body: string;
  priority: 'high' | 'medium' | 'low';
  action?: BriefAction;
}

/** Snapshot of the whole workspace the brain reasons over. */
export interface TodayContext {
  dateKey: string;
  streak: number;
  ideas: ContentIdea[];
  hooks: HookItem[];
  board: BoardCard[];
  deals: BrandDeal[];
  invoices: Invoice[];
  goals: Goal[];
  pillars: ContentPillar[];
  analytics: AnalyticsEntry[];
  tasksToday: Array<{ text: string; done: boolean }>;
  postsToday: Array<{ platform: string; title: string; status: string }>;
  mediaKit: MediaKitProfile | null;
}

export interface WeeklyPlanSlot {
  date: string;
  weekday: string;
  pillar: string;
  topic: string;
  platform: string;
  hook: string;
  angle: string;
}

export interface AnalyticsInsight { emoji: string; title: string; body: string; tone: 'good' | 'warn' | 'neutral' }

/* ---------------------------------------------------------------------------
 * Small deterministic helpers
 * ------------------------------------------------------------------------- */

function seededHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) { h = (h << 5) - h + input.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

function addDays(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function weekdayOf(dateKey: string): string {
  return WEEKDAYS[new Date(`${dateKey}T00:00:00`).getDay()] ?? 'Monday';
}

function weekdayShort(dateKey: string): string {
  return weekdayOf(dateKey).slice(0, 3);
}

function dayInWindow(windowDay: string, today: string): boolean {
  if (windowDay === 'Weekday') return today !== 'Saturday' && today !== 'Sunday';
  if (windowDay === 'Weekend') return today === 'Saturday' || today === 'Sunday';
  if (windowDay.includes('–')) {
    const [a, b] = windowDay.split('–');
    if (!a || !b) return false;
    const ia = WEEKDAYS.indexOf(a); const ib = WEEKDAYS.indexOf(b);
    const it = WEEKDAYS.indexOf(today);
    if (ia < 0 || ib < 0) return false;
    return it >= ia && it <= ib;
  }
  return windowDay === today;
}

function nicheOf(ctx: TodayContext): string {
  return ctx.mediaKit?.niche ?? ctx.hooks.find((h) => h.niche)?.niche ?? ctx.pillars[0]?.name ?? '';
}

/** Fills {token} placeholders in a hook template with sensible defaults (shared pool + topic/niche). */
const BRAIN_FILLS: Record<string, string> = {
  n: '30', number: '30', days: '30', time: 'a weekend', amount: '$100', step: 'one tiny step',
  metric: 'watch time', thing: 'technique', format: 'short video', result: 'the result', tool: 'free tool',
  price: '$50/mo', guide: 'guide', minutes: '3', outcome: 'growth', tiny: 'small',
  resource: 'a phone camera', unexpected: 'something clicked', event: 'small win', word: 'SOUND OFF',
  platform: 'the algorithm', week: 'this week', month: 'this month', trend: 'that trend',
  hours: '24', seconds: '3', year: 'year', deliverable: 'editorial', workflow: 'workflow', process: 'process',
  framework: 'framework', expert: 'pro', role: 'creator', challenge: 'challenge', method: 'method',
  total: '30', action: 'start', trick: 'trick', secret: 'secret', sneaky: 'small', detail: 'detail',
  setting: 'mode', feature: 'feature', warning: 'warning', creator: 'creator', normal: 'everyday',
  example: 'video', session: 'shoot', score: 'score', feed: 'feeds', tip: 'tip', rule: 'rule',
  project: 'project', frequency: 'every week', secrets: 'secrets', steps: '3', smallest: 'smallest',
  biggest: 'biggest', risk: 'a risk', start: 'the start', achievement: 'the goal', clip: 'clip',
  lonely: 'lonely', emotion: 'that feeling', routine: 'routine', objection: 'excuses', solution: 'solution',
};
function fillTemplate(text: string, topic: string, niche: string): string {
  return text
    .replace(/\{topic\}/g, topic)
    .replace(/\{niche\}/g, niche || topic)
    .replace(/\{([a-zA-Z]+)\}/g, (_all, key: string) => BRAIN_FILLS[key] ?? key)
    .replace(/\{[a-zA-Z _-]+\}/g, 'that thing');
}

function capFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* ---------------------------------------------------------------------------
 * 1. Daily brief — "what should I do today"
 * ------------------------------------------------------------------------- */

const STALE_IDEA_DAYS = 60;
const PITCH_STALE_DAYS = 7;

export function bestPostingWindow(ctx: TodayContext): { platform: string; start: string; note: string } | null {
  const today = weekdayOf(ctx.dateKey);
  const platform = platformPreference(ctx);
  const windows = BEST_TIMES[platform];
  if (!windows) return null;
  for (const w of windows) {
    if (dayInWindow(w.day, today)) return { platform, start: w.start, note: w.note };
  }
  const first = windows[0];
  if (!first) return null;
  return { platform, start: first.start, note: first.note };
}

function platformPreference(ctx: TodayContext): string {
  const counts = new Map<string, number>();
  for (const p of ctx.postsToday) counts.set(p.platform, (counts.get(p.platform) ?? 0) + 1);
  for (const p of ctx.ideas) { if (p.platform) counts.set(p.platform, (counts.get(p.platform) ?? 0) + 1); }
  for (const p of ctx.board) { if (p.platform) counts.set(p.platform, (counts.get(p.platform) ?? 0) + 1); }
  let best = 'tiktok'; let bestCount = 0;
  for (const [platform, count] of counts) { if (count > bestCount) { best = platform; bestCount = count; } }
  return best;
}

function staleIdeaCount(ctx: TodayContext): number {
  const cutoff = Date.now() - STALE_IDEA_DAYS * 24 * 60 * 60 * 1000;
  return ctx.ideas.filter((i) => i.status === 'idea' && new Date(i.created_at).getTime() < cutoff).length;
}

function outstandingInvoices(ctx: TodayContext): Invoice[] {
  return ctx.invoices.filter((i) => i.status === 'overdue' || (i.status === 'sent' && new Date(i.due_date).getTime() < Date.now()));
}

function stalePitches(ctx: TodayContext): BrandDeal[] {
  const cutoff = Date.now() - PITCH_STALE_DAYS * 24 * 60 * 60 * 1000;
  return ctx.deals.filter((d) => (d.status === 'cold' || d.status === 'contacted') && (!d.pitch_date || new Date(d.pitch_date).getTime() < cutoff));
}

function acceptedUninvoiced(ctx: TodayContext): BrandDeal[] {
  return ctx.deals.filter((d) => d.status === 'accepted' && !ctx.invoices.some((inv) => inv.brand_deal_id === d.id));
}

export function buildDailyBrief(ctx: TodayContext): BriefNudge[] {
  const nudges: BriefNudge[] = [];

  if (ctx.postsToday.length > 0) {
    const platforms = [...new Set(ctx.postsToday.map((p) => cap(p.platform)))].join(', ');
    nudges.push({
      id: 'posts-today', emoji: '📅', priority: 'high',
      title: `${ctx.postsToday.length} post${ctx.postsToday.length === 1 ? '' : 's'} scheduled today`,
      body: `${platforms} — check the calendar, film or schedule it and mark it live.`,
      action: { label: 'Open calendar', to: '/app/today' },
    });
  } else {
    const window = bestPostingWindow(ctx);
    if (window) {
      nudges.push({
        id: 'best-time', emoji: '🕐', priority: 'medium',
        title: `Post to ${cap(window.platform)} around ${window.start}`,
        body: window.note || 'This is the strongest slot of the week for reach.',
        action: { label: 'Plan a post', to: '/app/studio' },
      });
    }
  }

  const stale = staleIdeaCount(ctx);
  if (stale > 0) {
    nudges.push({
      id: 'stale-ideas', emoji: '🌱', priority: 'high',
      title: `${stale} idea${stale === 1 ? '' : 's'} have gone cold`,
      body: `Ideas older than ${STALE_IDEA_DAYS} days rarely get made. Score them, script them, or drop them.`,
      action: { label: 'Open Idea Bank', to: '/app/studio' },
    });
  }

  const owing = outstandingInvoices(ctx);
  if (owing.length > 0) {
    nudges.push({
      id: 'outstanding', emoji: '💰', priority: 'high',
      title: `You're owed money on ${owing.length} invoice${owing.length === 1 ? '' : 's'}`,
      body: `${owing[0]?.invoice_number ?? ''}${owing.length > 1 ? ` and ${owing.length - 1} more` : ''} is past due. Send a gentle nudge today.`,
      action: { label: 'Follow up', to: '/app/business' },
    });
  }

  const uninvoiced = acceptedUninvoiced(ctx);
  if (uninvoiced.length > 0) {
    nudges.push({
      id: 'invoice-booked', emoji: '🧾', priority: 'high',
      title: `Send the deposit invoice for ${uninvoiced.length} booked deal${uninvoiced.length === 1 ? '' : 's'}`,
      body: `${uninvoiced[0]?.brand_name ?? 'a brand'}${uninvoiced.length > 1 ? ` and ${uninvoiced.length - 1} more` : ''} accepted — invoice now so the money is locked in.`,
      action: { label: 'Create invoice', to: '/app/business' },
    });
  }

  const pitches = stalePitches(ctx);
  if (pitches.length > 0) {
    nudges.push({
      id: 'stale-pitches', emoji: '📨', priority: 'medium',
      title: `${pitches.length} pitch${pitches.length === 1 ? '' : 'es'} need a follow-up`,
      body: `Quiet pitches go stale after ${PITCH_STALE_DAYS} days. A one-line reply keeps you on their radar.`,
      action: { label: 'Review deals', to: '/app/business' },
    });
  }

  const atRisk = ctx.goals.filter((g) => g.status === 'at-risk' || (g.status === 'active' && g.deadline && new Date(g.deadline).getTime() < Date.now()));
  if (atRisk.length > 0) {
    nudges.push({
      id: 'goals', emoji: '🎯', priority: 'medium',
      title: `${atRisk.length} goal${atRisk.length === 1 ? '' : 's'} need a push`,
      body: `${atRisk[0]?.name ?? 'A goal'} is behind. A small content push this week closes the gap.`,
      action: { label: 'Review goals', to: '/app/knowledge' },
    });
  }

  const dueThisWeek = ctx.board.filter((c) => c.due_date && c.due_date >= ctx.dateKey && c.due_date <= addDays(ctx.dateKey, 6) && c.column_name !== 'published');
  if (dueThisWeek.length > 0) {
    nudges.push({
      id: 'board-due', emoji: '🗂️', priority: 'medium',
      title: `${dueThisWeek.length} production card${dueThisWeek.length === 1 ? '' : 's'} due this week`,
      body: `${dueThisWeek[0]?.title ?? 'A card'}${dueThisWeek.length > 1 ? ` and ${dueThisWeek.length - 1} more` : ''} — keep the pipeline moving.`,
      action: { label: 'Open board', to: '/app/studio' },
    });
  }

  const openTasks = ctx.tasksToday.filter((t) => !t.done).length;
  if (openTasks > 0) {
    nudges.push({
      id: 'tasks', emoji: '✅', priority: 'low',
      title: `${openTasks} task${openTasks === 1 ? '' : 's'} waiting on you today`,
      body: 'Knock out the quickest one first — momentum beats motivation.',
      action: { label: 'Open calendar', to: '/app/today' },
    });
  }

  if (ctx.ideas.length === 0) {
    nudges.push({
      id: 'capture', emoji: '💡', priority: 'low',
      title: 'Start capturing ideas',
      body: 'The Idea Bank is empty. Jot down 3 sparks today — even rough ones count.',
      action: { label: 'Spark an idea', to: '/app/studio' },
    });
  }

  const hasRates = (ctx.mediaKit?.rates ?? []).some((r) => r.name && r.price > 0);
  if (!hasRates) {
    nudges.push({
      id: 'rates', emoji: '🏷️', priority: 'medium',
      title: 'Your rate card is empty',
      body: 'Brands ask for rates first. Set a confident baseline with the pricing tool — you can negotiate down, never up.',
      action: { label: 'Set your rates', to: '/app/business' },
    });
  }

  const unpriced = ctx.deals.filter((d) => d.status !== 'declined' && (d.deal_value == null || d.deal_value <= 0));
  if (unpriced.length > 0) {
    nudges.push({
      id: 'price-it', emoji: '💵', priority: 'medium',
      title: `${unpriced.length} deal${unpriced.length === 1 ? '' : 's'} need${unpriced.length === 1 ? 's' : ''} a price`,
      body: `"${unpriced[0]?.brand_name ?? 'A deal'}" has no value yet. Give every pipeline deal a number so the money math works.`,
      action: { label: 'Price your deals', to: '/app/business' },
    });
  }

  const published = ctx.ideas.filter((i) => i.status === 'published');
  if (published.length > 0) {
    nudges.push({
      id: 'repurpose', emoji: '↻', priority: 'low',
      title: `${published.length} published idea${published.length === 1 ? '' : 's'} ripe for repurposing`,
      body: 'One strong post can become a thread, a carousel and a clip. Stretch your best work instead of starting cold.',
      action: { label: 'Repurpose', to: '/app/studio' },
    });
  }

  nudges.push({
    id: 'plan-week', emoji: '🗓️', priority: 'low',
    title: 'Plan the week ahead',
    body: 'A planned week beats a reactive one. Generate 7 content slots from your pillars in one tap.',
    action: { label: 'Plan my week', to: '/app/home' },
  });

  const ranked = ['high', 'medium', 'low'];
  return [...nudges]
    .sort((a, b) => ranked.indexOf(a.priority) - ranked.indexOf(b.priority))
    .filter((n, i, all) => all.findIndex((x) => x.id === n.id) === i)
    .slice(0, 6);
}

/* ---------------------------------------------------------------------------
 * 2. Weekly content plan — "plan my week" from pillars + proven hooks
 * ------------------------------------------------------------------------- */

const DEFAULT_PILLARS: Array<Pick<ContentPillar, 'name' | 'target_mix' | 'example_topics' | 'content_promise'>> = [
  { name: 'Education', target_mix: 40, example_topics: ['mistakes to avoid', 'my exact routine', 'the fix nobody shares'], content_promise: 'One clear, useful lesson per video' },
  { name: 'Connection', target_mix: 30, example_topics: ['day in the life', 'failures & lessons', 'small wins'], content_promise: 'Feel seen, not sold to' },
  { name: 'Trends & growth', target_mix: 30, example_topics: ['trend reactions', 'contrarian takes', 'predictions'], content_promise: 'Hot takes and new perspectives' },
];

const PLAN_PLATFORMS = ['tiktok', 'instagram', 'youtube', 'shorts', 'reels'] as const;

function pickPillar(pillars: Array<Pick<ContentPillar, 'name' | 'target_mix' | 'example_topics' | 'content_promise'>>, seed: number): (typeof pillars)[number] {
  const weights = pillars.map((p) => p.target_mix ?? 100 / pillars.length);
  const total = weights.reduce((s, w) => s + w, 0) || 1;
  let pick = seededHash(`pillar${seed}`) % total;
  for (let i = 0; i < pillars.length; i += 1) {
    pick -= weights[i] ?? 0;
    if (pick < 0) return pillars[i]!;
  }
  return pillars[0]!;
}

function pickHook(hooks: HookItem[], niche: string, seed: number): { hook: string; angle: string } {
  const mine = hooks.filter((h) => h.status === 'winning' && h.content).filter((h) => !niche || !h.niche || h.niche === niche);
  if (mine.length > 0) return { hook: mine[seededHash(`hook${seed}`) % mine.length]!.content, angle: mine[seededHash(`hook${seed}`) % mine.length]!.type ?? 'Hook' };
  const template = HOOK_TEMPLATES[seededHash(`tpl${seed}`) % HOOK_TEMPLATES.length]!;
  return { hook: fillTemplate(template.text, 'your {topic}'.replace(' {topic}', 'topic'), niche), angle: template.category };
}

export function buildWeeklyPlan(ctx: TodayContext, startDate = addDays(ctx.dateKey, 1), days = 7): WeeklyPlanSlot[] {
  const pillars = ctx.pillars.length > 0 ? ctx.pillars.map((p) => ({ name: p.name, target_mix: p.target_mix, example_topics: p.example_topics, content_promise: p.content_promise })) : DEFAULT_PILLARS;
  const niche = nicheOf(ctx);
  const slots: WeeklyPlanSlot[] = [];

  for (let i = 0; i < days; i += 1) {
    const date = addDays(startDate, i);
    const seed = seededHash(date);
    const pillar = pickPillar(pillars, seed);
    const examples = pillar.example_topics.length > 0 ? pillar.example_topics : ['a quick win', 'a real story', 'a hot take'];
    const example = examples[seed % examples.length] ?? 'a quick win';
    const topic = niche ? `${capFirst(example)} in ${niche}` : capFirst(example);
    const { hook, angle } = pickHook(ctx.hooks, niche, seed);
    slots.push({
      date,
      weekday: weekdayShort(date),
      pillar: pillar.name,
      topic,
      platform: PLAN_PLATFORMS[seed % PLAN_PLATFORMS.length]!,
      hook,
      angle,
    });
  }
  return slots;
}

/* ---------------------------------------------------------------------------
 * 3. Analytics interpretation — "what the numbers are telling you"
 * ------------------------------------------------------------------------- */

function erOf(e: AnalyticsEntry): number {
  if (e.engagement_rate != null) return e.engagement_rate;
  return e.followers > 0 ? ((e.likes + e.comments + e.shares + e.saves) / e.followers) * 100 : 0;
}

export function interpretAnalytics(entries: AnalyticsEntry[]): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];
  if (entries.length === 0) return [{ emoji: '📈', title: 'Start logging metrics', body: 'Add one entry per platform and the brain will tell you what is growing.', tone: 'neutral' }];

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const delta = last.followers - first.followers;

  if (delta !== 0) {
    insights.push({
      emoji: delta > 0 ? '🚀' : '🛟',
      title: delta > 0 ? `Followers are up ${delta.toLocaleString()} since ${first.date}` : `Followers dipped ${Math.abs(delta).toLocaleString()} since ${first.date}`,
      body: delta > 0 ? 'That is real momentum — double down on what you posted between these dates.' : 'One weak week is normal. Tighten the hook and post at your best window.',
      tone: delta > 0 ? 'good' : 'warn',
    });
  }

  const withEr = sorted.filter((e) => e.followers > 0);
  if (withEr.length > 0) {
    const avg = withEr.reduce((s, e) => s + erOf(e), 0) / withEr.length;
    const lastEr = erOf(last);
    insights.push({
      emoji: lastEr >= 3 ? '❤️' : lastEr >= 1 ? '🌤️' : '🥶',
      title: `Latest engagement is ${lastEr.toFixed(2)}% (avg ${avg.toFixed(2)}%)`,
      body: lastEr >= 3 ? 'That is a strong benchmark — viewers are saving and sharing.' : lastEr >= 1 ? 'Healthy baseline. A sharper first 3 seconds will push it up.' : 'Below 1% means the first second is losing people. Test a new hook style.',
      tone: lastEr >= 3 ? 'good' : lastEr >= 1 ? 'neutral' : 'warn',
    });
  }

  const byPlatform = new Map<string, AnalyticsEntry[]>();
  for (const e of entries) {
    const list = byPlatform.get(e.platform) ?? [];
    list.push(e);
    byPlatform.set(e.platform, list);
  }
  const platformEr: Array<{ platform: string; er: number }> = [];
  for (const [platform, list] of byPlatform) {
    const rows = list.filter((e) => e.followers > 0);
    if (rows.length === 0) continue;
    platformEr.push({ platform, er: rows.reduce((s, e) => s + erOf(e), 0) / rows.length });
  }
  if (platformEr.length >= 2) {
    const best = [...platformEr].sort((a, b) => b.er - a.er)[0]!;
    insights.push({
      emoji: '🏆', title: `${cap(best.platform)} is your strongest platform`,
      body: `It is holding ${best.er.toFixed(2)}% engagement. Lead with it and repurpose the rest.`,
      tone: 'good',
    });
  }

  const views = entries.reduce((s, e) => s + e.views, 0);
  const maxFollowers = Math.max(...entries.map((e) => e.followers), 0);
  if (views > 0 && maxFollowers > 0) {
    const ratio = views / maxFollowers;
    insights.push({
      emoji: ratio > 50 ? '🌊' : '🏝️',
      title: `About ${Math.round(ratio)} views per follower`,
      body: ratio > 50 ? 'Your content reaches far beyond your followers — great for landing brand deals.' : 'Views are mostly your own followers. Lean into discovery angles and trends.',
      tone: ratio > 50 ? 'good' : 'neutral',
    });
  }

  const revenue = entries.reduce((s, e) => s + (e.revenue ?? 0), 0);
  if (revenue > 0) {
    insights.push({ emoji: '💰', title: `${revenue.toLocaleString()} in logged platform revenue`, body: 'Platform payouts are the slowest stream — keep invoices for the fast money.', tone: 'neutral' });
  }

  return insights.slice(0, 5);
}

/* ---------------------------------------------------------------------------
 * 4. Outreach draft — "a pitch email that sounds like a human"
 * ------------------------------------------------------------------------- */

export function draftPitch(mediaKit: MediaKitProfile | null, deal: BrandDeal | null): string {
  const name = mediaKit?.display_name?.trim() || 'a creator';
  const niche = mediaKit?.niche ?? 'your niche';
  const location = mediaKit?.location ? `\nI'm based in ${mediaKit.location}.` : '';
  const availability = mediaKit?.availability ? `\nI'm currently ${mediaKit.availability}.` : '';
  const rates = mediaKit?.rates?.length
    ? `\n\nFor reference, my rate card:\n${mediaKit.rates.map((r) => `- ${r.name}: ${r.price}${r.negotiable ? ' (negotiable)' : ''}`).join('\n')}`
    : '';
  const brand = deal?.brand_name ?? 'your brand';
  const deliverables = deal?.deliverables ?? 'a set of short-form videos';
  const platform = deal?.platform ?? 'your feed';

  return `Hi ${brand} team,

I'm ${name}, a ${niche} creator who makes short-form UGC that sounds like a real person talking to a friend — never like an ad.${location}

I saw you're looking for ${deliverables} and I think I'd be a natural fit. I'd create ${deliverables} tailored for ${platform}, with strong hooks, clear product benefits, and natural usage shots.${rates}

Would you be open to a quick call this week to talk through it? I'm happy to send over a sample or a custom rate.${availability}

Warmly,
${name}`;
}

/* ---------------------------------------------------------------------------
 * Smart (Gemini) upgrades — every one falls back to the offline engine.
 * ------------------------------------------------------------------------- */

async function smartOr<T>(smart: () => Promise<T>, fallback: () => T): Promise<T> {
  if (!isGeminiConfigured) return fallback();
  try { return await smart(); } catch { return fallback(); }
}

function parseArray<T>(raw: string, key: string): T[] {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  return Array.isArray(parsed[key]) ? (parsed[key] as T[]) : [];
}

const NUDGE_SCHEMA: ResponseSchema = {
  type: 'OBJECT',
  properties: {
    nudges: { type: 'ARRAY', items: { type: 'OBJECT', properties: { emoji: { type: 'STRING' }, title: { type: 'STRING' }, body: { type: 'STRING' }, priority: { type: 'STRING' } }, } },
  },
  required: ['nudges'],
};

export async function buildDailyBriefSmart(ctx: TodayContext): Promise<BriefNudge[]> {
  const fallback = (): BriefNudge[] => buildDailyBrief(ctx);
  return smartOr(
    () => generateText(
      `You are a warm UGC coach writing a short "today brief" for a creator.
Today is ${ctx.dateKey} (${weekdayOf(ctx.dateKey)}). Streak: ${ctx.streak} days.
Workspace snapshot:
- Ideas: ${ctx.ideas.length} (${ctx.ideas.filter((i) => i.status === 'idea').length} open)
- Board cards in production: ${ctx.board.filter((c) => c.column_name !== 'published').length}
- Active deals: ${ctx.deals.filter((d) => d.status !== 'declined').length}
- Invoices overdue/late: ${ctx.invoices.filter((i) => i.status === 'overdue' || (i.status === 'sent' && new Date(i.due_date).getTime() < Date.now())).length}
- Goals active/at-risk: ${ctx.goals.filter((g) => g.status !== 'achieved').length}
- Posts scheduled today: ${ctx.postsToday.length}
- Open tasks today: ${ctx.tasksToday.filter((t) => !t.done).length}

Respect: ${HOOK_SCIENCE[0]}
Write 3-5 prioritised, actionable nudges in the creator's voice. No hype, no corporate words. Keep each under 160 characters. Priority must be "high", "medium" or "low".`,
      NUDGE_SCHEMA,
    ).then((raw) => parseArray<BriefNudge>(raw, 'nudges')),
    fallback,
  );
}

const PLAN_SCHEMA: ResponseSchema = {
  type: 'OBJECT',
  properties: {
    slots: { type: 'ARRAY', items: { type: 'OBJECT', properties: { date: { type: 'STRING' }, pillar: { type: 'STRING' }, topic: { type: 'STRING' }, platform: { type: 'STRING' }, hook: { type: 'STRING' }, angle: { type: 'STRING' } }, } },
  },
  required: ['slots'],
};

export async function buildWeeklyPlanSmart(ctx: TodayContext): Promise<WeeklyPlanSlot[]> {
  const fallback = (): WeeklyPlanSlot[] => buildWeeklyPlan(ctx);
  return smartOr(
    () => generateText(
      `Design a 7-day short-form content plan for a ${nicheOf(ctx) || 'creator'}.
Their content pillars: ${ctx.pillars.map((p) => `${p.name} (${p.target_mix ?? 0}% mix) — ${p.content_promise ?? ''}`).join('; ') || 'Education, Connection, Trends & growth'}.
Proven hooks they use: ${ctx.hooks.filter((h) => h.status === 'winning').slice(0, 4).map((h) => h.content).join('; ') || 'none yet — use strong curiosity/question hooks'}.
Start ${addDays(ctx.dateKey, 1)}. Return 7 slots (one per day) with: date (yyyy-MM-dd), pillar, a concrete topic, a platform, a one-sentence hook, and the hook angle. Keep topics specific and honest.`,
      PLAN_SCHEMA,
    ).then((raw) => parseArray<WeeklyPlanSlot>(raw, 'slots')),
    fallback,
  );
}

const INSIGHT_SCHEMA: ResponseSchema = {
  type: 'OBJECT',
  properties: {
    insights: { type: 'ARRAY', items: { type: 'OBJECT', properties: { emoji: { type: 'STRING' }, title: { type: 'STRING' }, body: { type: 'STRING' }, tone: { type: 'STRING' } }, } },
  },
  required: ['insights'],
};

export async function interpretAnalyticsSmart(entries: AnalyticsEntry[]): Promise<AnalyticsInsight[]> {
  const fallback = (): AnalyticsInsight[] => interpretAnalytics(entries);
  if (entries.length === 0) return fallback();
  const latest = entries.slice(-6).map((e) => `${e.date} ${e.platform}: ${e.followers} followers, ${e.views} views, ${e.likes + e.comments + e.shares + e.saves} interactions, ${e.revenue ?? 0} revenue`).join('\n');
  return smartOr(
    () => generateText(
      `A creator logged these metrics. Write 3-5 short, honest, actionable insights about what is working and what to try next. Tone must be "good", "warn" or "neutral".
${latest}`,
      INSIGHT_SCHEMA,
    ).then((raw) => parseArray<AnalyticsInsight>(raw, 'insights')),
    fallback,
  );
}

export async function draftPitchSmart(mediaKit: MediaKitProfile | null, deal: BrandDeal | null): Promise<string> {
  const fallback = (): string => draftPitch(mediaKit, deal);
  return smartOr(
    () => generateText(
      `Write a short, warm outreach email from a UGC creator to ${deal?.brand_name ?? 'a brand'} about ${deal?.deliverables ?? 'a short-form UGC project'}.
Creator: ${mediaKit?.display_name ?? 'unknown'} · niche: ${mediaKit?.niche ?? 'general'} · availability: ${mediaKit?.availability ?? 'open to work'}
Rate card: ${mediaKit?.rates?.map((r) => `${r.name} at ${r.price}`).join('; ') ?? 'none'}
Rules: real human voice, no corporate words, no em dashes, under 180 words, end with a clear call to action.`,
      { type: 'OBJECT', properties: { email: { type: 'STRING' } }, required: ['email'] },
    ).then((raw) => {
      const parsed = JSON.parse(raw) as { email?: string };
      return parsed.email ?? fallback();
    }),
    fallback,
  );
}

/* ---------------------------------------------------------------------------
 * 5. Rate intelligence — "what should I charge" (Collabstr-style pricing help)
 * ------------------------------------------------------------------------- */

export interface RateInput {
  /** Experience tier id from RATE_TIERS (creatorIntelligence). */
  tier: string;
  /** Deliverable key: short | reel | photo | long | bundle. */
  deliverable: string;
  /** Usage-rights id from USAGE_ADDONS. */
  usage: string;
  /** Bundle id from PACKAGE_TIERS. */
  bundle: string;
  followers: number;
  niche?: string;
}

export interface RateSuggestion {
  band: { low: number; high: number };
  mid: number;
  perDeliverable: string;
  drivers: string[];
  addons: Array<{ label: string; note: string; pct: number }>;
}

/** Computes a defensible USD rate band from tier × followers × deliverable × usage × bundle. */
export function suggestRate(input: RateInput): RateSuggestion {
  const tier = RATE_TIERS.find((t) => t.id === input.tier) ?? RATE_TIERS[0]!;
  const usage = USAGE_ADDONS.find((u) => u.id === input.usage) ?? USAGE_ADDONS[0]!;
  const pack = PACKAGE_TIERS.find((p) => p.id === input.bundle) ?? PACKAGE_TIERS[0]!;
  const band = FOLLOWERS_BANDS.find((b) => input.followers >= b.min && input.followers <= b.max) ?? FOLLOWERS_BANDS[0]!;
  const deliverable = DELIVERABLE_LABELS[input.deliverable] ?? DELIVERABLE_LABELS.short!;
  const multiplier = band.factor * deliverable.factor * (1 + usage.pct) * (1 - pack.discount);
  const low = Math.round(tier.min * multiplier);
  const high = Math.round(tier.max * multiplier);
  const mid = Math.round((low + high) / 2);
  const addons = USAGE_ADDONS.map((u) => ({ label: u.label, note: u.note, pct: u.pct }));
  const drivers = [
    `Base tier: ${tier.label} ($${tier.min}–$${tier.max})`,
    `Audience factor: ${band.label} followers ×${band.factor}`,
    `Deliverable: ${deliverable.label} ×${deliverable.factor}`,
    `Usage rights: ${usage.label} +${Math.round(usage.pct * 100)}%`,
    pack.discount > 0 ? `Bundle: ${pack.label} −${Math.round(pack.discount * 100)}%` : 'Bundle: single video',
  ];
  return {
    band: { low, high },
    mid,
    perDeliverable: `$${low.toLocaleString()}–$${high.toLocaleString()} per deliverable`,
    drivers,
    addons,
  };
}

export async function suggestRateSmart(input: RateInput): Promise<RateSuggestion> {
  const fallback = (): RateSuggestion => suggestRate(input);
  return smartOr(
    () => generateText(
      `A UGC creator is pricing a project. Experience tier: ${input.tier}, followers: ${input.followers}, deliverable: ${input.deliverable}, usage: ${input.usage}, niche: ${input.niche ?? 'general'}, bundle: ${input.bundle}.
Return a realistic 2026 USD rate band: a low, a high, a mid, a short "perDeliverable" summary line, 2-4 plain-English "drivers" (what justifies the number), and up to 5 "addons" as {label, note, pct}. Be honest and data-driven, not inflating.`,
      { type: 'OBJECT', properties: { band: { type: 'OBJECT', properties: { low: { type: 'NUMBER' }, high: { type: 'NUMBER' } } }, mid: { type: 'NUMBER' }, perDeliverable: { type: 'STRING' }, drivers: { type: 'ARRAY', items: { type: 'STRING' } }, addons: { type: 'ARRAY', items: { type: 'OBJECT', properties: { label: { type: 'STRING' }, note: { type: 'STRING' }, pct: { type: 'NUMBER' } } } } }, required: ['band', 'mid', 'perDeliverable', 'drivers'] },
    ).then((raw) => {
      const parsed = JSON.parse(raw) as RateSuggestion;
      if (!parsed.band || !parsed.band.low) throw new Error('bad rate schema');
      return parsed;
    }),
    fallback,
  );
}

/* ---------------------------------------------------------------------------
 * 6. Brainstorm — "give me content ideas" (AI ideation, offline + Gemini)
 * ------------------------------------------------------------------------- */

export interface BrainstormIdea {
  title: string;
  hook: string;
  angle: string;
  promise: string;
  pillar: string;
  platform: string;
}

export interface BrainstormInput {
  topic: string;
  niche: string;
  pillars: string[];
  count: number;
  avoid: string[];
}

const ANGLES = ['myth-bust', 'POV', 'behind the scenes', 'day in the life', 'speed tutorial', 'hot take', 'storytime', 'before/after', 'challenge', 'react', 'listicle', 'secret reveal'] as const;
const PLATFORMS_ROTATE = ['tiktok', 'instagram', 'youtube', 'shorts', 'reels', 'instagram'] as const;

const ANGLE_PROMISES: Record<string, string> = {
  'myth-bust': 'Destroys the most common {topic} myth with receipts.',
  'POV': 'Puts the viewer inside the {topic} experience.',
  'behind the scenes': 'Shows the real process nobody films.',
  'day in the life': 'One honest day, three tiny wins in {topic}.',
  'speed tutorial': 'The {topic} fix in 60 seconds, zero fluff.',
  'hot take': 'An unpopular {topic} opinion with evidence.',
  'storytime': 'A personal {topic} story with a payoff.',
  'before/after': 'The painful before, the single change, the after.',
  'challenge': 'A {days}-day {topic} challenge the audience can join.',
  'react': 'Reacting to the wildest {topic} takes online.',
  'listicle': '{number} {topic} lessons in one scroll.',
  'secret reveal': 'The {topic} detail almost everyone misses.',
};

/** Generates `count` concrete, non-duplicate content ideas from a topic. */
export function brainstormIdeas(input: BrainstormInput): BrainstormIdea[] {
  const niche = input.niche || 'creator';
  const pillars = input.pillars.length ? input.pillars : ['Education', 'Connection', 'Trends & growth'];
  const out: BrainstormIdea[] = [];
  let attempts = 0;
  for (let i = 0; i < input.count && attempts < input.count * 40; i += 1) {
    attempts += 1;
    const seed = seededHash(`${input.topic.toLowerCase()}::${i}`);
    const angle = ANGLES[seed % ANGLES.length]!;
    const template = HOOK_TEMPLATES[(seed + i * 7) % HOOK_TEMPLATES.length]!;
    const hook = fillTemplate(template.text, input.topic, niche);
    const pillar = pillars[seed % pillars.length] ?? pillars[0]!;
    const title = `${capFirst(input.topic)}: ${angle} that actually performs`;
    const unique = `${title}::${angle}::${hook}`;
    if (out.some((o) => `${o.title}::${o.angle}::${o.hook}` === unique) || input.avoid.some((a) => a.toLowerCase() === title.toLowerCase())) { i -= 1; continue; }
    out.push({
      title,
      hook,
      angle,
      promise: fillTemplate(ANGLE_PROMISES[angle] ?? 'A {topic} idea that pays off in one watch.', input.topic, niche),
      pillar,
      platform: PLATFORMS_ROTATE[seed % PLATFORMS_ROTATE.length]!,
    });
  }
  return out.slice(0, input.count);
}

const BRAINSTORM_SCHEMA: ResponseSchema = {
  type: 'OBJECT',
  properties: {
    ideas: { type: 'ARRAY', items: { type: 'OBJECT', properties: { title: { type: 'STRING' }, hook: { type: 'STRING' }, angle: { type: 'STRING' }, promise: { type: 'STRING' }, pillar: { type: 'STRING' }, platform: { type: 'STRING' } }, } },
  },
  required: ['ideas'],
};

export async function brainstormIdeasSmart(input: BrainstormInput): Promise<BrainstormIdea[]> {
  const fallback = (): BrainstormIdea[] => brainstormIdeas(input);
  return smartOr(
    () => generateText(
      `Act as a world-class UGC content strategist. Brainstorm ${input.count} specific, non-generic content ideas about "${input.topic}" for a ${input.niche || 'general'} creator.
Pillars to cover: ${input.pillars.join(', ') || 'Education, Connection, Trends & growth'}.
Avoid these existing titles: ${input.avoid.join('; ') || 'none'}.
Return ${input.count} ideas, each with: title (platform-ready, under 90 chars), a scroll-stopping first-line hook, a content angle, a one-line audience promise, the pillar, and a platform (tiktok, instagram, youtube, shorts, reels). Be concrete and honest — no generic filler.`,
      BRAINSTORM_SCHEMA,
    ).then((raw) => parseArray<BrainstormIdea>(raw, 'ideas').slice(0, input.count)),
    fallback,
  );
}

/* ---------------------------------------------------------------------------
 * 7. Caption generator — "publish-ready captions + hashtags" 
 * ------------------------------------------------------------------------- */

export interface CaptionSet {
  captions: string[];
  hashtags: string[];
  firstComment: string;
  cta: string;
}

export interface CaptionInput {
  title: string;
  hook: string;
  promise: string;
  niche: string;
  platform: string;
}

/** Builds publish-ready caption variants, niche hashtags, a first comment and a CTA. */
export function generateCaptions(input: CaptionInput): CaptionSet {
  const niche = input.niche || 'creator';
  const topic = input.title || input.hook || 'this';
  const hookClean = input.hook ? input.hook.replace(/[?.!]+$/, '') : 'the truth about this';
  const captions = [
    fillTemplate(CAPTION_TEMPLATES[Math.floor(seededHash(`${topic}::0`) % CAPTION_TEMPLATES.length)]!, topic, niche),
    fillTemplate(CAPTION_TEMPLATES[Math.floor(seededHash(`${topic}::1`) % CAPTION_TEMPLATES.length)]!, topic, niche),
    input.promise ? `${input.promise} Full breakdown in the video — ${hookClean.toLowerCase()}.` : `I've been holding this one back. ${capFirst(hookClean)}.`,
  ];
  const pool = NICHE_HASHTAGS[niche.toLowerCase()] ?? NICHE_HASHTAGS.lifestyle!;
  const platformTag = platformTagOf(input.platform);
  const generic = ['ugc', 'contentcreator', 'creatorlife', 'shortform'];
  const hashtags = [...new Set([...pool, platformTag, ...generic])].slice(0, 9);
  const cta = fillTemplate(CTA_TEMPLATES[Math.floor(seededHash(`${topic}::2`) % CTA_TEMPLATES.length)]!, topic, niche);
  const firstComment = `What did I miss? Drop your biggest ${input.promise ? input.promise.toLowerCase().slice(0, 40) : niche} question below — I read every comment.`;
  return { captions, hashtags, firstComment, cta };
}

function platformTagOf(platform: string): string {
  if (platform === 'tiktok') return 'tiktok';
  if (platform === 'instagram' || platform === 'reels') return 'reels';
  if (platform === 'youtube' || platform === 'shorts') return 'youtubeshorts';
  return 'socialmedia';
}

const CAPTION_SCHEMA: ResponseSchema = {
  type: 'OBJECT',
  properties: {
    captions: { type: 'ARRAY', items: { type: 'STRING' }, description: '3 ready-to-post caption variants.' },
    hashtags: { type: 'ARRAY', items: { type: 'STRING' }, description: '6-9 hashtags, no # symbol, lowercase.' },
    firstComment: { type: 'STRING', description: 'An engagement-pulling first comment.' },
    cta: { type: 'STRING', description: 'One clear call to action.' },
  },
  required: ['captions', 'hashtags', 'firstComment', 'cta'],
};

export async function generateCaptionsSmart(input: CaptionInput): Promise<CaptionSet> {
  const fallback = (): CaptionSet => generateCaptions(input);
  return smartOr(
    () => generateText(
      `Write publish-ready captions for a ${input.platform || 'social'} post titled "${input.title}" (hook: "${input.hook}") for a ${input.niche || 'general'} creator.
Return 3 caption variants (varied tone — educational, story, bold), 6-9 niche hashtags without # or spaces, an engagement-pulling first comment, and one clear call to action. No em dashes, no corporate speak.`,
      CAPTION_SCHEMA,
    ).then((raw) => {
      const parsed = JSON.parse(raw) as CaptionSet;
      if (!parsed.captions?.length) throw new Error('bad caption schema');
      return parsed;
    }),
    fallback,
  );
}

/* ---------------------------------------------------------------------------
 * 8. Repurposing — "stretch one strong post into many" (Opus-Clip-style)
 * ------------------------------------------------------------------------- */

export interface RepurposeVariant {
  title: string;
  hook: string;
  angle: string;
  platform: string;
  repurpose_plan: string;
}

/** Turns one idea into 4 cross-platform variants that reuse the same source. */
export function repurposeIdea(idea: ContentIdea): RepurposeVariant[] {
  const topic = idea.title || 'this topic';
  const niche = idea.pillar || 'creator';
  const hook = idea.hook_idea || fillTemplate(HOOK_TEMPLATES[0]!.text, topic, niche);
  const clean = hook.replace(/[?.!]+$/, '');
  return [
    { title: `${topic} — the 3 takeaways`, hook: `${clean} — here are the 3 takeaways.`, angle: 'listicle', platform: 'x', repurpose_plan: 'thread: pull 3 punchy lines from the video.' },
    { title: `${topic} — swipe-save edition`, hook: `${clean}. Save this one.`, angle: 'carousel', platform: 'instagram', repurpose_plan: 'carousel: 5 slides, one idea per slide.' },
    { title: `${topic} — 30-second clip`, hook: `${clean} (best 30 seconds).`, angle: 'shorts', platform: 'youtube', repurpose_plan: 'shorts: cut the single best segment, add captions.' },
    { title: `${topic} — full breakdown`, hook: `${clean} — the complete breakdown.`, angle: 'long-form', platform: 'youtube', repurpose_plan: 'long-form: expand into a 5-minute tutorial.' },
  ];
}

const REPURPOSE_SCHEMA: ResponseSchema = {
  type: 'OBJECT',
  properties: {
    variants: { type: 'ARRAY', items: { type: 'OBJECT', properties: { title: { type: 'STRING' }, hook: { type: 'STRING' }, angle: { type: 'STRING' }, platform: { type: 'STRING' }, repurpose_plan: { type: 'STRING' } }, } },
  },
  required: ['variants'],
};

export async function repurposeIdeaSmart(idea: ContentIdea): Promise<RepurposeVariant[]> {
  const fallback = (): RepurposeVariant[] => repurposeIdea(idea);
  return smartOr(
    () => generateText(
      `Act as a UGC repurposing strategist. A creator already posted "${idea.title}"${idea.hook_idea ? ` with the hook "${idea.hook_idea}"` : ''}${idea.pillar ? ` for the ${idea.pillar} niche` : ''}.
Stretch that single source into exactly 4 distinct cross-platform variants: one X thread, one Instagram carousel, one YouTube short, one YouTube long-form. For each, return a platform-ready title, a scroll-stopping hook, a clear angle, the platform, and a one-line repurpose plan. Be concrete, no generic filler, no em dashes.`,
      REPURPOSE_SCHEMA,
    ).then((raw) => {
      const variants = parseArray<RepurposeVariant>(raw, 'variants');
      if (!variants.length) throw new Error('bad repurpose schema');
      return variants.slice(0, 4);
    }),
    fallback,
  );
}

/* ---------------------------------------------------------------------------
 * 9. Follow-up outreach — "a gentle nudge that keeps deals warm"
 * ------------------------------------------------------------------------- */

/** Writes a short follow-up for a deal that was pitched but went quiet. */
export function draftFollowUp(mediaKit: MediaKitProfile | null, deal: BrandDeal | null): string {
  const name = mediaKit?.display_name?.trim() || 'I';
  const brand = deal?.brand_name ?? 'your brand';
  const deliverables = deal?.deliverables ?? 'the project';
  const pitchedOn = deal?.pitch_date ? `back on ${deal.pitch_date}` : 'a while ago';
  const tone = deal?.status === 'negotiating' ? 'keeping the conversation moving' : 'checking in';
  return `Hi ${brand} team,

Quick follow-up on the ${deliverables} opportunity I sent over ${pitchedOn}, just ${tone} and making sure it didn't get buried.

Happy to send samples, a rate card, or jump on a 10-minute call this week if that's easier.

Warmly,
${name}`;
}

export async function draftFollowUpSmart(mediaKit: MediaKitProfile | null, deal: BrandDeal | null): Promise<string> {
  const fallback = (): string => draftFollowUp(mediaKit, deal);
  return smartOr(
    () => generateText(
      `Write a short, warm follow-up email from UGC creator ${mediaKit?.display_name ?? 'a creator'} to ${deal?.brand_name ?? 'a brand'} about ${deal?.deliverables ?? 'a project'}, pitched ${deal?.pitch_date ?? 'recently'} (deal status: ${deal?.status ?? 'unknown'}).
Rules: real human voice, no corporate words, no em dashes, under 120 words, one clear next step.`,
      { type: 'OBJECT', properties: { email: { type: 'STRING' } }, required: ['email'] },
    ).then((raw) => {
      const parsed = JSON.parse(raw) as { email?: string };
      return parsed.email ?? fallback();
    }),
    fallback,
  );
}

/* ---------------------------------------------------------------------------
 * 10. Trend Pulse — "what's hot right now" + "what to work on next"
 * ------------------------------------------------------------------------- */

/** A trend surfaced for the creator, tagged with heat + viral potential. */
export interface TrendItem {
  id: string;
  niche: string;
  region: string;
  title: string;
  hook: string;
  angle: string;
  format: string;
  momentum: number;
  direction: 'rising' | 'peaking' | 'falling';
  virality: number;
  play: string;
  hashtags: string[];
  season?: string;
}

/** Blended "jump on it now" score — momentum wins, virality caps the ceiling, rising beats peaking. */
function heatOf(trend: TrendItem): number {
  const dirBonus = trend.direction === 'rising' ? 6 : trend.direction === 'peaking' ? 3 : 0;
  return trend.momentum * 0.7 + trend.virality * 0.3 + dirBonus;
}

export function regionLabelOf(region: string): string {
  return TREND_REGIONS.find((r) => r.id === region)?.label ?? 'Global';
}

/** Deterministic radar: the curated watchlist filtered by niches + region, hottest first. */
export function trendingNow(niches: string[], region: string): TrendItem[] {
  const list = TRENDS.filter((t) =>
    (niches.length === 0 || niches.includes(t.niche)) &&
    (region === 'all' || t.region === region),
  );
  return [...list].sort((a, b) => heatOf(b) - heatOf(a));
}

const TREND_SCHEMA: ResponseSchema = {
  type: 'OBJECT',
  properties: {
    trends: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      title: { type: 'STRING' }, hook: { type: 'STRING' }, angle: { type: 'STRING' }, format: { type: 'STRING' },
      momentum: { type: 'NUMBER' }, direction: { type: 'STRING' }, virality: { type: 'NUMBER' }, play: { type: 'STRING' }, hashtags: { type: 'ARRAY', items: { type: 'STRING' } },
    }, } },
  },
  required: ['trends'],
};

/** Gemini radar: a real-time trend scan for the creator's niches + region, falling back to the catalog. */
export async function trendingNowSmart(niches: string[], region: string): Promise<TrendItem[]> {
  const fallback = (): TrendItem[] => trendingNow(niches, region);
  const regionLabel = regionLabelOf(region);
  return smartOr(
    () => generateText(
      `You are a viral-trend scout for UGC creators. List the top 8 content trends that are genuinely trending RIGHT NOW (2026) for a ${regionLabel} audience, in these niches: ${niches.join(', ') || 'general lifestyle'}.
For each trend return: a specific platform-ready title, a scroll-stopping hook, a content angle, a format, a momentum score (0-100, how hot it is this week), a direction (rising/peaking/falling), a virality score (0-100 viral potential), a one-line play explaining why it is blowing up, and 3-5 niche hashtags. Prioritise specific, timely, verifiable trends over evergreen advice. No em dashes.`,
      TREND_SCHEMA,
    ).then((raw) => {
      const list = parseArray<Partial<TrendItem>>(raw, 'trends');
      if (!list.length) throw new Error('bad trend schema');
      return list.slice(0, 10).map((t, i) => ({
        id: typeof t.id === 'string' ? t.id : `ai-${i}`,
        niche: typeof t.niche === 'string' ? t.niche : niches[0] ?? 'lifestyle',
        region,
        title: String(t.title ?? 'Untitled trend'),
        hook: String(t.hook ?? ''),
        angle: String(t.angle ?? ''),
        format: String(t.format ?? ''),
        momentum: Number(t.momentum) || 50,
        direction: t.direction === 'peaking' || t.direction === 'falling' ? t.direction : 'rising',
        virality: Number(t.virality) || 50,
        play: String(t.play ?? ''),
        hashtags: Array.isArray(t.hashtags) ? t.hashtags.map(String).slice(0, 5) : [],
      }));
    }),
    fallback,
  );
}

const EFFORT_COST: Record<string, number> = { quick: 1, medium: 2, big: 3 };

export interface NextPick {
  idea: ContentIdea;
  score: number;
  reasons: string[];
  matchedTrend?: TrendItem;
}

const SHORT_FORM = ['tiktok', 'reels', 'instagram', 'shorts', 'youtube'];

/** Heuristic viral-potential score for one idea — ICE + format + freshness + trend fit. */
export function viralScoreOf(idea: ContentIdea, trends: TrendItem[], region = 'world'): NextPick {
  const reasons: string[] = [];
  let score = 0;

  const ice = idea.impact != null && idea.confidence != null
    ? (idea.impact * idea.confidence) / (EFFORT_COST[idea.effort_level ?? 'quick'] ?? 1)
    : 0;
  score += Math.min(40, ice * 3.2);
  if (ice > 0) reasons.push(`Strong idea score — ICE ${Number(ice.toFixed(1))} puts it at the top of the bank.`);

  if (SHORT_FORM.includes(idea.platform ?? '')) { score += 8; reasons.push('Short-form format is the highest-distribution channel right now.'); }

  if (idea.status === 'idea') score += 5;
  if (idea.status === 'scripted') { score += 3; reasons.push('Already scripted — filming is one step away.'); }

  const fresh = Date.now() - new Date(`${idea.updated_at ?? idea.created_at}`).getTime();
  if (fresh < 14 * 86400000) { score += 8; reasons.push('Fresh idea — momentum from recent thinking is still yours.'); }
  else if (fresh < 45 * 86400000) score += 4;

  if (idea.hook_idea) { score += 5; reasons.push('Has a hook ready — drop it into the camera and go.'); }
  if (idea.content_angle) score += 3;

  const titleHit = trends.find((t) => tokenOverlap(t.title, idea.title));
  if (titleHit) {
    score += 15;
    reasons.push(`Rides "${titleHit.title}" — trending ${titleHit.direction === 'rising' ? 'and rising' : 'right now'} in ${regionLabelOf(titleHit.region)}.`);
    return { idea, score: Math.round(Math.min(100, score)), reasons, matchedTrend: titleHit };
  }
  if (idea.pillar && trends.some((t) => t.niche === idea.pillar)) {
    score += 8;
    reasons.push(`Your ${idea.pillar} ideas sit in a hot niche in ${regionLabelOf(region)} — posting now taps live demand.`);
  }

  return { idea, score: Math.round(Math.min(100, score)), reasons };
}

function tokenOverlap(a: string, b: string): boolean {
  const ta = new Set(a.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3));
  return b.toLowerCase().split(/[^a-z0-9]+/).some((w) => w.length > 3 && ta.has(w));
}

/** Ranks the creator's own open ideas by predicted viral potential — "what to work on next". */
export function rankIdeasForNext(ideas: ContentIdea[], opts: { region?: string; niches?: string[] } = {}): NextPick[] {
  const trends = trendingNow(opts.niches ?? [], opts.region ?? 'all');
  return ideas
    .filter((i) => i.status === 'idea' || i.status === 'scripted')
    .map((i) => viralScoreOf(i, trends, opts.region ?? 'world'))
    .sort((a, b) => b.score - a.score);
}

/* ---------------------------------------------------------------------------
 * 10.5 Regional benchmarks + hashtag packs — "charge for your market"
 * ------------------------------------------------------------------------- */

/** Returns the regional rate benchmark for a given region, or null if unknown. */
export function regionalBenchmark(region: string): RegionalBenchmark | null {
  return REGIONAL_BENCHMARKS.find((b) => b.region === region) ?? null;
}

/** Builds a region-aware hashtag pack + caption starter from a trend. */
export function hashtagPack(t: TrendItem): { hashtags: string[]; caption: string } {
  const regionTags = REGION_HASHTAGS[(t.region as TrendRegion)] ?? REGION_HASHTAGS.world;
  const hashtags = [...new Set([...t.hashtags, ...regionTags])].slice(0, 12);
  const caption = `${t.hook}\n\n${t.angle} \u2014 ${t.play}\n\n${hashtags.map((h) => `#${h}`).join(' ')}`;
  return { hashtags, caption };
}
