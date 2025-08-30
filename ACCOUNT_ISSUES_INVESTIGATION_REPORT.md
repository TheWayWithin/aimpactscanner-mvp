# Account Page Issues Investigation Report
## Date: August 29, 2025
## User: jamie.watters.mail@icloud.com (ID: e8fda207-946e-48dc-87c4-909cfde3f543)

## Issues Reported
1. "Manage Subscription" button fails with 400 error
2. "Analyses used this month" shows 0 (incorrect count)

## Root Cause Analysis

### Issue 1: Create-Portal-Session 400 Error

**Primary Cause: Missing Service Role Policy**
- The `users` table lacks RLS policy allowing service role to read user data
- Edge Function `create-portal-session` cannot retrieve `stripe_customer_id` from database
- Error sequence:
  1. User clicks "Manage Subscription" → AccountDashboard.handleManageSubscription()
  2. Calls `supabase.functions.invoke('create-portal-session')`
  3. Edge Function tries to query `users` table for `stripe_customer_id`
  4. RLS policy blocks query (no service role access)
  5. Function throws "No active subscription found" error
  6. Returns 400 status

**Secondary Cause: Truncated Stripe Customer ID**
- User's `stripe_customer_id` is truncated: `"cus_00de545e-ed33-"` (18 chars)
- Normal Stripe customer IDs: `"cus_SsiSi0fBjDHA7T"` (18 chars but complete)
- Even if RLS is fixed, truncated ID would fail Stripe API calls

**Evidence:**
```sql
-- Current RLS policies (missing service role)
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users';
-- Results: Only user-based policies, no service role policy

-- Truncated customer ID
SELECT stripe_customer_id, LENGTH(stripe_customer_id) 
FROM users WHERE email = 'jamie.watters.mail@icloud.com';
-- Result: "cus_00de545e-ed33-", length: 18 (truncated)
```

### Issue 2: Analysis Count Showing 0

**Root Cause: RLS Policy Blocking Analysis Queries**
- Same RLS issue affects `analyses` table queries
- AccountDashboard component cannot fetch user's analysis records
- Database actually contains 10 analyses for this user (all status: 'processing')

**Evidence:**
```sql
-- Analyses exist but component can't fetch them
SELECT COUNT(*) FROM analyses WHERE user_id = 'e8fda207-946e-48dc-87c4-909cfde3f543';
-- Result: 10 analyses found

-- But RLS blocks client-side queries
-- Component falls back to localStorage-based counting (shows 0)
```

## Database State Analysis

### User Record
```json
{
  "id": "e8fda207-946e-48dc-87c4-909cfde3f543",
  "email": "jamie.watters.mail@icloud.com",
  "tier": "coffee",
  "stripe_customer_id": "cus_00de545e-ed33-", // ❌ TRUNCATED
  "subscription_status": "active",
  "monthly_analyses_used": 0,
  "total_analyses_count": 0
}
```

### Subscription Record
```json
{
  "user_id": "e8fda207-946e-48dc-87c4-909cfde3f543",
  "tier": "coffee",
  "stripe_subscription_id": "sub_5b8e1cde-940f-49ee-b11a-", // ❌ ALSO TRUNCATED
  "status": "active",
  "current_period_end": "2025-09-24 13:43:39.935445"
}
```

### Analysis Records
- **Total analyses:** 10 records
- **All status:** "processing" (stuck/incomplete)
- **Recent URLs:** freecalchub.com variations
- **Date range:** July 26-27, 2025

## Solutions Required

### 1. Apply Service Role Policies (HIGH PRIORITY)
```sql
-- Enable Edge Functions to access user data
CREATE POLICY "Service role can manage all users" ON users
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can manage analyses" ON analyses
  FOR ALL USING (current_setting('role') = 'service_role');
```

### 2. Fix Truncated Stripe IDs (HIGH PRIORITY)
**Action Required:** Check Stripe Dashboard
1. Find customer by email: `jamie.watters.mail@icloud.com`
2. Get complete customer ID (format: `cus_XXXXXXXXXXXXXXXXXX`)
3. Get complete subscription ID (format: `sub_XXXXXXXXXXXXXXXXXX`)
4. Update database with correct IDs

**Prevention:** Investigate TierManager.upgradeToCoffeeTier() function
- Check if truncation occurs during webhook processing
- Verify column lengths and data handling in upgrade process

### 3. Cleanup Processing Analyses (MEDIUM PRIORITY)
- 10 analyses stuck in "processing" status
- Need to determine if they completed successfully
- Update status to "completed" or "failed" as appropriate

## Implementation Steps

### Immediate (Apply service role policies)
1. Run migration: `fix-account-issues.sql`
2. Verify policy creation
3. Test create-portal-session function

### Within 24 hours (Fix Stripe IDs)
1. Access Stripe Dashboard
2. Locate customer and subscription records
3. Update database with complete IDs
4. Test subscription management flow

### Follow-up (Prevent future issues)
1. Investigate webhook processing for ID truncation
2. Add validation to TierManager for complete Stripe IDs
3. Implement analysis status cleanup job

## Testing Verification

After implementing fixes, verify:
```javascript
// 1. Service role can access user data
// 2. Create-portal-session returns valid URL
// 3. Analysis count displays correctly
// 4. Subscription management works end-to-end
```

## Files to Review/Modify
- `/supabase/functions/create-portal-session/index.ts` (Edge Function)
- `/supabase/functions/stripe-webhook/index.ts` (Webhook handler)
- `/supabase/functions/analyze-page/lib/TierManager.ts` (Tier management)
- `/src/components/AccountDashboard.jsx` (Frontend component)

## Prevention Measures
1. Add Stripe ID validation in webhook processing
2. Implement monitoring for truncated IDs
3. Add comprehensive RLS policy testing
4. Create database consistency checks

---

**Status:** Investigation Complete
**Next Actions:** Apply service role policies, fix Stripe IDs
**Priority:** HIGH - Affects subscription management functionality