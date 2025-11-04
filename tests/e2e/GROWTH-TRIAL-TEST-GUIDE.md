# Growth Tier 7-Day Trial E2E Test Guide

## Quick Start

### Run the Test
```bash
# Standard test run (headless)
npx playwright test tests/e2e/growth-trial-magic-link.spec.js --project=chromium

# Headed mode (watch the test run)
npx playwright test tests/e2e/growth-trial-magic-link.spec.js --headed --project=chromium

# Debug mode (step through test)
npx playwright test tests/e2e/growth-trial-magic-link.spec.js --debug
```

## What This Test Validates

### ✅ Complete Trial Flow (End-to-End)
1. **Navigate to signup page**
2. **Click Growth tier trial button** → Stores authContext with isTrial=true
3. **Magic link authentication** → Uses temporary email from 10minute.com
4. **Stripe checkout redirect** → Verifies $0.00 trial pricing
5. **Complete Stripe payment** → Uses test card 4242 4242 4242 4242
6. **Webhook processing** → Waits for database update
7. **Verify database** → Confirms tier="growth", analyses_remaining=40
8. **Account page check** → Validates UI shows correct trial status

### 🐛 Bug Fixes Verified

**Bug #1: AuthMethodSelector Parameter Stripping**
- ❌ Before: isTrial and billingFrequency were lost when clicking "Continue with Email"
- ✅ After: Parameters correctly preserved through authentication flow
- **Assertion**: Console log shows `[authRouting] Extracted isTrial: true`

**Bug #2: Webhook JWT Verification Blocking**
- ❌ Before: Webhook couldn't update database due to JWT verification
- ✅ After: Webhook successfully updates user tier and subscription
- **Assertion**: Database query returns tier="growth" after checkout

### 🔍 Critical Console Logs Monitored

The test captures and validates these console logs:
```
[Signup] Normalized isTrial: true
[authRouting] Extracted isTrial: true
💳 Auto-checkout params stored: {tier: 'growth', isTrial: true, billing: 'annual'}
```

## Test Environment

### Staging Database
- **URL**: `https://develop--aimpactscanner.netlify.app`
- **Database**: `isgzvwpjokcmtizstwru` (staging - safe for testing)
- **Stripe**: Test mode with Stripe test keys

### Test Data
- **Email**: Generated temporary email from 10minute.com
- **Card**: 4242 4242 4242 4242 (Stripe test card)
- **User**: Automatically cleaned up after test completion

## Test Assertions

### Phase-by-Phase Verification

**Phase 1: Signup Page**
- ✅ Signup page loads with tier cards
- ✅ Growth tier trial button visible

**Phase 2: Trial Button Click**
- ✅ authContext stored in localStorage
- ✅ authContext.isTrial === true
- ✅ authContext.selectedTier === 'growth'
- ✅ authContext.billingFrequency === 'annual'

**Phase 3: Console Log Validation**
- ✅ `[Signup] Normalized isTrial: true` appears
- ✅ No errors in console during flow

**Phase 4: Magic Link Flow**
- ✅ AuthMethodSelector displays
- ✅ "Continue with Email" button visible
- ✅ Email input accepts temporary email
- ✅ Confirmation message displays

**Phase 5: Email Authentication**
- ✅ Magic link received within 90 seconds
- ✅ Magic link navigation successful
- ✅ User authenticated (supabase.auth.token exists)

**Phase 6: Auth Routing Verification**
- ✅ `[authRouting] Extracted isTrial: true` in console
- ✅ Auto-checkout params stored with isTrial=true

**Phase 7: Stripe Checkout**
- ✅ Redirect to checkout.stripe.com
- ✅ Page content includes "$0.00" or "Free trial"
- ✅ Stripe form accepts test card

**Phase 8: Checkout Success**
- ✅ Redirect to checkout-success page
- ✅ No errors during checkout process

**Phase 9: Webhook Processing**
- ✅ 5-second grace period for webhook
- ✅ Database updated successfully

**Phase 10: Database Verification**
- ✅ User tier = "growth"
- ✅ analyses_remaining = 40
- ✅ subscription_status set correctly

**Phase 11: Account Page**
- ✅ Account page shows "Growth" tier
- ✅ "40 analyses remaining" displayed

## Screenshots Captured

The test automatically captures screenshots at key stages:
1. `growth-trial-01-signup-page.png` - Initial signup page
2. `growth-trial-02-after-trial-click.png` - After clicking trial button
3. `growth-trial-03-email-form.png` - Email input form
4. `growth-trial-04-stripe-checkout.png` - Stripe checkout page
5. `growth-trial-05-stripe-filled.png` - Stripe form filled
6. `growth-trial-06-checkout-success.png` - Success page
7. `growth-trial-07-account-page.png` - Final account page

All screenshots saved to: `test-results/`

## Troubleshooting

### Common Issues

**Issue: Magic Link Timeout**
```
❌ Magic link not received within 90 seconds
```
**Solution**:
- Check 10minute.com is accessible
- Try running test again (email services can be slow)
- Increase timeout in test if needed

**Issue: Stripe Checkout Fails**
```
❌ Cannot find card input iframe
```
**Solution**:
- Verify test is using staging environment
- Check Stripe test keys are configured
- Ensure Stripe Elements loaded correctly

**Issue: Database Not Updated**
```
❌ User tier not set to "growth"
```
**Solution**:
- Verify webhook is enabled in Netlify
- Check webhook JWT verification disabled for test mode
- Confirm staging database connection

**Issue: Test User Cleanup Failed**
```
⚠️ Cleanup warning: ...
```
**Solution**:
- This is non-critical (doesn't fail test)
- Manual cleanup: Delete test user from Supabase dashboard
- Check if test user has `is_test_user: true` flag

## Additional Tests

The spec includes 3 test cases:

### Test 1: Complete Trial Flow (Main Test)
- **Duration**: ~3 minutes
- **Coverage**: Full end-to-end flow
- **Purpose**: Verify entire trial signup works

### Test 2: Magic Link Timeout Handling
- **Duration**: ~30 seconds
- **Coverage**: Error handling
- **Purpose**: Verify graceful timeout behavior

### Test 3: AuthContext Persistence
- **Duration**: ~20 seconds
- **Coverage**: State management
- **Purpose**: Verify authContext survives page refresh

## Manual Testing Alternative

If automated test fails, you can manually verify:

1. Navigate to: https://develop--aimpactscanner.netlify.app/#signup
2. Click "Try Growth Free for 7 Days" (GREEN button)
3. Open DevTools Console - Look for: `[Signup] Normalized isTrial: true`
4. Click "Continue with Email"
5. Check Console: Should see `[authRouting] Extracted isTrial: true`
6. Enter temporary email from 10minute.com
7. Get magic link from inbox
8. Complete authentication
9. Verify Stripe shows "$0.00 due today"
10. Complete checkout with test card: 4242 4242 4242 4242
11. Verify account page shows "Growth" tier with 40 analyses

## Performance Benchmarks

Expected timings:
- **Email generation**: 5-15 seconds
- **Magic link receipt**: 30-90 seconds
- **Stripe checkout**: 10-20 seconds
- **Webhook processing**: 3-5 seconds
- **Total test duration**: 2-3 minutes

## CI/CD Integration

To run in CI pipeline:
```bash
# Set CI environment
export CI=true

# Run test
npx playwright test tests/e2e/growth-trial-magic-link.spec.js --reporter=json
```

Test results saved to: `test-results/playwright-results.json`

## Support

For test failures or questions:
1. Check console logs in test output
2. Review screenshots in `test-results/`
3. Run in headed mode to observe behavior
4. Verify staging environment is accessible
5. Confirm all environment variables set correctly

---

**Test Created**: 2025-10-31
**Last Updated**: 2025-10-31
**Status**: ✅ Production Ready
