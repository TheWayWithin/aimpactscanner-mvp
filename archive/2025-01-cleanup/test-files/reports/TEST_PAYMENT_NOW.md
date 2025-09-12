# Quick Payment Test Instructions

## Test with Working User

Since the user `wlkgztsglmfzmhyrok@fxavaj.com` has database issues, let's test with the working user first:

### 1. Open Incognito/Private Window
- This ensures a clean session

### 2. Go to https://aimpactscanner.com

### 3. Sign In with Working Test User
- Click "Sign In" 
- Email: `ugcbwkkfxvhhxyxmih@xfavaj.com`
- Password: `TestPassword123!`

### 4. Test Upgrade Flow
- After login, click "💎 Upgrade" tab
- Click "Buy Me a Coffee" button
- **You should be redirected to Stripe Checkout**

---

## For Your Regular Browser User

The user `wlkgztsglmfzmhyrok@fxavaj.com` needs to be added to the database. 

### Option 1: Manual Database Fix
1. Go to Supabase Dashboard
2. Go to Table Editor → users table
3. Add a new row with:
   - id: `9b54c8e8-f049-4254-8989-68e3962ab625`
   - email: `wlkgztsglmfzmhyrok@fxavaj.com`
   - tier: `free`
   - subscription_tier: `free`
   - subscription_status: `active`
   - monthly_analyses_used: `0`

### Option 2: Create New Account
1. Sign out
2. Create a new account with a different email
3. Test the payment flow with the new account

---

## Debug Information

The error you're seeing is because:
1. User exists in auth.users (can log in)
2. User DOESN'T exist in public.users table (can't upgrade)
3. Edge Function requires user in public.users to create Stripe session

Once the user is added to the users table, the payment flow will work.