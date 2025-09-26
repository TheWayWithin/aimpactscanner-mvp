# CRITICAL DASHBOARD ISSUES & TEMPORARY WORKAROUNDS

## ISSUES IDENTIFIED

### 1. **MISSING OVERALL_SCORE COLUMN** ❌
- The `analyses` table is missing the `overall_score` column 
- Application is likely expecting this column to exist
- **Workaround**: Extract from JSON: `CAST(scores->>'overall' AS INTEGER)`

### 2. **DATABASE PERFORMANCE ISSUES** ⚠️
- Missing critical index on `analyses.user_id` (causes timeouts with large datasets)
- Multiple unindexed foreign keys flagged by Supabase advisor
- **Current performance**: Small datasets work (~0.2ms), but will degrade with scale

### 3. **USER TIER INCONSISTENCY** ❌
- User `e8fda207-946e-48dc-87c4-909cfde3f543` has:
  - `tier: "coffee"` (correct)  
  - `subscription_tier: "free"` (incorrect)
- Dashboard showing "Free" instead of "Coffee"

### 4. **INCOMPLETE ANALYSES** ❌
- Many analyses stuck in `processing` status with empty scores `{}`
- Suggests analysis engine issues, not just database schema issues

### 5. **SECURITY VULNERABILITY** 🔒
- `subscriptions` table has RLS disabled (flagged by Supabase)

## IMMEDIATE TEMPORARY WORKAROUNDS

### Frontend/Application Layer Fixes:

1. **Extract overall_score from JSON:**
```sql
-- Replace queries expecting overall_score column with:
SELECT 
    id,
    url, 
    CAST(scores->>'overall' AS INTEGER) as overall_score,
    created_at
FROM analyses 
WHERE user_id = $1 
AND status = 'completed'
AND scores != '{}'::jsonb
ORDER BY created_at DESC;
```

2. **Use correct tier field:**
```sql  
-- Use 'tier' field instead of 'subscription_tier' for display:
SELECT tier as user_tier FROM users WHERE id = $1;
```

3. **Filter out incomplete analyses:**
```sql
-- Only show completed analyses with actual scores:
WHERE status = 'completed' AND scores != '{}'::jsonb
```

### Database Connection Optimization:
- Add connection pooling if not already present
- Consider read replicas for dashboard queries
- Implement query timeouts and retries

## REQUIRED DATABASE FIXES (NEEDS ADMIN ACCESS)

**Run the SQL in `URGENT_DATABASE_FIXES.sql` with service_role or database admin privileges.**

### Priority Order:
1. **Add overall_score column** (fixes dashboard data display)
2. **Add user_id index** (fixes query timeouts) 
3. **Fix user tier consistency** (fixes tier display)
4. **Add remaining performance indexes** (prevents future scaling issues)
5. **Enable RLS on subscriptions** (fixes security vulnerability)

## ANALYSIS ENGINE ISSUES

The dashboard issues may be secondary to analysis engine problems:

### Signs of Analysis Engine Problems:
- Multiple analyses stuck in `processing` status
- Empty scores objects `{}`  
- No completion of recent analyses

### Recommended Investigation:
1. Check analysis engine logs for errors
2. Verify Edge Functions are running properly
3. Check for timeout issues in analysis pipeline
4. Monitor analysis completion rates

## PERFORMANCE IMPACT ASSESSMENT

### Current State:
- ✅ Small datasets: ~0.2ms query time
- ❌ Missing indexes will cause timeouts at scale
- ❌ Sequential scans instead of index usage
- ❌ RLS policy performance warnings

### After Fixes:
- **Expected 80-95% performance improvement**
- Proper index usage for all user queries
- Consistent tier display across application
- Secure RLS policies on all tables

## IMMEDIATE ACTION PLAN

1. **Deploy application workarounds** (can do now)
2. **Apply database fixes** (requires admin access) 
3. **Investigate analysis engine** (may be root cause)
4. **Monitor dashboard performance** after fixes
5. **Implement query monitoring** for early warning

---

**Status: CRITICAL - Multiple blocking issues identified**  
**ETA with fixes: 30 minutes for database changes + analysis engine investigation**