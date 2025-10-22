# DevOps Implementation Plan - Production Ready Guide

**Version:** 2.1.0 - With Real-World Lessons Learned
**Last Updated:** 2025-10-13
**Based On:** Actual SoloMarket + AImpactScanner staging deployments

---

## 🚨 CRITICAL LESSONS LEARNED

### The Big Mistakes We Made (So You Don't Have To)

1. **Documentation ≠ Implementation**
   - ❌ **WRONG**: Creating setup guides and marking tasks complete
   - ✅ **RIGHT**: Actually creating infrastructure and testing it works

2. **Order Matters - A LOT**
   - ❌ **WRONG**: Setting up OAuth before database exists
   - ✅ **RIGHT**: Database → Auth Schema → OAuth Providers → Test

3. **Schema Mismatches Will Kill You**
   - ❌ **WRONG**: Assuming staging will match production automatically
   - ✅ **RIGHT**: Export EXACT production schema, verify ALL tables exist

4. **Auth Is Complex**
   - ❌ **WRONG**: Just enabling OAuth providers in Supabase
   - ✅ **RIGHT**: OAuth + Callback URLs + Auth Triggers + Profile Creation

5. **GitHub Branch Setup Comes FIRST** [NEW - Oct 2025]
   - ❌ **WRONG**: Setting up Netlify before creating the `develop` branch
   - ✅ **RIGHT**: Create `develop` branch → Push to GitHub → THEN configure Netlify
   - **Why**: Netlify can't deploy a branch that doesn't exist yet
   - **Correct Sequence**: GitHub branches → Netlify branch configuration → Environment variables

6. **Migration Files ≠ Complete Schema** [NEW - Oct 2025 - AImpactScanner]
   - ❌ **WRONG**: Trusting that running all migrations will recreate production schema
   - ✅ **RIGHT**: Run migrations + Compare schema column-by-column + Fix mismatches
   - **Why**: Production schema evolves through direct SQL changes, not just migrations
   - **Real Impact**: Can cause 400 errors on API calls when columns don't match

7. **Google OAuth: ADD to existing app, GitHub OAuth: CREATE new app** [NEW - Oct 2025 - AImpactScanner]
   - ❌ **WRONG**: Reusing same GitHub OAuth app for staging and production
   - ✅ **RIGHT**: Google = add staging callback to existing app, GitHub = create separate staging app
   - **Why**: Prevents breaking production auth and provides environment isolation
   - **Implementation**:
     - Google: Add `https://[staging-ref].supabase.co/auth/v1/callback` to existing app
     - GitHub: Create "AppName Staging" with new Client ID/Secret

8. **Database Functions Are Part of Schema** [NEW - Oct 2025 - AImpactScanner]
   - ❌ **WRONG**: Only checking tables and columns during schema verification
   - ✅ **RIGHT**: Also verify functions, triggers, RLS policies, and enums match
   - **Why**: Missing functions cause 400 errors that are hard to diagnose
   - **How**: Export functions separately: `pg_dump --schema-only | grep "CREATE FUNCTION"`

---

## 📋 THE CORRECT ORDER OF OPERATIONS

### Phase 0: Prerequisites (30 minutes)
**DO NOT SKIP THIS**

1. **Access Verification**
   ```
   ✓ Supabase dashboard access
   ✓ Netlify dashboard access  
   ✓ GitHub repository admin access
   ✓ Google Cloud Console access (for OAuth)
   ✓ GitHub OAuth app creation access
   ```

2. **Understand Your Production Setup**
   ```sql
   -- Connect to production database
   -- Count your tables
   SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public';
   -- Note this number (e.g., 33 tables)
   ```

3. **Document Production URLs**
   ```
   Production Frontend: https://yourapp.com
   Production Database: [project-ref].supabase.co
   Production Auth Callback: https://[project-ref].supabase.co/auth/v1/callback
   ```

---

## Phase 1: Database First (1 hour)

### Step 1.1: Create Supabase Staging Project

**USER ACTION REQUIRED:**
1. Go to: https://supabase.com/dashboard
2. Click "New Project"
3. Settings:
   ```
   Name: yourapp-staging
   Database Password: [SAVE THIS SECURELY]
   Region: [SAME AS PRODUCTION]
   Plan: Pro (if production is Pro)
   ```
4. Wait for project to be ready (2-3 minutes)
5. Save these values:
   ```
   Project URL: https://[staging-ref].supabase.co
   Project Ref: [staging-ref]
   Anon Key: [copy from API settings]
   Service Role Key: [copy from API settings]
   ```

### Step 1.2: Migrate Database Schema

**LESSON LEARNED**: Don't trust migrations alone - verify table count!

```bash
# Install PostgreSQL 17 (match Supabase version)
brew install postgresql@17
brew link postgresql@17

# Export production schema (ALL OBJECTS)
pg_dump "postgresql://postgres:[PROD_PASSWORD]@db.[PROD_REF].supabase.co:5432/postgres" \
  --schema=public \
  --no-owner \
  --no-privileges \
  --no-comments \
  -f production_schema.sql

# Import to staging
psql "postgresql://postgres:[STAGING_PASSWORD]@db.[STAGING_REF].supabase.co:5432/postgres" \
  < production_schema.sql
```

### Step 1.3: Verify Database Completeness

**CRITICAL VERIFICATION:**
```sql
-- Connect to staging database
-- Count tables (should match production exactly)
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';

-- List all tables
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- If count doesn't match, you have missing tables!
```

### Step 1.3.5: Verify Schema Column-by-Column [NEW - CRITICAL]

**LESSON LEARNED (AImpactScanner)**: Migrations don't always match production schema!

```bash
# Export production columns for critical tables
export PGPASSWORD='[PROD_PASSWORD]' && psql -h db.[PROD_REF].supabase.co -p 5432 -U postgres -d postgres -c "\d+ analyses" > /tmp/prod_analyses.txt

# Export staging columns
export PGPASSWORD='[STAGING_PASSWORD]' && psql -h db.[STAGING_REF].supabase.co -p 5432 -U postgres -d postgres -c "\d+ analyses" > /tmp/staging_analyses.txt

# Compare
diff /tmp/prod_analyses.txt /tmp/staging_analyses.txt
```

**If there are differences:**
```sql
-- Add missing columns
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS column_name data_type;

-- Drop obsolete columns
ALTER TABLE analyses DROP COLUMN IF EXISTS old_column_name;
```

**Common tables that need verification:**
- `analyses` (core data table)
- `users` (auth-related fields)
- `subscriptions` (payment tier logic)
- Any table with JSONB columns (structure changes frequently)

### Step 1.4: Verify and Migrate Database Functions [NEW - CRITICAL]

**LESSON LEARNED (AImpactScanner)**: Functions are schema too!

```bash
# Export all functions from production
export PGPASSWORD='[PROD_PASSWORD]' && psql -h db.[PROD_REF].supabase.co -p 5432 -U postgres -d postgres << 'EOF' > /tmp/prod_functions.sql
SELECT
  pg_get_functiondef(p.oid) || ';' as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;
EOF

# Apply each function to staging
export PGPASSWORD='[STAGING_PASSWORD]' && psql -h db.[STAGING_REF].supabase.co -p 5432 -U postgres -d postgres < /tmp/prod_functions.sql
```

**Critical functions to verify:**
- User tier/subscription functions (e.g., `get_actual_user_tier`)
- Auth triggers (e.g., `handle_new_user`)
- RLS policy functions
- Custom aggregations or calculations

### Step 1.5: Fix Auth Schema Issues

**LESSON LEARNED**: Auth schema needs special attention

```sql
-- Create auth trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'buyer',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## Phase 2: Authentication Setup (1 hour)

### Step 2.1: Configure Supabase URL Settings FIRST

**USER ACTION REQUIRED:**
1. Go to: https://supabase.com/dashboard/project/[staging-ref]/auth/url-configuration
2. Set:
   ```
   Site URL: https://develop--yourapp.netlify.app
   Redirect URLs:
   - https://develop--yourapp.netlify.app/**
   - https://develop--yourapp.netlify.app/auth/confirm
   ```
3. Save changes

### Step 2.2: Google OAuth Setup

**LESSON LEARNED (AImpactScanner)**: ADD staging to existing Google OAuth app - DO NOT create new app

**Strategy**: Google OAuth apps can handle multiple callback URLs safely, so ADD staging to your existing production app.

**For Google Cloud Console:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your **EXISTING** OAuth 2.0 Client (same one used for production)
3. Add to "Authorized JavaScript origins":
   ```
   https://[staging-ref].supabase.co
   ```
4. Add to "Authorized redirect URIs":
   ```
   https://[staging-ref].supabase.co/auth/v1/callback
   ```
5. **IMPORTANT**: Leave production URLs in place! You're ADDING, not replacing.
6. Save

**In Supabase Dashboard (Staging):**
1. Go to: Authentication → Providers → Google
2. Enable Google
3. **Use the SAME Client ID and Secret from production** (it now works for both environments)
4. Save

**Why this works**: Google OAuth apps support multiple redirect URLs, so one app can safely serve both environments.

### Step 2.3: GitHub OAuth Setup

**LESSON LEARNED (AImpactScanner)**: CREATE separate GitHub OAuth app - DO NOT reuse production app

**Strategy**: Unlike Google, GitHub OAuth apps should be environment-specific to avoid production disruption.

**Why separate apps?**
- GitHub OAuth apps allow only ONE callback URL (unlike Google's multiple)
- Changing production app's callback could break production authentication
- Separate apps provide clear environment isolation

**Create Staging GitHub OAuth App:**
1. Go to: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   ```
   Application name: YourApp Staging
   Homepage URL: https://develop--yourapp.netlify.app
   Authorization callback URL: https://[staging-ref].supabase.co/auth/v1/callback
   ```
4. Register application
5. Click "Generate a new client secret"
6. **Save both Client ID and Client Secret** (you'll need them in next step)

**In Supabase Dashboard (Staging):**
1. Go to: Authentication → Providers → GitHub
2. Enable GitHub
3. Enter the NEW Client ID from the staging app
4. Enter the NEW Client Secret from the staging app
5. Save

**Summary**:
- **Google OAuth**: 1 app for all environments (add callback URLs)
- **GitHub OAuth**: 1 app PER environment (separate apps)

---

## Phase 2.5: GitHub Branch Setup (5 minutes) [CRITICAL - DO THIS FIRST]

### Step 2.5.1: Create and Push Develop Branch

**DO THIS BEFORE NETLIFY CONFIGURATION**

```bash
# Ensure you're on main and up to date
git checkout main
git pull

# Create develop branch
git checkout -b develop

# Push to GitHub (Netlify needs this to exist!)
git push -u origin develop
```

**Verification**: Go to GitHub → Your Repo → Branches → Confirm `develop` exists

---

## Phase 3: Frontend Deployment (30 minutes)

### Step 3.1: Configure Netlify Branch Deployments

**USER ACTION REQUIRED:**
1. Go to: Netlify → Site Settings → Build & deploy
2. Under "Branches":
   - Production branch: `main`
   - Branch deploys: Add `develop`
   - Deploy previews: Enabled
3. Note your staging URL: `https://develop--yourapp.netlify.app`

### Step 3.3: Set Environment Variables

**LESSON LEARNED**: Scope variables to specific branches!

In Netlify → Site Settings → Environment Variables:

**For "develop" branch context:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[staging-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[staging-anon-key]
# Add any other PUBLIC environment variables
```

**For "main" branch context:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[prod-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[prod-anon-key]
# Production variables
```

---

## Phase 4: Data Migration (30 minutes)

### Step 4.1: Export Production Data

**LESSON LEARNED**: Schema must match EXACTLY before importing data

```bash
# Export only data (not schema)
pg_dump "postgresql://postgres:[PROD_PASSWORD]@db.[PROD_REF].supabase.co:5432/postgres" \
  --data-only \
  --no-owner \
  --no-privileges \
  --schema=public \
  -f production_data.sql
```

### Step 4.2: Import to Staging

```bash
# Import data
psql "postgresql://postgres:[STAGING_PASSWORD]@db.[STAGING_REF].supabase.co:5432/postgres" \
  < production_data.sql

# If errors occur, fix them one by one
# Common issues:
# - Missing columns: ALTER TABLE ADD COLUMN
# - Foreign key violations: Import in correct order
# - Enum mismatches: Update enum values
```

### Step 4.3: Verify Data

```sql
-- Check record counts
SELECT 
  'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL SELECT 
  'listings', COUNT(*) FROM listings
UNION ALL SELECT 
  'categories', COUNT(*) FROM categories;
```

---

## Phase 5: Testing & Verification (30 minutes)

### Step 5.1: Test Authentication Flow

1. **Open staging in incognito window** (avoid cookie conflicts)
2. Test Google OAuth:
   - Sign in with Google
   - Verify redirect to staging (not production!)
   - Check profile created in database
3. Test GitHub OAuth:
   - Sign in with GitHub
   - Verify redirect to staging
   - Check profile created

### Step 5.2: Test Core Functionality

```bash
# Run E2E tests against staging
NEXT_PUBLIC_SUPABASE_URL=https://[staging-ref].supabase.co \
npm run test:e2e
```

### Step 5.3: Verify Deployment Pipeline

```bash
# Make a test change
echo "// Test comment" >> app/page.tsx
git add -A
git commit -m "test: Verify staging deployment"
git push origin develop

# Watch deployment
gh run list --branch develop

# Verify change appears on staging site
```

---

## Phase 6: CI/CD Pipeline (30 minutes)

### Step 6.1: GitHub Actions Configuration

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Pipeline

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: echo "Netlify auto-deploys develop branch"
      
  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: echo "Netlify auto-deploys main branch"
```

### Step 6.2: Branch Protection Rules

**GitHub Settings → Branches:**

For `main` branch:
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- Include administrators

For `develop` branch:
- Require status checks to pass
- No force pushes

---

## 🎯 Common Issues & Solutions

### Issue 1: "provider is not enabled" OAuth Error
**Solution**: Enable provider in Supabase dashboard AND add callback URLs

### Issue 2: Foreign key constraint errors during data import
**Solution**:
```sql
-- Disable constraints temporarily
SET session_replication_role = 'replica';
-- Run imports
-- Re-enable constraints
SET session_replication_role = 'origin';
```

### Issue 3: Missing tables after migration
**Solution**: Manually create missing tables from production schema

### Issue 4: Auth state not updating in UI
**Solution**: Hard refresh (Cmd+Shift+R) and test in incognito

### Issue 5: Environment variables not working
**Solution**: Ensure they're scoped to correct branch context in Netlify

### Issue 6: OAuth redirects to localhost after authorization [NEW - AImpactScanner]
**Problem**: After OAuth signin, redirected to `http://localhost:3000/?code=...`
**Solution**: Configure Supabase Site URL settings
```
Dashboard → Authentication → URL Configuration
Site URL: https://develop--yourapp.netlify.app
Redirect URLs: https://develop--yourapp.netlify.app/**
```

### Issue 7: 400 errors on API calls after deployment [NEW - AImpactScanner]
**Problem**: Dashboard loads but API calls fail with 400 status
**Root Cause**: Schema mismatch between staging and production (columns or functions)
**Solution**:
```bash
# Compare table schemas
psql [PROD] -c "\d+ table_name" > prod.txt
psql [STAGING] -c "\d+ table_name" > staging.txt
diff prod.txt staging.txt

# Add missing columns
ALTER TABLE table_name ADD COLUMN column_name data_type;

# Check for missing functions
psql [PROD] -c "\df+ function_name"
# Apply to staging
```

### Issue 8: Function returns wrong data or errors [NEW - AImpactScanner]
**Problem**: Functions exist but return incorrect results
**Root Cause**: Function definition out of sync with production
**Solution**:
```bash
# Export function from production
psql [PROD] -c "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname='function_name';"

# Apply to staging with CREATE OR REPLACE
psql [STAGING] << 'EOF'
CREATE OR REPLACE FUNCTION ...
EOF
```

---

## ✅ Final Verification Checklist

Before considering staging complete:

### Database Schema
- [ ] Database has EXACT same number of tables as production
- [ ] Critical tables have matching columns (use `\d+ table_name` to compare)
- [ ] All database functions exist and match production (e.g., `get_actual_user_tier`)
- [ ] Triggers are in place (e.g., `handle_new_user`)
- [ ] RLS policies are enabled and match production

### Authentication
- [ ] Can create new user via Google OAuth
- [ ] Can create new user via GitHub OAuth
- [ ] User is redirected to staging URL (not production or localhost)
- [ ] User profile is automatically created in database after signup
- [ ] Site URL configured in Supabase: `https://develop--yourapp.netlify.app`

### Core Functionality
- [ ] Can perform primary user actions (e.g., create analysis, listing, etc.)
- [ ] API calls return 200 status (no 400/500 errors in console)
- [ ] Data loads correctly from staging database
- [ ] User tier/subscription logic works correctly

### Deployment Pipeline
- [ ] `develop` branch exists and is pushed to GitHub
- [ ] Changes to develop branch auto-deploy to staging
- [ ] Staging URL shows correct data from database
- [ ] Environment variables are scoped to branch deploys
- [ ] No console errors on staging site
- [ ] GitHub Actions tests pass on develop branch (if configured)

### Workflow Verification
- [ ] Can create PR from develop to main
- [ ] Production remains unaffected by staging changes

---

## 🚀 You're Done!

Your workflow is now:
1. Work on `develop` branch
2. Push changes → Auto-deploy to staging
3. Test on staging
4. Create PR to `main`
5. Merge → Auto-deploy to production

**Time Saved**: 4-6 hours by following correct order
**Errors Avoided**: 15+ common setup mistakes
**Result**: Professional DevOps pipeline that actually works

---

## Appendix: Quick Commands Reference

```bash
# Connect to staging database
psql "postgresql://postgres:[PASSWORD]@db.[STAGING_REF].supabase.co:5432/postgres"

# Check deployment status
gh run list --branch develop

# View staging logs
netlify logs --site develop--yourapp

# Quick branch switch
git checkout develop  # Work here
git checkout main     # Deploy from here

# Emergency rollback
git revert HEAD
git push origin main
```