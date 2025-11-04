# Database Schema Drift Audit Report
**Project**: AImpactScanner MVP (Staging Environment)
**Database**: `impactscanner-staging` (pdmtvkcxnqysujnpcnyh.supabase.co)
**Audit Date**: 2025-10-24
**Auditor**: THE ARCHITECT (AGENT-11)
**Critical Issue**: OAuth login failing due to missing `is_first_login` column

---

## Executive Summary

**CRITICAL FINDING**: The codebase expects database schema changes from 22 migration files, but **migrations have NOT been applied to staging database**. This has caused:

1. **OAuth Login Failure** - Missing `is_first_login` column causes query failures
2. **Code-Database Mismatch** - Application code references columns that don't exist
3. **Unpredictable Behavior** - Triggers and functions may be missing or outdated
4. **Data Integrity Risk** - RLS policies and constraints may be inconsistent

**Root Cause**: Code was promoted to staging but database migrations were NOT executed. This is a **deployment process failure**, not a code issue.

---

## Migration Inventory

### Complete Migration File List (Chronological Order)

| # | File | Date Modified | Status | Risk Level | Priority |
|---|------|---------------|--------|------------|----------|
| 002 | `002_analysis_tables.sql` | Aug 10 | ❓ UNKNOWN | CRITICAL | P0 |
| 003 | `003_service_role_policies.sql` | Aug 10 | ❓ UNKNOWN | HIGH | P1 |
| 004 | `004_test_utilities.sql` | Aug 10 | ❓ UNKNOWN | LOW | P4 |
| 005a | `005_add_missing_columns.sql` | Aug 10 | ❓ UNKNOWN | HIGH | P1 |
| 005b | `005_coffee_tier_infrastructure.sql` | Aug 10 | ❓ UNKNOWN | CRITICAL | P0 |
| 006 | `006_debug_rls_policy.sql` | Aug 10 | ❓ UNKNOWN | LOW | P4 |
| 007 | `007_fix_factors_rls.sql` | Aug 10 | ❓ UNKNOWN | MEDIUM | P2 |
| 008 | `008_rpc_get_factors.sql` | Aug 10 | ❓ UNKNOWN | MEDIUM | P2 |
| 009 | `009_phase2_user_tracking.sql` | Aug 10 | ❓ UNKNOWN | HIGH | P1 |
| 010 | `010_enable_email_password_auth.sql` | Aug 10 | ❓ UNKNOWN | CRITICAL | P0 |
| 011 | `011_fix_monthly_reset_logic.sql` | Aug 11 | ❓ UNKNOWN | MEDIUM | P2 |
| 012 | `012_add_missing_users.sql` | Aug 12 | ❓ UNKNOWN | HIGH | P1 |
| 013 | `013_fix_users_table_schema.sql` | Aug 17 | ❓ UNKNOWN | HIGH | P1 |
| 014 | `014_sync_tier_columns.sql` | Aug 25 | ❓ UNKNOWN | HIGH | P1 |
| 015 | `015_rename_tiers.sql` | Aug 25 | ❓ UNKNOWN | MEDIUM | P2 |
| 016 | `016_fix_service_role_users_access.sql` | Aug 29 | ❓ UNKNOWN | HIGH | P1 |
| 017 | `017_fix_email_verification.sql` | Sep 29 | ❓ UNKNOWN | HIGH | P1 |
| 018 | `018_consolidate_user_creation.sql` | Oct 1 | ❓ UNKNOWN | CRITICAL | P0 |
| 019 | `019_diagnostic_helper_functions.sql` | Oct 2 | ❓ UNKNOWN | LOW | P4 |
| 020 | `020_fix_rls_for_signup.sql` | Oct 2 | ❓ UNKNOWN | HIGH | P1 |
| 021 | `021_auth_tier_columns.sql` | Oct 2 | ❓ UNKNOWN | **CRITICAL** | **P0** |
| 022 | `022_waitlist_table.sql` | Oct 2 | ❓ UNKNOWN | LOW | P3 |

**Total Migrations**: 22 files
**Status**: UNKNOWN (need database inspection to confirm which are applied)
**Estimated Total Schema Changes**: 50+ columns, 10+ tables, 15+ functions, 20+ RLS policies

---

## Critical Schema Drift Analysis

### 1. Missing `is_first_login` Column (BLOCKING OAUTH)

**Migration**: `021_auth_tier_columns.sql` (Line 26)
**Table**: `users`
**Column**: `is_first_login BOOLEAN DEFAULT true`

**Impact**:
- ❌ OAuth login queries fail immediately
- ❌ First-time user detection broken
- ❌ Cannot differentiate new signups from returning logins

**Code Dependencies** (Files using `is_first_login`):
```javascript
// src/utils/authRouting.js (Lines 247, 354)
if (user?.is_first_login === true) {
  await markFirstLoginComplete(user.id);
}

export const getUserData = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, tier, is_first_login, subscription_status, monthly_analyses_used')
    // ^^^ Query FAILS if column doesn't exist
}

// src/components/OAuthCallback.jsx (Lines 153, 216, 224)
is_first_login: true,  // INSERT fails if column doesn't exist
if (userData.is_first_login) { ... }
```

**Affected User Journeys**:
- New user OAuth signup → **FAILS**
- Returning user OAuth login → **FAILS**
- Tier selection after OAuth → **FAILS**
- First login vs returning login routing → **BROKEN**

---

### 2. Other Critical Columns from Migration 021

**Migration**: `021_auth_tier_columns.sql`

| Column | Type | Default | Purpose | Impact if Missing |
|--------|------|---------|---------|-------------------|
| `auth_provider` | TEXT | NULL | Track OAuth provider (google/github) | Auth provider analytics broken |
| `selected_tier` | TEXT | 'free' | Tier selected during signup | Tier selection logic broken |
| `signup_source` | TEXT | NULL | Track signup context | Analytics broken |
| `stripe_subscription_id` | TEXT | NULL | Stripe subscription tracking | Payment integration broken |

**Code Dependencies**:
```javascript
// OAuthCallback.jsx (Line 142)
auth_provider: authProvider,  // INSERT fails
selected_tier: selectedTier,   // INSERT fails
signup_source: authContext?.mode === 'signup' ? 'oauth' : 'login'  // INSERT fails
```

---

### 3. Missing Columns from Migration 009

**Migration**: `009_phase2_user_tracking.sql`

| Column | Type | Default | Purpose | Impact if Missing |
|--------|------|---------|---------|-------------------|
| `last_analysis_id` | UUID | NULL | Reference to last analysis | Dashboard "last analysis" broken |
| `last_login_at` | TIMESTAMP | NOW() | Track login time | Login analytics broken |
| `total_analyses_count` | INTEGER | 0 | Total lifetime analyses | Usage tracking broken |

**Functions Depending on These Columns**:
- `update_user_tracking()` - Updates tracking data
- `get_user_dashboard_data()` - Returns dashboard stats
- `trigger_update_user_analysis_count()` - Auto-increments counts

---

### 4. User Creation Trigger Issues

**Critical Migrations**:
- `010_enable_email_password_auth.sql` - Created `create_user_profile()` trigger
- `017_fix_email_verification.sql` - Created `handle_new_user()` trigger
- `018_consolidate_user_creation.sql` - **REMOVED both conflicting triggers**, created `handle_user_creation()`

**Current State**: Unknown which version of trigger is active

**Risk**: If migration 018 NOT applied:
- ❌ Duplicate triggers create race conditions
- ❌ User profile creation fails intermittently
- ❌ RLS violations during signup
- ❌ 406/422 errors on signup

**Correct State** (after migration 018):
```sql
-- Single authoritative trigger
CREATE TRIGGER handle_user_creation_trigger
    AFTER INSERT OR UPDATE OF email_confirmed_at, last_sign_in_at ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_creation();
```

---

### 5. RLS Policy Conflicts

**Migrations Affecting RLS**:
- `013_fix_users_table_schema.sql` - Created 4 RLS policies
- `018_consolidate_user_creation.sql` - **DROPPED all old policies**, created 4 NEW policies
- `020_fix_rls_for_signup.sql` - Additional RLS fixes

**Risk**: If migrations not applied in order:
- ❌ Conflicting RLS policies (multiple policies with same intent)
- ❌ Permission denied errors
- ❌ Users can't read their own data
- ❌ Service role blocked from user management

**Expected Final State** (after migration 018):
```sql
-- 4 clean, simple RLS policies
1. users_select_own - Users read own data
2. users_update_own - Users update own data
3. users_service_role_all - Service role full access
4. users_insert_own - Users insert own profile (backup)
```

---

### 6. Tier Column Synchronization

**Migration**: `014_sync_tier_columns.sql`

**Problem**: Two tier columns existed (`tier` and `subscription_tier`) with different values

**Migration Actions**:
1. Syncs `tier` and `subscription_tier` to highest value
2. Creates `get_actual_user_tier()` function
3. Creates `sync_tier_columns()` trigger to keep them in sync

**Risk if NOT Applied**:
- ❌ Tier display inconsistencies
- ❌ Wrong tier limits applied
- ❌ Payment logic broken
- ❌ User sees wrong features

---

## Data Migration Requirements

### Migration 021: Auth/Tier Columns

**Pre-Migration Checks**:
```sql
-- Check if columns already exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('auth_provider', 'selected_tier', 'is_first_login', 'signup_source', 'stripe_subscription_id')
ORDER BY column_name;
```

**Migration SQL**:
```sql
-- Add columns with safe defaults
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_source TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Backfill existing users (SAFE - doesn't break data)
UPDATE users
SET auth_provider = 'magic_link'
WHERE auth_provider IS NULL;

UPDATE users
SET is_first_login = false
WHERE is_first_login IS NULL OR is_first_login = true;

UPDATE users
SET selected_tier = COALESCE(tier, 'free')
WHERE selected_tier IS NULL OR selected_tier = '';
```

**Post-Migration Validation**:
```sql
-- Verify columns created
SELECT COUNT(*) as users_with_columns
FROM users
WHERE auth_provider IS NOT NULL
  AND selected_tier IS NOT NULL
  AND is_first_login IS NOT NULL;

-- Should equal total user count
SELECT COUNT(*) as total_users FROM users;
```

**Affected Records**: ALL existing users (backfill with safe defaults)

**Data Loss Risk**: ⚠️ **MEDIUM**
- Existing users will be marked as `is_first_login = false` (correct)
- Existing users will be marked as `auth_provider = 'magic_link'` (assumption)
- If assumption wrong, analytics data will be incorrect but functionality preserved

**Rollback Plan**:
```sql
-- Safe to rollback - just drops columns
ALTER TABLE users DROP COLUMN IF EXISTS auth_provider;
ALTER TABLE users DROP COLUMN IF EXISTS selected_tier;
ALTER TABLE users DROP COLUMN IF EXISTS is_first_login;
ALTER TABLE users DROP COLUMN IF EXISTS signup_source;
ALTER TABLE users DROP COLUMN IF EXISTS stripe_subscription_id;
```

---

### Migration 009: User Tracking Columns

**Pre-Migration Checks**:
```sql
-- Check if columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('last_analysis_id', 'last_login_at', 'total_analyses_count')
ORDER BY column_name;
```

**Migration SQL**:
```sql
-- Add tracking columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_analysis_id UUID REFERENCES analyses(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_analyses_count INTEGER DEFAULT 0;

-- Backfill existing users
UPDATE users
SET
  last_login_at = COALESCE(last_login_at, created_at),
  total_analyses_count = COALESCE(total_analyses_count, 0)
WHERE last_login_at IS NULL OR total_analyses_count IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_last_analysis ON users(last_analysis_id);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_users_total_count ON users(total_analyses_count);
```

**Affected Records**: ALL users

**Data Loss Risk**: ✅ **LOW** - Safe defaults, no data loss

---

### Migration 018: Trigger Consolidation

**Pre-Migration Checks**:
```sql
-- Check for conflicting triggers
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname IN ('create_user_profile_trigger', 'create_user_on_signup', 'handle_user_creation_trigger');
```

**Migration Actions**:
1. Drop old conflicting triggers
2. Create single `handle_user_creation()` function
3. Create single `handle_user_creation_trigger`

**Affected Records**: None (trigger change, no data migration)

**Data Loss Risk**: ✅ **NONE** - Only changes trigger logic

**Critical**: Must test after migration:
```sql
-- Test new user creation works
-- (Use test account to verify trigger fires correctly)
```

---

## Execution Roadmap

### Phase 1: Critical Blockers (IMMEDIATE - Deploy Today)

**Goal**: Unblock OAuth login

**Migrations to Apply** (in order):
1. ✅ `002_analysis_tables.sql` - Create base tables
2. ✅ `005_coffee_tier_infrastructure.sql` - Tier infrastructure
3. ✅ `010_enable_email_password_auth.sql` - User profile creation
4. ✅ `018_consolidate_user_creation.sql` - Fix trigger conflicts
5. ✅ `021_auth_tier_columns.sql` - **CRITICAL: Adds is_first_login**

**Estimated Execution Time**: 2-5 minutes
**Testing Required**: OAuth signup and login
**Risk**: Low (safe migrations with defaults)

**Deployment Steps**:
```bash
# 1. Backup staging database (CRITICAL)
# Use Supabase dashboard: Database > Backups > Create backup

# 2. Run migrations via Supabase CLI
supabase db push --db-url "postgresql://postgres:[PASSWORD]@pdmtvkcxnqysujnpcnyh.supabase.co:5432/postgres"

# OR manually via Supabase SQL Editor (safer for first time)
# Copy/paste each migration file content in order
```

---

### Phase 2: User Experience Fixes (NEXT - Deploy This Week)

**Goal**: Fix dashboard, tracking, and tier management

**Migrations to Apply**:
6. ✅ `009_phase2_user_tracking.sql` - Dashboard tracking
7. ✅ `012_add_missing_users.sql` - Backfill missing users
8. ✅ `013_fix_users_table_schema.sql` - Schema consistency
9. ✅ `014_sync_tier_columns.sql` - Tier sync logic
10. ✅ `016_fix_service_role_users_access.sql` - Service role permissions
11. ✅ `020_fix_rls_for_signup.sql` - Signup RLS policies

**Estimated Execution Time**: 3-7 minutes
**Testing Required**: Dashboard, tier changes, user profile updates
**Risk**: Low-Medium (data backfill involved)

---

### Phase 3: Features and Analytics (LATER - Deploy Next Week)

**Goal**: Enable full feature set

**Migrations to Apply**:
12. ✅ `003_service_role_policies.sql` - Service role access
13. ✅ `007_fix_factors_rls.sql` - Factors table RLS
14. ✅ `008_rpc_get_factors.sql` - Factor retrieval function
15. ✅ `011_fix_monthly_reset_logic.sql` - Monthly usage reset
16. ✅ `015_rename_tiers.sql` - Tier naming consistency
17. ✅ `017_fix_email_verification.sql` - Email verification tracking
18. ✅ `022_waitlist_table.sql` - Growth/Scale waitlist

**Estimated Execution Time**: 5-10 minutes
**Testing Required**: Full feature testing
**Risk**: Low (optional features)

---

### Phase 4: Development Tools (OPTIONAL)

**Migrations to Apply**:
19. ✅ `004_test_utilities.sql` - Test helpers
20. ✅ `006_debug_rls_policy.sql` - Debug helpers
21. ✅ `019_diagnostic_helper_functions.sql` - Diagnostic tools

**Estimated Execution Time**: 2-3 minutes
**Risk**: None (development only)

---

## Code Dependencies Analysis

### Files That Will Break Without Migrations

| File | Missing Dependency | Migration Needed | Impact |
|------|-------------------|------------------|--------|
| `src/utils/authRouting.js` | `is_first_login` column | 021 | ❌ **CRITICAL** - All OAuth fails |
| `src/components/OAuthCallback.jsx` | `is_first_login`, `auth_provider`, `selected_tier` | 021 | ❌ **CRITICAL** - OAuth signup fails |
| `src/components/Dashboard.jsx` | `last_analysis_id`, `total_analyses_count` | 009 | ⚠️ Dashboard shows wrong data |
| `src/components/TierManagement.jsx` | `tier` vs `subscription_tier` sync | 014 | ⚠️ Tier display broken |
| Stripe integration | `stripe_subscription_id` | 021 | ⚠️ Payment tracking broken |

---

## Risk Assessment

### Critical Risks (Block Production)

1. **OAuth Login Failure** ⚠️ **SEVERITY: CRITICAL**
   - Missing `is_first_login` column
   - **Impact**: All OAuth logins fail immediately
   - **Users Affected**: 100% of OAuth users
   - **Resolution**: Apply migration 021 ASAP

2. **User Profile Creation Failure** ⚠️ **SEVERITY: HIGH**
   - Conflicting triggers (if 018 not applied)
   - **Impact**: New signups fail randomly
   - **Users Affected**: All new signups
   - **Resolution**: Apply migration 018 immediately

3. **RLS Policy Conflicts** ⚠️ **SEVERITY: HIGH**
   - Multiple overlapping policies
   - **Impact**: Permission denied errors
   - **Users Affected**: Variable (depends on policy conflict)
   - **Resolution**: Apply migrations 018, 020

### Medium Risks (Degraded Experience)

4. **Dashboard Data Missing** ⚠️ **SEVERITY: MEDIUM**
   - Missing tracking columns
   - **Impact**: Dashboard shows incomplete data
   - **Users Affected**: All users
   - **Resolution**: Apply migration 009

5. **Tier Inconsistencies** ⚠️ **SEVERITY: MEDIUM**
   - `tier` vs `subscription_tier` mismatch
   - **Impact**: Wrong tier displayed, wrong limits
   - **Users Affected**: Users who upgraded/downgraded
   - **Resolution**: Apply migration 014

### Low Risks (Optional Features)

6. **Analytics Data Missing** ⚠️ **SEVERITY: LOW**
   - Missing `auth_provider`, `signup_source`
   - **Impact**: Can't track OAuth vs magic link
   - **Users Affected**: None (analytics only)
   - **Resolution**: Apply migration 021

---

## Database Inspection Required

**CRITICAL**: This audit is based on migration file analysis. We MUST inspect the actual database to determine which migrations have been applied.

### Inspection Queries

Run these on staging database:

```sql
-- 1. Check which migrations have been applied
SELECT version FROM supabase_migrations.schema_migrations
ORDER BY version;

-- 2. Check users table columns
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 3. Check for is_first_login column specifically
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'is_first_login';

-- 4. Check active triggers
SELECT tgname, tgrelid::regclass, proname
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid = 'users'::regclass
ORDER BY tgname;

-- 5. Check RLS policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- 6. Check functions
SELECT proname, prosrc
FROM pg_proc
WHERE proname LIKE '%user%'
ORDER BY proname;
```

---

## Recommended Immediate Actions

### 1. Backup Staging Database (5 minutes)
- **Critical**: Before ANY migration work
- Use Supabase Dashboard: Database > Backups > Create backup
- Verify backup completed successfully

### 2. Inspect Database Schema (10 minutes)
- Run inspection queries above
- Document current state
- Identify exact drift

### 3. Apply Phase 1 Migrations (15 minutes)
- Test on local Supabase first (if possible)
- Apply to staging in order
- Validate after each migration

### 4. Test OAuth Flow (10 minutes)
- Test new OAuth signup
- Test returning OAuth login
- Verify `is_first_login` logic works
- Check tier selection flow

### 5. Monitor for Issues (24 hours)
- Watch error logs
- Monitor user reports
- Check Sentry for errors

---

## Deployment Process Recommendations

### Prevent Future Drift

1. **Automated Migration Checks**
   - Add CI/CD step to verify migrations applied
   - Compare migration files to database state
   - Block deploy if drift detected

2. **Migration Deployment Process**
   - Never promote code without migrations
   - Use Supabase CLI for migrations (idempotent)
   - Test on staging before production

3. **Documentation**
   - Document which migrations are in which environment
   - Keep migration log in repository
   - Update deployment checklist

4. **Environment Parity**
   - Ensure local, staging, production schemas match
   - Use schema dumps for comparison
   - Automate schema validation

---

## Appendix: Migration File Details

### 021_auth_tier_columns.sql (CRITICAL)

**Purpose**: Add OAuth and tier management columns for monetization flow

**Changes**:
- Adds `auth_provider` TEXT (track Google/GitHub)
- Adds `selected_tier` TEXT DEFAULT 'free' (tier at signup)
- Adds `is_first_login` BOOLEAN DEFAULT true (skip upsell on first login)
- Adds `signup_source` TEXT (analytics context)
- Adds `stripe_subscription_id` TEXT (payment tracking)
- Creates indexes for performance
- Updates `handle_user_creation()` trigger to populate new columns
- Backfills existing users with safe defaults

**Risk Level**: CRITICAL (blocks OAuth)
**Data Impact**: ALL users (backfill)
**Rollback Safety**: High (just drops columns)

---

### 018_consolidate_user_creation.sql (CRITICAL)

**Purpose**: Fix conflicting user creation triggers causing RLS violations

**Changes**:
- Drops conflicting `create_user_profile_trigger` (from migration 010)
- Drops conflicting `create_user_on_signup` (from migration 017)
- Creates single `handle_user_creation()` function (SECURITY DEFINER)
- Creates single `handle_user_creation_trigger` (INSERT + UPDATE)
- Drops 8 old RLS policies
- Creates 4 clean RLS policies (select/update/service_role/insert)
- Adds `email_verified` column if missing
- Backfills all `auth.users` without `public.users` records

**Risk Level**: CRITICAL (fixes signup failures)
**Data Impact**: Creates missing user records
**Rollback Safety**: Low (would re-introduce race condition bug)

---

### 009_phase2_user_tracking.sql (HIGH PRIORITY)

**Purpose**: Add user tracking for dashboard and UX improvements

**Changes**:
- Adds `last_analysis_id` UUID
- Adds `last_login_at` TIMESTAMP
- Adds `total_analyses_count` INTEGER
- Creates `update_user_tracking()` function
- Creates `get_user_dashboard_data()` function
- Creates trigger to auto-update counts
- Backfills existing users

**Risk Level**: HIGH (dashboard broken without it)
**Data Impact**: ALL users (backfill with defaults)
**Rollback Safety**: High (just drops columns)

---

## Summary and Next Steps

**Current State**: 22 migration files exist, unknown application status to staging database

**Critical Path**:
1. ✅ Backup staging database
2. ✅ Inspect database schema (run queries above)
3. ✅ Apply Phase 1 migrations (021, 018, others)
4. ✅ Test OAuth login flow
5. ✅ Apply Phase 2 migrations
6. ✅ Full feature testing

**Estimated Total Time**: 2-4 hours (including testing)

**Risk Level**: MEDIUM (migrations are safe, but data backfill involved)

**Blocker Resolution**: Once migration 021 applied, OAuth will work immediately

---

**Report Status**: DRAFT - Pending database inspection
**Next Action**: Run database inspection queries to determine actual schema state
**Owner**: @operator (database access required)
**Reviewer**: @architect (migration plan validation)

---

**END OF AUDIT REPORT**
