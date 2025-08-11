# Phase 2 Authentication & Pricing Testing Guide

This document provides comprehensive testing coverage for all Phase 2 functionality including email/password authentication, pricing displays, and registration flows.

## 🧪 Test Coverage Overview

### Authentication System Tests
- ✅ **Email/Password Authentication**: Login forms, validation, error handling
- ✅ **Password Strength Validation**: Real-time strength checking with visual indicators  
- ✅ **Registration Flow**: Complete signup with validation and confirmation
- ✅ **Password Reset Flow**: Forgot password and reset functionality
- ✅ **Session Persistence**: Remember me and session recovery
- ✅ **Error Handling**: Network errors, invalid credentials, rate limiting

### Pricing Display Tests
- ✅ **Three-Tier Display**: Free, Starter (Coffee), Professional tiers
- ✅ **Annual/Monthly Toggle**: Billing cycle switching with price updates
- ✅ **Currency Conversion**: USD, EUR, GBP currency selection
- ✅ **Professional Tier Highlighting**: Visual emphasis and "Most Popular" badge
- ✅ **Trust Signals**: Security badges, testimonials, guarantees
- ✅ **Mobile Responsiveness**: Layout adaptation across breakpoints
- ✅ **Limited Time Offers**: Countdown timer and promotional pricing

### Registration Flow Tests  
- ✅ **Free Tier Flow**: Direct registration without payment
- ✅ **Paid Tier Flow**: Pricing → Stripe → Registration sequence
- ✅ **Session Recovery**: Browser back/forward, refresh interruption handling
- ✅ **Payment Integration**: Stripe checkout simulation and return handling
- ✅ **Email Verification**: Different flows for paid vs free users
- ✅ **Error Recovery**: Payment failures, registration errors

### Integration Tests
- ✅ **Complete User Journeys**: End-to-end paid and free user experiences  
- ✅ **Authentication State**: Session management across page refreshes
- ✅ **Route Protection**: Authenticated route access control
- ✅ **Upgrade Flows**: Free to paid tier conversion

### Performance Tests
- ✅ **Page Load Times**: Pricing page and form loading performance
- ✅ **Form Responsiveness**: Real-time validation and interaction speed  
- ✅ **Error Display Timing**: Immediate feedback for user actions
- ✅ **Mobile Performance**: Touch interaction and viewport optimization

### Accessibility Tests
- ✅ **Keyboard Navigation**: Tab order and focus management
- ✅ **Form Labels**: Proper ARIA attributes and labeling
- ✅ **Color Contrast**: Visual accessibility compliance
- ✅ **Screen Reader Support**: Semantic HTML structure

## 🚀 Quick Start

### Prerequisites
```bash
# Ensure Playwright is installed
npm install @playwright/test

# Install Playwright browsers  
npx playwright install

# Start the development server
npm run dev
```

### Running Tests

#### Run All Phase 2 Tests
```bash
npm run test:phase2
```

#### Run Specific Test Categories
```bash
# Authentication tests only
npm run test:phase2:auth

# Pricing display tests only  
npm run test:phase2:pricing

# Registration flow tests only
npm run test:phase2:registration

# Mobile-specific tests
npm run test:phase2:mobile

# Performance tests only
npm run test:phase2:performance
```

#### Interactive Testing
```bash
# Run with UI for debugging
npm run test:phase2:ui

# Debug mode with browser DevTools
npm run test:phase2:debug

# Generate and view test report
npm run test:phase2:report
```

## 📋 Test Configuration

### Browser Coverage
- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: Chrome Mobile, Safari Mobile  
- **Cross-platform**: Windows, macOS, Linux

### Test Environment Variables
Located in `.env.test` - configure for your test environment:

```env
# Application URLs
VITE_BASE_URL=http://localhost:5173

# Test Supabase (use test project)
VITE_SUPABASE_URL=your-test-project-url
VITE_SUPABASE_ANON_KEY=your-test-anon-key

# Test Stripe (use test keys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
VITE_STRIPE_COFFEE_PRICE_ID=price_test_coffee

# Performance Thresholds
PERFORMANCE_THRESHOLD_PAGE_LOAD=5000
PERFORMANCE_THRESHOLD_FORM_SUBMIT=2000
```

### Global Setup
Tests automatically:
- ✅ Wait for development server startup
- ✅ Clear browser storage before tests
- ✅ Set up test environment variables  
- ✅ Clean up test data after completion

## 🧩 Test Architecture

### Core Test File
`tests/phase2-auth-pricing.spec.js` - Main test suite with:
- 200+ test cases covering all functionality
- Organized by feature area with descriptive test blocks
- Performance benchmarks and accessibility validation
- Mobile responsiveness and cross-browser compatibility

### Configuration Files
- `playwright.config.js` - Playwright configuration with multi-browser setup
- `tests/setup/global-setup.js` - Pre-test environment preparation  
- `tests/setup/global-teardown.js` - Post-test cleanup
- `tests/setup/test-helpers.js` - Reusable test utility functions

### Helper Functions
Available in `tests/setup/test-helpers.js`:

```javascript
import { AuthHelpers, PricingHelpers, ValidationHelpers } from './setup/test-helpers.js';

// Authentication helpers
await AuthHelpers.fillLoginForm(page, email, password);
await AuthHelpers.checkPasswordStrength(page, 'Strong');

// Pricing helpers  
await PricingHelpers.selectBillingCycle(page, 'annual');
await PricingHelpers.selectCurrency(page, 'EUR');

// Validation helpers
await ValidationHelpers.expectValidationMessage(page, 'Invalid email');
```

## 📊 Test Results & Reporting

### Test Reports
- **HTML Report**: Visual test results with screenshots and videos
- **JSON Report**: Structured results for CI/CD integration
- **Console Output**: Real-time test execution feedback

### Failure Analysis
Tests capture on failure:
- 📸 **Screenshots**: Visual state at failure point
- 🎥 **Videos**: Full interaction recording  
- 🔍 **Traces**: Detailed execution trace for debugging
- 📝 **Network Logs**: API calls and responses

### Viewing Reports
```bash
# Open HTML report in browser
npx playwright show-report

# View specific test results
npx playwright show-report test-results/playwright-report
```

## 🎯 Test Scenarios

### 1. Email/Password Authentication

#### Login Flow Tests
```javascript
test('should validate login credentials', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=Dashboard')).toBeVisible();
});
```

#### Password Strength Validation
```javascript
test('should show password strength indicators', async ({ page }) => {
  await page.goto('/register');
  await page.fill('input[placeholder*="Create a password"]', 'weak');
  
  await expect(page.locator('text=Weak')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeDisabled();
});
```

### 2. Pricing Display Components

#### Tier Selection Tests
```javascript  
test('should highlight professional tier', async ({ page }) => {
  await page.goto('/pricing');
  
  const professionalTier = page.locator('.scale-110').first();
  await expect(professionalTier.locator('text=MOST POPULAR')).toBeVisible();
});
```

#### Currency Conversion Tests
```javascript
test('should convert prices to selected currency', async ({ page }) => {
  await page.goto('/pricing');
  await page.selectOption('select', 'EUR');
  
  await expect(page.locator('text=€')).toBeVisible();
});
```

### 3. Registration Flow Tests

#### Free Tier Registration
```javascript
test('should complete free tier registration', async ({ page }) => {
  await page.goto('/register');
  await page.click('text=Start Free Trial');
  
  // Fill registration form
  await AuthHelpers.fillRegistrationForm(page, email, password);
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=Registration successful')).toBeVisible();
});
```

#### Paid Tier Registration  
```javascript
test('should handle paid tier registration flow', async ({ page }) => {
  await page.goto('/register');
  await page.click('text=Go Professional');
  
  await expect(page.locator('text=Confirm Your Selection')).toBeVisible();
  
  // Mock Stripe flow
  await RegistrationFlowHelpers.mockStripeCheckout(page);
  await page.click('text=Continue to Payment');
});
```

## 🚨 Error Testing

### Authentication Errors
- Invalid email format validation
- Weak password rejection  
- Rate limiting simulation
- Network connectivity issues
- Server error responses

### Payment Flow Errors
- Stripe API failures
- Payment cancellation handling
- Session expiration recovery
- Invalid payment method responses

### Form Validation Errors
- Required field validation
- Email format checking
- Password strength requirements
- Terms of service agreement

## 📱 Mobile Testing

### Responsive Design Validation
```javascript
test('should adapt layout for mobile viewports', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  
  // Tiers should stack vertically
  const tierGrid = page.locator('.grid');
  await expect(tierGrid).toHaveClass(/grid-cols-1/);
});
```

### Touch Interaction Testing
```javascript
test('should have touch-friendly button sizes', async ({ page }) => {
  await MobileHelpers.setMobileViewport(page);
  await MobileHelpers.verifyTouchTargets(page);
});
```

## ⚡ Performance Testing

### Page Load Performance
```javascript
test('should load pricing page quickly', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/pricing');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;
  
  expect(loadTime).toBeLessThan(5000);
});
```

### Form Interaction Performance
```javascript
test('should handle form submissions responsively', async ({ page }) => {
  const performanceMetrics = await PerformanceHelpers.measureFormResponsiveness(
    page, 
    [
      () => page.fill('input[type="email"]', email),
      () => page.fill('input[type="password"]', password),
      () => page.click('button[type="submit"]')
    ]
  );
  
  expect(performanceMetrics.totalTime).toBeLessThan(2000);
});
```

## 🔧 Debugging & Troubleshooting

### Common Issues

#### Test Server Not Starting
```bash
# Check if port 5173 is available
lsof -i :5173

# Start server manually
npm run dev

# Wait for server ready
curl http://localhost:5173
```

#### Playwright Browser Installation
```bash
# Install all browsers
npx playwright install

# Install specific browser
npx playwright install chromium
```

#### Environment Variable Issues
```bash
# Verify test environment
cat .env.test

# Check environment loading
node -e "require('dotenv').config({path: '.env.test'}); console.log(process.env.VITE_BASE_URL)"
```

### Debug Mode Testing
```bash
# Run single test in debug mode
npx playwright test --debug --grep "should validate login"

# Run with browser visible
npx playwright test --headed --grep "authentication"

# Generate trace for failed tests
npx playwright test --trace on
```

### Test Data Cleanup
```bash
# Clear test data manually
npm run test:setup

# Reset test database
npm run test:db:reset
```

## 📈 CI/CD Integration

### GitHub Actions Example
```yaml
name: Phase 2 Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run Phase 2 tests
        run: npm run test:phase2
        env:
          VITE_BASE_URL: http://localhost:5173
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: test-results/
```

### Test Metrics & Monitoring
- **Coverage**: Aim for >95% test coverage on critical authentication flows
- **Performance**: Track page load times and form interaction speeds  
- **Reliability**: Monitor test flakiness and failure rates
- **Cross-browser**: Ensure consistent behavior across all supported browsers

## 🎉 Success Criteria

Phase 2 testing is considered successful when:

- ✅ **100% Test Pass Rate**: All authentication and pricing tests pass
- ✅ **Cross-browser Compatibility**: Consistent behavior in Chrome, Firefox, Safari, Edge
- ✅ **Mobile Responsiveness**: Proper layout and interaction on mobile devices  
- ✅ **Performance Standards**: Page loads <5s, form interactions <2s
- ✅ **Accessibility Compliance**: Keyboard navigation and screen reader support
- ✅ **Error Recovery**: Graceful handling of network and validation errors

## 📞 Support & Maintenance

### Test Updates
When adding new Phase 2 features:
1. Add test cases to `phase2-auth-pricing.spec.js`
2. Update helper functions in `test-helpers.js`  
3. Extend performance benchmarks
4. Update this documentation

### Test Environment Maintenance
- Keep test data clean between runs
- Update browser versions regularly  
- Monitor and adjust performance thresholds
- Validate test environment configuration

For additional support or questions about Phase 2 testing, refer to the main project documentation or contact the development team.