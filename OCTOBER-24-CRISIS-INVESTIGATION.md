# October 24, 2025 - Production Database Crisis Investigation

**Status**: 🚨 CRITICAL - IN PROGRESS
**Started**: 2025-10-24
**Priority**: P0 - BLOCKING PRODUCTION

---

## Executive Summary

**Problem**: Production system crashed due to database schema mismatch.

**Initial Report**: "Production system doesn't have the database columns that were in staging"

**Actual Finding**: More complex - infrastructure misconfiguration combined with unapplied migrations.

**Current Status**: Investigation complete, awaiting user confirmation before applying fixes.

---

## Investigation Timeline

### 1. Initial CLAUDE.md Error Discovery
- **Time**: 2025-10-24 06:11
- **Issue**: CLAUDE.md had database mappings BACKWARDS
- **Error**: Listed production as `pdmtvkcxnqysujnpcnyh` labeled as "staging"
- **Impact**: Caused confusion about which database was which

### 2. CLAUDE.md Correction
- **Action**: Fixed database mappings in CLAUDE.md
- **Correct Mappings**:
  - **PRODUCTION**: `pdmtvkcxnqysujnpcnyh.supabase.co` (aimpactscanner-mvp)
  - **STAGING**: `isgzvwpjokcmtizstwru.supabase.co` (impactscanner-staging)

### 3. Database Schema Inspection
- **Production Database** (`pdmtvkcxnqysujnpcnyh`):
  - 56 columns in users table
  - **MISSING**: `is_first_login`, `auth_provider`, `selected_tier`, `signup_source`, `stripe_subscription_id`
  - **0 migrations applied** (no migration tracking table exists)

- **Staging Database** (`isgzvwpjokcmtizstwru`):
  - 56 columns in users table (different columns than production)
  - **HAS ALL 5**: Migration 021 columns present
  - **0 migrations applied** (no migration tracking table exists)

### 4. Critical Discovery: netlify.toml Misconfiguration
- **File**: `netlify.toml` line 54
- **Configuration**:
  ```toml
  [context.deploy-preview.environment]
    VITE_SUPABASE_URL = "https://pdmtvkcxnqysujnpcnyh.supabase.co"
  ```
- **Problem**: Deploy previews (develop branch) point to PRODUCTION database
- **Expected**: Should point to staging database (`isgzvwpjokcmtizstwru`)

---

## Root Cause Analysis

### What Actually Happened

1. **Oct 2, 2025**: Migration 021 created with OAuth code (commit `6d6d519`)
   - Added columns: `is_first_login`, `auth_provider`, `selected_tier`, `signup_source`, `stripe_subscription_id`

2. **Oct 13, 2025**: Staging database created (`isgzvwpjokcmtizstwru`)
   - Documented in CLAUDE.md (commit `b4480e3`)
   - BUT: netlify.toml was never updated to use it

3. **Oct 13-22, 2025**: Development period
   - Developers thought they were testing on staging
   - **Actually using**: Production database (`pdmtvkcxnqysujnpcnyh`) via netlify.toml
   - Migration 021 never applied to production (code expects it but DB doesn't have it)

4. **Unknown Date**: Someone manually applied migration 021 to `isgzvwpjokcmtizstwru`
   - This database has the columns
   - But this database wasn't being used by the app

5. **Oct 22, 2025**: Production deployment (commit `fb9d20a`)
   - Code with migration 021 dependencies merged to main
   - Production database STILL missing migration 021 columns
   - OAuth code expects columns that don't exist

6. **Oct 24, 2025**: Production crashes
   - OAuth queries fail: "column is_first_login does not exist"
   - User reports the issue
   - Investigation begins

### The Core Problem

**Infrastructure Mismatch**:
- Code developed thinking it was using staging database
- But netlify.toml pointed to production database all along
- Migration 021 never applied to production database
- Staging database (`isgzvwpjokcmtizstwru`) exists but was never actually used

**Result**: Production database schema out of sync with code expectations.

---

## Critical Questions Needing Answers

Before applying any fixes, we need to understand:

1. **Which database is Netlify ACTUALLY using?**
   - Does Netlify environment variables override netlify.toml?
   - Can we verify via Netlify dashboard what database the app uses?

2. **Has production database been modified during "staging" testing?**
   - If netlify.toml pointed develop branch to production...
   - Then all "staging" testing was on production database
   - What damage was done?

3. **When was migration 021 applied to `isgzvwpjokcmtizstwru`?**
   - Who applied it?
   - Why does it have the columns if it wasn't being used?

4. **What is the actual production state?**
   - Do production users currently exist?
   - What tier are they on?
   - Will applying migration 021 break anything?

---

## Database Inspection Results

### Production Database Inspection

**Database**: `pdmtvkcxnqysujnpcnyh.supabase.co`

**Query 1 Result**: `is_first_login` column does NOT exist
**Query 2 Result**: 56 columns total (see detailed list below)
**Query 3 Result**: ERROR - `supabase_migrations.schema_migrations` table doesn't exist
**Query 4 Result**: ERROR - `supabase_migrations.schema_migrations` table doesn't exist

**Missing Columns** (from migration 021):
1. `is_first_login` (BOOLEAN DEFAULT true) - **CRITICAL BLOCKER**
2. `auth_provider` (TEXT)
3. `selected_tier` (TEXT DEFAULT 'free')
4. `signup_source` (TEXT)
5. `stripe_subscription_id` (TEXT)

### Staging Database Inspection

**Database**: `isgzvwpjokcmtizstwru.supabase.co`

**Query 1 Result**: `is_first_login` column EXISTS ✅
**Query 2 Result**: 56 columns total including all 5 from migration 021 ✅
**Query 3 Result**: ERROR - `supabase_migrations.schema_migrations` table doesn't exist
**Query 4 Result**: ERROR - `supabase_migrations.schema_migrations` table doesn't exist

**Has All Columns** from migration 021:
1. ✅ `is_first_login` (boolean, default: true)
2. ✅ `auth_provider` (text, null)
3. ✅ `selected_tier` (text, default: 'free')
4. ✅ `signup_source` (text, null)
5. ✅ `stripe_subscription_id` (text, null)

---

## Code Dependencies Broken

### Files That Crash Without Migration 021

1. **src/utils/authRouting.js** (Lines 247, 354)
   ```javascript
   if (user?.is_first_login === true) {
     await markFirstLoginComplete(user.id);
   }
   // ❌ FAILS: column "is_first_login" does not exist
   ```

2. **src/components/OAuthCallback.jsx** (Lines 153, 216, 224)
   ```javascript
   const userData = {
     is_first_login: true,  // ❌ FAILS
     auth_provider: authProvider,  // ❌ FAILS
     selected_tier: selectedTier,  // ❌ FAILS
     signup_source: authContext?.mode === 'signup' ? 'oauth' : 'login'  // ❌ FAILS
   }
   ```

**Impact**: ALL OAuth logins crash immediately in production.

---

## Proposed Solutions

### Option 1: Apply Migration 021 to Production (RISKY)

**Steps**:
1. Backup production database
2. Apply migration 021 SQL
3. Verify columns exist
4. Test OAuth login

**Risks**:
- Don't know true state of production database
- May have been modified during "staging" testing via netlify misconfiguration
- Could corrupt existing user data if assumptions wrong

**Status**: NOT RECOMMENDED until we understand actual production state

### Option 2: Investigate Infrastructure First (RECOMMENDED)

**Steps**:
1. Check Netlify dashboard environment variables
2. Verify which database the app ACTUALLY uses
3. Review Netlify deploy logs for Oct 13-22 period
4. Understand if `isgzvwpjokcmtizstwru` was ever actually used
5. THEN decide on migration strategy

**Benefits**:
- Understand actual system state before making changes
- Prevent additional corruption
- Make informed decision based on facts

**Status**: AWAITING USER INPUT

### Option 3: Rollback Code to Before Migration 021

**Steps**:
1. Revert production code to commit before migration 021
2. Remove code dependencies on migration 021 columns
3. Deploy rollback
4. Plan proper migration deployment process

**Risks**:
- Loses all Oct 2-22 work
- OAuth features won't work
- Phase 1 signup fixes lost

**Status**: Last resort if Option 2 fails

---

## Documents Created

1. ✅ `/SCHEMA-DRIFT-AUDIT-REPORT.md` - Complete migration analysis (670 lines)
2. ✅ `/URGENT-DATABASE-MIGRATION-REQUIRED.md` - User-facing action plan (249 lines)
3. ✅ `/DATABASE-INSPECTION-QUERIES.sql` - Diagnostic SQL queries
4. ✅ `/FORENSIC-TIMELINE-ANALYSIS.md` - Git history analysis
5. ✅ `/PRODUCTION-EMERGENCY-RECOVERY-PLAN.md` - Recovery procedures (prepared but not vetted)
6. ✅ `/PRODUCTION-VS-STAGING-COMPARISON-REPORT.md` - Database comparison (delegated to operator)
7. ✅ `/OCTOBER-24-CRISIS-INVESTIGATION.md` - This file (master investigation log)

---

## Critical Decisions Needed

### User Must Confirm

1. **Check Netlify Environment Variables**
   - Dashboard → Site Settings → Environment Variables
   - What is `VITE_SUPABASE_URL` set to for `develop` branch?
   - Does it override netlify.toml?

2. **Verify Actual Database Usage**
   - Which database was the develop branch using Oct 13-22?
   - Can we check Supabase logs to see connection patterns?

3. **Production User Impact**
   - How many users are in production?
   - When did last successful OAuth login occur?
   - Are there active Coffee tier subscribers?

4. **Risk Tolerance**
   - Apply migration 021 blindly and hope for best? (fast but risky)
   - Investigate thoroughly first? (slow but safe)
   - Rollback code entirely? (safest but loses work)

---

## Next Actions (Awaiting User)

**BLOCKED**: Cannot proceed without user input on:

1. Netlify environment variable verification
2. Decision on investigation depth vs speed
3. Risk tolerance for production database changes
4. Access to Netlify deployment logs

**User to provide**:
- Netlify dashboard screenshots of environment variables
- Confirmation of which option to pursue (1, 2, or 3)
- Production database access credentials (if needed for further inspection)

---

## Lessons Learned (Preliminary)

1. **CLAUDE.md Must Be Accurate**: Incorrect database mappings caused confusion
2. **netlify.toml Must Match Documentation**: Misconfiguration hid true database usage
3. **Migration Tracking Essential**: No way to verify which migrations are applied
4. **Deployment Process Broken**: Code promoted without database migrations
5. **Staging Testing Invalid**: If netlify.toml wrong, all testing was on wrong database

---

## Status: INVESTIGATION COMPLETE, AWAITING USER DECISION

**Investigation By**: THE COORDINATOR (AGENT-11)
**Date**: 2025-10-24
**Time Spent**: 3 hours
**Files Analyzed**: CLAUDE.md, netlify.toml, git history, both databases
**Migrations Analyzed**: 22 migration files
**Recommendation**: Pursue Option 2 (investigate infrastructure first) before applying any database changes

---

**END OF INVESTIGATION LOG**
