# Migration 018 Deployment Guide

**CRITICAL DATABASE FIX**: Resolves all user signup failures (406, 401, 422 errors)

---

## Quick Start (60 Seconds)

### Step 1: Open Supabase SQL Editor
Navigate to: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/sql/new

### Step 2: Copy Migration SQL
Copy the entire contents of: `/Users/jamiewatters/DevProjects/aimpactscanner-mvp/supabase/migrations/018_consolidate_user_creation.sql`

### Step 3: Paste and Run
1. Paste into SQL Editor
2. Click "Run" button
3. Wait for execution (30-60 seconds)

### Step 4: Verify Success
Look for these messages in the output:
```
✅ Trigger function exists: handle_user_creation
✅ Trigger exists: handle_user_creation_trigger
✅ RLS policies created: 4 policies
✅ Column exists: email_verified
Migration 018 completed successfully
```

### Step 5: Test Signup
1. Go to: https://aimpactscanner.com/register
2. Create test account with email: test-[your-name]@example.com
3. Verify signup succeeds (no 406/401 errors)
4. Check email for verification link
5. Complete email verification
6. Sign in successfully

---

## What This Migration Does

**Problem Solved**: Two conflicting database triggers were racing to create user profiles, causing signup failures.

**The Fix**:
- ✅ Removes duplicate triggers from migrations 010 and 017
- ✅ Creates single authoritative trigger `handle_user_creation()`
- ✅ Simplifies RLS policies to eliminate conflicts
- ✅ Adds email_verified column tracking
- ✅ Backfills existing user data

**Impact**:
- New signups will work immediately
- Existing users completely unaffected
- Email verification flow restored
- Zero downtime deployment

---

## Verification Queries

Run these in Supabase SQL Editor after deployment:

```sql
-- Quick verification (all should return results)
SELECT COUNT(*) FROM pg_proc WHERE proname = 'handle_user_creation';
SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'handle_user_creation_trigger';
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'users';

-- Detailed verification
SELECT
    COUNT(DISTINCT au.id) as auth_users,
    COUNT(DISTINCT u.id) as profile_users,
    COUNT(DISTINCT au.id) - COUNT(DISTINCT u.id) as missing_profiles
FROM auth.users au
LEFT JOIN users u ON au.id = u.id;
```

**Expected**:
- Function count: 1
- Trigger count: 1
- Policy count: 4
- Missing profiles: 0

---

## Rollback (Emergency Only)

If critical issues occur, run this SQL to rollback:

```sql
DROP TRIGGER IF EXISTS handle_user_creation_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.handle_user_creation();

-- Then restore previous trigger from migration 017
-- (See handoff-notes.md for full rollback procedure)
```

---

## Support

- **Full Documentation**: See `/handoff-notes.md` for complete analysis
- **Architecture Analysis**: See `/agent-context.md` for root cause details
- **Migration File**: `/supabase/migrations/018_consolidate_user_creation.sql`

**Questions?** This migration was created by @architect and prepared for deployment by @operator.

---

**Deployment Time**: ~2 minutes
**Risk Level**: LOW (backward compatible)
**Impact**: CRITICAL FIX (resolves complete auth system failure)
