# How to Access Your Account

## Your Account Details
- **Email:** jamie.watters.mail@icloud.com
- **Tier:** Free (3 analyses per month)
- **Status:** Active

## Option 1: Magic Link Sign In (RECOMMENDED)
Since you're hitting password reset rate limits, use the magic link instead:

1. Go to https://aimpactscanner.com
2. Enter your email: jamie.watters.mail@icloud.com
3. Click "Send magic link"
4. Check your email for the sign-in link
5. Click the link to sign in directly (no password needed)

## Option 2: Wait for Rate Limit to Clear
Supabase has security rate limits on password resets:
- Wait 1-5 minutes before requesting another reset
- The rate limit will clear automatically
- Then go to https://aimpactscanner.com/reset-password

## Option 3: Direct Database Update (if needed)
If you absolutely need password access, we can:
1. Use Supabase admin to manually set a password
2. This requires the service role key
3. Contact support if this is needed

## Why This Happens
- Supabase limits password reset requests to prevent abuse
- Usually allows 1 request per minute per email
- The 429 error means "Too Many Requests"
- This is a security feature, not a bug

## Best Practice
Use magic link sign-in for now - it's:
- More secure (no password to remember)
- Not subject to the same rate limits
- Works immediately