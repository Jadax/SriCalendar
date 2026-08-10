import Dexie, { type Table } from 'dexie';
import type {
  AnalyticsEntry, BoardCard, BrandDeal, Collaboration, ContentIdea, ContentPillar, Goal,
  HookItem, Invoice, KnowledgeItem, MediaKitProfile, ProductionChecklist, Script,
} from '../types/ugc';

export interface PendingDelete { key: string; table: string; id: string; user_id: string; queued_at: string }

/** Second IndexedDB database holding the offline-first UGC suite tables. */
class SriCalendarUgcDatabase extends Dexie {
  content_ideas!: Table<ContentIdea, string>;
  scripts!: Table<Script, string>;
  hook_library!: Table<HookItem, string>;
  production_board!: Table<BoardCard, string>;
  brand_deals!: Table<BrandDeal, string>;
  invoices!: Table<Invoice, string>;
  media_kit!: Table<MediaKitProfile, string>;
  knowledge_base!: Table<KnowledgeItem, string>;
  analytics!: Table<AnalyticsEntry, string>;
  content_pillars!: Table<ContentPillar, string>;
  goals!: Table<Goal, string>;
  production_checklists!: Table<ProductionChecklist, string>;
  collaborations!: Table<Collaboration, string>;
  delete_queue!: Table<PendingDelete, string>;

  constructor() {
    super('SriCalendarUgcDB');
    const stores = {
      content_ideas: 'id, user_id, updated_at, sync_pending, status',
      scripts: 'id, user_id, updated_at, sync_pending, status',
      hook_library: 'id, user_id, updated_at, sync_pending, type',
      production_board: 'id, user_id, updated_at, sync_pending, column_name',
      brand_deals: 'id, user_id, updated_at, sync_pending, status',
      invoices: 'id, user_id, updated_at, sync_pending, status',
      media_kit: 'id, user_id, updated_at, sync_pending',
      knowledge_base: 'id, user_id, updated_at, sync_pending, category',
      analytics: 'id, user_id, updated_at, sync_pending, platform',
      content_pillars: 'id, user_id, updated_at, sync_pending',
      goals: 'id, user_id, updated_at, sync_pending, status',
      production_checklists: 'id, user_id, updated_at, sync_pending',
      collaborations: 'id, user_id, updated_at, sync_pending, status',
      delete_queue: 'key, user_id, table, queued_at',
    };
    this.version(1).stores(stores);
  }
}

/** Singleton local UGC database instance. */
export const dbUgc = new SriCalendarUgcDatabase();

/** Every UGC table name shared by the local cache and the Neon Data API. */
export const UGC_TABLES = [
  'content_ideas',
  'scripts',
  'hook_library',
  'production_board',
  'brand_deals',
  'invoices',
  'media_kit',
  'knowledge_base',
  'analytics',
  'content_pillars',
  'goals',
  'production_checklists',
  'collaborations',
] as const;

export type UgcTableName = (typeof UGC_TABLES)[number];