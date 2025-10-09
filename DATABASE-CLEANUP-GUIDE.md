# Database Cleanup & Test User Setup Guide

## 🎯 Mission Objective

1. ✅ Delete all test users from database
2. 🔒 PRESERVE production account: `jamie.watters.mail@icloud.com`
3. 🧪 Set up proper Playwright test user authentication

## 📋 Pre-Execution Checklist

### Required Environment Variables

Ensure your `.env.local` file contains:

```bash
VITE_SUPABASE_URL=https://pdmtvkcxnqysujnpcnyh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**Where to find the Service Role Key**:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh)
2. Navigate to: Settings → API → Project API keys
3. Copy the `service_role` key (secret, not anon)

### Verify Node Dependencies

```bash
# Install dependencies if needed
npm install @supabase/supabase-js dotenv
```

---

## 🚀 Execution Steps

### Step 1: Review Current Users (Dry Run)

**IMPORTANT**: Always run dry run first to see what will be deleted!

```bash
# Navigate to project directory
cd /Users/jamiewatters/DevProjects/aimpactscanner-mvp

# Run dry run (shows what WOULD be deleted)
node scripts/safe-user-cleanup.js
```

**Expected Output**:
```
🔍 DRY RUN MODE - No changes will be made
═══════════════════════════════════════════════════════════════════

📊 CURRENT DATABASE STATE:
────────────────────────────────────────────────────────────────────
Total auth users: X
Total public users: Y
────────────────────────────────────────────────────────────────────

👥 ALL USERS IN AUTH.USERS:
────────────────────────────────────────────────────────────────────
1. 🔒 PROTECTED
   Email: jamie.watters.mail@icloud.com
   ID: ...
   Provider: ...
   Created: ...

2. 🗑️  DELETE
   Email: test@example.com
   ID: ...
   Provider: ...
   Created: ...

📋 DELETION PLAN:
────────────────────────────────────────────────────────────────────
✅ WILL PRESERVE: 1 user(s)
   • jamie.watters.mail@icloud.com

❌ WILL DELETE: X user(s)
   • [list of test users]

═══════════════════════════════════════════════════════════════════
✅ Dry run complete - No changes made
Run with --execute flag to perform actual deletion
```

### Step 2: Execute Deletion (If Dry Run Looks Correct)

```bash
# Execute actual deletion
node scripts/safe-user-cleanup.js --execute
```

**You will be prompted for confirmation**:
```
⚠️  Are you absolutely sure you want to DELETE these users? (type "DELETE" to confirm):
```

**Type exactly**: `DELETE` (all caps)

**Expected Output**:
```
🚀 Starting deletion process...

🗑️  Deleting test@example.com...
   ✅ Removed from public.users
   ✅ Removed from auth.users

═══════════════════════════════════════════════════════════════════
✅ CLEANUP COMPLETE
────────────────────────────────────────────────────────────────────
✅ Successfully deleted: X user(s)
❌ Errors: 0
🔒 Protected (preserved): 1 user(s)
═══════════════════════════════════════════════════════════════════

🔍 Verifying production account preservation...
✅ VERIFIED: jamie.watters.mail@icloud.com still exists ✓
```

---

## 🔐 iCloud Email OAuth Strategy

### Current Situation

- **Production Email**: `jamie.watters.mail@icloud.com`
- **Current Architecture**: OAuth-first (Google, GitHub, Magic Link)

### ✅ RECOMMENDED: Use Magic Link

**Why Magic Link?**
- ✅ Works with ANY email (including @icloud.com)
- ✅ Already implemented and working
- ✅ No additional setup needed
- ✅ Passwordless (better UX)
- ✅ Secure (one-time tokens)

**How to Login with Magic Link**:

1. Navigate to: `http://localhost:5173/#/signup` (or `/login`)
2. Enter email: `jamie.watters.mail@icloud.com`
3. Click "Send Magic Link"
4. Check iCloud email inbox
5. Click the magic link in email
6. Automatically redirected and logged in

### ❌ Why Not Google/GitHub OAuth?

- **Google OAuth**: Requires Google account (iCloud emails can't be used for Google accounts)
- **GitHub OAuth**: Requires GitHub account with that email as primary
- **Not Recommended**: Adding iCloud email to Google/GitHub is unreliable

### 📚 Full Documentation

See: `/docs/icloud-oauth-strategy.md` for complete analysis and alternatives

---

## 🧪 Playwright Test User Setup

### Step 3: Create Test Users for Playwright

```bash
# Create dedicated test users
node scripts/create-playwright-users.js
```

**This creates 3 test users**:

1. **Free Tier Test User**:
   - Email: `playwright-free@aimpactscanner.com`
   - Password: `PlaywrightFree123!`
   - Tier: Free (3 analyses/month)

2. **Coffee Tier Test User**:
   - Email: `playwright-coffee@aimpactscanner.com`
   - Password: `PlaywrightCoffee123!`
   - Tier: Coffee (unlimited analyses)

3. **Exhausted Test User**:
   - Email: `playwright-expired@aimpactscanner.com`
   - Password: `PlaywrightExpired123!`
   - Tier: Free (3/3 analyses used)

### Step 4: Configure Playwright Authentication

**Option A: Database Session Injection (Recommended)**

Create: `tests/setup/auth.setup.js`

```javascript
import { test as setup } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

setup('authenticate', async ({ page }) => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Sign in with test user
  const { data } = await supabase.auth.signInWithPassword({
    email: 'playwright-coffee@aimpactscanner.com',
    password: 'PlaywrightCoffee123!'
  });

  // Inject session into browser
  await page.goto('http://localhost:5173');
  await page.evaluate((session) => {
    localStorage.setItem(
      'sb-pdmtvkcxnqysujnpcnyh-auth-token',
      JSON.stringify(session)
    );
  }, data.session);

  // Save authenticated state
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

**Option B: Magic Link (For E2E Testing)**

See: `/docs/playwright-test-auth-setup.md` for complete guide

### Step 5: Use in Tests

```javascript
import { test } from '@playwright/test';

// Use saved authentication state
test.use({ storageState: 'playwright/.auth/user.json' });

test('authenticated user can analyze pages', async ({ page }) => {
  await page.goto('http://localhost:5173/#/analyze');
  // User is already authenticated!
});
```

### 📚 Full Testing Documentation

See: `/docs/playwright-test-auth-setup.md` for:
- Multiple authentication strategies
- CI/CD configuration
- Best practices
- Security considerations

---

## 🛡️ Safety Features

### Built-in Protections

1. **Production Account Protected**:
   - `jamie.watters.mail@icloud.com` is NEVER deleted
   - Hardcoded in `PRODUCTION_EMAIL` constant
   - Verified after deletion completes

2. **Dry Run Mode**:
   - Default mode shows preview without changes
   - Must explicitly use `--execute` flag for deletion

3. **Explicit Confirmation**:
   - Requires typing "DELETE" (exact match)
   - No accidental deletions

4. **Detailed Logging**:
   - Shows every operation
   - Reports success/failure for each user
   - Verifies preservation of production account

---

## 📊 Summary of Changes

### Files Created

1. **`/scripts/safe-user-cleanup.js`**
   - Safe deletion script with dry run
   - Preserves production account
   - Requires explicit confirmation

2. **`/scripts/create-playwright-users.js`**
   - Creates 3 dedicated test users
   - Configures tiers and limits
   - Ready for Playwright testing

3. **`/docs/icloud-oauth-strategy.md`**
   - Analysis of OAuth compatibility
   - Magic Link recommendation
   - Alternative approaches

4. **`/docs/playwright-test-auth-setup.md`**
   - Complete testing guide
   - Multiple auth strategies
   - Best practices and security

5. **`/DATABASE-CLEANUP-GUIDE.md`** (this file)
   - Step-by-step execution guide
   - Safety procedures
   - Complete workflow

---

## ✅ Execution Checklist

### Pre-Execution
- [ ] Verify `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Install required dependencies
- [ ] Backup database (if critical)

### User Deletion
- [ ] Run dry run: `node scripts/safe-user-cleanup.js`
- [ ] Verify production account will be preserved
- [ ] Execute: `node scripts/safe-user-cleanup.js --execute`
- [ ] Type "DELETE" to confirm
- [ ] Verify production account still exists

### Test User Setup
- [ ] Create test users: `node scripts/create-playwright-users.js`
- [ ] Verify test users created successfully
- [ ] Note test credentials for Playwright

### Playwright Configuration
- [ ] Create `tests/setup/auth.setup.js`
- [ ] Configure `playwright.config.js`
- [ ] Add `playwright/.auth/` to `.gitignore`
- [ ] Test authentication setup

### Production Account
- [ ] Test Magic Link login for `jamie.watters.mail@icloud.com`
- [ ] Verify authentication works
- [ ] Confirm tier and permissions correct

---

## 🆘 Troubleshooting

### Error: Missing SUPABASE_SERVICE_ROLE_KEY

**Solution**:
1. Go to Supabase Dashboard: Settings → API
2. Copy `service_role` key
3. Add to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-key-here
   ```

### Error: Cannot delete users

**Possible Causes**:
- RLS policies blocking deletion
- Foreign key constraints
- User has active sessions

**Solution**: Script handles these gracefully, reports errors but continues

### Production account accidentally deleted

**Prevention**: Script has triple protection:
1. Hardcoded exclusion
2. Dry run preview
3. Explicit confirmation

**Recovery**: If somehow deleted, recreate manually in Supabase Dashboard

---

## 📞 Support

- **Script Issues**: Check script output for detailed error messages
- **OAuth Questions**: See `/docs/icloud-oauth-strategy.md`
- **Testing Setup**: See `/docs/playwright-test-auth-setup.md`
- **Supabase Docs**: https://supabase.com/docs

---

**Status**: Ready for execution ✓
**Last Updated**: 2025-10-08
