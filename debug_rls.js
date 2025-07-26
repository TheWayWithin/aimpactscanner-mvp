// Debug RLS issue - test factor retrieval directly
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pdmtvkcxnqysujnpcnyh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbXR2a2N4bnF5c3VqbnBjbnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODQ3MjAsImV4cCI6MjA2NjQ2MDcyMH0.EJmcxGQwsCsf4uGwNAz_D_DnJxGN2ZV3Doux_FyPtEg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugRLS() {
  console.log('🔍 Starting RLS debug...')
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('👤 Current user:', user?.id, authError)
  
  if (!user) {
    console.log('❌ No authenticated user found')
    return
  }
  
  // Get latest analysis for this user
  const { data: analyses, error: analysesError } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
  
  console.log('📊 Latest analysis:', analyses, analysesError)
  
  if (!analyses || analyses.length === 0) {
    console.log('❌ No analyses found for user')
    return
  }
  
  const analysisId = analyses[0].id
  console.log('🎯 Testing analysis_id:', analysisId)
  
  // Try to get factors for this analysis
  const { data: factors, error: factorsError } = await supabase
    .from('analysis_factors')
    .select('*')
    .eq('analysis_id', analysisId)
  
  console.log('🔍 Factors result:', factors, factorsError)
  
  // Also check if factors exist at all (might be RLS blocking)
  const { count: totalFactors, error: countError } = await supabase
    .from('analysis_factors')
    .select('*', { count: 'exact', head: true })
    .eq('analysis_id', analysisId)
  
  console.log('📈 Factor count:', totalFactors, countError)
}

debugRLS().catch(console.error)