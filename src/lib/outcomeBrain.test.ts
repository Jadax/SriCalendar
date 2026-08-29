import { describe, expect, it } from 'vitest';
import { analyzeOutcomes, engagementRate, outcomeNudge } from './outcomeBrain';
import type { ContentResult } from '../types/ugc';

const result = (r: Partial<ContentResult>): ContentResult => ({
  id: r.id ?? 'r1', user_id: 'u', created_at: '2026-01-01', updated_at: '2026-01-01', sync_pending: 0,
  date: r.date ?? '2026-08-01', platform: r.platform ?? 'tiktok', title: r.title ?? 'post',
  hook_category: r.hook_category ?? null, pillar: r.pillar ?? null, format: r.format ?? null, angle: r.angle ?? null,
  views: r.views ?? 1000, likes: r.likes ?? 0, comments: r.comments ?? 0, shares: r.shares ?? 0, saves: r.saves ?? 0,
  followers_gained: r.followers_gained ?? 0, note: r.note ?? null,
});

describe('outcomeBrain', () => {
  it('computes the engagement rate as engagements over views', () => {
    expect(engagementRate({ views: 1000, likes: 50, comments: 5, shares: 3, saves: 40 })).toBeCloseTo(9.8);
    expect(engagementRate({ views: 0, likes: 1, comments: 0, shares: 0, saves: 0 })).toBe(0);
  });

  it('reports an empty state on an empty log', () => {
    const report = analyzeOutcomes([]);
    expect(report.sampleSize).toBe(0);
    expect(report.winners).toHaveLength(0);
    expect(report.overall.er).toBe(0);
    expect(outcomeNudge(report)).toBeNull();
  });

  it('stays silent until at least two posts share a dimension', () => {
    const report = analyzeOutcomes([
      result({ hook_category: 'Question' }),
      result({ hook_category: 'Big Promise' }),
    ]);
    expect(report.byHook).toHaveLength(0);
    expect(report.winners).toHaveLength(0);
  });

  it('ranks patterns by engagement-rate lift over the baseline', () => {
    const rows = [
      result({ id: 'a', hook_category: 'Question', views: 1000, likes: 90, saves: 80 }), // 17%
      result({ id: 'b', hook_category: 'Question', views: 900, likes: 70, saves: 60 }), // 14.4%
      result({ id: 'c', hook_category: 'Story', views: 10000, likes: 100, saves: 50 }), // 1.5%
      result({ id: 'd', hook_category: 'Story', views: 8000, likes: 120, saves: 80 }), // 2.5%
    ];
    const report = analyzeOutcomes(rows);
    expect(report.byHook.map((p) => p.value)[0]).toBe('Question');
    expect(report.winners[0]?.dimension).toBe('hook');
    expect(report.winners[0]?.value).toBe('Question');
    expect(report.winners[0]?.lift).toBeGreaterThan(1.5);
  });

  it('flags a pattern as a cutter when it runs at half the baseline', () => {
    const rows = [
      result({ id: 'a', format: 'reel', views: 1000, likes: 120 }), // 12%
      result({ id: 'b', format: 'reel', views: 1000, likes: 100 }), // 10%
      result({ id: 'c', format: 'story', views: 1000, likes: 12 }), // 1.2%
      result({ id: 'd', format: 'story', views: 1000, likes: 18 }), // 1.8%
    ];
    const report = analyzeOutcomes(rows);
    expect(report.cutters.map((c) => c.value)).toContain('story');
  });

  it('builds a friendly outcome nudge once there is enough signal', () => {
    const rows = Array.from({ length: 6 }, (_, i) => result({ id: `r${i}`, hook_category: 'Question', views: 1000, likes: 90 + i * 10, saves: 60 }));
    const nudge = outcomeNudge(analyzeOutcomes(rows));
    expect(nudge).not.toBeNull();
    expect(nudge?.id).toBe('winning-pattern');
    expect(nudge?.title).toContain('Question');
    expect(nudge?.body).toBeTruthy();
  });

  it('does not nudge on a too-thin sample', () => {
    const rows = [
      result({ id: 'a', hook_category: 'Question', views: 1000, likes: 400 }),
      result({ id: 'b', hook_category: 'Question', views: 1000, likes: 350 }),
      result({ id: 'c', hook_category: 'Story', views: 1000, likes: 30 }),
    ];
    expect(reportNudgeFor(rows)).toBeNull();
  });

  it('keeps takeaways short, human and decisive', () => {
    const rows = [
      result({ id: 'a', hook_category: 'Question', pillar: 'Glow-ups', views: 1000, likes: 200 }),
      result({ id: 'b', hook_category: 'Question', pillar: 'Glow-ups', views: 1000, likes: 180 }),
      result({ id: 'c', hook_category: 'Story', format: 'story', views: 1000, likes: 10 }),
      result({ id: 'd', hook_category: 'Story', format: 'story', views: 1000, likes: 12 }),
    ];
    const report = analyzeOutcomes(rows);
    expect(report.takeaways.length).toBeGreaterThanOrEqual(2);
    for (const line of report.takeaways) {
      expect(line).not.toContain('—');
      expect(line.length).toBeLessThan(110);
    }
  });
});

function reportNudgeFor(rows: ContentResult[]) {
  return outcomeNudge(analyzeOutcomes(rows));
}