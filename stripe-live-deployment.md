# 🚀 Stripe Live Keys Deployment Guide
## Revenue Activation in 15 Minutes

### Prerequisites
- [ ] Stripe account with verified business details
- [ ] Bank account connected to Stripe
- [ ] Test mode disabled in Stripe Dashboard

---

## Step 1: Get Your Live Keys from Stripe (5 minutes)

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com
2. **Switch to Live Mode**: Toggle from "Test" to "Live" in top right
3. **Get Publishable Key**:
   - Go to Developers → API Keys
   - Copy your **Live Publishable Key** (starts with `pk_live_`)
4. **Get Secret Key**:
   - Click "Reveal live key"
   - Copy your **Live Secret Key** (starts with `sk_live_`)
5. **Get Webhook Secret**:
   - Go to Developers → Webhooks
   - Click "Add endpoint"
   - URL: `https://pdmtvkcxnqysujnpcnyh.supabase.co/functions/v1/stripe-webhook`
   - Select events: 
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - After creation, copy the **Signing secret** (starts with `whsec_`)

---

## Step 2: Verify Your Live Price ID (2 minutes)

1. **In Stripe Dashboard (Live Mode)**:
   - Go to Products → Coffee Tier
   - Click on the $5/month price
   - Copy the Price ID (should be `price_1RnSa4IiC84gpR8HXmbDgaNy` based on your .env.local)
   
2. **If Price Doesn't Exist**:
   - Click "Add Product"
   - Name: "Coffee Tier"
   - Price: $5.00 USD
   - Billing: Monthly
   - Save and copy the new Price ID

---

## Step 3: Update Frontend Environment (2 minutes)

Your `.env.local` already has the live publishable key configured:
```bash
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_51KSrA8IiC84gpR8Hf9dKTFIdR2rSzWtEuFlvQHBi3dLBNmojL0LLdTRDkCYfBtX1tYGbSNbIeykeDpLaSa3oUnnT00eelqRDiA"
VITE_STRIPE_COFFEE_PRICE_ID="price_1RnSa4IiC84gpR8HXmbDgaNy"
```

**Verify the Price ID matches your Stripe Dashboard Price ID**. If different, update it.

---

## Step 4: Update Supabase Edge Function Secrets (5 minutes)

```bash
# Update the Stripe secret key
supabase secrets set STRIPE_SECRET_KEY="sk_live_YOUR_ACTUAL_SECRET_KEY_HERE"

# Update the webhook secret
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET_HERE"

# Deploy the Edge Functions with new secrets
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

---

## Step 5: Test Your Live Payment (3 minutes)

1. **Open your live site**: https://aimpactscanner.com
2. **Create a new account** (or use incognito mode)
3. **Run 3 free analyses** to hit the limit
4. **Click upgrade** when prompted
5. **Use a real credit card** (you can refund yourself later)
6. **Verify**:
   - Payment processes successfully
   - You're redirected back to the app
   - Your tier shows as "Coffee" 
   - You can run unlimited analyses

---

## Step 6: Verify in Stripe Dashboard

1. **Check Payments**: Should see your $5 payment
2. **Check Customers**: Should see your email
3. **Check Subscriptions**: Should show active Coffee tier
4. **Check Webhooks**: Should show successful webhook delivery

---

## Common Issues & Solutions

### Issue: "No such price" error
**Solution**: The Price ID in your .env.local doesn't match Stripe. Create the product in Stripe Live mode.

### Issue: Webhook signature verification fails
**Solution**: Make sure you're using the webhook secret from the LIVE endpoint, not test.

### Issue: Payment succeeds but tier doesn't update
**Solution**: Check Supabase logs for the webhook function. The webhook secret might be wrong.

### Issue: Checkout page shows test mode warning
**Solution**: You're still using test keys. Double-check Step 4.

---

## Post-Deployment Checklist

- [ ] Test payment with real card
- [ ] Verify webhook is receiving events
- [ ] Check user tier updates correctly
- [ ] Monitor Stripe Dashboard for first real customers
- [ ] Set up Stripe email receipts (optional)
- [ ] Configure Stripe tax settings if needed

---

## 🎉 Congratulations!

Once live keys are deployed, you're making money! Your platform will:
- Accept real payments
- Automatically manage subscriptions
- Handle tier upgrades/downgrades
- Process recurring billing

**Next Steps**:
1. Share your site to get first customers
2. Monitor Stripe for revenue
3. Start Railway migration for scaling

---

## Rollback Instructions (If Needed)

To switch back to test mode:
```bash
# In .env.local, use test keys:
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# In Supabase:
supabase secrets set STRIPE_SECRET_KEY="sk_test_..."
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_test_..."
```