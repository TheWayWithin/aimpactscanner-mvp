# Quick Start: Database Cleanup

## 🚀 TL;DR - Execute These Commands

```bash
# 1. See what will be deleted (NO CHANGES MADE)
node scripts/safe-user-cleanup.js

# 2. If dry run looks good, execute deletion
node scripts/safe-user-cleanup.js --execute
# Type: DELETE (when prompted)

# 3. Create Playwright test users
node scripts/create-playwright-users.js

# 4. Test your production account login
# Go to: http://localhost:5173/#/signup
# Enter: jamie.watters.mail@icloud.com
# Click: "Send Magic Link"
# Check iCloud email and click link
```

## 🔒 Safety Guaranteed

- ✅ `jamie.watters.mail@icloud.com` is **NEVER** deleted
- ✅ Dry run shows preview first
- ✅ Requires typing "DELETE" to confirm
- ✅ Verification after deletion

## 📚 Full Documentation

- **Step-by-step guide**: `/DATABASE-CLEANUP-GUIDE.md`
- **Technical report**: `/OPERATOR-REPORT.md`
- **OAuth strategy**: `/docs/icloud-oauth-strategy.md`
- **Playwright setup**: `/docs/playwright-test-auth-setup.md`

## 🧪 Test Users Created

After running `create-playwright-users.js`:

- `playwright-free@aimpactscanner.com` / `PlaywrightFree123!`
- `playwright-coffee@aimpactscanner.com` / `PlaywrightCoffee123!`
- `playwright-expired@aimpactscanner.com` / `PlaywrightExpired123!`

## 🔐 Your Production Login

**Email**: `jamie.watters.mail@icloud.com`
**Method**: Magic Link (passwordless)

**Why Magic Link?**
- iCloud emails can't use Google/GitHub OAuth
- Magic Link works with ANY email
- Already implemented and working ✓

## ⚠️ Prerequisites

Ensure `.env.local` has:
```bash
VITE_SUPABASE_URL=https://pdmtvkcxnqysujnpcnyh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

Get service role key from:
[Supabase Dashboard](https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh) → Settings → API

---

**Status**: Ready to execute ✓
