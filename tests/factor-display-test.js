// FACTOR DISPLAY VERIFICATION TEST
// Check if factor names are displaying properly (no "undefined")

async function testFactorDisplay() {
  console.log('🧪 FACTOR DISPLAY VERIFICATION TEST');
  console.log('==================================\n');
  
  const SUPABASE_URL = 'http://127.0.0.1:54321';
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  const TEST_URL = 'https://example.com';  // Simple test URL
  const TEST_USER_ID = 'test-user-factors';
  const analysisId = `factor-test-${Date.now()}`;
  
  try {
    console.log(`Running analysis for: ${TEST_URL}`);
    console.log(`Analysis ID: ${analysisId}\n`);
    
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
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Edge Function error:', errorText);
      return;
    }
    
    const result = await response.json();
    
    console.log('📊 FACTOR DISPLAY ANALYSIS');
    console.log('==========================\n');
    
    let issuesFound = 0;
    
    // Check each factor for display issues
    result.factors?.forEach((factor, index) => {
      const factorNum = index + 1;
      console.log(`Factor ${factorNum}:`);
      console.log(`  - ID: ${factor.factor_id || 'MISSING'}`);
      console.log(`  - Name: ${factor.factor_name || 'MISSING'}`);
      console.log(`  - Pillar: ${factor.pillar || 'MISSING'}`);
      console.log(`  - Score: ${factor.score ?? 'MISSING'}`);
      
      // Check for undefined/null/missing values
      if (!factor.factor_id || factor.factor_id === 'undefined') {
        console.log('  ❌ ISSUE: Factor ID is undefined/missing');
        issuesFound++;
      }
      
      if (!factor.factor_name || factor.factor_name === 'undefined') {
        console.log('  ❌ ISSUE: Factor name is undefined/missing');
        issuesFound++;
      }
      
      if (!factor.pillar || factor.pillar === 'undefined') {
        console.log('  ❌ ISSUE: Pillar is undefined/missing');
        issuesFound++;
      }
      
      if (factor.score === undefined || factor.score === null) {
        console.log('  ❌ ISSUE: Score is undefined/missing');
        issuesFound++;
      }
      
      if (factor.evidence && factor.evidence.some(e => e.includes('undefined'))) {
        console.log('  ❌ ISSUE: Evidence contains "undefined"');
        issuesFound++;
      }
      
      if (factor.recommendations && factor.recommendations.some(r => r.includes('undefined'))) {
        console.log('  ❌ ISSUE: Recommendations contain "undefined"');
        issuesFound++;
      }
      
      console.log('');
    });
    
    // Summary
    console.log('📋 FACTOR DISPLAY SUMMARY');
    console.log('=========================');
    console.log(`Total factors: ${result.factors?.length || 0}`);
    console.log(`Issues found: ${issuesFound}`);
    
    if (issuesFound === 0) {
      console.log('✅ SUCCESS: All factors display correctly');
      console.log('✅ No "undefined" values detected');
      console.log('✅ All factor names are properly defined');
    } else {
      console.log('❌ ISSUES DETECTED: Factor display problems found');
    }
    
    // Check pillar summary as well
    console.log('\n🏛️ PILLAR DISPLAY CHECK');
    console.log('=======================');
    
    if (result.pillars) {
      Object.entries(result.pillars).forEach(([key, pillar]) => {
        console.log(`${key}: ${pillar.name || 'MISSING NAME'} (Score: ${pillar.score ?? 'MISSING'})`);
        
        if (!pillar.name || pillar.name === 'undefined') {
          console.log(`  ❌ ISSUE: Pillar ${key} name is undefined/missing`);
          issuesFound++;
        }
      });
    }
    
    console.log('\n🎯 FINAL VERDICT');
    console.log('================');
    
    if (issuesFound === 0) {
      console.log('✅ ALL CLEAR: Factor and pillar names are displaying correctly');
      console.log('✅ The "undefined" factor name issue appears to be RESOLVED');
    } else {
      console.log('❌ PROBLEMS PERSIST: Found display issues that need attention');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFactorDisplay();