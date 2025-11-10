# Trial Testing Instructions - CRITICAL

## ⚠️ IMPORTANT: Which Button to Click

The Growth tier card has **TWO buttons**:

### ✅ CORRECT BUTTON (For Trial):
```
🎁 Try Growth Free for 7 Days
```
- **Color**: Green gradient (from-green-500 to-teal-500)
- **Location**: INSIDE the Growth tier card
- **Text**: Has the 🎁 emoji
- **What it does**: Sets `isTrial=true` and auto-proceeds to OAuth

### ❌ WRONG BUTTON (Regular Signup):
```
Continue to Sign Up →
```
- **Color**: Blue (bg-blue-600)
- **Location**: BOTTOM of page, below all tier cards
- **Text**: Has the → arrow
- **What it does**: Sets `isTrial=false` and proceeds to OAuth

---

## Step-by-Step Testing Instructions

### Step 1: Delete Test User from Database
```sql
DELETE FROM users WHERE email = 'aimpactscannertest@gmail.com';
```

### Step 2: Clear Browser State
1. Sign out from app
2. Open DevTools (F12)
3. Application tab → Storage → "Clear site data"
4. Close and reopen browser tab

### Step 3: Navigate to Signup Page
Visit: `https://develop--aimpactscanner.netlify.app/#signup`

### Step 4: Verify Default State
You should see:
- ✅ Growth tier selected (yellow border, RECOMMENDED badge)
- ✅ Annual billing selected (toggle on right side)
- ✅ Price shows "$149.50/year" and "Save $65.90/year"

### Step 5: Click the TRIAL Button
**CRITICAL**: Click the button INSIDE the Growth tier card:
```
🎁 Try Growth Free for 7 Days
```

**DO NOT** click the blue "Continue to Sign Up →" button at the bottom!

### Step 6: Complete OAuth
- Select your Google account
- Authorize the app

### Step 7: Verify Stripe Checkout
You should see:
- ✅ **"Total due today: US$0.00"** (NOT $149.50!)
- ✅ "7-day trial, then $149.50/year"
- ✅ "Billed annually"

### Step 8: Check Console Logs
Open DevTools Console (F12) and look for these logs:
```
[TierOptionsList] User clicked: Try Growth Free for 7 Days
[TierOptionsList] Calling onTrialSelect(true, true)
[DynamicTierSelector] handleTrialSelect called
[DynamicTierSelector] wantsTrial parameter: true
[Signup] onSelectionComplete called
[Signup] Received isTrial (raw): true
[Signup] Normalized isTrial: true
[authRouting] Extracted isTrial: true
[App.jsx] autoCheckoutIsTrial (boolean): true
✅ Added 7-day trial period to checkout session
```

---

## Visual Guide

### ✅ CORRECT Flow (Trial):
```
1. Visit /#signup
2. See Growth tier (already selected)
3. Click "🎁 Try Growth Free for 7 Days" INSIDE Growth card
4. OAuth → Stripe shows $0.00 due today
```

### ❌ INCORRECT Flow (Regular):
```
1. Visit /#signup
2. See Growth tier (already selected)
3. Click "Continue to Sign Up →" at bottom
4. OAuth → Stripe shows $149.50 due today  <-- WRONG!
```

---

## If Trial Still Doesn't Work

Check these in console:
1. Are the debug logs appearing?
   - If NO: You clicked the wrong button or went through a different flow
   - If YES: Check what value `isTrial` has in each log

2. Does `[Signup] Normalized isTrial: true` appear?
   - If shows `false`: The trial button click didn't work
   - If doesn't appear: You bypassed the tier selector entirely

3. Does `✅ Added 7-day trial period to checkout session` appear?
   - If NO: The Edge Function didn't receive `isTrial=true`
   - Check the App.jsx logs for what value was sent
