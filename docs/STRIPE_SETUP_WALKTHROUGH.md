# Stripe Setup Complete Walkthrough
## Step-by-Step Coffee Tier Payment Configuration

**Goal**: Configure Stripe to process $5/month Coffee tier subscriptions  
**Time**: 15-20 minutes  
**Outcome**: Functional payment processing for immediate revenue generation  

---

## 🎯 Overview: What We're Building

### **Payment Flow Architecture**
```
User clicks "Buy Me a Coffee" 
    ↓
Frontend calls create-checkout-session Edge Function
    ↓  
Edge Function creates Stripe checkout session
    ↓
User redirected to Stripe-hosted checkout page
    ↓
User enters payment details and subscribes
    ↓
Stripe sends webhook to stripe-webhook Edge Function
    ↓
Webhook updates user tier to "coffee" in database
    ↓
User gets unlimited Phase A analysis access
```

### **Why This Approach**
- **Security**: Stripe handles all payment processing and PCI compliance
- **Simplicity**: No need to handle credit cards directly
- **Reliability**: Stripe's 99.99% uptime and robust webhook system
- **Global**: Supports customers worldwide with local payment methods

---

## 📝 Step 1: Access Stripe Dashboard (2 minutes)

### **What**: Log into Stripe and access the correct environment
### **Why**: Need to configure products and webhooks in live/test mode
### **How**:

1. **Go to**: https://dashboard.stripe.com
2. **Sign in** with your Stripe account
3. **Important**: Check the top-left toggle
   - **For Testing**: Ensure "Test mode" is ON (data toggle should show "Test")
   - **For Production**: Ensure "Live mode" is ON (data toggle should show "Live")

### **Screenshot Reference**:
```
┌─────────────────────────────────────┐
│ [Stripe Logo] Test mode [ON/OFF]    │  ← This toggle!
│                                     │
│ Dashboard  Products  Customers...   │
└─────────────────────────────────────┘
```

### **Critical**: Start with Test mode for setup, switch to Live mode for production

---

## 🛍️ Step 2: Create Coffee Tier Product (5 minutes)

### **What**: Create a subscription product for Coffee tier
### **Why**: Stripe needs a product definition to know what customers are buying
### **How**:

1. **Navigate**: Dashboard → Products (in left sidebar)
2. **Click**: "Add product" button (blue button, top right)
3. **Fill Product Details**:

```
┌─ Product Information ─────────────────────────────────┐
│                                                       │
│ Name: AImpactScanner Coffee Tier                      │
│ (This appears on customer receipts and invoices)     │
│                                                       │
│ Description: Unlimited Phase A AI optimization       │
│ analysis for websites. Get professional insights     │
│ without limits for just $5/month.                    │
│                                                       │
│ Image: [Optional - upload logo if you have one]      │
│                                                       │
│ Statement descriptor: AIMPACT*COFFEE                  │
│ (This appears on customer credit card statements)    │
└───────────────────────────────────────────────────────┘
```

4. **Configure Pricing**:

```
┌─ Pricing Information ─────────────────────────────────┐
│                                                       │
│ Pricing model: ○ One time  ● Recurring               │
│                                                       │
│ Price: $5.00                                          │
│ Currency: USD                                         │
│ Billing period: ● Monthly  ○ Yearly                  │
│                                                       │
│ Usage type: ● Licensed (most common)                 │
│                                                       │
│ Per unit: [leave blank]                               │
└───────────────────────────────────────────────────────┘
```

5. **Click**: "Save product" button

### **Result**: You'll see a new product with a Price ID like `price_1AbCdEf123456789`

### **CRITICAL**: Copy the Price ID immediately - you'll need this!

```
Example Price ID: price_1OqJ2k2eZvKYlo2C7VqzYvGH
                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ 
                  Copy this exact string!
```

---

## 🔗 Step 3: Configure Webhook Endpoint (5 minutes)

### **What**: Set up endpoint for Stripe to notify our app about payment events
### **Why**: When customers pay, Stripe needs to tell our database to upgrade their tier
### **How**:

1. **Navigate**: Dashboard → Webhooks (in left sidebar under "Developers")
2. **Click**: "Add endpoint" button
3. **Configure Endpoint**:

```
┌─ Webhook Endpoint Configuration ──────────────────────┐
│                                                       │
│ Endpoint URL:                                         │
│ https://pdmtvkcxnqysujnpcnyh.supabase.co/functions/v1/stripe-webhook
│ ^^^^^^^^^^^^^^^^^^^^^^^^^^^^                          │
│ Replace with YOUR project ID                          │
│                                                       │
│ Description: Coffee Tier Payment Processing           │
│                                                       │
│ Version: 2024-06-20 (or latest)                      │
└───────────────────────────────────────────────────────┘
```

4. **Select Events to Listen For**:

**Why these specific events?**
- `checkout.session.completed`: Customer finished paying → upgrade tier
- `invoice.payment_succeeded`: Monthly payment successful → keep tier active  
- `customer.subscription.updated`: Subscription changed → handle tier changes
- `customer.subscription.deleted`: Customer canceled → downgrade to free tier
- `invoice.payment_failed`: Payment failed → handle gracefully

**How to select**:
```
☑ checkout.session.completed
☑ invoice.payment_succeeded  
☑ customer.subscription.updated
☑ customer.subscription.deleted
☑ invoice.payment_failed
```

5. **Click**: "Add endpoint"

### **CRITICAL**: Copy the Webhook Secret

After creating the webhook, you'll see:
```
┌─ Webhook Details ─────────────────────────────────────┐
│                                                       │
│ Signing secret: whsec_1Ab2Cd3Ef4Gh5Ij6Kl7Mn8Op9Qr... │
│                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^       │
│                 Copy this entire string!              │
│                                                       │
│ [Reveal] button ← Click this to show the secret       │
└───────────────────────────────────────────────────────┘
```

---

## 🔑 Step 4: Collect API Keys (3 minutes)

### **What**: Get the API keys needed for your application to communicate with Stripe
### **Why**: Your Edge Functions need these to create checkout sessions and verify webhooks

### **How**:

1. **Navigate**: Dashboard → API keys (in left sidebar under "Developers")

2. **Copy Publishable Key**:
```
┌─ Publishable key ─────────────────────────────────────┐
│                                                       │
│ pk_test_51Ab2Cd...  [Reveal] [Copy]                   │
│ ^^^^^^^^^^^^^^^^^^^                                   │
│ This is safe to use in frontend code                 │
└───────────────────────────────────────────────────────┘
```

3. **Copy Secret Key**:
```
┌─ Secret key ──────────────────────────────────────────┐
│                                                       │
│ sk_test_51Ab2Cd...  [Reveal] [Copy]                   │
│ ^^^^^^^^^^^^^^^^^^^                                   │
│ ⚠️  NEVER expose this in frontend code!               │
└───────────────────────────────────────────────────────┘
```

### **Security Note**: 
- **Publishable key**: Safe to use in React components (starts with `pk_`)
- **Secret key**: Only use in backend/Edge Functions (starts with `sk_`)

---

## ⚙️ Step 5: Configure Environment Variables (5 minutes)

### **What**: Add the keys to your application configuration
### **Why**: Your Edge Functions and React app need these to communicate with Stripe

### **Supabase Environment Variables**:

1. **Go to**: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/settings/environment-variables
2. **Add these variables**:

```
┌─ Add Environment Variable ────────────────────────────┐
│                                                       │
│ Name: STRIPE_SECRET_KEY                               │
│ Value: sk_test_51Ab2Cd3Ef4Gh5Ij6Kl...                │
│                                                       │
│ [Save]                                                │
└───────────────────────────────────────────────────────┘

┌─ Add Environment Variable ────────────────────────────┐
│                                                       │
│ Name: STRIPE_WEBHOOK_SECRET                           │
│ Value: whsec_1Ab2Cd3Ef4Gh5Ij6Kl7Mn...               │
│                                                       │
│ [Save]                                                │
└───────────────────────────────────────────────────────┘
```

### **Local Environment Variables**:

3. **Edit your `.env.local` file**:

```bash
# Open .env.local in your project root
# Add these lines:

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51Ab2Cd3Ef4Gh5Ij6Kl...
VITE_STRIPE_COFFEE_PRICE_ID=price_1OqJ2k2eZvKYlo2C7VqzYvGH

# Note: VITE_ prefix makes these available in React components
```

### **Why These Specific Variables**:
- `STRIPE_SECRET_KEY`: Edge Functions use this to create checkout sessions
- `STRIPE_WEBHOOK_SECRET`: Edge Functions use this to verify webhook authenticity  
- `VITE_STRIPE_PUBLISHABLE_KEY`: React components use this for Stripe checkout
- `VITE_STRIPE_COFFEE_PRICE_ID`: Tells Stripe which product customer is buying

---

## ✅ Step 6: Test the Configuration (5 minutes)

### **What**: Verify everything is connected correctly
### **Why**: Catch configuration issues before customers encounter them

### **Test 1: Webhook Endpoint**

1. **Go to**: Stripe Dashboard → Webhooks → [Your endpoint]
2. **Click**: "Send test webhook" button
3. **Select**: `checkout.session.completed` 
4. **Click**: "Send test webhook"
5. **Expected Result**: Status 200 response (may take a few seconds)

### **Test 2: Price ID Verification**

1. **In Stripe Dashboard**: Go to Products → [Your Coffee Tier product]
2. **Verify**: Price shows as $5.00/month
3. **Copy Price ID**: Ensure it matches your environment variable

### **Test 3: Environment Variables**

1. **In terminal, run**:
```bash
# This should show your Stripe configuration
npm run coffee:status
```

2. **Expected output**: All database components verified ✅

---

## 🚨 Common Issues & Solutions

### **Issue**: "Webhook endpoint returned status 404"
**Why**: URL is incorrect or Edge Function not deployed  
**Fix**: 
```bash
# Redeploy Edge Functions
npm run deploy:functions

# Verify correct URL in webhook:
https://[YOUR-PROJECT-ID].supabase.co/functions/v1/stripe-webhook
```

### **Issue**: "Invalid API key"
**Why**: Wrong key or not saved properly in environment variables
**Fix**: 
1. Re-copy keys from Stripe Dashboard
2. Verify in Supabase environment variables (no extra spaces)
3. Restart your local development server

### **Issue**: "Price not found"
**Why**: Price ID doesn't match or product not saved
**Fix**:
1. Go to Stripe Products → [Your product] 
2. Copy the exact Price ID (starts with `price_`)
3. Update VITE_STRIPE_COFFEE_PRICE_ID

### **Issue**: Test vs Live Mode Confusion
**Why**: Keys from wrong environment
**Fix**:
- Test keys start with `pk_test_` and `sk_test_`
- Live keys start with `pk_live_` and `sk_live_`
- Ensure all keys are from same environment

---

## 🎯 Verification Checklist

Before proceeding to testing payments:

- [ ] Coffee Tier product created with $5/month pricing
- [ ] Price ID copied and added to environment variables
- [ ] Webhook endpoint configured with correct URL
- [ ] All 5 webhook events selected
- [ ] Webhook secret copied and added to Supabase
- [ ] Secret key added to Supabase environment variables
- [ ] Publishable key added to .env.local
- [ ] Test webhook sent successfully (status 200)
- [ ] Edge Functions deployed with latest code

### **Success Indicators**:
```bash
✅ Stripe Dashboard shows Coffee Tier product active
✅ Webhook endpoint shows "Enabled" status  
✅ Test webhook returns 200 response
✅ All environment variables configured
✅ npm run coffee:status shows all systems ready
```

---

## 🚀 Next Steps

Once Stripe is configured:

1. **Test Payment Flow**: Follow the payment testing guide
2. **Frontend Integration**: Add tier selection components to your app
3. **Monitor Revenue**: Use the business metrics queries
4. **Go Live**: Switch from test to live mode when ready

**You now have a fully configured Stripe payment system ready to process Coffee tier subscriptions!** 

The next step is testing the complete payment flow to ensure customers can successfully upgrade and receive unlimited access.