CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY DEFAULT auth.user_id(),
  username TEXT,
  avatar_url TEXT,
  settings JSONB NOT NULL DEFAULT '{"theme":"light", "view":"month", "soundEnabled":true}'::jsonb,
  streak_count INTEGER NOT NULL DEFAULT 0,
  last_visit DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT auth.user_id(),
  date_key DATE NOT NULL,
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT NOT NULL DEFAULT '',
  stickers TEXT[] NOT NULL DEFAULT '{}'::text[],
  platform_posts JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_data_user_date ON public.daily_data (user_id, date_key);
CREATE INDEX IF NOT EXISTS idx_daily_data_user_id ON public.daily_data (user_id);

ALTER TABLE public.daily_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own daily_data" ON public.daily_data;
DROP POLICY IF EXISTS "Users can insert own daily_data" ON public.daily_data;
DROP POLICY IF EXISTS "Users can update own daily_data" ON public.daily_data;
DROP POLICY IF EXISTS "Users can delete own daily_data" ON public.daily_data;
CREATE POLICY "Users can read own daily_data" ON public.daily_data FOR SELECT TO authenticated USING ((SELECT auth.user_id()) = user_id);
CREATE POLICY "Users can insert own daily_data" ON public.daily_data FOR INSERT TO authenticated WITH CHECK ((SELECT auth.user_id()) = user_id);
CREATE POLICY "Users can update own daily_data" ON public.daily_data FOR UPDATE TO authenticated USING ((SELECT auth.user_id()) = user_id) WITH CHECK ((SELECT auth.user_id()) = user_id);
CREATE POLICY "Users can delete own daily_data" ON public.daily_data FOR DELETE TO authenticated USING ((SELECT auth.user_id()) = user_id);

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING ((SELECT auth.user_id()) = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((SELECT auth.user_id()) = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((SELECT auth.user_id()) = id) WITH CHECK ((SELECT auth.user_id()) = id);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.daily_data TO authenticated;
