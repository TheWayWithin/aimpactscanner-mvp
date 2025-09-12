# 🚨 CRITICAL FIX: Monthly Reset Bug

## The Bug
Your system is currently resetting usage limits **EVERY DAY** instead of **EVERY MONTH**!
- Free users get 3 new analyses every day (should be per month)
- This breaks your entire business model

## How to Apply the Fix

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/sql/new
2. Copy the entire contents of: `supabase/migrations/011_fix_monthly_reset_logic.sql`
3. Paste into SQL editor
4. Click "Run"
5. You should see: "Monthly reset logic fixed successfully!"

### Option 2: Via Supabase CLI
```bash
# If you have the database password:
supabase db push

# Or reset migrations:
supabase migration repair --status applied 011
```

## What This Fixes

### Before (BUG):
```sql
-- Resets when date changes (DAILY!)
IF monthly_reset_date != CURRENT_DATE THEN
    -- Reset to 0
```

### After (FIXED):
```sql
-- Resets when MONTH changes
IF EXTRACT(MONTH FROM reset_date) != EXTRACT(MONTH FROM today_date) OR 
   EXTRACT(YEAR FROM reset_date) != EXTRACT(YEAR FROM today_date) THEN
    -- Reset to 0
```

## Impact
- Free users: Get 3 analyses per calendar month (not per day)
- Paid users: Unaffected (unlimited remains unlimited)
- Billing integrity: Preserved

## Verification
After applying, test:
1. Complete an analysis (uses 1 of 3)
2. Check tomorrow - should still show 2 remaining (not reset to 3)
3. Check next month - should reset to 3

**APPLY THIS FIX BEFORE GOING LIVE!**