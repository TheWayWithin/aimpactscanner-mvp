# Diagnostic Tool Setup Guide

## Quick Start (2 Minutes)

### Option 1: Local Development (Recommended)

1. **Deploy the helper functions**:
   ```bash
   cd /Users/jamiewatters/DevProjects/aimpactscanner-mvp
   supabase db push --linked
   ```

2. **Start the dev server** (if not already running):
   ```bash
   npm run dev
   ```

3. **Open the diagnostic page**:
   ```
   http://localhost:5173/#diagnostic-signup
   ```

4. **Run the diagnostic**:
   - Click "Run Complete Diagnostic"
   - Wait ~5 seconds for tests to complete
   - Click "Copy Full Report"
   - Paste the JSON into your chat with me

### Option 2: Production Testing

1. **Deploy helper functions via Supabase Dashboard**:
   - Navigate to: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/sql/new
   - Copy contents of: `/supabase/migrations/019_diagnostic_helper_functions.sql`
   - Paste and run

2. **Open diagnostic page** (production):
   ```
   https://aimpactscanner.com/#diagnostic-signup?diagnostic=true
   ```

3. **Run diagnostic** (same as above)

---

## What the Diagnostic Tests

The diagnostic page will test the COMPLETE signup flow:

### ✅ Tests Performed (12 total)

1. **Initial Session Check** - Is user already logged in?
2. **Pre-signup Database** - Does test email already exist?
3. **Trigger Check** - What triggers exist on auth.users?
4. **Function Check** - What user functions exist?
5. **RLS Policy Check** - What policies protect users table?
6. **Signup Attempt** - Does `supabase.auth.signUp()` succeed?
7. **Post-signup Session** - Is session created?
8. **Auth User Check** - Was user created in auth.users?
9. **Public User Check** - Was user created in public.users? (TRIGGER TEST)
10. **Email Query Test** - Can we query by email? (RLS TEST)
11. **Manual Insert Test** - Can we insert manually? (RLS FALLBACK)
12. **Database Logs** - Where to check for errors

---

## Understanding the Results

### ✅ Everything Working

```json
{
  "summary": {
    "signupSucceeded": true,
    "authUserCreated": true,
    "publicUserCreated": true,
    "rlsBlocking": false,
    "triggerFailed": false
  },
  "diagnosis": {
    "rootCause": "No issues detected - signup flow working correctly",
    "confidence": "Very High"
  }
}
```

**Meaning**: Migration 018 deployed successfully, all systems working.

### ❌ Trigger Not Executing

```json
{
  "summary": {
    "signupSucceeded": true,
    "authUserCreated": true,
    "publicUserCreated": false,  // ← Problem
    "triggerFailed": true
  },
  "diagnosis": {
    "rootCause": "Trigger not executing or failing silently",
    "confidence": "Very High"
  }
}
```

**Meaning**: Migration 018 NOT deployed or trigger broken.

**Fix**: Deploy migration 018 via Supabase Dashboard.

### ❌ RLS Blocking

```json
{
  "summary": {
    "signupSucceeded": true,
    "authUserCreated": true,
    "publicUserCreated": true,
    "rlsBlocking": true  // ← Problem
  },
  "diagnosis": {
    "rootCause": "RLS policy blocking SELECT",
    "confidence": "Very High"
  }
}
```

**Meaning**: Trigger works but RLS policies wrong.

**Fix**: Check RLS policies in migration 018.

---

## Troubleshooting

### "RPC function does not exist"

**Symptom**: Diagnostic fails with "function check_auth_triggers does not exist"

**Fix**: Deploy migration 019:
```bash
supabase db push --linked
```

### "Diagnostic Mode Disabled"

**Symptom**: Page shows "only available in development mode"

**Fix**: Either:
1. Run in local dev: `npm run dev` → `http://localhost:5173/#diagnostic-signup`
2. Add param in production: `https://aimpactscanner.com/#diagnostic-signup?diagnostic=true`

### Can't Copy Report

**Symptom**: "Copy Full Report" button doesn't work

**Fix**: Manually copy the JSON from the gray box at the bottom of the page.

---

## What to Share

After running the diagnostic, copy the ENTIRE JSON report and paste it into your chat.

The report includes:
- Test results for all 12 tests
- Error messages with codes
- Database state
- Automated diagnosis
- Confidence level
- Specific recommendations

**One report = Complete picture** ✅

---

## Security Notes

- Diagnostic is production-safe (read-only operations)
- Uses anon key (no service role exposure)
- Auto-signs out test user after test
- Only accessible in dev mode or with `?diagnostic=true`
- Helper functions only READ database metadata

---

## Files Created

1. `/src/pages/DiagnosticSignup.jsx` - Diagnostic page component
2. `/supabase/migrations/019_diagnostic_helper_functions.sql` - Database helpers
3. `/src/App.jsx` - Updated with diagnostic route
4. `/DIAGNOSTIC-SETUP.md` - This guide

---

**Ready to end the debugging marathon?** 🎯

Run the diagnostic and paste the results!
