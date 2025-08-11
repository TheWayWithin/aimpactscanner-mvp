# Stripe Webhook Configuration

## Create Webhook Endpoint in Stripe Dashboard

1. **Go to**: https://dashboard.stripe.com/webhooks
2. **Click**: "Add endpoint"
3. **Enter Endpoint URL**: 
   ```
   https://pdmtvkcxnqysujnpcnyh.supabase.co/functions/v1/stripe-webhook
   ```

4. **Select these events**:
   - `checkout.session.completed` ✓
   - `invoice.payment_succeeded` ✓
   - `customer.subscription.updated` ✓
   - `customer.subscription.deleted` ✓
   - `invoice.payment_failed` ✓

5. **Click**: "Add endpoint"
6. **Copy the Signing Secret** (starts with `whsec_`)

## You'll need these values:
- [ ] Live Secret Key: `sk_live_...`
- [ ] Webhook Signing Secret: `whsec_...`
- [ ] Verify Price ID exists: `price_1RnSa4IiC84gpR8HXmbDgaNy`