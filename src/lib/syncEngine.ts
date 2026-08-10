import { db } from './dexieClient';
import { neon } from './neonClient';
import { SYNC_DEBOUNCE_MS, SYNC_RETRIES } from '../utils/constants';
import { useUiStore } from '../store/uiStore';
import type { DailyData } from '../types';

const timers = new Map<string, ReturnType<typeof setTimeout>>();

/** Creates a complete empty daily record for a specific user and immutable date key. */
export function createEmptyDailyData(userId: string, dateKey: string): DailyData {
  return { id: crypto.randomUUID(), user_id: userId, date_key: dateKey, tasks: [], notes: '', stickers: [], platform_posts: [], updated_at: new Date().toISOString(), sync_pending: 0 };
}

/** Resolves local/cloud conflict by newest timestamp while protecting unsynced local edits. */
export function chooseNewest(local: DailyData | undefined, remote: DailyData): DailyData {
  if (!local) return { ...remote, sync_pending: 0 };
  if (local.sync_pending === 1) return local;
  return new Date(remote.updated_at).getTime() > new Date(local.updated_at).getTime() ? { ...remote, sync_pending: 0 } : local;
}

/** Fetches one historical day from Neon and reconciles it into IndexedDB. */
export async function reconcileDay(userId: string, dateKey: string): Promise<DailyData> {
  const local = await db.daily_data.get([userId, dateKey]);
  const { data, error } = await neon.from('daily_data').select('*').eq('user_id', userId).eq('date_key', dateKey).maybeSingle();
  if (error) throw error;
  if (!data) return local ?? createEmptyDailyData(userId, dateKey);
  const resolved = chooseNewest(local, data as DailyData);
  await db.daily_data.put(resolved);
  return resolved;
}

/** Retries a complete-record upsert and marks the local record synced on success. */
export async function pushRecord(record: DailyData): Promise<DailyData> {
  useUiStore.getState().setSyncState('syncing');
  const payload = { id: record.id, user_id: record.user_id, date_key: record.date_key, tasks: record.tasks, notes: record.notes, stickers: record.stickers, platform_posts: record.platform_posts, updated_at: record.updated_at };
  for (let attempt = 1; attempt <= SYNC_RETRIES; attempt += 1) {
    const { data, error } = await neon.from('daily_data').upsert(payload, { onConflict: 'user_id,date_key' }).select().single();
    if (!error && data) {
      const synced = { ...(data as DailyData), sync_pending: 0 as const };
      await db.daily_data.put(synced);
      useUiStore.getState().setSyncState('synced');
      return synced;
    }
    if (attempt < SYNC_RETRIES) await new Promise<void>((resolve) => setTimeout(resolve, 300 * 2 ** (attempt - 1)));
  }
  useUiStore.getState().setSyncState('offline');
  throw new Error('Cloud synchronization failed after three attempts.');
}

/** Debounces cloud synchronization independently for every user/date record. */
export function scheduleSync(record: DailyData): void {
  const key = `${record.user_id}:${record.date_key}`;
  const previous = timers.get(key);
  if (previous) clearTimeout(previous);
  timers.set(key, setTimeout(() => { timers.delete(key); void pushRecord(record).catch(() => undefined); }, SYNC_DEBOUNCE_MS));
}

/** Pushes every locally queued record, used when connectivity returns. */
export async function flushPending(userId: string): Promise<void> {
  const pending = await db.daily_data.where('user_id').equals(userId).and((row) => row.sync_pending === 1).toArray();
  for (const record of pending) await pushRecord(record);
}
