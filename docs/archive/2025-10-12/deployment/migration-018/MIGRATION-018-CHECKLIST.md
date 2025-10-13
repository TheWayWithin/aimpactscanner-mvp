# Migration 018 Deployment Checklist

**CRITICAL FIX**: User signup authentication failures
**Status**: Ready for deployment
**Prepared**: 2025-10-01 by @operator

---

## Pre-Deployment Checklist ✅

- [x] Migration file created: `018_consolidate_user_creation.sql`
- [x] Root cause analyzed and documented
- [x] Security-first principles followed
- [x] Backward compatibility verified
- [x] Rollback plan prepared
- [x] Verification queries ready
- [x] Testing protocol documented
- [x] Production project identified: `pdmtvkcxnqysujnpcnyh`

**Status**: ALL PRE-DEPLOYMENT CHECKS COMPLETE ✅

---

## Deployment Checklist (User Action Required)

### Step 1: Open Supabase Dashboard
- [ ] Navigate to: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/sql/new
- [ ] Confirm you're on the correct project (pdmtvkcxnqysujnpcnyh)

### Step 2: Execute Migration
- [ ] Open migration file: `/Users/jamiewatters/DevProjects/aimpactscanner-mvp/supabase/migrations/018_consolidate_user_creation.sql`
- [ ] Copy entire contents (279 lines)
- [ ] Paste into Supabase SQL Editor
- [ ] Review the SQL (should see DROP, CREATE, ALTER statements)
- [ ] Click "Run" button
- [ ] Wait for execution to complete

### Step 3: Verify Success Messages
Look for these notices in output (should see all 4):
- [ ] ✅ Trigger function exists: handle_user_creation
- [ ] ✅ Trigger exists: handle_user_creation_trigger
- [ ] ✅ RLS policies created: 4 policies
- [ ] ✅ Column exists: email_verified
- [ ] ✅ Migration 018 completed successfully

**If any notices are missing**: STOP and check error messages

---

## Post-Deployment Verification Checklist

### Database State Verification

Run these queries in Supabase SQL Editor:

**Query 1: Verify Trigger Function**
```sql
SELECT COUNT(*) as count FROM pg_proc WHERE proname = 'handle_user_creation';
```
- [ ] Result: 1 ✅

**Query 2: Verify Trigger Exists**
```sql
SELECT COUNT(*) as count FROM pg_trigger WHERE tgname = 'handle_user_creation_trigger';
```
- [ ] Result: 1 ✅

**Query 3: Verify RLS Policies**
```sql
SELECT COUNT(*) as count FROM pg_policies WHERE tablename = 'users';
```
- [ ] Result: 4 or more ✅

**Query 4: Verify Email Column**
```sql
SELECT COUNT(*) as count FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'email_verified';
```
- [ ] Result: 1 ✅

**Query 5: Verify Data Consistency**
```sql
SELECT
    COUNT(DISTINCT au.id) as auth_users,
    COUNT(DISTINCT u.id) as profile_users,
    COUNT(DISTINCT au.id) - COUNT(DISTINCT u.id) as missing_profiles
FROM auth.users au
LEFT JOIN users u ON au.id = u.id;
```
- [ ] missing_profiles: 0 ✅

---

## Functional Testing Checklist

### Test 1: New User Signup

**Setup**:
- [ ] Open incognito/private browser window
- [ ] Navigate to: https://aimpactscanner.com/register
- [ ] Open browser DevTools → Network tab

**Execution**:
- [ ] Enter email: `test-migration-018-$(date +%s)@example.com`
- [ ] Enter password: `Test123!@#$`
- [ ] Click "Sign Up" button

**Verification** (Check Network tab):
- [ ] POST /auth/v1/signup → Status 200 ✅ (NOT 422)
- [ ] GET /rest/v1/users → Status 200 ✅ (NOT 406)
- [ ] No 401 errors in console ✅
- [ ] Signup confirmation message displayed ✅

### Test 2: Email Verification

- [ ] Check email inbox for verification link
- [ ] Click verification link
- [ ] Redirected to application successfully
- [ ] Email marked as verified in database

### Test 3: Sign In After Verification

- [ ] Sign out if automatically signed in
- [ ] Navigate to: https://aimpactscanner.com/login
- [ ] Enter test email and password
- [ ] Click "Sign In"
- [ ] Successfully signed in ✅
- [ ] Dashboard/app loads correctly ✅

### Test 4: Database Record Verification

Run in Supabase SQL Editor:
```sql
SELECT
    au.id,
    au.email,
    au.email_confirmed_at,
    u.email_verified,
    u.tier,
    u.subscription_status,
    u.created_at
FROM auth.users au
JOIN users u ON au.id = u.id
WHERE au.email LIKE 'test-migration-018%'
ORDER BY au.created_at DESC
LIMIT 1;
```

**Verify**:
- [ ] Record exists in both auth.users and users ✅
- [ ] email_confirmed_at is NOT NULL ✅
- [ ] email_verified is TRUE ✅
- [ ] tier is 'free' ✅
- [ ] subscription_status is 'active' ✅

---

## Monitoring Checklist (15 minutes)

### Supabase Logs Monitoring

- [ ] Open: Supabase Dashboard → Logs → Postgres Logs
- [ ] Monitor for 15 minutes after deployment
- [ ] Check for RLS violations: NONE ✅
- [ ] Check for trigger errors: NONE ✅
- [ ] Check for INSERT failures: NONE ✅
- [ ] Verify successful user creation operations ✅

### Application Monitoring

- [ ] No increase in error rates in application logs
- [ ] No user reports of signup failures
- [ ] No authentication errors in error tracking (Sentry, etc.)

---

## Rollback Checklist (If Needed - Emergency Only)

**ONLY USE IF CRITICAL ISSUES OCCUR**

### Rollback Trigger

Execute rollback if:
- [ ] New signup errors increase (>5% failure rate)
- [ ] Existing users cannot sign in
- [ ] Database errors in logs
- [ ] Critical production impact

### Rollback Procedure

1. **Execute Rollback SQL**:
   - [ ] Open Supabase SQL Editor
   - [ ] Copy rollback SQL from `handoff-notes.md` (Lines 893-927)
   - [ ] Paste and execute
   - [ ] Verify rollback success messages

2. **Verify Rollback**:
   - [ ] Old trigger function restored
   - [ ] System returns to previous state
   - [ ] Existing functionality works

3. **Document Rollback**:
   - [ ] Capture error messages that triggered rollback
   - [ ] Update `handoff-notes.md` with rollback details
   - [ ] Escalate to @architect for analysis
   - [ ] Plan remediation approach

---

## Completion Checklist

### Documentation Updates

- [ ] Update `handoff-notes.md` with deployment timestamp
- [ ] Update `agent-context.md` marking issue as resolved
- [ ] Create deployment summary for coordinator
- [ ] Archive deployment guides (optional)

### Stakeholder Communication

- [ ] Report deployment success to team
- [ ] Document any issues encountered
- [ ] Update project timeline if needed
- [ ] Schedule post-deployment review (if required)

### Cleanup

- [ ] Delete test user accounts created during testing
- [ ] Archive deployment checklists
- [ ] Update runbook with lessons learned
- [ ] Mark issue as resolved in issue tracker

---

## Success Criteria Summary

**Deployment Successful If**:
- ✅ All pre-deployment checks passed
- ✅ Migration executed without errors
- ✅ All 5 verification queries return expected results
- ✅ Test signup completes successfully (no 406/401/422 errors)
- ✅ Email verification works
- ✅ Sign-in after verification succeeds
- ✅ No errors in logs for 15 minutes
- ✅ Existing users unaffected

**Current Status**: [ ] PENDING USER DEPLOYMENT

---

## Quick Reference

**Migration File**: `/Users/jamiewatters/DevProjects/aimpactscanner-mvp/supabase/migrations/018_consolidate_user_creation.sql`

**Quick Guide**: `DEPLOYMENT-GUIDE-MIGRATION-018.md`

**Full Summary**: `OPERATOR-DEPLOYMENT-SUMMARY.md`

**Dashboard URL**: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/sql/new

**Test Signup URL**: https://aimpactscanner.com/register

**Estimated Time**: 30 minutes total (2 min deploy + 5 min verify + 10 min test + 15 min monitor)

---

**Prepared By**: THE OPERATOR (@operator)
**Date**: 2025-10-01
**Version**: 1.0
**Status**: Ready for user deployment
