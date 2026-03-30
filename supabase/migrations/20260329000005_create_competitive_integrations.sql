-- Competitive Citation Intelligence & Integration Framework
-- Migration: 20260329000005
-- Creates tables for competitor tracking, competitor citations, and Slack integration

-- Competitor configs (one per user, up to 5 domains)
CREATE TABLE IF NOT EXISTS public.competitor_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competitor_domains TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Competitor citations (separate from user citations)
CREATE TABLE IF NOT EXISTS public.competitor_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,
  platform TEXT NOT NULL,
  query TEXT NOT NULL,
  cited BOOLEAN NOT NULL DEFAULT false,
  context_quote TEXT,
  sentiment TEXT DEFAULT 'neutral',
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Slack integration configs
CREATE TABLE IF NOT EXISTS public.slack_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS policies
ALTER TABLE public.competitor_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slack_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own competitor config"
  ON public.competitor_configs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role competitor configs"
  ON public.competitor_configs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users view own competitor citations"
  ON public.competitor_citations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role competitor citations"
  ON public.competitor_citations FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users manage own slack config"
  ON public.slack_configs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role slack configs"
  ON public.slack_configs FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes for query performance
CREATE INDEX idx_competitor_citations_user ON public.competitor_citations(user_id);
CREATE INDEX idx_competitor_citations_domain ON public.competitor_citations(competitor_domain);
CREATE INDEX idx_competitor_citations_cited ON public.competitor_citations(user_id, cited);
CREATE INDEX idx_competitor_configs_user ON public.competitor_configs(user_id);
CREATE INDEX idx_slack_configs_user ON public.slack_configs(user_id);
