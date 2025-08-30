# AImpactScanner Comprehensive Playwright Test Plan

## Overview
This test plan covers recent feature implementations and comprehensive regression testing for AImpactScanner. The test suite is designed to ensure quality across all user-facing features while maintaining fast execution and reliable results.

## Test Coverage

### 🆕 RECENT FEATURES (High Priority)

#### 1. Messaging Clarity Updates
**File:** `messaging-clarity-tests.spec.js`
- ✅ **URL Input Placeholder**: "Enter a page URL to analyze..."
- ✅ **Helper Text**: "Analyze one page at a time - start with your homepage or most important page"
- ✅ **Results Header**: "Analysis Results for: [URL]"
- ✅ **FAQ Content**: Page vs website analysis explanation
- ✅ **User Guidance**: Clear process explanation and next steps

**Key Selectors:**
```javascript
// URL Input
'input#url'
'input[placeholder*="Enter a page URL to analyze"]'
'text*="Analyze one page at a time"'

// Results Header  
'text*="Analysis Results for:"'
'[data-testid="analysis-results"]'

// Example URLs
'button:has-text("github.com")'
'button:has-text("wikipedia.org")'
```

#### 2. LLMs.txt Integration
**File:** `llmstxt-integration-tests.spec.js`
- ✅ **Detection Logic**: Identifies presence/absence of LLMs.txt
- ✅ **Context-Aware Recommendations**: Different messaging for sites with/without LLMs.txt
- ✅ **llmtxtmastery.com Integration**: Proper referencing and linking
- ✅ **Scoring Integration**: LLMs.txt as scoring factor
- ✅ **User Education**: Clear explanation of LLMs.txt benefits

**Test URLs:**
```javascript
const TEST_URLS = {
  withLLMsTxt: 'anthropic.com',    // Has LLMs.txt
  withoutLLMsTxt: 'example.com',   // No LLMs.txt  
  llmtxtMastery: 'llmtxtmastery.com',
  testSite: 'github.com'
};
```

#### 3. Account Page Fixes
**File:** `account-fixes-tests.spec.js`
- ✅ **Manage Subscription Button**: Functional for paid tiers, hidden for free
- ✅ **Usage Tracking**: Accurate counts for all tiers
- ✅ **Billing Consolidation**: All billing info in one section
- ✅ **Status Indicators**: Clear tier badges and subscription status
- ✅ **Error Handling**: Graceful fallbacks for network issues

**Key Selectors:**
```javascript
// Account Navigation
'button:has-text("👤 Account")'

// Subscription Management
'button:has-text("Manage Subscription")'
'[data-testid="subscription-details"]'

// Usage Tracking
'[data-testid="usage-summary"]'
'text*="analyses remaining"'
'text*="Unlimited"'
```

### 🔄 REGRESSION TESTING

#### Authentication Flow
- Email/password registration and login
- Magic link authentication  
- Email verification states
- Session management
- Error handling

#### Analysis Workflow  
- URL input validation
- Analysis progress tracking
- Results display
- Factor scoring
- Performance within timeouts

#### Payment Integration
- Stripe checkout flow
- Tier upgrade process
- Subscription management
- Customer portal access
- Webhook handling

#### PDF Generation
- Report generation
- Download functionality
- Error states
- Status indicators

#### Tier Management
- Free tier limitations
- Usage tracking
- Upgrade flows
- Access controls

### 🌐 CROSS-BROWSER COMPATIBILITY

#### Supported Browsers
- **Chromium** (Chrome/Edge)
- **Firefox** 
- **WebKit** (Safari)

#### Responsive Design Testing
- **Mobile**: 375x667 (iPhone SE)
- **Tablet**: 768x1024 (iPad)  
- **Desktop**: 1920x1080

## Test Structure

### File Organization
```
tests/playwright/
├── comprehensive-test-suite.spec.js     # Main test suite
├── messaging-clarity-tests.spec.js      # Recent UI updates
├── llmstxt-integration-tests.spec.js    # LLMs.txt features  
├── account-fixes-tests.spec.js          # Account improvements
└── test-plan-documentation.md           # This file
```

### Test Configuration
```javascript
// Common configuration
const BASE_URL = process.env.BASE_URL || 'https://app.aimpactscanner.com';
const TEST_TIMEOUT = 30000; // 30 seconds for analysis completion
const TEST_EMAIL = `test_${Date.now()}@temp-mail.org`;
```

## Running the Tests

### Prerequisites
```bash
# Install Playwright
npm install @playwright/test

# Install browsers
npx playwright install
```

### Execution Commands
```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test messaging-clarity-tests

# Run with specific browser
npx playwright test --project=chromium

# Run in headed mode (see browser)
npx playwright test --headed

# Generate test report
npx playwright test --reporter=html
```

### Environment Setup
```bash
# Set base URL for testing
export BASE_URL=https://app.aimpactscanner.com

# For local testing
export BASE_URL=http://localhost:3000
```

## Test Categories by Priority

### 🟢 P0 - Critical (Must Pass)
- Authentication flow
- Analysis completion  
- Payment processing
- Core navigation

### 🟡 P1 - High (Should Pass)
- Recent messaging updates
- Account page functionality
- LLMs.txt integration
- PDF generation

### 🔵 P2 - Medium (Good to Pass)
- Cross-browser compatibility
- Responsive design
- Error handling
- Performance benchmarks

### ⚪ P3 - Low (Nice to Pass)
- Visual regression
- Accessibility compliance
- Edge case handling

## Expected Test Results

### Success Criteria
- **All P0 tests**: 100% pass rate
- **All P1 tests**: 95% pass rate  
- **Cross-browser**: 90% pass rate across all browsers
- **Performance**: Analysis completion within 30 seconds
- **Reliability**: Tests should be stable across multiple runs

### Common Failure Points
1. **Analysis Timeout**: Edge function exceeds 30s limit
2. **Authentication Issues**: Session management problems
3. **Network Dependencies**: External service failures
4. **Race Conditions**: Timing-dependent test failures
5. **Browser Differences**: WebKit-specific issues

## Maintenance Guidelines

### Adding New Tests
1. Follow existing naming patterns
2. Use data-testid attributes for reliable selectors
3. Include proper error handling
4. Add to appropriate priority category
5. Update documentation

### Selector Best Practices
```javascript
// Preferred: data-testid
page.locator('[data-testid="analysis-results"]')

// Acceptable: semantic text
page.locator('button:has-text("Start Analysis")')

// Avoid: fragile CSS selectors  
page.locator('.btn-primary.large') // Can break with styling changes
```

### Error Handling Pattern
```javascript
test('should handle feature gracefully', async ({ page }) => {
  try {
    await page.click('button:has-text("Feature")');
    // Test main functionality
  } catch (error) {
    // Check for graceful degradation
    const fallback = page.locator('[data-testid="fallback"]');
    await expect(fallback).toBeVisible();
  }
});
```

## Test Data Management

### Test URLs
- **Valid URLs**: example.com, github.com, anthropic.com
- **Invalid URLs**: invalid-url, not.a.valid.domain  
- **Edge Cases**: URLs with paths, protocols, subdomains

### Test Accounts
- **Free Tier**: Basic functionality testing
- **Coffee Tier**: Paid feature testing
- **Test Emails**: Temporary email services for registration

### Mock Data
```javascript
// Sample analysis results for testing
const MOCK_ANALYSIS = {
  overall_score: 67,
  url: 'example.com',
  factors: [...],
  created_at: new Date().toISOString()
};
```

## Reporting and Monitoring

### Test Reports
- **HTML Report**: Detailed results with screenshots
- **JUnit XML**: CI/CD integration
- **JSON**: Programmatic analysis
- **Console Output**: Quick feedback during development

### Failure Investigation
1. Check screenshot on failure
2. Review network requests
3. Verify element selectors
4. Check timing issues
5. Validate test environment

### Continuous Integration
```yaml
# Example CI configuration
- name: Run Playwright Tests
  run: |
    npm ci
    npx playwright install
    npx playwright test
    
- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Known Issues and Workarounds

### Database Timeout Issues
**Problem**: Supabase database queries timing out
**Workaround**: Tests include fallbacks for simplified components
**Status**: Under investigation

### Authentication in CI
**Problem**: Magic link flow difficult to test in automated environment
**Workaround**: Use email/password flow for testing
**Status**: Acceptable for current needs

### Analysis Timing Variability  
**Problem**: Analysis completion time varies (10-25 seconds)
**Workaround**: Extended timeout (30s) with progress checking
**Status**: Monitoring for improvements

## Future Enhancements

### Planned Additions
- Visual regression testing with screenshot comparison
- Accessibility testing with axe-playwright
- Performance monitoring with lighthouse
- API integration testing
- Mobile app testing (if applicable)

### Test Optimization
- Parallel execution optimization
- Test data setup/teardown automation
- Dynamic test environment provisioning
- Advanced mocking for external services

## Contact and Support

### Test Maintenance
- **Primary**: THE TESTER (automated QA)
- **Secondary**: Development team for selector updates
- **Emergency**: On-call developer for critical failures

### Documentation Updates
This test plan should be updated whenever:
- New features are added
- UI changes affect selectors  
- Test coverage requirements change
- New browsers/devices need support

---

*Last Updated: Generated with comprehensive analysis coverage*
*Version: 1.0*
*Coverage: Recent features + full regression testing*