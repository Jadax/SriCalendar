import { useCallback, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useQuery } from '@tanstack/react-query';
import { dbUgc, type UgcTableName } from '../lib/dexieUgcClient';
import { enqueueDelete, reconcileCollection, scheduleUgcPush } from '../lib/ugcSync';
import type {
  AnalyticsEntry, BoardCard, BrandDeal, Collaboration, ContentIdea, ContentPillar, Goal,
  HookItem, Invoice, KnowledgeItem, MediaKitProfile, ProductionChecklist, Script,
} from '../types/ugc';

/** Maps each local table name to its typed row. */
export interface UgcRowMap {
  content_ideas: ContentIdea;
  scripts: Script;
  hook_library: HookItem;
  production_board: BoardCard;
  brand_deals: BrandDeal;
  invoices: Invoice;
  media_kit: MediaKitProfile;
  knowledge_base: KnowledgeItem;
  analytics: AnalyticsEntry;
  content_pillars: ContentPillar;
  goals: Goal;
  production_checklists: ProductionChecklist;
  collaborations: Collaboration;
}

export type UgcActions<K extends UgcTableName> = {
  /** Creates a row locally and queues the cloud push. Resolves with the new row id. */
  add: (input: Partial<Omit<UgcRowMap[K], 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'>>) => Promise<string>;
  update: (id: string, patch: Partial<Omit<UgcRowMap[K], 'id' | 'user_id' | 'created_at' | 'updated_at' | 'sync_pending'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  replace: (row: UgcRowMap[K]) => Promise<void>;
};
export interface UseCollectionResult<K extends UgcTableName> extends UgcActions<K> {
  items: UgcRowMap[K][];
  isLoading: boolean;
}

/** Offline-first collection hook shared by every UGC table. */
export function useCollection<K extends UgcTableName>(tableName: K, userId?: string): UseCollectionResult<K> {
  const local = useLiveQuery(() => (userId ? dbUgc.table<UgcRowMap[K], string>(tableName).where('user_id').equals(userId).toArray() : Promise.resolve([] as UgcRowMap[K][])), [tableName, userId]);
  const query = useQuery({
    queryKey: ['ugc', tableName, userId],
    queryFn: () => reconcileCollection(tableName, userId ?? '').then((rows) => rows as UgcRowMap[K][]),
    enabled: Boolean(userId),
    retry: 1,
    staleTime: 60_000,
  });
  const items = local ?? query.data ?? [];

  const actions = useMemo<UgcActions<K>>(() => {
    const table = dbUgc.table<UgcRowMap[K], string>(tableName);
    const now = (): string => new Date().toISOString();
    const touch = async (id: string, transform: (current: UgcRowMap[K]) => UgcRowMap[K]): Promise<void> => {
      if (!userId) return;
      const current = await table.get(id);
      if (!current) return;
      const next: UgcRowMap[K] = { ...transform(current), updated_at: now(), sync_pending: 1 } as UgcRowMap[K];
      await table.put(next);
      scheduleUgcPush(tableName, next as never);
    };
    return {
      add: async (input) => {
        if (!userId) return '';
        const created = now();
        const record = { id: crypto.randomUUID(), user_id: userId, created_at: created, updated_at: created, sync_pending: 1, ...input } as UgcRowMap[K];
        await table.put(record);
        scheduleUgcPush(tableName, record as never);
        return record.id;
      },
      update: (id, patch) => touch(id, (current) => ({ ...current, ...patch })),
      replace: (row) => {
        if (!userId) return Promise.resolve();
        const next = { ...row, user_id: userId, updated_at: now(), sync_pending: 1 } as UgcRowMap[K];
        return table.put(next).then(() => scheduleUgcPush(tableName, next as never));
      },
      remove: (id) => (userId ? enqueueDelete(tableName, userId, id) : Promise.resolve()),
    };
  }, [tableName, userId]);

  return { items, isLoading: local === undefined && query.isLoading, ...actions };
}