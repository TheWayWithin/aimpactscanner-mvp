// CACHING INVESTIGATION TEST
// Testing AImpactScanner for potential caching issues with freecalchub.com
// Expected behavior: site with no meta description should score 0, not 70

// Use native fetch (available in Node 18+)

// Local Supabase configuration
const SUPABASE_URL = 'http://127.0.0.1:54321';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Test configuration
const TEST_URL = 'https://www.freecalchub.com';
const TEST_USER_ID = 'test-user-001';

async function testPageFetch() {
  console.log('=== DIRECT PAGE FETCH TEST ===');
  
  try {
    const response = await fetch(TEST_URL, {
      headers: {
        'User-Agent': 'AImpactScanner/1.0 (AI Search Optimization Analysis)'
      }
    });
    
    const html = await response.text();
    
    // Extract meta description using the same logic as the Edge Function
    let metaDescription = '';
    
    // Standard meta description
    let metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)/i);
    if (!metaMatch) {
      // Try reversed order
      metaMatch = html.match(/<meta[^>]*content=["']([^"']*)[^>]*name=["']description/i);
    }
    if (!metaMatch) {
      // Try Open Graph
      metaMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)/i);
    }
    
    metaDescription = metaMatch ? metaMatch[1].trim() : '';
    
    console.log('Direct fetch results:');
    console.log('- URL:', TEST_URL);
    console.log('- Status:', response.status);
    console.log('- Has meta description:', !!metaDescription);
    console.log('- Meta description:', metaDescription || 'NOT FOUND');
    console.log('- Expected meta score: 0 (no meta description)');
    
    // Calculate expected score based on analysis logic
    let expectedScore = 0;
    if (!metaDescription) {
      expectedScore = 0;
      console.log('- Analysis: No meta description = score should be 0');
    }
    
    return {
      hasMetaDescription: !!metaDescription,
      metaDescription: metaDescription,
      expectedScore: expectedScore
    };
    
  } catch (error) {
    console.error('Direct fetch failed:', error);
    return null;
  }
}

async function testEdgeFunctionAnalysis() {
  console.log('\n=== EDGE FUNCTION ANALYSIS TEST ===');
  
  try {
    // Create a test analysis record first
    const analysisId = `test-analysis-${Date.now()}`;
    
    console.log(`Creating analysis with ID: ${analysisId}`);
    
    // Call the Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-page`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({
        url: TEST_URL,
        userId: TEST_USER_ID,
        analysisId: analysisId
      })
    });
    
    console.log('Edge Function response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge Function error:', errorText);
      return null;
    }
    
    const result = await response.json();
    console.log('Edge Function result:', JSON.stringify(result, null, 2));
    
    // Look for meta description factor specifically
    const metaFactor = result.factors?.find(f => 
      f.factor_name === 'Meta Description' || 
      f.factor_id === 'AI.1.3' || 
      f.factor_id === 'M.2.2'
    );
    
    if (metaFactor) {
      console.log('\nMeta Description Factor Results:');
      console.log('- Factor ID:', metaFactor.factor_id);
      console.log('- Factor Name:', metaFactor.factor_name);
      console.log('- Score:', metaFactor.score);
      console.log('- Evidence:', metaFactor.evidence);
      console.log('- Recommendations:', metaFactor.recommendations);
      
      return {
        found: true,
        score: metaFactor.score,
        evidence: metaFactor.evidence,
        factor: metaFactor
      };
    } else {
      console.log('Meta Description factor not found in results');
      console.log('Available factors:', result.factors?.map(f => ({
        id: f.factor_id, 
        name: f.factor_name,
        score: f.score
      })));
      return { found: false };
    }
    
  } catch (error) {
    console.error('Edge Function test failed:', error);
    return null;
  }
}

async function runCachingInvestigation() {
  console.log('🔍 AIMPACTSCANNER CACHING INVESTIGATION');
  console.log('========================================');
  console.log('Testing URL:', TEST_URL);
  console.log('Issue: Always gets score of 70 even after changes');
  console.log('Hypothesis: Caching preventing fresh data fetch\n');
  
  // Test 1: Direct page fetch
  const directResult = await testPageFetch();
  
  // Test 2: Edge Function analysis
  const edgeResult = await testEdgeFunctionAnalysis();
  
  // Analysis and conclusions
  console.log('\n=== CACHING INVESTIGATION RESULTS ===');
  
  if (directResult && edgeResult) {
    console.log('\n📊 COMPARISON:');
    console.log('Direct fetch meta description:', directResult.metaDescription || 'NONE');
    console.log('Expected score based on direct fetch:', directResult.expectedScore);
    
    if (edgeResult.found) {
      console.log('Edge Function meta description score:', edgeResult.score);
      console.log('Evidence from Edge Function:', edgeResult.evidence);
      
      // Check for discrepancy
      if (directResult.expectedScore !== edgeResult.score) {
        console.log('\n🚨 CACHING ISSUE DETECTED!');
        console.log(`Expected score: ${directResult.expectedScore}`);
        console.log(`Actual score: ${edgeResult.score}`);
        console.log('This suggests the Edge Function is using cached/stale data');
        
        // Look for cache-related evidence
        if (edgeResult.evidence.some(e => e.includes('Meta description:'))) {
          console.log('\n🔍 CACHE EVIDENCE:');
          console.log('Edge Function found meta description, but direct fetch found none');
          console.log('This confirms caching is the issue');
        }
      } else {
        console.log('\n✅ NO CACHING ISSUE DETECTED');
        console.log('Direct fetch and Edge Function results match');
      }
    }
  }
  
  // Additional cache detection
  console.log('\n=== CACHE DETECTION RECOMMENDATIONS ===');
  console.log('1. Check fetch() headers in Edge Function for cache-control');
  console.log('2. Verify no response memoization in the analysis engine');
  console.log('3. Test with cache-busting parameters (e.g., ?t=' + Date.now() + ')');
  console.log('4. Check if CDN or proxy is caching responses');
  console.log('5. Verify HTTP cache headers are properly set to no-cache');
}

// Run the investigation
runCachingInvestigation().catch(console.error);