-- Competitive comparisons table
CREATE TABLE IF NOT EXISTS public.comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_url TEXT NOT NULL,
  competitor_url TEXT NOT NULL,
  user_score INTEGER,
  competitor_score INTEGER,
  score_delta INTEGER,
  factor_deltas JSONB DEFAULT '[]',
  pillar_deltas JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own comparisons" ON public.comparisons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access comparisons" ON public.comparisons
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_comparisons_user_id ON public.comparisons(user_id);
CREATE INDEX idx_comparisons_created_at ON public.comparisons(created_at DESC);
