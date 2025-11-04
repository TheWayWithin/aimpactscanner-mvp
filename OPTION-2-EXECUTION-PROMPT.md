# Option 2 Execution Prompt - Phase 1 Signup Flow Fixes

## Mission Objective
Implement all critical fixes identified in Phase 1 validation analysis, create automated tests, and deploy to staging environment.

## Context
- **Analysis Complete**: `/docs/PHASE-1-JOURNEY-MAP-ANALYSIS.md` identified 3 critical blockers
- **Success Rate**: Currently 25% (2/8 journeys working)
- **Target**: 100% (8/8 journeys working correctly)
- **Environment**: Staging database (`impactscanner-staging`)
- **Testing**: Localhost (`http://localhost:5173`) + Deploy Preview

## Critical Fixes Required

### Fix 1: Upsell Routing Bypass (5 min)
- **File**: `src/components/OAuthCallback.jsx` lines 246-250
- **Issue**: ALL existing users bypass upgrade prompts, go straight to dashboard
- **Impact**: Zero upsell conversion = revenue loss
- **Fix**: Route existing free/paid users to appropriate upsell pages instead of dashboard

### Fix 2: SIGNED_IN Race Condition (30 min)
- **File**: `src/App.jsx` lines 541-564
- **Issue**: SIGNED_IN event fires AFTER OAuthCallback routing, redirects users to oauth-callback AGAIN
- **Impact**: Payment flow broken, users stuck in callback loop
- **Fix**: Prevent SIGNED_IN event from re-triggering oauth-callback redirect after OAuthCallback.jsx has already routed user

### Fix 3: authContext Expiry Too Short (5 min)
- **Files**:
  - `src/pages/Signup.jsx` line 123
  - `src/components/AuthMethodSelector.jsx` line 30
- **Issue**: 24hr TTL too short - magic link users who click >24hr later lose tier selection
- **Impact**: Broken magic link flow, orphaned auth accounts
- **Fix**: Extend TTL from 24 hours to 7 days (604800000 ms)

## High Priority Issues (Optional - Include if Time Permits)

### Issue 4: Payment Confirmation Flow
- **File**: `src/App.jsx`
- **Issue**: No dedicated payment confirmation page after Stripe checkout
- **Recommendation**: Add payment success confirmation before routing to dashboard

### Issue 5: Stripe Checkout Error Recovery
- **Issue**: No error handling for failed Stripe checkout sessions
- **Recommendation**: Implement retry logic and user-friendly error messaging

### Issue 6: first_login Flag Reset
- **Issue**: `is_first_login` flag not reset after successful login
- **Recommendation**: Reset flag after user completes first session

## Testing Strategy

### Automated E2E Tests Required
Create Playwright tests for all 8 user journeys:

1. **Journey 1**: New user → Coffee tier → OAuth → Stripe checkout
2. **Journey 2**: New user → Coffee tier → Magic link → Stripe checkout
3. **Journey 3**: New user → Free tier → OAuth → Dashboard
4. **Journey 4**: New user → Free tier → Magic link → Dashboard
5. **Journey 5**: Existing paid user → Login → OAuth → Dashboard (no upsell)
6. **Journey 6**: Existing paid user → Login → Magic link → Dashboard (no upsell)
7. **Journey 7**: Existing free user → Login → OAuth → Upsell page
8. **Journey 8**: Existing free user → Login → Magic link → Upsell page

### Test Infrastructure
- **Location**: `tests/e2e/phase1-signup-flow.spec.js`
- **Credentials**: Use `.env.test` (gitignored)
- **Database**: Staging (`impactscanner-staging`)
- **Test Accounts**: Google OAuth test account already configured

## Deployment Strategy

### Stage 1: Fix Implementation
1. Implement Fix 1 (upsell routing)
2. Implement Fix 2 (race condition)
3. Implement Fix 3 (authContext TTL)
4. Verify fixes locally on `http://localhost:5173`

### Stage 2: Automated Testing
1. Create E2E test suite for 8 journeys
2. Run tests on localhost
3. Verify 100% pass rate

### Stage 3: Staging Deployment
1. Commit changes with descriptive message
2. Push to `develop` branch
3. Verify deploy preview works
4. Test on `https://develop--aimpactscanner.netlify.app`

## AGENT-11 Delegation Strategy

### Use Developer Agent for:
- Implementing the 3 critical fixes
- Code modifications to OAuthCallback.jsx, App.jsx, Signup.jsx, AuthMethodSelector.jsx
- Ensuring proper error handling

### Use Tester Agent for:
- Creating comprehensive E2E test suite
- Testing all 8 user journeys
- Setting up test infrastructure
- Running tests and reporting results

### Use Operator Agent for:
- Git operations (commit, push)
- Deployment verification
- Environment validation
- Monitoring staging deployment

## Success Criteria

✅ All 3 critical fixes implemented and tested locally
✅ Automated E2E tests created for all 8 journeys
✅ 100% test pass rate on localhost
✅ Changes committed and pushed to develop branch
✅ Deploy preview accessible and functional
✅ Manual verification on staging environment
✅ Documentation updated in progress.md

## Execution Command

```
/coord Execute Option 2: Implement all Phase 1 signup flow fixes (3 critical issues), create automated E2E tests for 8 user journeys, and deploy to staging. Delegate to developer agent for fixes, tester agent for test automation, and operator agent for deployment. Reference /docs/PHASE-1-JOURNEY-MAP-ANALYSIS.md for complete issue details. Target: 100% journey success rate.
```

## Files to Reference

- **Analysis**: `/docs/PHASE-1-JOURNEY-MAP-ANALYSIS.md` (complete journey maps and issue details)
- **Spec**: `/docs/SIGNUP-UX-OPTIMIZATION-PLAN.md` (original Phase 1 design)
- **Status**: `/Users/jamiewatters/DevProjects/aimpactscanner-mvp/project-plan.md` (current mission status)
- **History**: `/Users/jamiewatters/DevProjects/aimpactscanner-mvp/progress.md` (analysis results)

## Environment Guardrails

⛔ **NEVER** modify production database (`aimpactscanner-mvp`)
✅ **ALWAYS** test on staging database (`impactscanner-staging`)
✅ **VERIFY** localhost uses staging before making changes
✅ **CONFIRM** deploy preview uses staging database

---

**Estimated Time**: 2-3 hours total
- Fixes: 40 minutes
- Testing: 60-90 minutes
- Deployment: 30 minutes
