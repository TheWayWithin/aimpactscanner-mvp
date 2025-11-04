# Stripe Webhook Setup Checklist

## ✅ STAGING (Test Mode) - COMPLETE
- [x] Add webhook endpoint in Stripe Test Mode
- [x] Copy webhook signing secret
- [x] Add secret to Supabase staging Edge Function secrets
- [x] **CRITICAL**: Disable JWT verification in Edge Function settings
- [x] Test with Growth trial signup (webhook working, tier updates automatically)

## ⏳ PRODUCTION (Live Mode) - TODO BEFORE LAUNCH
- [ ] Add webhook endpoint in Stripe Live Mode
- [ ] Copy webhook signing secret (different from test!)
- [ ] Add secret to Supabase production Edge Function secrets
- [ ] **CRITICAL**: Disable JWT verification in production Edge Function settings
- [ ] Test with real payment

---

## Webhook Configuration Details

### Staging Setup
- **Stripe Dashboard**: https://dashboard.stripe.com/test/webhooks
- **Endpoint URL**: `https://isgzvwpjokcmtizstwru.supabase.co/functions/v1/stripe-webhook`
- **Events**: `checkout.session.completed`
- **Supabase Project**: isgzvwpjokcmtizstwru (staging)
- **Secret Name**: `STRIPE_WEBHOOK_SECRET`

### Production Setup (TODO)
- **Stripe Dashboard**: https://dashboard.stripe.com/webhooks (LIVE mode)
- **Endpoint URL**: `https://pdmtvkcxnqysujnpcnyh.supabase.co/functions/v1/stripe-webhook`
- **Events**: `checkout.session.completed`
- **Supabase Project**: pdmtvkcxnqysujnpcnyh (production)
- **Secret Name**: `STRIPE_WEBHOOK_SECRET`

---

## Why This Matters

Without webhooks configured:
- ❌ User pays but tier stays "free"
- ❌ Manual SQL required to fix
- ❌ Bad user experience

With webhooks configured:
- ✅ User pays → tier updates automatically
- ✅ Seamless experience
- ✅ No manual intervention needed

## Critical Setup Requirement: JWT Verification

⚠️ **IMPORTANT**: Supabase Edge Functions have JWT verification ENABLED by default, which blocks Stripe webhooks!

**Why This Is Critical**:
- Stripe webhook calls don't include JWT authentication tokens
- If JWT verification is enabled, Edge Function returns 401 BEFORE any code runs
- Webhook secret verification happens AFTER JWT check, so correct secret still fails
- No logs appear because function never executes

**How to Disable JWT Verification**:
1. Go to: Supabase Dashboard → Edge Functions → stripe-webhook → Details tab
2. Find "Verify JWT with legacy secret" toggle (will be green/enabled)
3. Click toggle to disable (turns gray/off)
4. Click "Save changes"
5. Webhook will now accept Stripe calls and verify signature in code

**Security Note**: This is safe because:
- Webhook signature verification still happens in code (HMAC-SHA256)
- Only Stripe can generate valid signatures using the webhook secret
- Edge Function validates every request before processing
