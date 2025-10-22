
## OAuth Testing (Automated)

### Quick Test After OAuth Fixes

To test OAuth redirects after making fixes:

```bash
# Run the OAuth redirect test (takes ~60 seconds)
npx playwright test tests/e2e/test-oauth-redirect.spec.js --headed --project=chromium

# What it tests:
# 1. /#login shows OAuth buttons (not legacy password form)
# 2. Google OAuth completes successfully  
# 3. Redirects to #dashboard (NOT #landing)
# 4. User is authenticated

# Credentials are in .env.test (gitignored)
```

### Test Maintenance

The test uses credentials from `.env.test`:
- `GOOGLE_TEST_EMAIL_1`: Test Google account
- `GOOGLE_TEST_PASSWORD_1`: Password

**Re-run when**:
- OAuth routing logic changes
- Supabase redirect URLs updated
- Hash routing changes
- New OAuth providers added

**File**: `tests/e2e/test-oauth-redirect.spec.js`
