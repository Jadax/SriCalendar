import type { ContentResult } from '../types/ugc';

/**
 * What Worked: turns the per-post result log into a plain-English formula.
 * Pure and deterministic; powers both the Knowledge "What Worked" panel and a
 * daily-brief nudge so the creator keeps repeating their proven patterns.
 */

export interface OutcomeMetric { n: number; er: number; views: number; saves: number; followers: number }

export interface OutcomePattern extends OutcomeMetric { value: string }

export interface OutcomeWinner { dimension: 'hook' | 'pillar' | 'format' | 'angle'; dimensionLabel: string; value: string; reason: string; lift: number; er: number }

export interface PerformanceReport {
  sampleSize: number;
  overall: OutcomeMetric;
  byHook: OutcomePattern[];
  byPillar: OutcomePattern[];
  byFormat: OutcomePattern[];
  byAngle: OutcomePattern[];
  winners: OutcomeWinner[];
  cutters: OutcomePattern[];
  takeaways: string[];
}

export interface ResultNudge {
  id: string;
  emoji: string;
  title: string;
  body: string;
  priority: 'high' | 'medium' | 'low';
  action?: { label: string; to: string };
}

const DIMENSION_LABEL: Record<string, string> = { hook: 'hook', pillar: 'pillar', format: 'format', angle: 'angle' };

/** Engagements divided by views. The honest short-video engagement rate. */
export function engagementRate(r: Pick<ContentResult, 'views' | 'likes' | 'comments' | 'shares' | 'saves'>): number {
  if (!r.views) return 0;
  return ((r.likes + r.comments + r.shares + r.saves) / r.views) * 100;
}

function mean(values: number[]): number {
  return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
}

type KeyOf = (r: ContentResult) => string | null;

function groupBy(results: ContentResult[], keyOf: KeyOf): Map<string, ContentResult[]> {
  const groups = new Map<string, ContentResult[]>();
  for (const row of results) {
    const key = keyOf(row)?.trim();
    if (!key) continue;
    const list = groups.get(key);
    if (list) list.push(row); else groups.set(key, [row]);
  }
  return groups;
}

function patternOf(value: string, rows: ContentResult[]): OutcomePattern {
  return {
    value,
    n: rows.length,
    er: mean(rows.map(engagementRate)),
    views: mean(rows.map((r) => r.views)),
    saves: mean(rows.map((r) => r.saves)),
    followers: rows.reduce((sum, r) => sum + r.followers_gained, 0),
  };
}

function dimensionPatterns(results: ContentResult[], keyOf: KeyOf): OutcomePattern[] {
  const out: OutcomePattern[] = [];
  for (const [value, rows] of groupBy(results, keyOf)) {
    if (rows.length >= 2) out.push(patternOf(value, rows));
  }
  return out.sort((a, b) => b.er - a.er || b.views - a.views);
}

function overallMetric(results: ContentResult[]): OutcomeMetric {
  return patternOf('all', results);
}

function liftOf(pattern: OutcomePattern, overall: OutcomeMetric): number {
  const base = Math.max(overall.er, 0.001);
  return pattern.er / base;
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(Math.round(n));
}

function fmtEr(er: number): string {
  return `${er.toFixed(1)}%`;
}

function winnerReason(dimension: string, pattern: OutcomePattern, lift: number): string {
  if (dimension === 'hook') return `${pattern.value} hooks averaged ${fmtEr(pattern.er)} engagement, ${lift.toFixed(1)}x your baseline.`;
  if (dimension === 'pillar') return `Your ${pattern.value} pillar pulls ${lift.toFixed(1)}x your baseline engagement rate.`;
  if (dimension === 'format') return `${pattern.value} posts averaged ${fmtEr(pattern.er)} engagement across ${pattern.n} posts.`;
  return `${pattern.value} angles ran ${lift.toFixed(1)}x your baseline engagement rate.`;
}

function takeawayOf(winners: OutcomeWinner[], cutters: OutcomePattern[], sampleSize: number): string[] {
  const lines: string[] = [];
  const best = winners[0];
  if (best) lines.push(`Lead with ${best.value} ${best.dimensionLabel}s. It is your strongest move right now.`);
  const bestPillar = winners.find((w) => w.dimension === 'pillar');
  if (bestPillar && !lines.some((l) => l.includes(bestPillar.value))) {
    lines.push(`Make more ${bestPillar.value} content, it is driving your growth.`);
  }
  if (cutters.length > 0) {
    const c = cutters[0]!;
    lines.push(`Ease off ${c.value} posts, they ran about half your usual rate.`);
  }
  if (sampleSize < 6) lines.push('The signal is thin. Keep logging every post and the formula sharpens.');
  else lines.push('Log every post for another few weeks and this formula keeps sharpening.');
  return lines.slice(0, 3);
}

export function analyzeOutcomes(results: ContentResult[]): PerformanceReport {
  const byHook = dimensionPatterns(results, (r) => r.hook_category);
  const byPillar = dimensionPatterns(results, (r) => r.pillar);
  const byFormat = dimensionPatterns(results, (r) => r.format);
  const byAngle = dimensionPatterns(results, (r) => r.angle);
  const overall = overallMetric(results);

  const candidates: Array<{ dimension: OutcomeWinner['dimension']; pattern: OutcomePattern; lift: number }> = [];
  for (const [dimension, patterns] of [['hook', byHook], ['pillar', byPillar], ['format', byFormat], ['angle', byAngle]] as const) {
    const top = patterns[0];
    if (!top) continue;
    const lift = liftOf(top, overall);
    if (top.n >= 2 && (lift >= 1.15 || (top.n >= 3 && top.er >= overall.er * 0.9))) {
      candidates.push({ dimension, pattern: top, lift });
    }
  }
  candidates.sort((a, b) => b.lift - a.lift);

  const winners: OutcomeWinner[] = candidates.slice(0, 3).map((c) => ({
    dimension: c.dimension,
    dimensionLabel: DIMENSION_LABEL[c.dimension] ?? c.dimension,
    value: c.pattern.value,
    reason: winnerReason(c.dimension, c.pattern, c.lift),
    lift: c.lift,
    er: c.pattern.er,
  }));

  const cutters: OutcomePattern[] = [];
  for (const patterns of [byHook, byPillar, byFormat, byAngle]) {
    for (const pattern of patterns) {
      if (pattern.er <= overall.er * 0.5 && pattern.n >= 2) {
        cutters.push(pattern);
        break;
      }
    }
    if (cutters.length >= 2) break;
  }
  cutters.sort((a, b) => a.er - b.er);

  return {
    sampleSize: results.length,
    overall,
    byHook,
    byPillar,
    byFormat,
    byAngle,
    winners,
    cutters: cutters.slice(0, 2),
    takeaways: takeawayOf(winners, cutters.slice(0, 2), results.length),
  };
}

/** The daily-brief nudge: "Double down on what is proven." */
export function outcomeNudge(report: PerformanceReport): ResultNudge | null {
  if (report.sampleSize < 4 || report.winners.length === 0) return null;
  const w = report.winners[0]!;
  return {
    id: 'winning-pattern',
    emoji: '📊',
    priority: 'medium',
    title: `${w.value} is your winning ${w.dimensionLabel}`,
    body: `${w.reason} Double down on what your own numbers already proved.`,
    action: { label: 'See what worked', to: '/app/knowledge' },
  };
}