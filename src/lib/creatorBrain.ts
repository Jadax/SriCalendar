import { generateText, isGeminiConfigured, type ResponseSchema } from './geminiClient';
import { HOOK_TEMPLATES } from '../data/hookTemplates';
import { BEST_TIMES, HOOK_SCIENCE } from '../data/creatorIntelligence';
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

function fillTemplate(text: string, topic: string, niche: string): string {
  return text
    .replace(/\{topic\}/g, topic)
    .replace(/\{niche\}/g, niche || topic)
    .replace(/\{n\}/g, '30')
    .replace(/\{number\}/g, '3')
    .replace(/\{days\}/g, '30')
    .replace(/\{seconds\}/g, '3')
    .replace(/\{minutes\}/g, '3')
    .replace(/\{steps\}/g, '3')
    .replace(/\{step\}/g, 'one tiny step')
    .replace(/\{tool\}/g, 'free tool')
    .replace(/\{time\}/g, 'a weekend')
    .replace(/\{amount\}/g, '$100')
    .replace(/\{price\}/g, '$50/mo')
    .replace(/\{month\}/g, 'this month')
    .replace(/\{week\}/g, 'this week')
    .replace(/\{word\}/g, 'SOUND OFF')
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
