# User Acceptance Testing (UAT) Suite

Comprehensive UAT testing for AImpactScanner MVP to ensure production readiness.

## Overview

This UAT suite validates all critical user journeys, tier-specific features, and cross-platform compatibility for AImpactScanner. It ensures the application is fully tested and ready for production deployment.

## Quick Start

```bash
# Setup test users and environment
npm run test:uat:setup

# Run all UAT tests
npm run test:uat

# View test report
npm run test:uat:report
```

## Test Coverage

### User Journeys
- **Anonymous Users**: Landing page navigation, pricing exploration, sign-up decisions
- **Free Tier**: Registration with temp email, single analysis, upgrade prompts
- **Paid Tiers**: Stripe checkout, tier-specific features, usage limits
- **Authentication**: OAuth (Google/GitHub), magic links, session management
- **Analysis Engine**: MASTERY-AI validation, performance benchmarks, PDF export
- **Payments**: Subscription management, upgrades/downgrades, failure handling
- **Edge Cases**: Database timeouts, invalid URLs, rate limiting, network issues

### Cross-Platform Testing
- Chrome/Chromium
- Firefox
- Safari/WebKit
- Microsoft Edge
- Mobile (iOS/Android)

## Test Commands

### Full Suite
```bash
npm run test:uat           # Run all UAT tests
npm run test:uat:setup      # Setup test users
npm run test:uat:cleanup    # Clean up test data
npm run uat                 # Setup + Run tests
```

### Category-Specific Tests
```bash
npm run test:uat:anonymous  # Anonymous user flows
npm run test:uat:free       # Free tier testing
npm run test:uat:paid       # Paid tier testing
npm run test:uat:auth       # Authentication flows
npm run test:uat:analysis   # Analysis engine tests
npm run test:uat:payment    # Payment & subscriptions
npm run test:uat:edge       # Edge cases & errors
npm run test:uat:browser    # Cross-browser tests
npm run test:uat:mobile     # Mobile responsive tests
```

### Debug & Development
```bash
npm run test:uat:debug      # Run in headed mode with debugging
npm run test:uat:report     # View HTML test report
```

### CI/CD Integration
```bash
npm run test:uat:ci         # Setup + Run for CI environments
```

## Test Users

Pre-configured test users are available for different scenarios:

| Tier | Email | Password | Features |
|------|-------|----------|----------|
| Free | uat.free@test.com | UATtest123! | 1 analysis |
| Starter | uat.starter@test.com | UATtest123! | 10 analyses, PDF |
| Growth | uat.growth@test.com | UATtest123! | 100 analyses, API |
| Business | uat.business@test.com | UATtest123! | Unlimited, All features |

Temporary emails are automatically generated for new user registration tests.

## Configuration

### Environment Variables
```bash
TEST_ENV=local           # local, staging, or production
BASE_URL=http://localhost:5173
SUPABASE_SERVICE_ROLE_KEY=your_key_here
HEADLESS=true           # Set to false for visible browser
```

### Test Configuration
Edit `test-users.config.js` to modify:
- Test user profiles
- Test credit cards
- Test websites for analysis
- Environment settings

## File Structure

```
tests/uat/
├── README.md                    # This file
├── project-plan.md             # UAT roadmap and objectives
├── progress.md                 # Execution log and issues
├── uat-comprehensive.spec.js  # Main test suite
├── test-users.config.js       # Test user configurations
├── setup-uat.js               # Environment setup script
├── run-uat.js                 # Test runner with reporting
└── test-results/              # Generated test reports
    ├── uat-signoff.md         # Sign-off document
    ├── summary.json           # Test summary data
    └── index.html            # HTML test report
```

## Performance Benchmarks

The UAT suite validates these performance requirements:
- Analysis completion: <15 seconds
- Page load: <3 seconds
- Authentication: <5 seconds
- PDF generation: <10 seconds

## Success Criteria

UAT is considered successful when:
- ✅ All critical user journeys pass
- ✅ Cross-browser compatibility confirmed
- ✅ Mobile responsiveness verified
- ✅ Performance benchmarks met
- ✅ Payment processing functional
- ✅ Error handling validated

## Troubleshooting

### Common Issues

1. **Temporary Email Generation Fails**
   - Check internet connectivity
   - Verify 10minute.com is accessible
   - Fallback services will be tried automatically

2. **Test Users Not Created**
   - Ensure Supabase is running locally
   - Check SUPABASE_SERVICE_ROLE_KEY is set
   - Run `npm run test:uat:cleanup` then setup again

3. **Stripe Tests Failing**
   - Verify Stripe test mode is enabled
   - Check test API keys are configured
   - Ensure webhook endpoint is accessible

4. **Database Timeouts**
   - This is expected behavior (10-second limit)
   - Tests verify graceful degradation
   - Simplified components should still work

## CI/CD Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Run UAT Tests
  run: |
    npm install
    npm run test:uat:ci
  env:
    TEST_ENV: staging
    HEADLESS: true
```

## Reporting

After test execution:
- **HTML Report**: `test-results/uat/index.html`
- **JSON Summary**: `test-results/uat/summary.json`
- **Sign-off Document**: `test-results/uat/uat-signoff.md`

The sign-off document provides a production readiness assessment based on test results.

## Contributing

When adding new tests:
1. Add test cases to `uat-comprehensive.spec.js`
2. Update test categories in `run-uat.js`
3. Add new test users to `test-users.config.js` if needed
4. Document changes in this README

## Support

For issues or questions about UAT testing:
- Check test logs in `progress.md`
- Review failed test screenshots in `test-results/`
- Consult the main project documentation