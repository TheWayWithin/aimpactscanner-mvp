# Manual Payment Flow Test Instructions

## How to Test and Debug the Payment Flow

### 1. Open Browser Developer Console
- **Chrome/Edge**: Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
- **Firefox**: Press `F12` or `Cmd+Option+K` (Mac) / `Ctrl+Shift+K` (Windows)
- **Safari**: Enable Developer menu first, then `Cmd+Option+C`

### 2. Navigate to the Site
1. Go to https://aimpactscanner.com
2. Keep the Console tab open in DevTools

### 3. Sign In
1. Click "Sign In" button
2. Use these credentials:
   - Email: `ugcbwkkfxvhhxyxmih@xfavaj.com`
   - Password: `TestPassword123!`
3. Click "Sign In"

### 4. Navigate to Pricing
1. After login, you should see navigation tabs
2. Click the "💎 Upgrade" tab

### 5. Try to Purchase Coffee Tier
1. Find the Coffee tier ($5/month)
2. Click "Buy Me a Coffee" button
3. **WATCH THE CONSOLE** for debug messages

### Expected Console Output
You should see messages like:
```
🔍 DEBUG: handleUpgrade called
   Target tier: coffee
   User: {id: "...", email: "..."}
   📡 Getting price IDs...
   Coffee price ID from env: price_1RnSa4IiC84gpR8HXmbDgaNy
   📤 Calling Edge Function...
   📥 Edge Function response:
   ✅ Redirecting to: https://checkout.stripe.com/...
```

### What to Look For

#### ✅ If it's working:
- Browser redirects to Stripe checkout page
- You see the Coffee tier subscription for $5/month

#### ❌ If it's NOT working, check for:
1. **"Coffee price ID from env: undefined"** 
   - Environment variable not loaded
   
2. **"User: null" or "User ID: undefined"**
   - User session issue
   
3. **"Edge Function response: Error:"**
   - Backend API issue
   
4. **No console logs at all**
   - Button click not triggering function

### Copy Console Output
1. Right-click in the console
2. Select "Save as..." or copy all text
3. Share the debug output for analysis

### Alternative Test
If the above doesn't work, try this in the browser console:
```javascript
// Check if environment variables are loaded
console.log('Stripe Coffee Price ID:', import.meta.env.VITE_STRIPE_COFFEE_PRICE_ID);
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
```

---

## What We Know So Far

### ✅ Working:
- Stripe recurring price configuration ($5/month)
- Edge Function (creates checkout sessions when called directly)
- User exists in database

### ❌ Issue:
- Frontend not successfully calling Edge Function or redirecting to Stripe

### 🔍 Debugging:
- Added console logging to identify exact failure point
- Will show environment variables, user data, and API responses