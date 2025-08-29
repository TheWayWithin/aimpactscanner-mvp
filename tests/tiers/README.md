# Tier System Testing Suite

## Overview

Comprehensive Playwright testing environment for AImpactScanner tier system validation, featuring automated email verification, payment flow testing, and database state validation.

## 🎯 Test Coverage

### Tier Types Tested
- **FREE Tier**: Complete signup → email verification → dashboard access
- **COFFEE Tier**: Complete signup → email verification → payment processing → subscription activation
- **GROWTH Tier**: Coming soon validation → waitlist functionality
- **SCALE Tier**: Coming soon validation → enterprise contact functionality

### Testing Features
- **10minutemail.com Integration**: Automated temporary email generation and verification
- **Magic Link Processing**: Complete email verification flow automation
- **Payment Flow Testing**: Stripe checkout validation (test mode)
- **Database State Validation**: User tier assignment and subscription status verification
- **Cross-Browser Compatibility**: Chrome, Firefox, Safari, Edge testing
- **Responsive Design Testing**: Mobile, tablet, desktop viewport validation
- **Error Handling**: Invalid email, network timeout, payment failure scenarios

## 🚀 Quick Start

### Prerequisites
```bash
# Ensure Playwright is installed
npm install

# Install browsers (if needed)
npx playwright install
```

### Basic Usage
```bash
# Run complete tier test suite
npm run test:tier:all

# Test specific tier
npm run test:tier:free
npm run test:tier:coffee

# Quick validation (essential tests only)
npm run test:tier:quick

# Cross-browser testing
npm run test:tier:cross-browser

# Debug mode (headed browser)
npm run test:tier:debug
npm run test:tier:debug:coffee
```

## 📋 Available Commands

### Core Test Commands
```bash
npm run test:tier:all              # Complete tier system test suite
npm run test:tier:free             # Free tier signup flow
npm run test:tier:coffee           # Coffee tier with payment flow
npm run test:tier:growth           # Growth tier coming soon validation
npm run test:tier:scale            # Scale tier enterprise validation
```

### Advanced Testing
```bash
npm run test:tier:cross-browser    # Test across all browsers
npm run test:tier:performance      # Performance benchmarking
npm run test:tier:quick            # Quick validation tests
npm run test:tier:ui               # Interactive test runner
```

### Debug & Development
```bash
npm run test:tier:debug            # Debug mode (all tests)
npm run test:tier:debug:free       # Debug specific tier
npm run test:tier:report           # View test reports
```

## 🏗️ Test Architecture

### File Structure
```
tests/tiers/
├── tier-signup-flows.spec.js      # Main test suite
├── README.md                       # This file
└── test-results/                   # Generated reports

tests/setup/
├── tier-test-config.js             # Configuration and test data
└── temp-email-config.js            # Email service configuration

tests/utils/
├── tier-test-utils.js              # Advanced testing utilities
└── temp-email-utils.js             # Email automation utilities

tests/
└── run-tier-tests.js               # Test execution orchestrator
```

### Configuration Files

#### `tier-test-config.js`
- Tier definitions and expected behaviors
- Test data generation utilities
- Database validation queries
- Performance thresholds
- Browser and device configurations

#### `tier-test-utils.js`
- Complete signup flow automation
- Payment processing simulation
- Database state validation
- Performance metrics tracking
- Error handling and retry logic

## 📧 Email Testing Integration

### 10minutemail.com Integration
The test suite uses automated temporary email generation:

```javascript
// Automatic email generation
const tempEmail = await tempEmailUtils.generateTempEmail();

// Magic link retrieval
const magicLink = await tempEmailUtils.waitForMagicLink(120000);

// Complete authentication
const authSuccess = await tempEmailUtils.handleMagicLinkAuth(magicLink);
```

### Fallback Services
- temp-mail.org
- tempmail.lol 
- guerrillamail.com

## 💳 Payment Testing

### Stripe Test Mode
- Automated checkout page validation
- Test card processing simulation
- Subscription activation verification
- Payment failure scenario testing

### Test Card Numbers
```javascript
// Stripe test cards (configured in utilities)
const testCard = {
  number: '4242424242424242',
  expiry: '12/30',
  cvc: '123'
};
```

## 🗄️ Database Validation

### Automated Checks
- User record creation validation
- Tier assignment verification
- Subscription status confirmation
- Usage limit initialization
- Authentication token validation

### Validation Queries
```sql
-- User tier verification
SELECT id, email, tier, created_at FROM users WHERE email = $1;

-- Subscription status check
SELECT u.*, s.* FROM users u 
LEFT JOIN subscriptions s ON u.id = s.user_id 
WHERE u.email = $1;
```

## 🎨 Test Data & Scenarios

### Test User Patterns
```javascript
// Configured test patterns for each tier
FREE_USER: {
  namePrefix: 'free-test',
  expectedFlow: ['signup', 'email-verification', 'dashboard'],
  timeoutBehavior: 'graceful'
}

COFFEE_USER: {
  namePrefix: 'coffee-test', 
  expectedFlow: ['signup', 'email-verification', 'payment', 'subscription-active'],
  timeoutBehavior: 'retry'
}
```

### Error Scenarios
- Invalid email format validation
- Network timeout handling
- Payment processing failures
- Magic link expiration
- Database connection issues

## 📊 Reporting & Metrics

### Generated Reports
- **HTML Summary Report**: Complete test execution summary
- **Cross-Browser Report**: Browser compatibility results
- **Performance Metrics**: Timing and performance data
- **Playwright HTML Report**: Detailed test results with screenshots
- **JSON Results**: Machine-readable test data

### Performance Tracking
- Page load times
- Email delivery times
- Payment processing duration
- Database query performance
- Magic link processing time

## 🔧 Configuration

### Environment Variables
```bash
# Required for payment testing
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_COFFEE_PRICE_ID=price_test_...

# Database connection
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Test Configuration
```javascript
// Timeout settings (tier-test-config.js)
EMAIL_TIMEOUT: 120000,        // 2 minutes for email delivery
PAYMENT_TIMEOUT: 60000,       // 1 minute for payment processing
DB_TIMEOUT: 15000,            // 15 seconds for database operations
```

## 🚨 Troubleshooting

### Common Issues

#### Email Delivery Timeout
```bash
# Increase email timeout
export EMAIL_TIMEOUT=180000  # 3 minutes

# Or use fallback email service
npm run test:tier:debug:free  # Manual inspection
```

#### Payment Flow Issues
```bash
# Verify Stripe configuration
echo $VITE_STRIPE_PUBLISHABLE_KEY
echo $VITE_STRIPE_COFFEE_PRICE_ID

# Run payment-specific debug
npm run test:tier:debug:coffee
```

#### Database Connection Issues
```bash
# Check Supabase connection
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Validate database schema
npm run test:db
```

### Debug Mode Usage
```bash
# Run with headed browser for manual inspection
npm run test:tier:debug

# Step through specific tier
npm run test:tier:debug:coffee

# Use Playwright Inspector
# Browser will open with debug controls
# Use step-by-step execution for issue identification
```

## 📈 Performance Expectations

### Target Metrics
- **Page Load**: < 5 seconds
- **Email Delivery**: < 60 seconds
- **Payment Processing**: < 30 seconds
- **Database Queries**: < 5 seconds
- **Magic Link Processing**: < 10 seconds

### Concurrent User Testing
- Tests support 20+ concurrent users
- Memory usage monitoring
- Network request optimization validation
- Session management testing

## 🔄 Continuous Integration

### CI-Friendly Commands
```bash
# Non-interactive testing
npm run test:tier:all

# Quick validation for PR checks
npm run test:tier:quick

# Cross-browser for release validation
npm run test:tier:cross-browser
```

### Test Result Formats
- JSON for CI parsing
- JUnit XML for test reporting
- HTML reports for manual review
- Screenshots on failure
- Video recordings for debugging

## 🎯 Best Practices

### Test Development
1. **Always use temp email utilities** for realistic flows
2. **Include error handling** for all network operations
3. **Validate database state** after major operations
4. **Test responsive design** across viewports
5. **Include performance assertions** for critical paths

### Debugging Strategy
1. **Start with debug mode** for new test development
2. **Use Playwright Inspector** for step-by-step analysis
3. **Check browser console** for JavaScript errors
4. **Validate network requests** in DevTools
5. **Review generated screenshots** for visual issues

### Maintenance Guidelines
1. **Update email service selectors** if services change UI
2. **Validate Stripe test mode** configurations regularly
3. **Monitor tier configuration** alignment with product changes
4. **Review timeout values** based on performance data
5. **Update browser versions** for compatibility testing

## 🤝 Contributing

### Adding New Tests
```javascript
// Follow existing patterns in tier-signup-flows.spec.js
test('New Tier Feature - Description', async ({ page }) => {
  // Use TierTestUtils for consistent patterns
  const tierUtils = new TierTestUtils(page);
  
  // Include comprehensive error handling
  // Validate database state
  // Clean up resources
});
```

### Configuration Updates
- Update `TIER_DEFINITIONS` in `tier-test-config.js`
- Add new selectors to test configuration
- Update validation rules as needed
- Document changes in this README

---

## 📞 Support

For issues with tier testing:
1. **Check logs**: `./test-results/tier-tests/execution.log`
2. **Review reports**: `./test-results/tier-tests/summary-report.html`
3. **Run debug mode**: `npm run test:tier:debug`
4. **Validate environment**: Check all required environment variables

---

*Last updated: February 2025*