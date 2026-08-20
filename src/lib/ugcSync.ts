import { dbUgc, type UgcTableName } from './dexieUgcClient';
import { neon } from './neonClient';
import { useUiStore } from '../store/uiStore';
import { SYNC_DEBOUNCE_MS, SYNC_RETRIES } from '../utils/constants';
import type { AnyUgcRow, UgcRow } from '../types/ugc';

/** Minimal PostgREST chain surface used for dynamically named UGC tables. */
interface LooseResponse { data: unknown; error: { message: string } | null }
interface LooseQuery {
  select: (columns?: string) => LooseQuery;
  single: () => Promise<LooseResponse>;
  eq: (column: string, value: unknown) => Promise<LooseResponse>;
  then: <TResult = LooseResponse>(onfulfilled?: ((value: LooseResponse) => TResult | PromiseLike<TResult>) | null, onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null) => PromiseLike<TResult>;
}
interface LooseTable {
  select: (columns?: string) => LooseQuery;
  upsert: (payload: Record<string, unknown>, options?: { onConflict?: string }) => LooseQuery;
  delete: () => LooseQuery;
  insert: (payload: Record<string, unknown>) => LooseQuery;
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();

/** Resolves local/cloud conflict by newest timestamp while protecting unsynced local edits. */
export function chooseNewest<T extends UgcRow>(local: T | undefined, remote: T): T {
  if (!local) return { ...remote, sync_pending: 0 };
  if (local.sync_pending === 1) return local;
  return new Date(remote.updated_at).getTime() > new Date(local.updated_at).getTime() ? { ...remote, sync_pending: 0 } : local;
}

function tableRef(table: UgcTableName): LooseTable {
  return neon.from(table as never) as unknown as LooseTable;
}

interface LocalTableLike {
  get: (id: string) => Promise<AnyUgcRow | undefined>;
  put: (row: AnyUgcRow) => Promise<unknown>;
  delete: (id: string) => Promise<void>;
}
function localTable(table: UgcTableName): LocalTableLike {
  return dbUgc.table<AnyUgcRow, string>(table) as unknown as LocalTableLike;
}

function stripSync<T extends UgcRow>(row: T): Record<string, unknown> {
  const { sync_pending: _ignored, ...clean } = row;
  return clean;
}

/** Fetches every owned row from Neon and reconciles it into IndexedDB. */
export async function reconcileCollection(table: UgcTableName, userId: string): Promise<AnyUgcRow[]> {
  if (!userId) return [];
  const { data, error } = await tableRef(table).select('*').eq('user_id', userId);
  if (error) throw new Error(error.message);
  const remoteRows = (Array.isArray(data) ? data : []) as Array<AnyUgcRow & { id: string }>;
  const merged: AnyUgcRow[] = [];
  for (const remote of remoteRows) {
    if (!remote?.id) continue;
    const local = await localTable(table).get(remote.id);
    const resolved = chooseNewest(local as AnyUgcRow | undefined, remote as AnyUgcRow);
    await localTable(table).put(resolved);
    merged.push(resolved);
  }
  return merged;
}

/** Retries a complete-record upsert and marks the local record synced on success. */
export async function pushUgcRecord(table: UgcTableName, record: AnyUgcRow): Promise<void> {
  useUiStore.getState().setSyncState('syncing');
  for (let attempt = 1; attempt <= SYNC_RETRIES; attempt += 1) {
    const { data, error } = await tableRef(table).upsert(stripSync(record), { onConflict: 'id' }).select();
    if (!error && data) {
      const dataRows = Array.isArray(data) ? data : [data];
      const syncedRow = dataRows[0] as AnyUgcRow;
      await localTable(table).put({ ...syncedRow, sync_pending: 0 } as AnyUgcRow);
      useUiStore.getState().setSyncState('synced');
      return;
    }
    if (attempt < SYNC_RETRIES) await new Promise<void>((resolve) => setTimeout(resolve, 300 * 2 ** (attempt - 1)));
  }
  useUiStore.getState().setSyncState('offline');
  throw new Error(`Cloud sync failed for ${table}.`);
}

/** Debounces cloud synchronization independently for every table/record pair. */
export function scheduleUgcPush(table: UgcTableName, record: AnyUgcRow): void {
  const key = `${table}:${record.id}`;
  const previous = timers.get(key);
  if (previous) clearTimeout(previous);
  timers.set(key, setTimeout(() => { timers.delete(key); void pushUgcRecord(table, record).catch(() => undefined); }, SYNC_DEBOUNCE_MS));
}

/** Queues a delete for later reconciliation and drops the row from the local cache. */
export async function enqueueDelete(table: UgcTableName, userId: string, id: string): Promise<void> {
  await localTable(table).delete(id);
  await dbUgc.delete_queue.put({ key: `${table}:${id}`, table, id, user_id: userId, queued_at: new Date().toISOString() });
}

/** Pushes a queued delete to Neon and removes it from the queue on success. */
export async function flushDelete(entry: { key: string; table: string; id: string }): Promise<void> {
  for (let attempt = 1; attempt <= SYNC_RETRIES; attempt += 1) {
    const { error } = await tableRef(entry.table as UgcTableName).delete().eq('id', entry.id);
    if (!error) { await dbUgc.delete_queue.delete(entry.key); useUiStore.getState().setSyncState('synced'); return; }
    if (attempt < SYNC_RETRIES) await new Promise<void>((resolve) => setTimeout(resolve, 300 * 2 ** (attempt - 1)));
  }
  useUiStore.getState().setSyncState('offline');
}

/** Pushes every locally queued UGC record and pending delete when connectivity returns. */
export async function flushPendingUgc(userId: string): Promise<void> {
  if (!userId) return;
  const tables = dbUgc;
  const queued = await tables.delete_queue.where('user_id').equals(userId).toArray();
  for (const entry of queued) await flushDelete(entry).catch(() => undefined);
  for (const table of ['content_ideas', 'scripts', 'hook_library', 'production_board', 'brand_deals', 'invoices', 'media_kit', 'knowledge_base', 'analytics', 'content_pillars', 'goals', 'production_checklists', 'collaborations'] as const) {
    const local = tables.table<AnyUgcRow, string>(table).where('user_id').equals(userId).and((row) => row.sync_pending === 1).toArray();
    for (const record of await local) await pushUgcRecord(table, record).catch(() => undefined);
  }
}
