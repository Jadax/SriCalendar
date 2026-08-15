import { describe, expect, it } from 'vitest';
import {
  buildDailyBrief, buildWeeklyPlan, draftPitch, interpretAnalytics,
  type TodayContext,
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
