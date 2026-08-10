import type { DailyData, Profile } from './index';
import type {
  AnalyticsEntry, BoardCard, BrandDeal, Collaboration, ContentIdea, ContentPillar, Goal,
  HookItem, Invoice, KnowledgeItem, MediaKitProfile, ProductionChecklist, Script,
} from './ugc';

type DailyRow = Omit<DailyData, 'sync_pending'>;
type Row<T> = Omit<T, 'sync_pending'>;

/** Generated-style database contract used by the Neon Data API client. */
export interface Database {
  public: {
    Tables: {
      daily_data: {
        Row: DailyRow;
        Insert: Partial<Pick<DailyRow, 'id' | 'notes' | 'stickers' | 'platform_posts' | 'updated_at'>> & Pick<DailyRow, 'user_id' | 'date_key' | 'tasks'>;
        Update: Partial<DailyRow>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Pick<Profile, 'id'> & Partial<Omit<Profile, 'id'>>;
        Update: Partial<Omit<Profile, 'id'>>;
        Relationships: [];
      };
      content_ideas: {
        Row: Row<ContentIdea>;
        Insert: Partial<Row<ContentIdea>> & Pick<Row<ContentIdea>, 'title'>;
        Update: Partial<Row<ContentIdea>>;
        Relationships: [];
      };
      scripts: {
        Row: Row<Script>;
        Insert: Partial<Row<Script>> & Pick<Row<Script>, 'title' | 'content'>;
        Update: Partial<Row<Script>>;
        Relationships: [];
      };
      hook_library: {
        Row: Row<HookItem>;
        Insert: Partial<Row<HookItem>> & Pick<Row<HookItem>, 'content'>;
        Update: Partial<Row<HookItem>>;
        Relationships: [];
      };
      production_board: {
        Row: Row<BoardCard>;
        Insert: Partial<Row<BoardCard>> & Pick<Row<BoardCard>, 'title'>;
        Update: Partial<Row<BoardCard>>;
        Relationships: [];
      };
      brand_deals: {
        Row: Row<BrandDeal>;
        Insert: Partial<Row<BrandDeal>> & Pick<Row<BrandDeal>, 'brand_name'>;
        Update: Partial<Row<BrandDeal>>;
        Relationships: [];
      };
      invoices: {
        Row: Row<Invoice>;
        Insert: Partial<Row<Invoice>> & Pick<Row<Invoice>, 'invoice_number'>;
        Update: Partial<Row<Invoice>>;
        Relationships: [{ foreignKeyName: 'invoices_brand_deal_id_fkey'; columns: ['brand_deal_id']; referencedRelation: 'brand_deals'; referencedColumns: ['id'] }];
      };
      media_kit: {
        Row: Row<MediaKitProfile>;
        Insert: Partial<Row<MediaKitProfile>>;
        Update: Partial<Row<MediaKitProfile>>;
        Relationships: [];
      };
      knowledge_base: {
        Row: Row<KnowledgeItem>;
        Insert: Partial<Row<KnowledgeItem>> & Pick<Row<KnowledgeItem>, 'title'>;
        Update: Partial<Row<KnowledgeItem>>;
        Relationships: [];
      };
      analytics: {
        Row: Row<AnalyticsEntry>;
        Insert: Partial<Row<AnalyticsEntry>> & Pick<Row<AnalyticsEntry>, 'platform' | 'date'>;
        Update: Partial<Row<AnalyticsEntry>>;
        Relationships: [];
      };
      content_pillars: {
        Row: Row<ContentPillar>;
        Insert: Partial<Row<ContentPillar>> & Pick<Row<ContentPillar>, 'name'>;
        Update: Partial<Row<ContentPillar>>;
        Relationships: [];
      };
      goals: {
        Row: Row<Goal>;
        Insert: Partial<Row<Goal>> & Pick<Row<Goal>, 'type' | 'name'>;
        Update: Partial<Row<Goal>>;
        Relationships: [];
      };
      production_checklists: {
        Row: Row<ProductionChecklist>;
        Insert: Partial<Row<ProductionChecklist>> & Pick<Row<ProductionChecklist>, 'name'>;
        Update: Partial<Row<ProductionChecklist>>;
        Relationships: [];
      };
      collaborations: {
        Row: Row<Collaboration>;
        Insert: Partial<Row<Collaboration>> & Pick<Row<Collaboration>, 'partner_name'>;
        Update: Partial<Row<Collaboration>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}