-- Citation Monitor Tables
-- Tracks AI platform citations of user domains

-- Monitor configs (one per user)
CREATE TABLE IF NOT EXISTS public.monitor_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  platforms TEXT[] NOT NULL DEFAULT ARRAY['chatgpt', 'perplexity', 'claude'],
  check_frequency TEXT NOT NULL DEFAULT 'daily',
  alert_on_new BOOLEAN DEFAULT true,
  alert_on_drop BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Citations (individual check results)
CREATE TABLE IF NOT EXISTS public.citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  platform TEXT NOT NULL,
  query TEXT NOT NULL,
  cited BOOLEAN NOT NULL DEFAULT false,
  position INTEGER,
  context_quote TEXT,
  sentiment TEXT DEFAULT 'neutral',
  accuracy_flag TEXT DEFAULT 'unverified',
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.monitor_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: monitor_configs
CREATE POLICY "Users manage own configs"
  ON public.monitor_configs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role configs"
  ON public.monitor_configs FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies: citations
CREATE POLICY "Users view own citations"
  ON public.citations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role citations"
  ON public.citations FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes for query performance
CREATE INDEX idx_citations_user_domain ON public.citations(user_id, domain);
CREATE INDEX idx_citations_checked_at ON public.citations(checked_at DESC);
CREATE INDEX idx_citations_platform ON public.citations(platform);
CREATE INDEX idx_monitor_configs_user ON public.monitor_configs(user_id);
