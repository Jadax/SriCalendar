/**
 * Real-time trend sources — fetches trending data from free public APIs.
 * All calls are client-side; no backend needed.
 */

/* ---------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */

export interface LiveTrend {
  source: 'tiktok' | 'google' | 'reddit' | 'youtube';
  title: string;
  url?: string;
  score?: number;     // relative popularity 0-100
  category?: string;
  region?: string;
  fetchedAt: string;  // ISO timestamp
}

interface CacheEntry { data: LiveTrend[]; ts: number }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function getCached(key: string): LiveTrend[] | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key: string, data: LiveTrend[]): void {
  cache.set(key, { data, ts: Date.now() });
}

/* ---------------------------------------------------------------------------
 * TikTok Creative Center (unofficial)
 * ------------------------------------------------------------------------- */

/** Fetch trending hashtags from TikTok Creative Center by country. */
export async function fetchTikTokTrends(countryCode = 'US', limit = 20): Promise<LiveTrend[]> {
  const cacheKey = `tiktok-${countryCode}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://ads.tiktok.com/business/creativecenter/inspiration/popular/pc/en?period=7&countryCode=${countryCode}&page=1&limit=${limit}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];
    const html = await res.text();
    const trends: LiveTrend[] = [];
    const now = new Date().toISOString();

    // Parse hashtag names from HTML (Creative Center renders them server-side)
    const hashtagRegex = /class="[^"]*hashtag[^"]*"[^>]*>([^<]+)</gi;
    let match = hashtagRegex.exec(html);
    let idx = 0;
    while (match && idx < limit) {
      const name = match[1]?.trim();
      if (name && name.length > 1) {
        trends.push({
          source: 'tiktok',
          title: name.startsWith('#') ? name : `#${name}`,
          score: Math.max(10, 100 - idx * 4),
          region: countryCode,
          fetchedAt: now,
        });
        idx++;
      }
      match = hashtagRegex.exec(html);
    }

    if (trends.length > 0) setCache(cacheKey, trends);
    return trends;
  } catch {
    return [];
  }
}

/* ---------------------------------------------------------------------------
 * Google Trends RSS
 * ------------------------------------------------------------------------- */

/** Fetch trending Google searches from the RSS feed. */
export async function fetchGoogleTrends(limit = 20): Promise<LiveTrend[]> {
  const cacheKey = 'google-trends';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      'https://trends.google.com/trending/rss?geo=US',
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];
    const text = await res.text();
    const trends: LiveTrend[] = [];
    const now = new Date().toISOString();

    // Parse RSS items
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let itemMatch = itemRegex.exec(text);
    let idx = 0;
    while (itemMatch && idx < limit) {
      const block = itemMatch[1]!;
      const titleMatch = /<title><!\[CDATA\[(.+?)\]\]><\/title>/.exec(block);
      const linkMatch = /<link>(.+?)<\/link>/.exec(block);
      const trafficMatch = /<ht:approx_traffic>(.+?)<\/ht:approx_traffic>/.exec(block);

      const title = titleMatch?.[1]?.trim();
      if (title) {
        const traffic = parseInt(trafficMatch?.[1] ?? '0', 10);
        trends.push({
          source: 'google',
          title,
          url: linkMatch?.[1],
          score: Math.min(100, Math.max(10, Math.round((traffic || 1000000) / 100000))),
          region: 'US',
          fetchedAt: now,
        });
        idx++;
      }
      itemMatch = itemRegex.exec(text);
    }

    if (trends.length > 0) setCache(cacheKey, trends);
    return trends;
  } catch {
    return [];
  }
}

/* ---------------------------------------------------------------------------
 * Reddit JSON (public, no auth needed)
 * ------------------------------------------------------------------------- */

/** Fetch hot posts from a subreddit. */
export async function fetchRedditTrends(subreddit = 'BeautyGuruChattering', limit = 15): Promise<LiveTrend[]> {
  const cacheKey = `reddit-${subreddit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
      { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'SriCalendar/1.0' } },
    );
    if (!res.ok) return [];
    const json = await res.json() as { data?: { children?: Array<{ data?: { title?: string; url?: string; score?: number; subreddit?: string } }> } };
    const now = new Date().toISOString();
    const trends: LiveTrend[] = [];

    for (const child of json.data?.children ?? []) {
      const post = child.data;
      if (post?.title) {
        trends.push({
          source: 'reddit',
          title: post.title.length > 80 ? post.title.slice(0, 77) + '...' : post.title,
          url: post.url,
          score: Math.min(100, Math.max(10, Math.round((post.score ?? 0) / 10))),
          category: post.subreddit,
          fetchedAt: now,
        });
      }
    }

    if (trends.length > 0) setCache(cacheKey, trends);
    return trends;
  } catch {
    return [];
  }
}

/* ---------------------------------------------------------------------------
 * YouTube Trending (via RSS)
 * ------------------------------------------------------------------------- */

/** Fetch trending YouTube videos from RSS. */
export async function fetchYouTubeTrends(regionCode = 'US', limit = 15): Promise<LiveTrend[]> {
  const cacheKey = `youtube-${regionCode}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?region_id=${regionCode}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];
    const text = await res.text();
    const trends: LiveTrend[] = [];
    const now = new Date().toISOString();

    const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
    let entryMatch = entryRegex.exec(text);
    let idx = 0;
    while (entryMatch && idx < limit) {
      const block = entryMatch[1]!;
      const titleMatch = /<title>(.+?)<\/title>/.exec(block);
      const linkMatch = /<link[^>]+href="(.+?)"/.exec(block);

      const title = titleMatch?.[1]?.trim();
      if (title) {
        trends.push({
          source: 'youtube',
          title,
          url: linkMatch?.[1],
          score: Math.max(10, 100 - idx * 6),
          region: regionCode,
          fetchedAt: now,
        });
        idx++;
      }
      entryMatch = entryRegex.exec(text);
    }

    if (trends.length > 0) setCache(cacheKey, trends);
    return trends;
  } catch {
    return [];
  }
}

/* ---------------------------------------------------------------------------
 * Aggregator — fetch from all sources
 * ------------------------------------------------------------------------- */

/** Fetch live trends from all free sources. Returns deduplicated, sorted by score. */
export async function fetchAllLiveTrends(regionCode = 'US'): Promise<LiveTrend[]> {
  const [tiktok, google, reddit, youtube] = await Promise.allSettled([
    fetchTikTokTrends(regionCode),
    fetchGoogleTrends(),
    fetchRedditTrends('BeautyGuruChattering'),
    fetchYouTubeTrends(regionCode),
  ]);

  const all: LiveTrend[] = [
    ...(tiktok.status === 'fulfilled' ? tiktok.value : []),
    ...(google.status === 'fulfilled' ? google.value : []),
    ...(reddit.status === 'fulfilled' ? reddit.value : []),
    ...(youtube.status === 'fulfilled' ? youtube.value : []),
  ];

  // Deduplicate by title similarity
  const seen = new Set<string>();
  const deduped = all.filter((t) => {
    const key = t.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

/** Map a region id to a TikTok/YouTube country code. */
export function regionToCountryCode(region: string): string {
  const map: Record<string, string> = {
    us: 'US', uk: 'GB', india: 'IN', africa: 'ZA', world: 'US',
  };
  return map[region] ?? 'US';
}
