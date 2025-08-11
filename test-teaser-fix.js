import { chromium } from 'playwright';

async function testTeaserResultsFix() {
  console.log('🚀 Starting TeaserResults Critical Bug Fix Test');
  console.log('==================================================');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable console logging to capture debug output
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);
    console.log(`📝 Console: ${text}`);
  });

  try {
    // Test 1: Load the application
    console.log('\n📊 Test 1: Loading Application');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    console.log('✅ Application loaded successfully');

    // Test 2: Navigate to free tier analysis
    console.log('\n📊 Test 2: Starting Free Tier Analysis');
    
    // Look for teaser analysis or free analysis button
    const teaserButton = page.locator('button:has-text("Start Free Analysis")').first();
    const analyzeButton = page.locator('button:has-text("Analyze")').first();
    
    let targetButton;
    if (await teaserButton.isVisible()) {
      targetButton = teaserButton;
      console.log('Found "Start Free Analysis" button');
    } else if (await analyzeButton.isVisible()) {
      targetButton = analyzeButton;
      console.log('Found "Analyze" button');
    } else {
      console.log('⚠️ No analysis button found, checking page content...');
      const pageContent = await page.content();
      console.log('Page title:', await page.title());
      
      // Check if we need authentication first
      const authElements = await page.locator('input[type="email"]').count();
      if (authElements > 0) {
        console.log('🔐 Authentication required, testing with auth flow...');
        await page.fill('input[type="email"]', 'test@example.com');
        await page.click('button:has-text("Continue")');
        await page.waitForTimeout(2000);
      }
    }

    // Test 3: Enter URL and start analysis
    console.log('\n📊 Test 3: Entering URL and Starting Analysis');
    
    const urlInput = page.locator('input[placeholder*="Enter"]').first();
    if (await urlInput.isVisible()) {
      await urlInput.fill('https://example.com');
      console.log('✅ URL entered: https://example.com');
    }

    if (targetButton && await targetButton.isVisible()) {
      await targetButton.click();
      console.log('✅ Analysis started');
    } else {
      // Try finding any analysis trigger
      const possibleButtons = await page.locator('button').all();
      for (const btn of possibleButtons) {
        const text = await btn.textContent();
        if (text && (text.includes('Analyz') || text.includes('Start') || text.includes('Continue'))) {
          console.log(`Found potential button: "${text}"`);
          await btn.click();
          break;
        }
      }
    }

    // Test 4: Monitor progress simulation
    console.log('\n📊 Test 4: Monitoring Progress Simulation');
    
    let progressStarted = false;
    let progressCompleted = false;
    let resultsShown = false;
    
    // Wait up to 20 seconds for progress to start and complete
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(1000);
      
      // Check for progress indicators
      const progressText = await page.locator('text=/\\d+%/').first().textContent().catch(() => null);
      const loadingSpinner = await page.locator('.animate-spin').count();
      
      if (progressText && !progressStarted) {
        console.log('✅ Progress simulation started');
        progressStarted = true;
      }
      
      if (progressText && progressText.includes('100%') && !progressCompleted) {
        console.log('✅ Progress reached 100%');
        progressCompleted = true;
      }
      
      // Check for results elements
      const scoreElement = await page.locator('text=/\\d+\/100/').count();
      const trafficLoss = await page.locator('text=/\\$[\\d,]+/').count();
      const criticalIssues = await page.locator('text=/Critical/i').count();
      
      if ((scoreElement > 0 || trafficLoss > 0 || criticalIssues > 0) && !resultsShown) {
        console.log('✅ Results elements detected');
        resultsShown = true;
        break;
      }
      
      console.log(`⏳ Waiting... (${i + 1}/20s) - Progress: ${progressText || 'N/A'}, Spinners: ${loadingSpinner}`);
    }

    // Test 5: Verify critical elements are visible
    console.log('\n📊 Test 5: Verifying Critical Elements');
    
    const testResults = {
      progressStarted,
      progressCompleted,
      resultsShown,
      scoreVisible: false,
      trafficLossVisible: false,
      criticalIssuesVisible: false,
      consoleDebugging: false
    };

    // Check for score display (42/100 or similar)
    const scoreElements = await page.locator('text=/\\d+\/100/').all();
    for (const elem of scoreElements) {
      const text = await elem.textContent();
      if (text && text.match(/\d+\/100/)) {
        console.log(`✅ Score visible: ${text}`);
        testResults.scoreVisible = true;
        break;
      }
    }

    // Check for traffic loss ($3,750 or similar)
    const trafficElements = await page.locator('text=/\\$[\\d,]+/').all();
    for (const elem of trafficElements) {
      const text = await elem.textContent();
      if (text && text.includes('$') && text.match(/[\d,]+/)) {
        console.log(`✅ Traffic loss visible: ${text}`);
        testResults.trafficLossVisible = true;
        break;
      }
    }

    // Check for critical issues section
    const criticalElements = await page.locator('text=/Critical/i').all();
    if (criticalElements.length > 0) {
      console.log(`✅ Critical issues section visible (${criticalElements.length} elements)`);
      testResults.criticalIssuesVisible = true;
    }

    // Test 6: Verify console debugging output
    console.log('\n📊 Test 6: Checking Console Debug Output');
    
    const expectedMessages = [
      'TeaserResults: Starting analysis simulation',
      'TeaserResults: Reached 100% progress',
      'TeaserResults: Showing final results'
    ];

    for (const expectedMsg of expectedMessages) {
      const found = consoleMessages.some(msg => msg.includes(expectedMsg));
      if (found) {
        console.log(`✅ Found debug message: ${expectedMsg}`);
        testResults.consoleDebugging = true;
      } else {
        console.log(`⚠️ Missing debug message: ${expectedMsg}`);
      }
    }

    // Test 7: Test 15-second fallback
    console.log('\n📊 Test 7: Testing 15-Second Fallback (if applicable)');
    
    // If results aren't showing yet, wait for fallback
    if (!resultsShown) {
      console.log('⏳ Waiting for 15-second fallback mechanism...');
      await page.waitForTimeout(5000); // Wait additional 5 seconds
      
      const fallbackResults = await page.locator('text=/\\d+\/100/').count() > 0;
      if (fallbackResults) {
        console.log('✅ Fallback mechanism worked');
        testResults.resultsShown = true;
      }
    }

    // Final Results
    console.log('\n🎯 TEST RESULTS SUMMARY');
    console.log('========================');
    console.log(`Progress Started: ${testResults.progressStarted ? '✅' : '❌'}`);
    console.log(`Progress Completed: ${testResults.progressCompleted ? '✅' : '❌'}`);
    console.log(`Results Shown: ${testResults.resultsShown ? '✅' : '❌'}`);
    console.log(`Score Visible: ${testResults.scoreVisible ? '✅' : '❌'}`);
    console.log(`Traffic Loss Visible: ${testResults.trafficLossVisible ? '✅' : '❌'}`);
    console.log(`Critical Issues Visible: ${testResults.criticalIssuesVisible ? '✅' : '❌'}`);
    console.log(`Console Debugging: ${testResults.consoleDebugging ? '✅' : '❌'}`);

    const criticalBugFixed = testResults.progressStarted && testResults.resultsShown && 
                            (testResults.scoreVisible || testResults.trafficLossVisible);

    console.log('\n🚨 CRITICAL BUG STATUS');
    console.log('======================');
    if (criticalBugFixed) {
      console.log('✅ CRITICAL BUG FIXED - Revenue flow can be restored');
      console.log('✅ TeaserResults component is working correctly');
      console.log('✅ Users can see analysis results');
    } else {
      console.log('❌ CRITICAL BUG NOT FIXED - Revenue flow still blocked');
      console.log('❌ Users cannot see analysis results');
      console.log('🔧 Further investigation required');
    }

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'teaser-results-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved: teaser-results-test.png');

    return {
      success: criticalBugFixed,
      details: testResults,
      consoleMessages
    };

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page.screenshot({ path: 'teaser-results-error.png', fullPage: true });
    return {
      success: false,
      error: error.message,
      consoleMessages
    };
  } finally {
    await browser.close();
  }
}

// Run the test
testTeaserResultsFix()
  .then(result => {
    console.log('\n🏁 Test completed');
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });

export { testTeaserResultsFix };