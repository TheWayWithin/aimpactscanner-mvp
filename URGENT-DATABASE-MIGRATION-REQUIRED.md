# 🚨 URGENT: Database Migration Required

**Date**: 2025-10-24
**Severity**: CRITICAL
**Issue**: OAuth login completely broken in staging
**Cause**: Database schema out of sync with codebase

---

## The Problem (In Plain English)

Your code expects a database column called `is_first_login` to exist in the `users` table, but **it doesn't exist** in the staging database. This causes **every OAuth login attempt to fail immediately**.

This happened because:
1. Code was promoted to staging ✅
2. Database migrations were NOT run ❌
3. Code expects columns that don't exist = instant failure

---

## Impact

- ❌ **ALL OAuth logins fail** (Google, GitHub)
- ❌ New user signups broken
- ❌ Returning user logins broken
- ❌ Dashboard features degraded (missing tracking data)
- ❌ Tier management inconsistent

**Bottom Line**: Authentication is completely broken on staging.

---

## The Fix (Step by Step)

### Step 1: Backup Database (5 minutes)

**CRITICAL**: Do this FIRST before any changes

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select: `impactscanner-staging` project
3. Navigate to: **Database** → **Backups**
4. Click: **Create backup**
5. Wait for backup to complete
6. ✅ Verify backup shows "Success"

**Why**: If anything goes wrong, you can restore from backup

---

### Step 2: Inspect Current Schema (10 minutes)

**Purpose**: Find out exactly which migrations have been applied

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select: `impactscanner-staging` project
3. Navigate to: **SQL Editor**
4. Open the file: `/DATABASE-INSPECTION-QUERIES.sql` from this repo
5. Copy/paste the **QUICK HEALTH CHECK** section (at the bottom of the file)
6. Click **Run**
7. Read the output - it will tell you what's missing

**Expected Output**:
```
===========================================
DATABASE HEALTH CHECK
===========================================
Migrations Applied: 0-15 (Expected: 22)
is_first_login Exists: false (Expected: true) ❌
User Creation Triggers: 2 (Expected: 1) ⚠️
RLS Policies on users: 8 (Expected: 4) ⚠️
===========================================
❌ CRITICAL: Missing migrations! Apply missing migrations.
❌ CRITICAL: is_first_login column missing! OAuth will fail.
===========================================
```

---

### Step 3: Apply Critical Migrations (15 minutes)

**These migrations MUST be applied immediately to fix OAuth**

#### Option A: Use Supabase CLI (Recommended - Idempotent)

```bash
# From project root directory
cd /Users/jamiewatters/DevProjects/aimpactscanner-mvp

# Apply all migrations (Supabase CLI is smart - won't re-apply existing ones)
supabase db push --db-url "postgresql://postgres:[YOUR_PASSWORD]@pdmtvkcxnqysujnpcnyh.supabase.co:5432/postgres"
```

**Where to get password**: Supabase Dashboard → Settings → Database → Connection String

#### Option B: Manual SQL Execution (Safer for first time)

1. Go to Supabase Dashboard → SQL Editor
2. Run these migrations **IN THIS EXACT ORDER**:

**Phase 1: Critical Blockers (Run These Now)**

```sql
-- Migration 1: Create analysis tables
-- Copy/paste content from: supabase/migrations/002_analysis_tables.sql
-- Click Run

-- Migration 2: Coffee tier infrastructure
-- Copy/paste content from: supabase/migrations/005_coffee_tier_infrastructure.sql
-- Click Run

-- Migration 3: User profile creation
-- Copy/paste content from: supabase/migrations/010_enable_email_password_auth.sql
-- Click Run

-- Migration 4: Fix trigger conflicts
-- Copy/paste content from: supabase/migrations/018_consolidate_user_creation.sql
-- Click Run

-- Migration 5: Add OAuth columns (THE CRITICAL ONE)
-- Copy/paste content from: supabase/migrations/021_auth_tier_columns.sql
-- Click Run
```

**After each migration**:
- Check for errors in SQL Editor output
- If you see "✅" success messages, continue to next migration
- If you see "❌" errors, STOP and screenshot the error

---

### Step 4: Verify OAuth Works (10 minutes)

1. Go to: https://develop--aimpactscanner.netlify.app/#signup
2. Select a tier (Free or Coffee)
3. Click "Continue with Google"
4. Complete OAuth flow
5. ✅ **Success**: You should reach the dashboard (not error page)

**If OAuth still fails**:
- Check browser console for errors
- Check Supabase logs: Dashboard → Logs → Postgres Logs
- Run the health check query again (Step 2)

---

### Step 5: Apply Remaining Migrations (30 minutes)

**Once OAuth is working**, apply the remaining migrations for full functionality:

**Phase 2: User Experience Fixes**
- `009_phase2_user_tracking.sql` (dashboard tracking)
- `012_add_missing_users.sql` (backfill users)
- `013_fix_users_table_schema.sql` (schema fixes)
- `014_sync_tier_columns.sql` (tier sync)
- `016_fix_service_role_users_access.sql` (permissions)
- `020_fix_rls_for_signup.sql` (RLS policies)

**Phase 3: Optional Features**
- All remaining migration files (can be done later)

---

## How to Prevent This in the Future

### Deployment Checklist (Add to CI/CD)

Before promoting code to staging:

1. ✅ Run database migrations first
2. ✅ Verify schema matches code expectations
3. ✅ Test authentication flow
4. ✅ Then promote code

### Automated Migration Check

Add this to your deployment script:

```bash
# Check if migrations need to be applied
migration_count=$(supabase db diff --db-url $STAGING_DB_URL | wc -l)

if [ $migration_count -gt 0 ]; then
  echo "❌ MIGRATIONS PENDING - Cannot deploy code yet"
  echo "Run: supabase db push first"
  exit 1
fi
```

---

## Quick Reference

### Files Created
- `/SCHEMA-DRIFT-AUDIT-REPORT.md` - Complete technical analysis
- `/DATABASE-INSPECTION-QUERIES.sql` - SQL diagnostic queries
- `/URGENT-DATABASE-MIGRATION-REQUIRED.md` - This file (action plan)

### Key Migrations
- **021_auth_tier_columns.sql** - Adds `is_first_login` column ⚠️ CRITICAL
- **018_consolidate_user_creation.sql** - Fixes user creation triggers
- **009_phase2_user_tracking.sql** - Adds dashboard tracking

### Database Info
- **Staging DB**: `impactscanner-staging` (pdmtvkcxnqysujnpcnyh.supabase.co)
- **Environment**: https://develop--aimpactscanner.netlify.app
- **Safe to modify**: YES (staging/testing database)

### Support Resources
- Supabase Dashboard: https://supabase.com/dashboard
- Supabase Docs: https://supabase.com/docs/guides/database/migrations
- Migration Files: `/Users/jamiewatters/DevProjects/aimpactscanner-mvp/supabase/migrations/`

---

## Summary Timeline

| Time | Task | Status |
|------|------|--------|
| 0:00 | Backup database | ⏳ TODO |
| 0:05 | Run health check query | ⏳ TODO |
| 0:15 | Apply Phase 1 migrations (5 files) | ⏳ TODO |
| 0:30 | Test OAuth signup/login | ⏳ TODO |
| 0:40 | Apply Phase 2 migrations (6 files) | ⏳ TODO |
| 1:10 | Test dashboard features | ⏳ TODO |
| 1:20 | Apply Phase 3 migrations (optional) | ⏳ TODO |

**Total Time**: 1-2 hours (including testing)

---

## Questions?

If you encounter errors:
1. Check the error message in Supabase SQL Editor
2. Screenshot the error
3. Check `/SCHEMA-DRIFT-AUDIT-REPORT.md` for detailed migration info
4. Check Supabase logs: Dashboard → Logs → Postgres Logs

**Common Issues**:
- "Column already exists" → Safe to ignore (migration already applied)
- "Permission denied" → Check you're logged into correct Supabase project
- "Trigger already exists" → Safe to ignore (migration already applied)

---

**Created by**: THE ARCHITECT (AGENT-11)
**Date**: 2025-10-24
**Priority**: 🚨 URGENT - OAuth completely broken until fixed
