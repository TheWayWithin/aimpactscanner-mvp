# Environment Variables Setup Guide
## Exact Configuration for Coffee Tier Stripe Integration

**Problem**: You need to configure environment variables in multiple locations for Stripe to work  
**Solution**: This guide shows exactly which variables go where and why  

---

## 🎯 **Overview: Why Two Different Places?**

Your Coffee tier uses both **frontend** (React) and **backend** (Edge Functions) code:

- **Frontend**: Needs to redirect users to Stripe checkout
- **Backend**: Needs to create checkout sessions and process webhooks
- **Security**: Secret keys must NEVER be in frontend code

---

## 📁 **File 1: Frontend Environment Variables**

### **File Location**: `.env.local` (in your project root)

### **Current Status**: ✅ Already updated for you

```bash
# Existing Supabase config
VITE_SUPABASE_URL="https://pdmtvkcxnqysujnpcnyh.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# NEW: Stripe Configuration (Frontend)
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_REPLACE_WITH_YOUR_PUBLISHABLE_KEY"
VITE_STRIPE_COFFEE_PRICE_ID="price_REPLACE_WITH_YOUR_PRICE_ID"
```

### **What You Need to Replace**:

1. **`VITE_STRIPE_PUBLISHABLE_KEY`**:
   - **From**: Stripe Dashboard → API Keys → Publishable key
   - **Starts with**: `pk_test_` (test mode) or `pk_live_` (production)
   - **Example**: `pk_test_51AbCdEf2GhIjKl3MnOpQr4StUvWxYz...`
   - **Why needed**: React components use this to redirect to Stripe checkout

2. **`VITE_STRIPE_COFFEE_PRICE_ID`**:
   - **From**: Stripe Dashboard → Products → [Coffee Tier] → Price ID
   - **Starts with**: `price_`
   - **Example**: `price_1OqJ2k2eZvKYlo2C7VqzYvGH`
   - **Why needed**: Tells Stripe which product the customer is buying

### **Important Notes**:
- **VITE_ prefix**: Makes these available in React components
- **Safe for frontend**: These keys are safe to expose in browser code
- **No quotes needed**: When you paste the actual values, keep the quotes

---

## 🛠️ **File 2: Backend Environment Variables**

### **Location**: Supabase Dashboard (NOT a file on your computer)

### **How to Access**:
1. Go to: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/settings/environment-variables
2. Click "Add new variable" for each one below

### **Variables to Add**:

#### **Variable 1: STRIPE_SECRET_KEY**
```
Name: STRIPE_SECRET_KEY
Value: sk_test_REPLACE_WITH_YOUR_SECRET_KEY
```
- **From**: Stripe Dashboard → API Keys → Secret key (click "Reveal" first)
- **Starts with**: `sk_test_` (test mode) or `sk_live_` (production)
- **Example**: `sk_test_51AbCdEf2GhIjKl3MnOpQr4StUvWxYz...`
- **Why needed**: Edge Functions use this to create checkout sessions
- **⚠️ CRITICAL**: Never put this in frontend code!

#### **Variable 2: STRIPE_WEBHOOK_SECRET**
```
Name: STRIPE_WEBHOOK_SECRET  
Value: whsec_REPLACE_WITH_YOUR_WEBHOOK_SECRET
```
- **From**: Stripe Dashboard → Webhooks → [Your endpoint] → Signing secret (click "Reveal")
- **Starts with**: `whsec_`
- **Example**: `whsec_1Ab2Cd3Ef4Gh5Ij6Kl7Mn8Op9Qr...`
- **Why needed**: Edge Functions use this to verify webhook authenticity
- **⚠️ CRITICAL**: Webhooks won't work without this!

---

## 🔄 **Test vs Production Setup**

### **For Testing (Recommended Start)**:

**Frontend (.env.local)**:
```bash
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."  # Test publishable key
VITE_STRIPE_COFFEE_PRICE_ID="price_..."    # Test mode price ID
```

**Backend (Supabase)**:
```bash
STRIPE_SECRET_KEY="sk_test_..."           # Test secret key
STRIPE_WEBHOOK_SECRET="whsec_..."         # Webhook secret
```

### **For Production (Later)**:

**Frontend (.env.production)**:
```bash
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_..."  # LIVE publishable key
VITE_STRIPE_COFFEE_PRICE_ID="price_..."    # LIVE mode price ID
```

**Backend (Supabase)**:
```bash
STRIPE_SECRET_KEY="sk_live_..."           # LIVE secret key  
STRIPE_WEBHOOK_SECRET="whsec_..."         # LIVE webhook secret
```

---

## ✅ **Verification Steps**

### **Step 1: Check Frontend Variables**
```bash
# In your project directory, run:
npm run dev

# Open browser console and type:
console.log(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
# Should show: pk_test_... or pk_live_...

console.log(import.meta.env.VITE_STRIPE_COFFEE_PRICE_ID)  
# Should show: price_...
```

### **Step 2: Check Backend Variables**
```bash
# Test if Edge Functions can access Stripe
npm run deploy:functions

# Check logs in Supabase Dashboard → Functions → analyze-page → Logs
# Look for any "Missing environment variable" errors
```

### **Step 3: Test Complete Setup**
```bash
# This will verify database + environment setup
npm run coffee:status
```

---

## 🚨 **Common Mistakes & Fixes**

### **Mistake 1**: "Environment variable not found"
**Cause**: Variable name typed incorrectly  
**Fix**: Check exact spelling and case sensitivity

### **Mistake 2**: "Invalid API key"  
**Cause**: Test key used in live mode or vice versa  
**Fix**: Ensure all keys are from same mode (test or live)

### **Mistake 3**: "Webhook signature verification failed"
**Cause**: Wrong webhook secret or missing  
**Fix**: Re-copy webhook secret from Stripe Dashboard

### **Mistake 4**: Variables not updating
**Cause**: Need to restart development server  
**Fix**: Stop (`Ctrl+C`) and restart (`npm run dev`)

---

## 📋 **Quick Copy-Paste Checklist**

Use this checklist when setting up:

### **From Stripe Dashboard, I need to copy**:
- [ ] Publishable key (pk_test_... or pk_live_...)
- [ ] Secret key (sk_test_... or sk_live_...)  
- [ ] Price ID (price_...)
- [ ] Webhook secret (whsec_...)

### **Into my project, I need to paste**:
- [ ] Publishable key → .env.local → VITE_STRIPE_PUBLISHABLE_KEY
- [ ] Price ID → .env.local → VITE_STRIPE_COFFEE_PRICE_ID
- [ ] Secret key → Supabase Dashboard → STRIPE_SECRET_KEY
- [ ] Webhook secret → Supabase Dashboard → STRIPE_WEBHOOK_SECRET

### **To verify setup works**:
- [ ] npm run dev (no environment errors)
- [ ] npm run deploy:functions (deploys successfully)
- [ ] npm run coffee:status (all systems ready)

---

**🎯 Next Step**: Once you have all 4 values from Stripe Dashboard, we'll replace the placeholder values and test the complete payment flow!