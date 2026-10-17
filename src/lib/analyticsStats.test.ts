import { describe, expect, it } from 'vitest';
import { formatCompact } from '../utils/format';
import { avgEngagementRate, erOf, latestFollowers } from './analyticsStats';
import { shortDate } from '../utils/dateUtils';
import type { AnalyticsEntry } from '../types/ugc';

const entry = (over: Partial<AnalyticsEntry>): AnalyticsEntry => ({
  id: 'x', user_id: 'u1', platform: 'tiktok', date: '2026-01-01',
  followers: 0, views: 0, likes: 0, comments: 0, shares: 0, saves: 0,
  engagement_rate: 0, reach: 0, revenue: 0, currency: 'USD', notes: '',
  created_at: '', updated_at: '', sync_pending: 0, ...over,
});

describe('formatCompact', () => {
  it('keeps small numbers simple', () => { expect(formatCompact(830)).toBe('830'); expect(formatCompact(0)).toBe('0'); expect(formatCompact(999)).toBe('999'); });
  it('compacts thousands and millions', () => { expect(formatCompact(1_240_000)).toBe('1.2M'); expect(formatCompact(12_300)).toBe('12.3K'); });
  it('handles negative and non-finite input', () => { expect(formatCompact(-2_400)).toBe('-2.4K'); expect(formatCompact(NaN)).toBe('0'); });
});

describe('analyticsStats', () => {
  it('computes er as interactions over followers', () => {
    expect(erOf({ likes: 8, comments: 6, shares: 4, saves: 2, followers: 1000 })).toBe(2);
    expect(erOf({ likes: 1, comments: 0, shares: 0, saves: 0, followers: 0 })).toBe(0);
  });
  it('sums only the newest followers per platform', () => {
    const rows = [entry({ platform: 'tiktok', followers: 500 }), entry({ platform: 'tiktok', followers: 700 }), entry({ platform: 'instagram', followers: 300 })];
    expect(latestFollowers(rows)).toBe(1000);
  });
  it('averages engagement over entries with a real audience', () => {
    const rows = [entry({ likes: 10, followers: 100 }), entry({ likes: 20, followers: 100 }), entry({ likes: 99, followers: 0 })];
    expect(avgEngagementRate(rows)).toBe(15);
    expect(avgEngagementRate([])).toBe(0);
  });
});

describe('shortDate', () => {
  it('formats a date key as a short human label', () => { expect(shortDate('2026-10-17')).toBe('17 Oct'); });
});
