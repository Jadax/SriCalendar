import { db } from './dexieClient';
import { createEmptyDailyData, scheduleSync } from './syncEngine';
import type { Platform, PlatformPost } from '../types';

/** Attaches a scheduled platform post to a calendar day with offline-first sync. */
export async function schedulePlatformPost(userId: string, dateKey: string, post: Omit<PlatformPost, 'id'>): Promise<void> {
  const existing = await db.daily_data.get([userId, dateKey]);
  const base = existing ?? createEmptyDailyData(userId, dateKey);
  const next: typeof base = {
    ...base,
    platform_posts: [...base.platform_posts, { ...post, id: crypto.randomUUID() }],
    updated_at: new Date().toISOString(),
    sync_pending: 1,
  };
  await db.daily_data.put(next);
  scheduleSync(next);
}

export type { Platform, PlatformPost };