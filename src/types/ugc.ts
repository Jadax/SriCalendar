/** Shared row shape for every offline-synced UGC table. */
export interface UgcRow {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  sync_pending?: 0 | 1;
}

export type IdeaStatus = 'idea' | 'scripted' | 'scheduled' | 'published' | 'discarded';
export type ScriptStatus = 'draft' | 'ready' | 'filming' | 'published';
export type BoardColumn = 'idea' | 'scripting' | 'preproduction' | 'filming' | 'editing' | 'review' | 'scheduled' | 'published' | 'repurposed';
export type DealStatus = 'cold' | 'contacted' | 'negotiating' | 'accepted' | 'delivered' | 'declined';
export type PaymentStatus = 'pending' | 'partial' | 'paid';
export type InvoiceStatus = 'draft' | 'sent' | 'overdue' | 'paid';

export interface ContentIdea extends UgcRow {
  title: string;
  description: string | null;
  platform: string | null;
  priority: string | null;
  effort_level: string | null;
  audience_promise: string | null;
  hook_idea: string | null;
  content_angle: string | null;
  inspiration_source: string | null;
  pillar: string | null;
  repurpose_plan: string | null;
  status: string;
  /** ICE scoring — Impact (1–5) × Confidence (1–5) ÷ Effort. */
  impact: number | null;
  confidence: number | null;
}

export interface Script extends UgcRow {
  title: string;
  content: string;
  niche: string | null;
  hook_template_used: string | null;
  platform_target: string | null;
  status: string;
  word_count: number;
  runtime_seconds: number;
  platform?: string;
  hook?: string;
  structure?: string;
  script_body?: string;
  caption?: string;
  tags?: string[];
  board_card_id?: string | null;
  source_idea_id?: string | null;
}

export interface HookItem extends UgcRow {
  type: string | null;
  content: string;
  niche: string | null;
  platform: string | null;
  performance_notes: string | null;
  status: string;
  times_used: number;
}

export interface BoardCard extends UgcRow {
  title: string;
  column_name: string;
  platform: string | null;
  priority: string | null;
  due_date: string | null;
  sponsor: string | null;
  video_type: string | null;
  subtasks: BoardSubtask[];
  status: string;
}

export interface BoardSubtask { id: string; text: string; done: boolean }

export interface BrandDeal extends UgcRow {
  brand_name: string;
  contact_name: string | null;
  contact_email: string | null;
  deal_value: number | null;
  estimated_probability: number;
  currency: string;
  deliverables: string | null;
  usage_rights: string | null;
  rights_period: string | null;
  deadline: string | null;
  pitch_date: string | null;
  follow_up_date: string | null;
  payment_status: string;
  status: string;
  platform: string | null;
  notes: string | null;
}

export interface InvoiceLineItem { id: string; description: string; quantity: number; rate: number }

export interface Invoice extends UgcRow {
  invoice_number: string;
  brand_deal_id: string | null;
  client_note: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  issue_date: string;
  due_date: string;
  line_items: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  /** Currency the client is billed in (defaults to USD). */
  currency: string;
  /** Income stream this invoice belongs to — powers the Income dashboard. */
  stream: string | null;
}

export interface RateCard { id: string; name: string; price: number; includes: string; negotiable: boolean }

export interface PastCollab { id: string; brand: string; format: string; year: string }

export interface MediaKitProfile extends UgcRow {
  display_name: string | null;
  tagline: string | null;
  bio: string | null;
  email: string | null;
  location: string | null;
  niche: string | null;
  audience_demographics: { age?: string; gender?: string; geo?: string; interests?: string };
  rates: RateCard[];
  past_collabs: PastCollab[];
  availability: string | null;
  form_factor: string | null;
  /** Currency used for the whole rate card (defaults to USD). */
  currency: string | null;
  social_instagram: string | null;
  social_tiktok: string | null;
  social_youtube: string | null;
  social_x: string | null;
}

export interface KnowledgeItem extends UgcRow {
  title: string;
  category: string | null;
  description: string | null;
  url: string | null;
  tags: string[];
  cost: number | null;
  /** Currency of the logged cost (defaults to USD). */
  currency: string | null;
  renewal_date: string | null;
  notes: string | null;
}

export interface AnalyticsEntry extends UgcRow {
  platform: string;
  date: string;
  followers: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagement_rate: number | null;
  reach: number;
  revenue: number;
  /** Currency of the logged revenue (defaults to USD). */
  currency: string | null;
  notes: string | null;
}

export interface ContentPillar extends UgcRow {
  name: string;
  description: string | null;
  target_audience: string | null;
  content_promise: string | null;
  offer_angle: string | null;
  example_topics: string[];
  goals: string | null;
  target_mix: number | null;
}

export interface Goal extends UgcRow {
  type: string;
  name: string;
  target: number | null;
  current_progress: number;
  status: string;
  deadline: string | null;
}

export interface ChecklistItem { id: string; text: string; checked: boolean }

export interface ProductionChecklist extends UgcRow {
  name: string;
  category: string | null;
  items: ChecklistItem[];
}

export interface Collaboration extends UgcRow {
  partner_name: string;
  contact_info: string | null;
  briefings: string | null;
  notes: string | null;
  status: string;
  deadline: string | null;
}

/** Union of every row type stored locally for offline-first access. */
export type AnyUgcRow = ContentIdea | Script | HookItem | BoardCard | BrandDeal | Invoice | MediaKitProfile | KnowledgeItem | AnalyticsEntry | ContentPillar | Goal | ProductionChecklist | Collaboration;