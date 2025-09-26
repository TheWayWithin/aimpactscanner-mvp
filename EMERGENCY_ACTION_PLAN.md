# 🚨 EMERGENCY ACTION PLAN - CRITICAL PRODUCTION ISSUES

## CRITICAL FINDINGS

### 1. **DATABASE SCHEMA ISSUES** ❌
- Missing `overall_score` column in analyses table
- Missing critical performance indexes (causing timeouts)
- User tier inconsistency (Coffee tier showing as Free)

### 2. **ANALYSIS ENGINE FAILURE** 🔥 **ROOT CAUSE**
- **33% of analyses stuck in "processing" status** (40 out of 121 analyses)
- Empty scores objects `{}` indicate analysis engine not completing
- Latest stuck analysis: July 29th (analyses have been failing for days)

### 3. **DASHBOARD BREAKDOWN** 💥
- No data to display due to incomplete analyses
- Query timeouts due to missing indexes
- Incorrect user tier display

---

## IMMEDIATE EMERGENCY ACTIONS (NEXT 30 MINUTES)

### PHASE 1: QUICK FIXES (5 minutes)
```bash
# 1. Deploy application-level workarounds immediately
# Update dashboard queries to:
# - Extract overall_score from JSON: CAST(scores->>'overall' AS INTEGER)
# - Use 'tier' field instead of 'subscription_tier'  
# - Filter to only completed analyses: WHERE status = 'completed' AND scores != '{}'::jsonb
```

### PHASE 2: DATABASE FIXES (15 minutes)
**Run `URGENT_DATABASE_FIXES.sql` with service_role/admin privileges:**

```sql
-- CRITICAL INDEX (fixes timeouts)
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);

-- ADD MISSING COLUMN  
ALTER TABLE analyses ADD COLUMN overall_score INTEGER;
UPDATE analyses SET overall_score = CAST(scores->>'overall' AS INTEGER) WHERE scores->>'overall' IS NOT NULL;

-- FIX USER TIER
UPDATE users SET subscription_tier = 'coffee' WHERE id = 'e8fda207-946e-48dc-87c4-909cfde3f543';
```

### PHASE 3: ANALYSIS ENGINE INVESTIGATION (10 minutes)
**Investigate why 40 analyses are stuck in processing:**

1. **Check Edge Function logs:**
   ```bash
   # Check analyze-page function for errors
   supabase functions logs analyze-page
   ```

2. **Check for timeout issues:**
   - Edge Functions have 60-second timeout limit
   - Analysis engine processes 10 factors with 1-second delays each
   - Total expected time: ~20-30 seconds (should not timeout)

3. **Check for function deployment issues:**
   - Verify latest code is deployed
   - Check for runtime errors in function execution

---

## ROOT CAUSE ANALYSIS

### Analysis Engine Status Breakdown:
- **✅ 68 completed (56%)** - Engine works for some analyses  
- **❌ 40 processing (33%)** - Engine starting but not finishing
- **⏸️ 13 pending (11%)** - Never started processing

### Likely Causes:
1. **Edge Function timeouts** - Long-running analyses hitting 60s limit
2. **Network fetch failures** - Unable to retrieve page content  
3. **Unhandled exceptions** - Edge Function crashing mid-analysis
4. **Database write failures** - Unable to save completed results
5. **Progress callback failures** - UI update mechanism breaking function

---

## DIAGNOSTIC COMMANDS

### Check Recent Analysis Attempts:
```sql
-- Find recent stuck analyses for specific debugging
SELECT id, url, created_at, status, 
       EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_stuck
FROM analyses 
WHERE status = 'processing' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check for Error Patterns:
```sql
-- Look for error details in failed analyses
SELECT error_details, COUNT(*) 
FROM analyses 
WHERE error_details IS NOT NULL 
GROUP BY error_details;
```

---

## IMMEDIATE WORKAROUNDS

### Frontend Dashboard Fixes:
```typescript
// 1. Use working analyses only
const completedAnalyses = await supabase
  .from('analyses')
  .select('*')
  .eq('user_id', userId)
  .eq('status', 'completed')
  .neq('scores', '{}')
  .order('created_at', { ascending: false });

// 2. Extract overall_score from JSON
const analysesWithScores = analyses.map(analysis => ({
  ...analysis,
  overall_score: analysis.scores?.overall || null
}));

// 3. Use correct tier field
const { tier: userTier } = await supabase
  .from('users')
  .select('tier')
  .eq('id', userId)
  .single();
```

---

## MONITORING & ALERTS

### Set up immediate monitoring:
1. **Analysis completion rate** - Track stuck analyses
2. **Edge Function errors** - Monitor function logs
3. **Database performance** - Query execution times
4. **User tier accuracy** - Verify tier display consistency

---

## ESTIMATED RESOLUTION TIME

| Fix | Time | Impact |
|-----|------|---------|
| Application workarounds | 5 min | Dashboard functional with existing data |
| Database schema fixes | 15 min | Performance + data consistency |
| Analysis engine debugging | 30-60 min | New analyses completing |
| **Total Recovery** | **1-2 hours** | **Full system operational** |

---

## SUCCESS METRICS

- [ ] Dashboard loads < 2 seconds (after index fix)
- [ ] Correct user tier displayed (Coffee not Free)
- [ ] Overall scores visible for completed analyses
- [ ] New analyses complete successfully (not stuck in processing)
- [ ] Analysis completion rate > 90%

---

## ESCALATION TRIGGERS

**Escalate to senior engineering if:**
- Database fixes require more than admin SQL access
- Edge Function issues require platform-level support
- Analysis engine bugs require significant code changes
- User data corruption discovered beyond tier inconsistency

---

**STATUS: EMERGENCY - PRODUCTION BLOCKING**  
**PRIORITY: P0 - IMMEDIATE ACTION REQUIRED**  
**NEXT UPDATE: 30 minutes**