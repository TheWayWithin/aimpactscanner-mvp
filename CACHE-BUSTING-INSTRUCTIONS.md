# Cache Busting Instructions - CRITICAL

## ✅ INFRASTRUCTURE FIX DEPLOYED (2025-10-30)

**Root cause identified and fixed**: The `_headers` file was missing a Cache-Control directive for `index.html`, causing browsers to cache the HTML file indefinitely. This has now been fixed with:

```
/index.html
  Cache-Control: no-cache, must-revalidate
```

This ensures browsers always fetch the latest HTML, which references the latest JavaScript bundles.

**Deploy**: Commit 796c94c - deployed to staging

---

## The Problem

You're running OLD JavaScript code from before the trial fix. Your browser cached it and won't load the new version.

## The Solution (Do ALL of these)

### Step 1: Clear ALL Browser Data
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **"Clear site data"** button (clears everything)
4. Confirm

### Step 2: Hard Refresh Multiple Times
1. Close DevTools
2. Hold **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
3. Do this **3 times** to ensure all cached JS is gone

### Step 3: Clear localStorage Manually
Open Console (F12) and run:
```javascript
localStorage.clear();
sessionStorage.clear();
console.log('✅ Storage cleared');
```

### Step 4: Close and Reopen Browser
1. Close the ENTIRE browser (all tabs)
2. Reopen fresh
3. Visit: `https://develop--aimpactscanner.netlify.app/#signup`

### Step 5: Verify New Code is Loaded
Check console for these NEW debug logs:
```
🚀 Signup component mounted
🔍 Mode: signup
🔍 Current URL: https://develop--aimpactscanner.netlify.app/#signup
```

If you DON'T see these logs, the new code hasn't loaded yet!

---

## Then Test Trial Flow

1. Delete user: `DELETE FROM users WHERE email = 'aimpactscannertest@gmail.com';`
2. Visit: `https://develop--aimpactscanner.netlify.app/#signup`
3. Click: **"🎁 Try Growth Free for 7 Days"** button
4. Complete OAuth
5. Check console for: `[Signup] Normalized isTrial: true`
6. Verify Stripe shows: **"$0.00 due today"**

---

## How to Know if Cache is Still Bad

If after clearing cache you STILL don't see:
```
🚀 Signup component mounted
```

Then:
1. Try **Incognito/Private window** (bypasses all cache)
2. Check Netlify deploy status: https://app.netlify.com/sites/aimpactscanner/deploys
3. Wait 5 minutes for CDN to propagate
4. Try different browser entirely

---

## Why This Matters

The OLD code has:
```javascript
onSelectionComplete={(tier, billing, isTrial = false) => {
  // Bug: default parameter can override true!
```

The NEW code has:
```javascript
onSelectionComplete={(tier, billing, isTrial) => {
  const normalizedIsTrial = isTrial === true;  // Explicit check
```

If you're running OLD code, the trial will NEVER work, no matter how many times you click the button!
