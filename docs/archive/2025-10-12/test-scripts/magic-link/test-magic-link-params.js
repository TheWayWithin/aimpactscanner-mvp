/**
 * Test Magic Link Parameter Detection
 * 
 * This tests our magic link detection logic by simulating different URL scenarios
 */

// Simulate our magic link detection function from App.jsx
function hasMagicLinkTokens(searchParams = '') {
  const urlParams = new URLSearchParams(searchParams);
  return urlParams.has('access_token') || 
         (urlParams.has('token') && urlParams.get('type') === 'magiclink') ||
         urlParams.has('confirmation_url');
}

// Simulate the query params parsing from supabaseFacade
function parseQueryParams(searchParams = '') {
  const params = {};
  
  if (!searchParams) return params;
  
  // Remove leading ? if present
  const search = searchParams.startsWith('?') ? searchParams.substring(1) : searchParams;
  
  search.split('&').forEach(param => {
    const [key, value] = param.split('=');
    if (key && value) {
      params[key] = decodeURIComponent(value);
    }
  });
  
  return params;
}

// Test different magic link URL scenarios
const testCases = [
  {
    name: 'Magic Link with access_token',
    url: '?access_token=abc123&refresh_token=def456&type=recovery',
    expectedDetection: true
  },
  {
    name: 'Magic Link with token and type',
    url: '?token=xyz789&type=magiclink&redirect_to=dashboard',
    expectedDetection: true
  },
  {
    name: 'Magic Link with confirmation_url',
    url: '?confirmation_url=true&user_id=12345',
    expectedDetection: true
  },
  {
    name: 'Regular OAuth (should not trigger magic link detection)',
    url: '#access_token=oauth123&refresh_token=refresh456',
    expectedDetection: false
  },
  {
    name: 'No auth tokens',
    url: '?page=dashboard&view=analysis',
    expectedDetection: false
  },
  {
    name: 'Empty URL',
    url: '',
    expectedDetection: false
  }
];

console.log('🧪 Testing Magic Link Parameter Detection\n');

let passed = 0;
let failed = 0;

testCases.forEach(testCase => {
  console.log(`📋 Test: ${testCase.name}`);
  console.log(`   URL: ${testCase.url}`);
  
  // Extract query parameters (magic links use query params, not hash)
  const searchParams = testCase.url.includes('?') ? testCase.url.split('?')[1] : '';
  
  // Test detection
  const detected = hasMagicLinkTokens('?' + searchParams);
  const params = parseQueryParams(searchParams);
  
  console.log(`   Parsed params: ${JSON.stringify(params)}`);
  console.log(`   Expected detection: ${testCase.expectedDetection}`);
  console.log(`   Actual detection: ${detected}`);
  
  if (detected === testCase.expectedDetection) {
    console.log('   ✅ PASSED\n');
    passed++;
  } else {
    console.log('   ❌ FAILED\n');
    failed++;
  }
});

console.log(`📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 All tests passed! Magic link detection is working correctly.');
} else {
  console.log('❌ Some tests failed. Please check the logic.');
}

// Test the specific magic link URL structure that Supabase uses
console.log('\n🔍 Testing realistic Supabase magic link URL:');
const realisticMagicLink = '?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9&refresh_token=KDz5-abc123&expires_in=3600&token_type=bearer&type=recovery';
const isDetected = hasMagicLinkTokens(realisticMagicLink);
const parsedParams = parseQueryParams(realisticMagicLink.substring(1));

console.log(`Magic link URL: ${realisticMagicLink}`);
console.log(`Parsed parameters: ${JSON.stringify(parsedParams, null, 2)}`);
console.log(`Detected as magic link: ${isDetected ? '✅' : '❌'}`);

export { hasMagicLinkTokens, parseQueryParams };