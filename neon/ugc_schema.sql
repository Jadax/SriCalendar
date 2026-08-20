-- SriCalendar UGC Suite
-- Run this after neon/schema.sql in the Neon SQL Editor.
-- Follows the existing Neon conventions: TEXT user_id, auth.user_id() defaults, RLS to authenticated.

-- ---------------------------------------------------------------------------
-- PILLAR 2: Studio
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT auth.user_id(),
  title TEXT NOT NULL,
  description TEXT,
  platform TEXT,
  priority TEXT,
  effort_level TEXT,
  audience_promise TEXT,
  hook_idea TEXT,
  content_angle TEXT,
  inspiration_source TEXT,
  pillar TEXT,
  repurpose_plan TEXT,
  impact INTEGER,
  confidence INTEGER,
  status TEXT NOT NULL DEFAULT 'idea',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safe upgrade for projects that ran an earlier version of this schema.
ALTER TABLE public.content_ideas ADD COLUMN IF NOT EXISTS impact INTEGER;
ALTER TABLE public.content_ideas ADD COLUMN IF NOT EXISTS confidence INTEGER;

CREATE TABLE IF NOT EXISTS public.scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT auth.user_id(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  niche TEXT,
  hook_template_used TEXT,
  platform_target TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  word_count INTEGER NOT NULL DEFAULT 0,
  runtime_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hook_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT auth.user_id(),
  type TEXT,
  content TEXT NOT NULL,
  niche TEXT,
  platform TEXT,
  performance_notes TEXT,
  status TEXT NOT NULL DEFAULT 'untested',
  times_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.production_board (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT auth.user_id(),
  title TEXT NOT NULL,
  column_name TEXT NOT NULL DEFAULT 'idea',
  platform TEXT,
  priority TEXT,
  due_date DATE,
  sponsor TEXT,
  video_type TEXT,
  subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'idea',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- PILLAR 3: Business
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brand_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT auth.user_id(),
  brand_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  deal_value DECIMAL(10,2),
  estimated_probability DECIMAL(5,2) NOT NULL DEFAULT 100,
  currency TEXT NOT NULL DEFAULT 'USD',
  deliverables TEXT,
  usage_rights TEXT,
  rights_period TEXT,
  deadline DATE,
  pitch_date DATE,
  follow_up_date DATE,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'active',
  platform TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT auth.user_id(),
  invoice_number TEXT NOT NULL,
  brand_deal_id UUID REFERENCES public.brand_deals(id) ON DELETE SET NULL,
  client_note TEXT,
  recipient_name TEXT,
  recipient_email TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + 30),
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  stream TEXT NOT NULL DEFAULT 'brand-deal',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS stream TEXT NOT NULL DEFAULT 'brand-deal';

CREATE TABLE IF NOT EXISTS public.media_kit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT auth.user_id(),
  display_name TEXT,
  tagline TEXT,
  bio TEXT,
  email TEXT,
  location TEXT,
  niche TEXT,
  audience_demographics JSONB NOT NULL DEFAULT '{}'::jsonb,
  rates JSONB NOT NULL DEFAULT '[]'::jsonb,
  past_collabs JSONB NOT NULL DEFAULT '[]'::jsonb,
  availability TEXT,
  form_factor TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  social_instagram TEXT,
  social_tiktok TEXT,
  social_youtube TEXT,
  social_x TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.media_kit ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE public.media_kit ADD COLUMN IF NOT EXISTS social_instagram TEXT;
ALTER TABLE public.media_kit ADD COLUMN IF NOT EXISTS social_tiktok TEXT;
ALTER TABLE public.media_kit ADD COLUMN IF NOT EXISTS social_youtube TEXT;
ALTER TABLE public.media_kit ADD COLUMN IF NOT EXISTS social_x TEXT;

-- ---------------------------------------------------------------------------
-- PILLAR 4: Knowledge
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT auth.user_id(),
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  cost DECIMAL(10,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  renewal_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT auth.user_id(),
  platform TEXT NOT NULL,
  date DATE NOT NULL,
  followers INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  reach INTEGER NOT NULL DEFAULT 0,
  revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, platform, date)
);

ALTER TABLE public.analytics ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

CREATE TABLE IF NOT EXISTS public.content_pillars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT auth.user_id(),
  name TEXT NOT NULL,
  description TEXT,
  target_audience TEXT,
  content_promise TEXT,
  offer_angle TEXT,
  example_topics TEXT[] NOT NULL DEFAULT '{}'::text[],
  goals TEXT,
  target_mix DECIMAL(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT auth.user_id(),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  target DECIMAL(12,2),
  current_progress DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.production_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT auth.user_id(),
  name TEXT NOT NULL,
  category TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT auth.user_id(),
  partner_name TEXT NOT NULL,
  contact_info TEXT,
  briefings TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_content_ideas_user ON public.content_ideas (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_scripts_user ON public.scripts (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_hook_library_user ON public.hook_library (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_board_user ON public.production_board (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_brand_deals_user ON public.brand_deals (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.invoices (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_user ON public.knowledge_base (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user_date ON public.analytics (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_content_pillars_user ON public.content_pillars (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_checklists_user ON public.production_checklists (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_collaborations_user ON public.collaborations (user_id, updated_at DESC);

-- ---------------------------------------------------------------------------
-- Row Level Security for all new tables
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  tbl TEXT;
  new_tables TEXT[] := ARRAY[
    'content_ideas','scripts','hook_library','production_board',
    'brand_deals','invoices','media_kit',
    'knowledge_base','analytics','content_pillars','goals','production_checklists','collaborations'
  ];
BEGIN
  FOREACH tbl IN ARRAY new_tables
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can read own %I" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can insert own %I" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can update own %I" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can read own %I" ON public.%I FOR SELECT TO authenticated USING ((SELECT auth.user_id()) = user_id)', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can insert own %I" ON public.%I FOR INSERT TO authenticated WITH CHECK ((SELECT auth.user_id()) = user_id)', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can update own %I" ON public.%I FOR UPDATE TO authenticated USING ((SELECT auth.user_id()) = user_id) WITH CHECK ((SELECT auth.user_id()) = user_id)', tbl, tbl);
    EXECUTE format('CREATE POLICY "Users can delete own %I" ON public.%I FOR DELETE TO authenticated USING ((SELECT auth.user_id()) = user_id)', tbl, tbl);
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.content_ideas, public.scripts, public.hook_library, public.production_board,
  public.brand_deals, public.invoices, public.media_kit,
  public.knowledge_base, public.analytics, public.content_pillars, public.goals,
  public.production_checklists, public.collaborations
TO authenticated;
