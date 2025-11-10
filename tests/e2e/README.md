# E2E Testing Suite with Temporary Email Integration

## Overview

This comprehensive E2E testing suite validates the complete AImpactScanner user journey using temporary email addresses from 10minute.com and fallback services. The tests cover the full anonymous → authenticated flow without requiring permanent email accounts.

## Test Coverage

### 🎯 Complete User Journey Tests (`user-journey-with-temp-email.spec.js`)
- **Anonymous Analysis**: URL input, progress monitoring, preview results
- **Temporary Email Registration**: 10minute.com integration with fallbacks
- **Magic Link Authentication**: Email polling and link processing
- **Results Persistence**: Validation that analysis survives authentication
- **Session Management**: Cross-page navigation and refresh testing
- **Performance Benchmarks**: Timing validation for complete flow

### 🎁 Growth Tier 7-Day Trial Tests (`growth-trial-magic-link.spec.js`)
- **Trial Button Flow**: Click "Try Growth Free for 7 Days" and verify authContext storage
- **Parameter Preservation**: Verify isTrial and billingFrequency survive the flow
- **Magic Link Authentication**: Complete magic link flow with temporary email
- **Stripe $0.00 Checkout**: Verify trial shows "$0.00 due today" in Stripe
- **Webhook Processing**: Validate database updates after Stripe checkout
- **Tier Assignment**: Confirm user assigned "growth" tier with 40 analyses
- **Account Page Verification**: Validate account page displays trial status correctly
- **Bug Fix Validation**: Confirms fixes for AuthMethodSelector parameter stripping and JWT verification

### 📊 Usage Tracking Tests (`usage-tracking-flow.spec.js`)
- **Free Tier Progression**: 3→2→1→0 usage tracking validation
- **Monthly Reset Simulation**: Usage limit reset functionality
- **Coffee Tier Upgrade**: Complete payment flow testing (without actual payment)
- **Tier Benefits Display**: Pricing page and benefit comparison
- **Upgrade Cancellation**: Graceful cancellation handling

### 🚨 Error Handling Tests (`error-handling-edge-cases.spec.js`)
- **Invalid URL Validation**: 15+ invalid URL patterns testing
- **Email Validation**: 17+ invalid email patterns testing
- **Network Errors**: Offline mode and slow network simulation
- **Authentication Failures**: Expired/malformed magic links
- **Security Testing**: XSS prevention and CSRF protection
- **Performance Edge Cases**: Memory usage and concurrent operations
- **Browser Compatibility**: Cross-browser feature support

## Quick Start

### Run Individual Test Suites
```bash
# Complete user journey with temp email
npm run test:temp-email

# Growth tier 7-day trial flow (magic link)
npx playwright test tests/e2e/growth-trial-magic-link.spec.js

# Usage tracking and tier management
npm run test:usage-tracking

# Error handling and edge cases
npm run test:error-handling

# All E2E tests
npm run test:e2e:all
```

### Debug Mode
```bash
# Debug specific test with UI
npm run test:temp-email:debug

# Debug Growth trial test with headed browser
npx playwright test tests/e2e/growth-trial-magic-link.spec.js --headed --project=chromium

# Open Playwright UI for all E2E tests
npx playwright test tests/e2e/ --ui
```

### CI/CD Mode
```bash
# Run in CI mode with JSON output
npm run test:e2e:ci
```

## Email Service Integration

### Primary Service: 10minute.com
- **Advantages**: Reliable, fast email generation, good inbox UI
- **Features**: 10-minute email lifetime, no registration required
- **API**: Web scraping via Playwright page automation

### Fallback Services
1. **temp-mail.org**: Secondary option with different selectors
2. **tempmail.lol**: Tertiary fallback for reliability
3. **Mock Emails**: For CI environments when external services fail

### Email Flow Process
1. **Generation**: Create temporary email via service API
2. **Registration**: Submit email to AImpactScanner registration
3. **Polling**: Monitor inbox for magic link email (90s timeout)
4. **Extraction**: Parse magic link from email content
5. **Authentication**: Process magic link for app authentication
6. **Cleanup**: Close email pages and reset state

## Configuration

### Environment Variables
```bash
# Skip email tests (use mock auth)
SKIP_EMAIL_TESTS=true

# Use mock emails instead of real services
USE_MOCK_EMAILS=true

# Enable debug logging for email flow
DEBUG_EMAIL_TESTS=true

# CI mode optimizations
CI=true
```

### Performance Thresholds
- **Email Generation**: 15 seconds maximum
- **Magic Link Wait**: 90 seconds maximum  
- **Auth Processing**: 10 seconds maximum
- **Complete Flow**: 3 minutes total maximum

### Retry Logic
- **Email Generation**: 3 attempts with fallback services
- **Magic Link Polling**: 90 seconds with 2-second intervals
- **Authentication**: 3 retry attempts with delay
- **Service Fallback**: Automatic switch on primary service failure

## Test Architecture

### Utility Classes
- **TempEmailUtils**: Main email service integration class
- **Email Generation**: Service-agnostic email creation
- **Inbox Monitoring**: Real-time email polling with timeouts
- **Magic Link Extraction**: Multiple pattern matching for links
- **Authentication Handling**: Complete auth flow processing

### Helper Functions
```javascript
// Quick email generation
const email = await generateQuickTempEmail(page);

// Wait for magic link
const magicLink = await waitForMagicLinkSimple(page, email);

// Complete auth flow
const success = await completeEmailVerification();
```

### Test Structure
```
tests/e2e/
├── user-journey-with-temp-email.spec.js    # Main user flow
├── growth-trial-magic-link.spec.js         # Growth tier 7-day trial flow
├── usage-tracking-flow.spec.js             # Tier and usage tests
├── error-handling-edge-cases.spec.js       # Error scenarios
└── README.md                               # This documentation

tests/utils/
└── temp-email-utils.js                     # Email service utilities

tests/setup/
└── temp-email-config.js                    # Configuration constants
```

## Browser Support

### Tested Browsers
- **Chromium**: Primary development browser
- **Firefox**: Cross-browser compatibility
- **WebKit**: Safari compatibility testing
- **Mobile Chrome**: Responsive design validation
- **Mobile Safari**: iOS compatibility
- **Microsoft Edge**: Enterprise browser support

### Feature Detection
- **LocalStorage**: Session persistence testing
- **SessionStorage**: Temporary data handling
- **Modern JavaScript**: ES6+ feature support
- **Fetch API**: Network request compatibility
- **Async/Await**: Modern async pattern support

## CI/CD Integration

### GitHub Actions Support
```yaml
# Example workflow step
- name: Run E2E Tests with Temp Email
  run: npm run test:e2e:ci
  env:
    CI: true
    SKIP_EMAIL_TESTS: false
```

### Performance Optimization for CI
- **Reduced Timeouts**: 30% faster timeouts in CI
- **Limited Retries**: 2 retries max in CI vs 3 locally
- **Parallel Execution**: 2 workers in CI vs 4 locally  
- **Minimal Screenshots**: Capture only on failure in CI

### Artifact Collection
- **Test Results**: JSON reports in `test-results/e2e/`
- **Screenshots**: Failure screenshots with context
- **Videos**: Test execution recordings on failure
- **Traces**: Playwright traces for debugging

## Troubleshooting

### Common Issues

#### Email Service Unavailable
```bash
# Use mock emails
USE_MOCK_EMAILS=true npm run test:temp-email
```

#### Magic Link Timeout
- **Increase timeout**: Modify `TEMP_EMAIL_CONFIG.primary.timeout`
- **Check spam filtering**: Some services filter auth emails
- **Verify email service**: Ensure 10minute.com is accessible

#### Authentication Failures
- **Check magic link format**: Verify Supabase auth URL structure
- **Test network connectivity**: Ensure localhost:5174 is accessible  
- **Validate session storage**: Check browser support for auth tokens

#### Performance Issues
- **Reduce parallel workers**: Set `workers: 1` in playwright.config.js
- **Increase timeouts**: Multiply timeouts by 1.5x for slow systems
- **Skip heavy tests**: Use test.skip() for resource-intensive scenarios

### Debug Tools

#### Playwright Inspector
```bash
# Debug specific test with inspector
npx playwright test tests/e2e/user-journey-with-temp-email.spec.js --debug
```

#### Email Service Debug
```bash
# Enable email debug logging
DEBUG_EMAIL_TESTS=true npm run test:temp-email:debug
```

#### Network Debug
```bash
# Capture network traffic
npx playwright test --trace on tests/e2e/
```

## Best Practices

### Test Isolation
- **Fresh Email**: Generate new email for each test
- **Clean State**: Clear localStorage/sessionStorage between tests
- **Independent Tests**: No shared state between test cases
- **Resource Cleanup**: Always cleanup email pages and resources

### Reliability Patterns
- **Multiple Fallbacks**: 3 email services + mock fallback
- **Retry Logic**: Exponential backoff for temporary failures  
- **Timeout Handling**: Graceful degradation on service timeouts
- **Error Recovery**: Automatic fallback to alternative services

### Performance Optimization
- **Parallel Execution**: Run independent tests concurrently
- **Resource Pooling**: Reuse browser contexts when possible
- **Selective Testing**: Skip non-critical tests in rapid development
- **Smart Waiting**: Use specific element waits vs fixed timeouts

### Security Considerations
- **No Real Emails**: Never use permanent email addresses
- **Input Sanitization**: Test XSS and injection prevention
- **Authentication Security**: Validate magic link expiration
- **Data Privacy**: No personal information in test data

## Maintenance

### Service Updates
- **Monitor 10minute.com**: Watch for UI changes affecting selectors
- **Fallback Testing**: Regularly verify backup services work
- **Selector Updates**: Update CSS selectors when services change
- **Performance Monitoring**: Track email generation and auth times

### Test Updates
- **Feature Changes**: Update tests when app features change
- **New Edge Cases**: Add tests for newly discovered issues
- **Performance Tuning**: Adjust timeouts based on real performance
- **Documentation**: Keep README updated with test changes

---

## Example Test Execution

```bash
# Full test suite
npm run test:e2e:all

# Expected output:
# ✅ user-journey-with-temp-email.spec.js (6 tests, ~8 minutes)
# ✅ usage-tracking-flow.spec.js (5 tests, ~6 minutes)
# ✅ error-handling-edge-cases.spec.js (7 tests, ~5 minutes)
# 
# Total: 18 tests, ~19 minutes
# Coverage: Complete anonymous → authenticated user flow
# Email services: 10minute.com + 2 fallbacks + mock
# Browsers: Chromium, Firefox, WebKit, Mobile
```

This test suite provides comprehensive validation of the AImpactScanner user experience with real-world email authentication flows, ensuring reliability and quality before production deployment.