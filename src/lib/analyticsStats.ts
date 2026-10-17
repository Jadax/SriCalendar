import type { AnalyticsEntry } from '../types/ugc';

type EngagementSource = Pick<AnalyticsEntry, 'likes' | 'comments' | 'shares' | 'saves' | 'followers'>;

/** Engagement rate as a percentage of followers: (likes + comments + shares + saves) ÷ followers. */
export function erOf(entry: EngagementSource): number {
  return entry.followers > 0 ? ((entry.likes + entry.comments + entry.shares + entry.saves) / entry.followers) * 100 : 0;
}

/** Sums the newest follower count per platform, so logarithmic histories sum to the real audience. */
export function latestFollowers(entries: AnalyticsEntry[]): number {
  const latest = new Map<string, number>();
  for (const entry of entries) latest.set(entry.platform, entry.followers);
  return [...latest.values()].reduce((sum, count) => sum + count, 0);
}

/** Average engagement rate across every entry that has an audience to measure against. */
export function avgEngagementRate(entries: AnalyticsEntry[]): number {
  const rows = entries.filter((entry) => entry.followers > 0);
  return rows.length ? rows.reduce((sum, entry) => sum + erOf(entry), 0) / rows.length : 0;
}
