-- ROI Attribution Framework Tables
-- Stores user ROI configuration and monthly attribution calculations.

CREATE TABLE IF NOT EXISTS public.roi_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analytics_provider TEXT DEFAULT 'manual',
  analytics_property_id TEXT,
  avg_deal_value NUMERIC DEFAULT 100,
  conversion_rate NUMERIC DEFAULT 0.025,
  traffic_multiplier NUMERIC DEFAULT 15,
  subscription_cost NUMERIC DEFAULT 19.95,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.attribution_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  citations_count INTEGER DEFAULT 0,
  estimated_ai_traffic NUMERIC DEFAULT 0,
  estimated_conversions NUMERIC DEFAULT 0,
  estimated_revenue NUMERIC DEFAULT 0,
  confidence TEXT DEFAULT 'directional',
  methodology_note TEXT,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, period)
);

-- Row Level Security
ALTER TABLE public.roi_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribution_data ENABLE ROW LEVEL SECURITY;

-- Users can manage their own ROI config
CREATE POLICY "Users manage own roi config"
  ON public.roi_configs FOR ALL
  USING (auth.uid() = user_id);

-- Service role has full access to roi_configs
CREATE POLICY "Service role roi configs"
  ON public.roi_configs FOR ALL
  USING (auth.role() = 'service_role');

-- Users can view their own attribution data
CREATE POLICY "Users view own attribution"
  ON public.attribution_data FOR SELECT
  USING (auth.uid() = user_id);

-- Service role has full access to attribution_data
CREATE POLICY "Service role attribution"
  ON public.attribution_data FOR ALL
  USING (auth.role() = 'service_role');

-- Index for efficient lookups by user + period
CREATE INDEX idx_attribution_user_period
  ON public.attribution_data(user_id, period);
