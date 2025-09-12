# 🚀 LIVE PAYMENT TEST - Step by Step

## Your Testing URL: https://aimpactscanner.com

## Quick Test Flow (5 minutes):

### 1️⃣ Start Testing
- Open: https://aimpactscanner.com (use incognito mode)
- Enter URL: "example.com"
- Click: "Analyze My Site Free"
- Wait for results (14 seconds)

### 2️⃣ Register
- Click: "Continue with Limited Free"
- Enter: Your email
- Check email for magic link
- Click the link to authenticate

### 3️⃣ Upgrade to Coffee Tier
- Click: "Upgrade" or "Get Coffee Tier"
- You'll see Stripe Checkout page
- **Verify it shows**: 
  - Coffee Tier
  - $5.00/month (or whatever price you set)
  - Your email pre-filled

### 4️⃣ Complete Payment
- Card Number: Your real card
- Expiry: Any future date
- CVC: Your card's CVC
- Name: Your name
- Click: "Subscribe"

### 5️⃣ After Payment
You should:
- Be redirected back to AImpactScanner
- See "Coffee" tier in header
- Be able to analyze unlimited URLs

## 🔄 Cancel & Refund Process:

### In Stripe Dashboard (https://dashboard.stripe.com):

1. **Find Your Subscription**:
   - Click "Customers" → Find your email
   - OR Click "Payments" → See your $5 payment

2. **Cancel Subscription**:
   - Click on subscription
   - Click "Cancel subscription"
   - Choose "Cancel immediately"
   - Confirm

3. **Process Refund**:
   - Go to "Payments"
   - Click your $5 payment
   - Click "Refund"
   - Select "Full refund"
   - Confirm → Money back to your card

## ✅ What to Verify:

**In Stripe Dashboard:**
- [ ] Payment shows as succeeded
- [ ] Customer created with your email
- [ ] Subscription created then canceled
- [ ] Refund processed
- [ ] Webhook events delivered (check Events tab)

**In AImpactScanner:**
- [ ] Tier upgraded to Coffee after payment
- [ ] Could analyze URLs without limit
- [ ] No errors in browser console

## 🐛 If Something Goes Wrong:

**Payment fails:**
- Check browser console (F12)
- Verify you're using live Stripe checkout (not test)

**Tier doesn't update:**
- Check Stripe Events tab for webhook delivery
- May take 10-30 seconds for webhook to process

**Can't find subscription:**
- Make sure you're in Live mode in Stripe (not Test)
- Check Customers section, not just Payments

## 📝 Notes:
- The $5 charge will appear on your card statement
- Refund typically appears in 5-10 business days
- You're testing the exact flow real customers will use
- This verifies both payment AND cancellation work correctly

---

**Ready? Start at: https://aimpactscanner.com** 🎯