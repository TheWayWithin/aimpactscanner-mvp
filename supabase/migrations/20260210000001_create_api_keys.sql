-- Migration: Create api_keys table for programmatic API access (Sprint 8)
-- Scale tier users can generate API keys for automated analysis

-- Create api_keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  is_active boolean NOT NULL DEFAULT true
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys (key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys (user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON public.api_keys (is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only manage their own keys
CREATE POLICY "Users can view their own API keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypass for backend operations (key lookup by hash)
CREATE POLICY "Service role has full access to api_keys"
  ON public.api_keys FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.api_keys IS 'API keys for programmatic access. Only SHA-256 hashes stored, never raw keys.';
