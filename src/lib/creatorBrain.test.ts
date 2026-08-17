import { describe, expect, it } from 'vitest';
import {
  buildDailyBrief, buildWeeklyPlan, draftFollowUp, draftPitch, generateCaptions, interpretAnalytics, brainstormIdeas, repurposeIdea, repurposeIdeaSmart, suggestRate,
  rankIdeasForNext, trendingNow, trendingNowSmart, regionalBenchmark, hashtagPack,
  type BrainstormIdea, type TodayContext, type Trend,
} from './creatorBrain';
import type { AnalyticsEntry, BoardCard, BrandDeal, ContentIdea, HookItem, Invoice, MediaKitProfile } from '../types/ugc';

const mediaKit = (p: Partial<MediaKitProfile> = {}): MediaKitProfile => ({
  id: 'mk', user_id: 'u', created_at: '2026-01-01', updated_at: '2026-01-01', sync_pending: 0,
  display_name: null, tagline: null, bio: null, email: null, location: null, niche: null,
  audience_demographics: {}, rates: [], past_collabs: [], availability: null, form_factor: null,
  currency: 'USD', ...p,
});

const baseCtx = (overrides: Partial<TodayContext> = {}): TodayContext => ({
  dateKey: '2026-08-15',
  streak: 4,
  ideas: [],
  hooks: [],
  board: [],
  deals: [],
  invoices: [],
  goals: [],
  pillars: [],
  analytics: [],
  tasksToday: [],
  postsToday: [],
  mediaKit: null,
  ...overrides,
});

describe('creatorBrain · daily brief', () => {
  it('tells a new creator to capture ideas and plan the week', () => {
    const nudges = buildDailyBrief(baseCtx());
    const ids = nudges.map((n) => n.id);
    expect(ids).toContain('capture');
    expect(ids).toContain('plan-week');
    expect(nudges.find((n) => n.id === 'plan-week')?.priority).toBe('low');
  });

  it('ranks nudges from high to low priority', () => {
    const rank = (p?: string) => ['high', 'medium', 'low'].indexOf(p ?? '');
    const nudges = buildDailyBrief(baseCtx());
    for (let i = 1; i < nudges.length; i += 1) {
      expect(rank(nudges[i - 1]!.priority)).toBeLessThanOrEqual(rank(nudges[i]!.priority));
    }
  });

  it('flags overdue invoices as high priority', () => {
    const invoices: Invoice[] = [{
      id: 'i1', user_id: 'u', created_at: '2026-01-01', updated_at: '2026-01-01', sync_pending: 0,
      invoice_number: 'INV-001', brand_deal_id: null, client_note: null, recipient_name: null,
      recipient_email: null, issue_date: '2026-07-01', due_date: '2026-07-15', line_items: [],
      subtotal: 500, tax: 0, total: 500, status: 'overdue', currency: 'USD', stream: 'brand-deal',
    }];
    const nudge = buildDailyBrief(baseCtx({ invoices })).find((n) => n.id === 'outstanding');
    expect(nudge).toBeDefined();
    expect(nudge!.priority).toBe('high');
  });

  it('ranks urgent nudges before low-priority ones', () => {
    const ideas: ContentIdea[] = [{
      id: 'i', user_id: 'u', created_at: '2025-01-01', updated_at: '2025-01-01', sync_pending: 0,
      title: 'old spark', description: null, platform: 'tiktok', priority: 'medium', effort_level: 'quick',
      audience_promise: null, hook_idea: null, content_angle: null, inspiration_source: null,
      pillar: null, repurpose_plan: null, status: 'idea', impact: null, confidence: null,
    }];
    const nudges = buildDailyBrief(baseCtx({ ideas }));
    expect(nudges.find((n) => n.id === 'stale-ideas')?.priority).toBe('high');
    expect(nudges.find((n) => n.id === 'plan-week')?.priority).toBe('low');
  });

  it('does not duplicate nudges', () => {
    const nudges = buildDailyBrief(baseCtx());
    const ids = nudges.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('creatorBrain · weekly plan', () => {
  it('generates 7 date-sorted slots starting the next day', () => {
    const plan = buildWeeklyPlan(baseCtx());
    expect(plan).toHaveLength(7);
    expect(plan[0]!.date).toBe('2026-08-16');
    expect(plan[6]!.date).toBe('2026-08-22');
    expect(plan[1]!.date > plan[0]!.date).toBe(true);
  });

  it('uses a concrete topic when the niche is known', () => {
    const plan = buildWeeklyPlan(baseCtx({ mediaKit: mediaKit({ niche: 'beauty' }) }));
    expect(plan[0]!.topic.toLowerCase()).toContain('beauty');
  });

  it('stays deterministic for a given start date', () => {
    const a = buildWeeklyPlan(baseCtx());
    const b = buildWeeklyPlan(baseCtx());
    expect(a).toEqual(b);
  });
});

describe('creatorBrain · analytics interpretation', () => {
  const row = (p: Partial<AnalyticsEntry>): AnalyticsEntry => ({
    id: 'a', user_id: 'u', created_at: '2026-01-01', updated_at: '2026-01-01', sync_pending: 0,
    platform: 'tiktok', date: '2026-08-01', followers: 1000, views: 5000, likes: 120, comments: 10,
    shares: 20, saves: 40, engagement_rate: null, reach: 4000, revenue: 0, currency: 'USD', notes: null, ...p,
  });

  it('reports empty-state guidance with no data', () => {
    expect(interpretAnalytics([])[0]?.title).toContain('Start logging');
  });

  it('spots follower growth and engagement strength', () => {
    const insights = interpretAnalytics([row({ date: '2026-07-01', followers: 900, engagement_rate: 2 }), row({ date: '2026-08-01', followers: 1000, engagement_rate: 4 })]);
    expect(insights.some((i) => i.title.includes('up 100'))).toBe(true);
    expect(insights.some((i) => i.tone === 'good' && i.title.includes('3.00%'))).toBe(true);
  });

  it('flags weak engagement', () => {
    const insights = interpretAnalytics([row({ engagement_rate: 0.5 })]);
    expect(insights.some((i) => i.title.includes('0.50%'))).toBe(true);
  });
});

describe('creatorBrain · outreach draft', () => {
  it('writes a warm email using the media kit and deal', () => {
    const deal: BrandDeal = {
      id: 'd', user_id: 'u', created_at: '2026-01-01', updated_at: '2026-01-01', sync_pending: 0,
      brand_name: 'GlowLab', contact_name: null, contact_email: null, deal_value: 500,
      estimated_probability: 60, currency: 'USD', deliverables: '2 UGC videos', usage_rights: null,
      rights_period: null, deadline: null, pitch_date: null, follow_up_date: null,
      payment_status: 'pending', status: 'cold', platform: 'tiktok', notes: null,
    };
    const email = draftPitch(mediaKit({ display_name: 'Priya', niche: 'beauty', rates: [{ id: 'r', name: 'Video', price: 150, includes: '', negotiable: true }] }), deal);
    expect(email).toContain('Hi GlowLab team');
    expect(email).toContain('Priya');
    expect(email).toContain('beauty');
    expect(email).toContain('2 UGC videos');
    expect(email).toContain('150');
  });
});

describe('creatorBrain · board due surfacing', () => {
  it('flags production cards due this week', () => {
    const board: BoardCard[] = [{
      id: 'b', user_id: 'u', created_at: '2026-01-01', updated_at: '2026-01-01', sync_pending: 0,
      title: 'Serum reel', column_name: 'editing', platform: 'tiktok', priority: 'high',
      due_date: '2026-08-18', sponsor: null, video_type: null, subtasks: [], status: 'active',
    }];
    const nudge = buildDailyBrief(baseCtx({ board })).find((n) => n.id === 'board-due');
    expect(nudge).toBeDefined();
    expect(nudge!.body).toContain('Serum reel');
  });

  it('ignores published cards for due warnings', () => {
    const board: BoardCard[] = [{
      id: 'b', user_id: 'u', created_at: '2026-01-01', updated_at: '2026-01-01', sync_pending: 0,
      title: 'Done reel', column_name: 'published', platform: 'tiktok', priority: 'high',
      due_date: '2026-08-18', sponsor: null, video_type: null, subtasks: [], status: 'published',
    }];
    const nudge = buildDailyBrief(baseCtx({ board })).find((n) => n.id === 'board-due');
    expect(nudge).toBeUndefined();
  });
});

describe('creatorBrain · rate intelligence', () => {
  const input = { tier: 'beginner', deliverable: 'short', usage: 'organic', bundle: 'single', followers: 5000 };

  it('returns an ordered band with a mid', () => {
    const r = suggestRate(input);
    expect(r.band.low).toBeLessThan(r.mid);
    expect(r.mid).toBeLessThan(r.band.high);
    expect(r.perDeliverable).toContain('per deliverable');
  });

  it('scales up with audience size', () => {
    const small = suggestRate({ ...input, followers: 800 });
    const big = suggestRate({ ...input, followers: 120000 });
    expect(big.band.low).toBeGreaterThan(small.band.low);
    expect(big.band.high).toBeGreaterThan(small.band.high);
  });

  it('charges more for ad rights and long-form, discounts bundles', () => {
    const base = suggestRate(input).band.low;
    expect(suggestRate({ ...input, usage: 'perpetual' }).band.low).toBeGreaterThan(base);
    expect(suggestRate({ ...input, deliverable: 'long' }).band.low).toBeGreaterThan(base);
    expect(suggestRate({ ...input, bundle: 'pack' }).band.low).toBeLessThan(base);
  });

  it('lists the tier as a pricing driver', () => {
    expect(suggestRate(input).drivers.join(' ')).toContain('Just starting');
  });
});

describe('creatorBrain · brainstorm', () => {
  it('returns the requested number of concrete ideas', () => {
    const ideas = brainstormIdeas({ topic: 'morning routines', niche: 'lifestyle', pillars: [], count: 5, avoid: [] });
    expect(ideas).toHaveLength(5);
    for (const idea of ideas) {
      expect(idea.title.length).toBeGreaterThan(0);
      expect(idea.hook.length).toBeGreaterThan(0);
      expect(idea.promise.length).toBeGreaterThan(0);
    }
  });

  it('returns nothing instead of hanging when every title is avoided', () => {
    const first = brainstormIdeas({ topic: 'skincare', niche: 'beauty', pillars: [], count: 8, avoid: [] });
    const avoided = brainstormIdeas({ topic: 'skincare', niche: 'beauty', pillars: [], count: 8, avoid: first.map((f) => f.title) });
    expect(avoided).toHaveLength(0);
  });

  it('is deterministic for the same topic', () => {
    const a = brainstormIdeas({ topic: 'budget travel', niche: 'travel', pillars: [], count: 3, avoid: [] });
    const b = brainstormIdeas({ topic: 'budget travel', niche: 'travel', pillars: [], count: 3, avoid: [] });
    expect(a.map((i) => i.title)).toEqual(b.map((i) => i.title));
  });
});

describe('creatorBrain · captions', () => {
  const input = { title: 'The 30-day glow-up', hook: 'I fixed my skin in a month', promise: 'One routine, zero products', niche: 'beauty', platform: 'tiktok' };

  it('returns 3 caption variants plus hashtags, first comment and CTA', () => {
    const c = generateCaptions(input);
    expect(c.captions).toHaveLength(3);
    expect(c.hashtags.length).toBeGreaterThanOrEqual(3);
    expect(c.firstComment.length).toBeGreaterThan(0);
    expect(c.cta.length).toBeGreaterThan(0);
  });

  it('uses niche hashtags for beauty content', () => {
    expect(generateCaptions(input).hashtags.join(' ')).toContain('skincare');
  });

  it('is deterministic', () => {
    expect(generateCaptions(input)).toEqual(generateCaptions(input));
  });
});

describe('creatorBrain · repurposing', () => {
  it('stretches one idea into 4 cross-platform formats', () => {
    const idea: ContentIdea = {
      id: 'i', user_id: 'u', created_at: '2026-01-01', updated_at: '2026-01-01', sync_pending: 0,
      title: '5 makeup mistakes', description: null, platform: 'tiktok', priority: 'high', effort_level: 'medium',
      audience_promise: 'Fix your base routine', hook_idea: 'Nobody told you about mistake #3', content_angle: 'listicle',
      inspiration_source: null, pillar: 'beauty', repurpose_plan: null, status: 'published', impact: 4, confidence: 4,
    };
    const variants = repurposeIdea(idea);
    expect(variants).toHaveLength(4);
    expect(new Set(variants.map((v) => v.angle)).size).toBe(4);
    for (const v of variants) {
      expect(v.platform.length).toBeGreaterThan(0);
      expect(v.repurpose_plan.length).toBeGreaterThan(0);
      expect(v.hook).toContain('mistake #3');
    }
  });

  it('smart repurposing falls back to the offline 4-variant engine without Gemini', async () => {
    const idea: ContentIdea = {
      id: 'i', user_id: 'u', created_at: '2026-01-01', updated_at: '2026-01-01', sync_pending: 0,
      title: '5 makeup mistakes', description: null, platform: 'tiktok', priority: 'high', effort_level: 'medium',
      audience_promise: 'Fix your base routine', hook_idea: 'Nobody told you about mistake #3', content_angle: 'listicle',
      inspiration_source: null, pillar: 'beauty', repurpose_plan: null, status: 'published', impact: 4, confidence: 4,
    };
    const variants = await repurposeIdeaSmart(idea);
    expect(variants).toHaveLength(4);
    expect(variants.some((v) => v.platform === 'x')).toBe(true);
    expect(variants.some((v) => v.platform === 'instagram')).toBe(true);
    for (const v of variants) {
      expect(v.title.length).toBeGreaterThan(0);
      expect(v.hook.length).toBeGreaterThan(0);
    }
  });
});

describe('creatorBrain · follow-up outreach', () => {
  it('writes a warm nudge naming the brand and deliverables', () => {
    const deal: BrandDeal = {
      id: 'd', user_id: 'u', created_at: '2026-01-01', updated_at: '2026-01-01', sync_pending: 0,
      brand_name: 'GlowLab', contact_name: null, contact_email: null, deal_value: 850, estimated_probability: 60,
      currency: 'USD', deliverables: '3 UGC reels', usage_rights: null, rights_period: null, deadline: null,
      pitch_date: '2026-07-20', follow_up_date: null, payment_status: 'pending', status: 'contacted', platform: 'tiktok', notes: null,
    };
    const email = draftFollowUp(mediaKit({ display_name: 'Ari' }), deal);
    expect(email).toContain('GlowLab');
    expect(email).toContain('3 UGC reels');
    expect(email).toContain('Ari');
    expect(email).not.toContain('—');
  });
});

describe('creatorBrain · new brief nudges', () => {
  it('prompts a creator with no rate card to set rates', () => {
    const nudge = buildDailyBrief(baseCtx({ mediaKit: mediaKit({ rates: [] }) })).find((n) => n.id === 'rates');
    expect(nudge).toBeDefined();
    expect(nudge!.action?.to).toBe('/app/business');
  });

  it('skips the rates nudge once a price exists', () => {
    const ctx = baseCtx({ mediaKit: mediaKit({ rates: [{ id: 'r', name: 'Reel', price: 400, includes: '', negotiable: true }] }) });
    expect(buildDailyBrief(ctx).find((n) => n.id === 'rates')).toBeUndefined();
  });

  it('flags deals missing a price', () => {
    const deal: BrandDeal = {
      id: 'd', user_id: 'u', created_at: '2026-01-01', updated_at: '2026-01-01', sync_pending: 0,
      brand_name: 'GlowLab', contact_name: null, contact_email: null, deal_value: 0, estimated_probability: 60,
      currency: 'USD', deliverables: '1 reel', usage_rights: null, rights_period: null, deadline: null,
      pitch_date: null, follow_up_date: null, payment_status: 'pending', status: 'cold', platform: 'tiktok', notes: null,
    };
    const nudge = buildDailyBrief(baseCtx({ deals: [deal] })).find((n) => n.id === 'price-it');
    expect(nudge).toBeDefined();
    expect(nudge!.body).toContain('GlowLab');
  });

  it('suggests repurposing published ideas', () => {
    const idea: ContentIdea = {
      id: 'i', user_id: 'u', created_at: '2026-01-01', updated_at: '2026-01-01', sync_pending: 0,
      title: 'Wins', description: null, platform: 'tiktok', priority: 'high', effort_level: 'quick',
      audience_promise: null, hook_idea: null, content_angle: null, inspiration_source: null,
      pillar: null, repurpose_plan: null, status: 'published', impact: 3, confidence: 3,
    };
    const nudge = buildDailyBrief(baseCtx({ ideas: [idea] })).find((n) => n.id === 'repurpose');
    expect(nudge).toBeDefined();
    expect(nudge!.priority).toBe('low');
  });
});

describe('creatorBrain · trend pulse', () => {
  const daysAgo = (n: number): string => new Date(Date.now() - n * 86400000).toISOString();

  const idea = (p: Partial<ContentIdea> & { id: string }): ContentIdea => ({
    user_id: 'u', created_at: '2026-01-01', updated_at: daysAgo(3), sync_pending: 0,
    title: 'test', description: null, platform: 'tiktok', priority: 'medium', effort_level: 'quick', status: 'idea',
    audience_promise: null, hook_idea: null, content_angle: null, inspiration_source: null,
    pillar: null, repurpose_plan: null, impact: null, confidence: null, ...p,
  });

  it('returns region-filtered trends hottest-first', () => {
    const india = trendingNow(['fitness', 'beauty'], 'india');
    expect(india.length).toBeGreaterThan(0);
    expect(india.every((t) => t.region === 'india')).toBe(true);
    expect(india.every((t) => t.niche === 'fitness' || t.niche === 'beauty')).toBe(true);
    const heats = india.map((t) => t.momentum * 0.7 + t.virality * 0.3 + (t.direction === 'rising' ? 6 : t.direction === 'peaking' ? 3 : 0));
    expect(heats).toEqual([...heats].sort((a, b) => b - a));
  });

  it('returns the full catalog when no filter is applied', () => {
    expect(trendingNow([], 'all').length).toBeGreaterThan(60);
  });

  it('AI scan falls back to the catalog without Gemini', async () => {
    const africa = await trendingNowSmart(['food'], 'africa');
    expect(africa.length).toBeGreaterThan(0);
    expect(africa.every((t) => t.region === 'africa')).toBe(true);
    for (const t of africa) {
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.hook.length).toBeGreaterThan(0);
      expect(t.momentum).toBeGreaterThan(0);
      expect(t.momentum).toBeLessThanOrEqual(100);
    }
  });

  it('ranks a fresh short-form idea above a stale long-form one', () => {
    const fresh = idea({
      id: 'fresh', title: 'Drugstore serum blind test', platform: 'tiktok', effort_level: 'quick', status: 'idea',
      hook_idea: 'The cheap serum won', content_angle: 'listicle', pillar: 'beauty', impact: 4, confidence: 4,
    });
    const stale = idea({
      id: 'stale', title: 'Old notebook tour', platform: 'x', effort_level: 'big', status: 'idea',
      updated_at: daysAgo(90), impact: 1, confidence: 1,
    });
    const published = idea({ id: 'pub', title: 'Published reel', platform: 'tiktok', status: 'published', impact: 5, confidence: 5 });
    const picks = rankIdeasForNext([stale, published, fresh], { region: 'india', niches: ['beauty'] });
    expect(picks.map((p) => p.idea.id)).toEqual([fresh.id, stale.id]);
    expect(picks[0]!.score).toBeGreaterThan(picks[1]!.score);
    expect(picks[0]!.reasons.length).toBeGreaterThan(0);
    expect(picks.find((p) => p.idea.id === published.id)).toBeUndefined();
  });

  it('returns an empty ranking when nothing is open', () => {
    expect(rankIdeasForNext([], { region: 'world', niches: [] })).toEqual([]);
  });

  it('returns india benchmark with INR currency', () => {
    const b = regionalBenchmark('india');
    expect(b).not.toBeNull();
    expect(b!.currency).toBe('INR');
    expect(b!.symbol).toBe('\u20B9');
    expect(b!.rows.length).toBe(4);
    expect(b!.rows[0]!.low).toBeGreaterThan(0);
    expect(b!.rows[0]!.high).toBeGreaterThan(b!.rows[0]!.low);
  });

  it('returns null for unknown region', () => {
    expect(regionalBenchmark('atlantis')).toBeNull();
  });

  it('all 5 regions have benchmarks', () => {
    const regions = ['india', 'africa', 'us', 'uk', 'world'] as const;
    for (const r of regions) {
      const b = regionalBenchmark(r);
      expect(b).not.toBeNull();
      expect(b!.rows.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('hashtagPack merges trend + region tags', () => {
    const t: Trend = { id: 'test', niche: 'beauty', region: 'india', title: 'Test', hook: 'Hook', angle: 'angle', format: 'reel', momentum: 80, direction: 'rising', virality: 70, play: 'Play', hashtags: ['skincare', 'reels'] };
    const pack = hashtagPack(t);
    expect(pack.hashtags).toContain('skincare');
    expect(pack.hashtags).toContain('reels');
    expect(pack.hashtags.some((h) => ['viralindia', 'reelsindia', 'trendingindia', 'instagrowth'].includes(h))).toBe(true);
    expect(pack.hashtags.length).toBeLessThanOrEqual(12);
    expect(pack.caption).toContain('Hook');
    expect(pack.caption).toContain('#');
  });

  it('hashtagPack deduplicates overlapping tags', () => {
    const t: Trend = { id: 'test', niche: 'food', region: 'world', title: 'Test', hook: 'H', angle: 'A', format: 'video', momentum: 50, direction: 'rising', virality: 40, play: 'P', hashtags: ['fyp', 'food'] };
    const pack = hashtagPack(t);
    const fypCount = pack.hashtags.filter((h) => h === 'fyp').length;
    expect(fypCount).toBe(1);
  });

  it('hashtagPack falls back to world tags for unknown region', () => {
    const t = { id: 'test', niche: 'tech', region: 'atlantis', title: 'T', hook: 'H', angle: 'A', format: 'V', momentum: 60, direction: 'rising', virality: 50, play: 'P', hashtags: ['tech'] } as unknown as Trend;
    const pack = hashtagPack(t);
    expect(pack.hashtags).toContain('fyp');
    expect(pack.hashtags).toContain('viral');
  });
});
