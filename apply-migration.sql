-- Manual application of core analysis tables
-- New analysis tables
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Remove REFERENCES for now since auth.users might not exist
  url TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, analyzing, completed, failed
  overall_score INTEGER,
  ai_score INTEGER,
  authority_score INTEGER,
  machine_readability_score INTEGER,
  semantic_quality_score INTEGER,
  engagement_score INTEGER,
  topical_expertise_score INTEGER,
  reference_networks_score INTEGER,
  yield_optimization_score INTEGER,
  framework_version TEXT DEFAULT '3.1.1',
  analysis_duration INTEGER, -- seconds
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  page_title TEXT,
  page_description TEXT
);

CREATE TABLE IF NOT EXISTS analysis_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  factor_id TEXT NOT NULL, -- e.g., "M.5.1"
  factor_name TEXT NOT NULL,
  pillar TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  weight DECIMAL(4,2) NOT NULL,
  evidence JSONB,
  recommendations JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analysis_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  progress_percent INTEGER CHECK (progress_percent >= 0 AND progress_percent <= 100),
  message TEXT,
  educational_content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_factors_analysis_id ON analysis_factors(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_progress_analysis_id ON analysis_progress(analysis_id);