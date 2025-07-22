# Stripe Test Mode Setup Guide
## Coffee Tier Payment Testing Configuration

This guide walks through setting up Stripe in test mode to validate the Coffee tier payment flow before production deployment.

## Step 1: Stripe Dashboard Setup

### 1.1 Create Stripe Account (if needed)
1. Go to [stripe.com](https://stripe.com) and create an account
2. Verify your email and complete basic setup
3. **IMPORTANT**: Start in **Test Mode** (toggle in top left)

### 1.2 Create Coffee Tier Product
1. Navigate to **Products** in Stripe Dashboard
2. Click **+ Add Product**
3. Configure:
   - **Name**: `AImpactScanner Coffee Tier`
   - **Description**: `Unlimited AI website analysis - $5/month`
   - **Pricing Model**: `Standard pricing`
   - **Price**: `$5.00 USD`
   - **Billing Period**: `Monthly`
   - **Payment Behavior**: `Charge automatically`
4. Click **Save Product**
5. **Copy the Price ID** (starts with `price_`) - you'll need this

### 1.3 Get API Keys
1. Navigate to **Developers** → **API Keys**
2. **Copy the following TEST keys**:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### 1.4 Configure Webhooks
1. Navigate to **Developers** → **Webhooks**
2. Click **+ Add endpoint**
3. **Endpoint URL**: `https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1/stripe-webhook`
   - Replace `YOUR_SUPABASE_PROJECT` with your actual project ID
4. **Events to send**:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. **Copy the Webhook Secret** (starts with `whsec_`)

## Step 2: Update Environment Variables

### 2.1 Frontend Configuration (.env.local)
```bash
# Supabase Configuration (keep existing)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Stripe Configuration (UPDATE THESE)
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY"
VITE_STRIPE_COFFEE_PRICE_ID="price_YOUR_ACTUAL_PRICE_ID"

# Environment
NODE_ENV="development"
```

### 2.2 Supabase Edge Functions Environment Variables
1. Go to your **Supabase Dashboard**
2. Navigate to **Settings** → **Edge Functions**
3. Add these environment variables:

```bash
STRIPE_SECRET_KEY="sk_test_YOUR_ACTUAL_SECRET_KEY"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_ACTUAL_WEBHOOK_SECRET"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Step 3: Deploy Updated Edge Functions

```bash
# Deploy all Edge Functions with new environment variables
npm run deploy:functions

# Verify deployment
npm run coffee:status
```

## Step 4: Run Coffee Tier Test Suite

```bash
# Run the comprehensive test validation
node scripts/test-coffee-tier-stripe.js

# Run specific test categories
npm run test:db          # Database operations
npm run test:progress    # Real-time progress
npm run test:edge        # Edge Function integration
```

## Step 5: Manual Payment Flow Testing

### 5.1 Test the Complete User Journey
1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Register New User**:
   - Go to http://localhost:3000
   - Sign up with a test email
   - Verify magic link

3. **Trigger Free Tier Limit**:
   - Run 3 analyses to reach free tier limit
   - Note the "upgrade" prompt

4. **Test Coffee Tier Upgrade**:
   - Click "Upgrade to Coffee Tier"
   - Should redirect to Stripe checkout
   - **Use Stripe test card**: `4242 4242 4242 4242`
   - Any future expiry date
   - Any CVC

5. **Verify Upgrade Success**:
   - Should redirect back to success page
   - User should now have unlimited access
   - Run additional analyses to confirm

### 5.2 Test Edge Cases

#### Test Failed Payment
- Use card: `4000 0000 0000 0002` (decline)
- Verify user remains on free tier

#### Test Subscription Management
- In Stripe Dashboard, cancel the test subscription
- Verify user gets downgraded to free tier

## Step 6: Validation Checklist

### ✅ Environment Setup
- [ ] Stripe test mode enabled
- [ ] Coffee tier product created ($5/month)
- [ ] API keys configured in .env.local
- [ ] Webhook endpoint configured
- [ ] Edge Functions environment variables set

### ✅ Payment Flow Testing
- [ ] Free user registration works
- [ ] 3 analysis limit enforced for free users
- [ ] Upgrade button triggers Stripe checkout
- [ ] Test payment (4242...) processes successfully
- [ ] User gets upgraded to Coffee tier
- [ ] Unlimited analysis access granted
- [ ] Failed payment (4000...) handled gracefully

### ✅ Technical Validation
- [ ] All Edge Functions responding
- [ ] Database tier updates working
- [ ] Real-time progress still functional
- [ ] Webhook events processed correctly
- [ ] Test suite passes (95%+ success rate)

### ✅ Error Handling
- [ ] Invalid payment methods handled
- [ ] Network errors don't break user flow
- [ ] Subscription cancellation works
- [ ] User downgrade logic functions

## Step 7: Production Readiness

Once all tests pass:

1. **Switch to Live Mode**:
   - Toggle Stripe to **Live Mode**
   - Create production Coffee tier product
   - Update environment variables with live keys
   - Update webhook endpoint to production domain

2. **Deploy to Production**:
   - Configure Netlify with production environment
   - Set up custom domain (www.aimpactscanner.com)
   - Deploy with live Stripe integration

## Test Card Numbers

Use these test cards for different scenarios:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 0069` | Expired card |
| `4000 0027 6000 3184` | 3D Secure authentication required |

## Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**:
   - Check webhook URL is correct Supabase function endpoint
   - Verify webhook secret matches environment variable
   - Check Stripe Dashboard webhook logs

2. **Edge Function Errors**:
   - Verify all environment variables are set
   - Check Supabase function logs
   - Ensure functions are deployed with latest code

3. **Frontend Stripe Integration**:
   - Confirm publishable key is test key (pk_test_)
   - Verify price ID matches created product
   - Check browser console for JavaScript errors

4. **Database Issues**:
   - Run `npm run verify:migration` to check schema
   - Ensure Coffee tier migration was applied
   - Verify RLS policies allow service role access

---

## Support

If you encounter issues:

1. Check Stripe Dashboard logs for webhook delivery
2. Monitor Supabase Edge Function logs
3. Review browser console for frontend errors
4. Run `npm run test:summary` for system status

This guide ensures your Coffee tier is thoroughly tested before production launch! 🚀