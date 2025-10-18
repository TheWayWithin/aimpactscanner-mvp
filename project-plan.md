# AImpactScanner - Project Plan

## Current Mission Status

### 🔴 CRITICAL: OAuth User Journey Broken Business Logic (Oct 15, 2025)
**Objective**: Fix OAuth flow creating duplicate accounts and bypassing tier selection
**Status**: 🔴 INVESTIGATION COMPLETE - Ready for Implementation
**Started**: 2025-10-15
**Priority**: CRITICAL - Breaks core business logic

**Issue**: OAuth authentication creates duplicate accounts for existing users, bypasses tier selection, and redirects to wrong destinations.

#### Root Causes Identified
1. **Missing Tier Selection**: Users never see TierSelector before OAuth (Signup.jsx:65)
2. **getUserData() Timing Issue**: Returns null for existing users due to async database trigger
3. **Auto-Free Tier**: System defaults to 'free' without user consent (useUserInitializer.js:144-191)
4. **Wrong Routing**: All users redirect to #landing instead of tier-based destinations
5. **Ignored is_first_login Flag**: Flag exists but never used in routing logic

#### Remediation Plan (5 Phases)
- [ ] Phase 1: Add TierSelector to signup flow (force selection before OAuth)
- [ ] Phase 2: Fix getUserData() timing issue (stop duplicate accounts) - HOTFIX
- [ ] Phase 3: Remove auto-free tier (enforce business logic) - HOTFIX
- [ ] Phase 4: Fix post-authentication routing (use existing functions)
- [ ] Phase 5: Testing & validation (comprehensive E2E tests)

**3-Stage Deployment Strategy (APPROVED)**:

**STAGE 1: Emergency Hotfix** 🔥 (TODAY - 2-4 hours)
- Deploy: Phases 2+3 to production immediately
- Goal: Stop duplicate accounts, enforce tier consent
- Impact: Prevents revenue loss, protects existing users
- Testing: Manual validation with test accounts
- Risk: Low (only fixes broken behavior)
- **Priority**: CRITICAL - Deploy ASAP

**STAGE 2: Complete Business Logic** ✅ (Day 2 - 1-2 days)
- Deploy: Phases 1+4 to restore intended user journey
- Goal: Add TierSelector UI, fix routing destinations
- Testing: Comprehensive staging validation
- Risk: Medium (UI changes require testing)
- **Priority**: HIGH - Full feature restoration

**STAGE 3: Test Automation** 🧪 (Day 3 - 4 hours)
- Complete: Test account setup (return to original mission)
- Deploy: Phase 5 Playwright E2E tests
- Goal: Automated regression prevention
- Testing: Validate OAuth fixes with automation
- **Priority**: MEDIUM - Quality assurance

**Rationale**: Fix critical production issues first, then add comprehensive testing. Test accounts more valuable when testing CORRECT behavior.

**Documentation**: `oauth-user-journey-remediation-plan.md`

**Next Action**: Begin Stage 1 hotfix implementation (Phases 2+3).

---

### ✅ COMPLETED: Test Account Infrastructure Setup (Oct 15, 2025)
**Objective**: Create dedicated test accounts for OAuth authentication testing
**Status**: ✅ PARTIAL COMPLETE - Accounts created, testing revealed critical OAuth bugs
**Completed**: 2025-10-15

**Results**:
- ✅ Test accounts created (Google + GitHub): aimpactscannertest@gmail.com
- ✅ Credentials stored in .env.test (gitignored)
- ✅ OAuth authentication successful
- ❌ Tests revealed critical user journey issues (duplicate accounts, wrong routing)

**Discovery**: Testing revealed OAuth flow broken - triggers new mission above.

---

### ✅ COMPLETED: Documentation Cleanup & OAuth Fix Closure (Oct 12, 2025)
**Objective**: Finalize OAuth fix documentation and archive completed mission files
**Status**: ✅ COMPLETE
**Completed**: 2025-10-12

**Results**:
- OAuth authentication: Working in production
- 70 files archived to organized structure
- Repository cleanup: 78.6% reduction in root documentation
- 3 corrupted files removed
- Archive location: `/docs/archive/2025-10-12/`

### ✅ COMPLETED: About Page Enhancement (Oct 12, 2025)
**Objective**: Add founder story and complete MASTERY-AI framework
**Status**: ✅ COMPLETE
**Completed**: 2025-10-12

**Results**:
- Added AI traffic impact statistics with NPR citation
- Featured all 8 MASTERY-AI Framework pillars
- Personal branding with jamiewatters.work links
- Deployed to production

### ✅ COMPLETED: OAuth Authentication Fix (Oct 11-12, 2025)
**Objective**: Fix GitHub OAuth authentication failure
**Status**: ✅ COMPLETE
**Completed**: 2025-10-12

**Results**:
- GitHub OAuth: Working (100% success rate)
- Dashboard redirect: Fixed (landing → dashboard)
- Session persistence: Verified
- Production validated with user account

---

## Previous Mission: Authentication Architecture Review (ARCHIVED)

**Objective**: Analyze intended vs actual auth flows, identify OAuth integration status
**Status**: ✅ ANALYSIS COMPLETE - Awaiting User Confirmation
**Started**: 2025-10-08
**Completed**: 2025-10-08
**Archived**: 2025-10-12 to `/docs/archive/2025-10-12/auth-fixes/architecture/`

## Mission Phases

### Phase 1: Architecture Analysis ✅ COMPLETE
- [x] Map INTENDED auth journey from architecture docs
- [x] Map ACTUAL auth journey from codebase
- [x] Identify OAuth implementation status
- [x] Document all signup/signin entry points
- [x] Compare intended vs actual flows

**Output**: `INTENDED-AUTHENTICATION-ARCHITECTURE.md`

### Phase 2: Gap Analysis ✅ COMPLETE
- [x] Identify which flows are legacy vs current
- [x] Determine OAuth integration completeness
- [x] Map redirect URL issues to specific flows
- [x] Create decision matrix for fixes

**Output**: `ACTUAL-AUTHENTICATION-IMPLEMENTATION.md`

### Phase 3: User Confirmation ⏳ IN PROGRESS
- [ ] User reviews analysis documents
- [ ] User answers strategy questions
- [ ] User confirms OAuth provider setup
- [ ] User decides on password component fate
- [ ] Agree on fix implementation strategy

**Pending User Input on**:
1. Enable both Google + GitHub OAuth? Or just one?
2. What happens to existing password users?
3. Delete or archive legacy password components?
4. Testing strategy - staging environment available?

### Phase 4: Implementation (Pending User Confirmation)
- [ ] Configure OAuth providers in Supabase
- [ ] Fix routing in App.jsx
- [ ] Update landing page signup button
- [ ] Handle legacy password components
- [ ] Consolidate routes
- [ ] Test OAuth flows end-to-end
- [ ] Deploy to production

## Root Cause Analysis - COMPLETE ✅

### USER COMPLAINT
> "I don't see any of the oauth stuff we were supposed to be delivering"

### ROOT CAUSE IDENTIFIED
**OAuth components EXIST and WORK but are HIDDEN behind wrong entry points.**

#### What EXISTS (Good News) ✅
1. All OAuth components present and functional:
   - TierSelector.jsx ✅
   - AuthMethodSelector.jsx ✅ (Google, GitHub, Magic Link)
   - OAuthCallback.jsx ✅
   - Signup.jsx ✅ (OAuth-first design)

2. OAuth code implementation is correct and would work if configured

#### What's BROKEN (Bad News) ❌
1. **OAuth Providers NOT Configured** (🔴 CRITICAL):
   - No Google OAuth in `supabase/config.toml`
   - No GitHub OAuth in `supabase/config.toml`
   - OAuth buttons fail when clicked

2. **Wrong Routing** (🔴 CRITICAL):
   - Landing page → `CoffeeTierSignup.jsx` (password) ❌
   - `/#/login` → `Login.jsx` (password) ❌
   - `/#/register` → `CoffeeTierSignup.jsx` (password) ❌
   - Only `/#/signup` → `Signup.jsx` (OAuth) ✅

3. **Password Auth NOT Removed** (🟡 MAJOR):
   - Migration docs claim "Complete"
   - Reality: 4+ password components still active
   - Login.jsx, CoffeeTierSignup.jsx, AuthWithPassword.jsx, etc.

4. **Multiple Auth Paths Coexist** (🟡 MAJOR):
   - 5+ different signup/login routes
   - Only 1 route goes to OAuth components
   - No single source of truth

## Why User Doesn't See OAuth

**Actual User Journey**:
```
Landing Page → Click "Sign Up" →
App.jsx routes to 'coffee-signup' →
Loads CoffeeTierSignup.jsx (PASSWORD FORM) ❌

USER SEES: Email + Password fields
USER EXPECTS: Google/GitHub OAuth buttons
```

**Path That Would Work** (but users don't take):
```
Manually navigate to /#/signup →
Signup.jsx loads →
AuthMethodSelector shows OAuth buttons ✅

BUT: OAuth providers not configured, so fails anyway ❌
```

## Statistics

- **OAuth Components**: 4/4 exist (100%) ✅
- **OAuth Configured**: 0/2 providers (0%) ❌
- **Routes to OAuth**: 1/5 routes (20%) ❌
- **Password Removed**: 0% (still active) ❌
- **Architecture Match**: ~45%

## Critical Questions Answered

1. **What is the INTENDED signup/signin journey?**
   - OAuth-first (Google/GitHub primary, Magic Link fallback)
   - Documented in ADR_AUTH_MONETIZATION.md dated 2025-10-02
   - Password auth marked as "removed"

2. **Where is OAuth supposed to be used?**
   - Primary authentication method for all signups/logins
   - Google OAuth (primary)
   - GitHub OAuth (secondary)
   - Magic Link (passwordless fallback)

3. **Which components are legacy vs current?**
   - **CURRENT**: Signup.jsx, AuthMethodSelector.jsx, OAuthCallback.jsx, TierSelector.jsx
   - **LEGACY**: Login.jsx, CoffeeTierSignup.jsx, AuthWithPassword.jsx, ResetPassword.jsx, PasswordResetPage.jsx

4. **Why are there 3+ different signup paths?**
   - Migration from password auth to OAuth-first was documented but not implemented
   - Password components were supposed to be removed but weren't
   - Multiple paths created during transition but never consolidated

## Required Fixes (Pending User Confirmation)

### 🔴 CRITICAL Fixes
1. **Configure OAuth Providers**:
   - Create Google OAuth app in Google Cloud Console
   - Create GitHub OAuth app in GitHub Settings
   - Add to `supabase/config.toml`

2. **Fix Default Routing** (`src/App.jsx` Line 697-708):
   ```javascript
   // CHANGE FROM:
   setCurrentView('coffee-signup'); // Password component ❌

   // CHANGE TO:
   setCurrentView('signup'); // OAuth Signup.jsx ✅
   ```

3. **Fix Login Route** (`src/App.jsx` Line 1259):
   - Route to OAuth component instead of password Login.jsx

4. **Fix Landing Page**:
   - Signup button routes to `/#/signup` (OAuth)

### 🟡 MAJOR Decisions Needed

5. **Password Components** - User must choose:
   - **Option A**: Delete all password components (clean break)
   - **Option B**: Keep for existing users, OAuth for new users
   - **Affected**: Login.jsx, CoffeeTierSignup.jsx, AuthWithPassword.jsx, ResetPassword.jsx

6. **Route Consolidation**:
   - Remove: `/#/register`, `/#/unified-registration`
   - Keep: `/#/signup` (OAuth), `/#/login` (OAuth)

## Success Metrics

OAuth will be "working" when:
1. ✅ User clicks "Sign Up" → Sees OAuth buttons (NO passwords)
2. ✅ OAuth providers configured in Supabase
3. ✅ Google OAuth flow works end-to-end
4. ✅ GitHub OAuth flow works end-to-end
5. ✅ Magic Link works as fallback
6. ✅ Default routes go to OAuth components
7. ✅ Password auth removed or clearly marked as legacy

## Analysis Documents for Review

1. **`ACTUAL-AUTHENTICATION-IMPLEMENTATION.md`** - 500+ line comprehensive analysis with:
   - Complete component inventory
   - Route configuration details
   - Gap analysis tables
   - Specific code locations and line numbers
   - Step-by-step fix recommendations

2. **`INTENDED-AUTHENTICATION-ARCHITECTURE.md`** - What architecture docs specify

3. **`handoff-notes.md`** - Executive summary with action items

## Next Steps

**Awaiting user confirmation on**:
1. OAuth provider strategy (Google + GitHub or just one?)
2. Password user migration strategy
3. Legacy component handling (delete or archive?)
4. Testing approach (staging environment?)

**Once confirmed, Phase 4 implementation will**:
- Configure OAuth providers
- Fix routing to OAuth components
- Handle legacy password components per user decision
- Test and deploy OAuth-first authentication

---

**Current Status**: Analysis complete, no code changes made, awaiting user strategic decisions before proceeding with fixes.
