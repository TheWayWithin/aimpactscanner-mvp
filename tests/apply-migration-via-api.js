// APPLY MIGRATION VIA SUPABASE API
// Manually create the required tables

async function applyMigration() {
  console.log('🔧 APPLYING DATABASE MIGRATION VIA API');
  console.log('=====================================\n');
  
  const SUPABASE_URL = 'http://127.0.0.1:54321';
  const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  
  const migrationSQL = `
-- Manual application of core analysis tables
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
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
  analysis_duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  page_title TEXT,
  page_description TEXT
);

CREATE TABLE IF NOT EXISTS analysis_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  factor_id TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_factors_analysis_id ON analysis_factors(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_progress_analysis_id ON analysis_progress(analysis_id);
`;
  
  try {
    console.log('Executing migration SQL...');
    
    // Execute the SQL via REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: migrationSQL
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Migration applied successfully');
      console.log('Result:', result);
    } else {
      const error = await response.text();
      console.log('❌ Migration failed via RPC, trying alternative...');
      console.log('Error:', error);
      
      // Try alternative approach - use a custom Edge Function
      const altResponse = await fetch(`${SUPABASE_URL}/functions/v1/setup-tables`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'create_tables' })
      });
      
      if (altResponse.ok) {
        const altResult = await altResponse.json();
        console.log('✅ Tables created via Edge Function');
        console.log('Result:', altResult);
      } else {
        const altError = await altResponse.text();
        console.log('❌ Edge Function approach also failed');
        console.log('Error:', altError);
      }
    }
    
    // Verify tables were created
    console.log('\n🔍 VERIFYING TABLE CREATION');
    console.log('==========================');
    
    const tables = ['analyses', 'analysis_factors', 'analysis_progress'];
    
    for (const table of tables) {
      const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'apikey': SERVICE_ROLE_KEY
        }
      });
      
      if (checkResponse.ok) {
        console.log(`✅ Table '${table}' exists and is accessible`);
      } else {
        const error = await checkResponse.json();
        console.log(`❌ Table '${table}' not accessible:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Migration process failed:', error);
  }
}

// Run the migration
applyMigration();