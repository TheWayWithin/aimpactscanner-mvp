# OAuth Provider Setup Guide - AImpactScanner

## Overview

This guide provides complete, step-by-step instructions for configuring Google OAuth and GitHub OAuth authentication providers in Supabase for the AImpactScanner authentication system.

**Implementation Time**: 60-90 minutes total
**Cost**: Free (using standard Google Cloud and GitHub OAuth)
**Prerequisite**: Active Supabase project

---

## Quick Navigation

- [Google OAuth Setup](#google-oauth-setup) (30-40 minutes)
- [GitHub OAuth Setup](#github-oauth-setup) (20-30 minutes)
- [Supabase Configuration](#supabase-configuration) (10 minutes)
- [Testing OAuth Flows](#testing-oauth-flows) (10 minutes)
- [Troubleshooting](#troubleshooting)

---

## Supabase Redirect URLs

**CRITICAL**: You'll need these redirect URLs for both OAuth providers. Copy them from your Supabase dashboard:

### How to Find Your Redirect URLs

1. **Login to Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to Your Project**: Select `aimpactscanner-mvp` project
3. **Go to Authentication Settings**:
   - Sidebar → Authentication → Providers
4. **Copy Redirect URLs**: Each provider shows its redirect URL

### Your Redirect URLs

Based on your project ID (`pdmtvkcxnqysujnpcnyh`):

**Production Callback URL**:
```
https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback
```

**Local Development Callback URL** (if using local Supabase):
```
http://localhost:54321/auth/v1/callback
```

**Important Notes**:
- URLs must match EXACTLY (including `https://` vs `http://`)
- Trailing slashes matter - DO NOT add trailing slash
- Case-sensitive - use lowercase
- These URLs are the same for BOTH Google and GitHub OAuth

---

## Google OAuth Setup

### Prerequisites
- Google account (personal or workspace)
- Access to Google Cloud Console
- 30-40 minutes for setup

### Step 1: Create Google Cloud Project (10 minutes)

1. **Access Google Cloud Console**:
   - Go to: https://console.cloud.google.com/
   - Login with your Google account

2. **Create New Project**:
   - Click project dropdown (top left, next to "Google Cloud")
   - Click "NEW PROJECT"
   - Project Name: `AImpactScanner`
   - Organization: Leave as default (No organization)
   - Location: Leave as default
   - Click "CREATE"

3. **Wait for Project Creation**:
   - Takes 30-60 seconds
   - Notification will appear when complete
   - Select the new project from dropdown

### Step 2: Configure OAuth Consent Screen (10 minutes)

**CRITICAL**: This step MUST be completed before creating OAuth credentials.

1. **Navigate to OAuth Consent Screen**:
   - Left sidebar → APIs & Services → OAuth consent screen
   - OR: https://console.cloud.google.com/apis/credentials/consent

2. **Select User Type**:
   - Choose: **External** (allows any Google account to sign in)
   - Click "CREATE"

3. **Configure App Information** (Required Fields):

   **App Information**:
   - App name: `AImpactScanner`
   - User support email: `your-email@example.com` (select from dropdown)

   **App Domain** (Optional but Recommended):
   - Application home page: `https://aimpactscanner.com`
   - Application privacy policy: `https://aimpactscanner.com/#/privacy`
   - Application terms of service: `https://aimpactscanner.com/#/terms`

   **Developer Contact Information**:
   - Email addresses: `your-email@example.com`

   Click "SAVE AND CONTINUE"

4. **Configure Scopes**:
   - Click "ADD OR REMOVE SCOPES"
   - Select these scopes ONLY:
     - `openid` - OpenID Connect authentication
     - `email` - User's email address
     - `profile` - User's basic profile info (name, photo)
   - Click "UPDATE"
   - Click "SAVE AND CONTINUE"

5. **Add Test Users** (Optional - for testing phase):
   - Click "ADD USERS"
   - Add your email address
   - Click "ADD"
   - Click "SAVE AND CONTINUE"

6. **Review and Publish**:
   - Review summary
   - Click "BACK TO DASHBOARD"
   - **Optional**: Click "PUBLISH APP" to remove testing restrictions
     - If you keep it in Testing mode, only test users can sign in
     - Publishing allows anyone with a Google account to sign in

### Step 3: Create OAuth 2.0 Credentials (10 minutes)

1. **Navigate to Credentials**:
   - Left sidebar → APIs & Services → Credentials
   - OR: https://console.cloud.google.com/apis/credentials

2. **Create OAuth Client ID**:
   - Click "+ CREATE CREDENTIALS" (top of page)
   - Select "OAuth client ID"

3. **Configure OAuth Client**:

   **Application Type**:
   - Select: **Web application**

   **Name**:
   - Enter: `AImpactScanner Web Client`

   **Authorized JavaScript origins** (Optional):
   - Click "ADD URI"
   - Add: `https://aimpactscanner.com`
   - Click "ADD URI"
   - Add: `http://localhost:5173` (for local development)

   **Authorized redirect URIs** (CRITICAL):
   - Click "ADD URI"
   - Add: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
   - For local dev, click "ADD URI" and add: `http://localhost:54321/auth/v1/callback`

   Click "CREATE"

4. **Save Credentials**:
   - Modal appears with Client ID and Client Secret
   - **Client ID**: Starts with numbers, ends with `.apps.googleusercontent.com`
   - **Client Secret**: Random string
   - Click "DOWNLOAD JSON" (optional, for backup)
   - Click "OK"

5. **Copy Credentials**:
   - Go back to Credentials page
   - Find your OAuth 2.0 Client ID in the list
   - Click the name to view details
   - **Copy Client ID**: You'll need this for Supabase
   - **Copy Client Secret**: You'll need this for Supabase

### Step 4: Enable Google+ API (5 minutes)

**Note**: While deprecated, the Google+ API is still required for OAuth to work properly.

1. **Navigate to API Library**:
   - Left sidebar → APIs & Services → Library
   - OR: https://console.cloud.google.com/apis/library

2. **Search for Google+ API**:
   - Search box: Type "Google+ API"
   - Click on "Google+ API" result

3. **Enable API**:
   - Click "ENABLE"
   - Wait for confirmation (30 seconds)

### Google OAuth Setup Complete ✅

**You Should Now Have**:
- [x] Google Cloud Project created
- [x] OAuth consent screen configured
- [x] OAuth 2.0 Client ID created
- [x] Client ID and Client Secret copied
- [x] Google+ API enabled
- [x] Redirect URIs configured

**Next**: Configure these credentials in Supabase (see [Supabase Configuration](#supabase-configuration))

---

## GitHub OAuth Setup

### Prerequisites
- GitHub account
- Admin access to create OAuth apps
- 20-30 minutes for setup

### Step 1: Create GitHub OAuth App (15 minutes)

1. **Access GitHub Developer Settings**:
   - Login to GitHub: https://github.com
   - Click your profile picture (top right)
   - Settings → Developer settings
   - OR: https://github.com/settings/developers

2. **Create New OAuth App**:
   - Left sidebar → OAuth Apps
   - Click "New OAuth App" (or "Register a new application")

3. **Configure OAuth Application**:

   **Application name**:
   ```
   AImpactScanner
   ```

   **Homepage URL**:
   ```
   https://aimpactscanner.com
   ```

   **Application description** (Optional):
   ```
   AI-powered impact analysis for websites and content.
   ```

   **Authorization callback URL** (CRITICAL):
   ```
   https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback
   ```

   **Enable Device Flow**: Leave UNCHECKED

   Click "Register application"

4. **Generate Client Secret**:
   - After creation, you'll see the app details page
   - **Client ID**: Displayed at top (20-character alphanumeric string)
   - **Client secrets**: Click "Generate a new client secret"
   - **Copy Secret IMMEDIATELY**: You won't be able to see it again
   - Store securely (you'll need it for Supabase)

5. **Optional - Add Logo**:
   - Upload Application logo: Click "Upload new logo"
   - Use your AImpactScanner logo
   - Click "Update application"

### Step 2: Configure Additional Settings (5 minutes)

1. **Review Permissions**:
   - GitHub OAuth automatically requests:
     - `read:user` - Read user profile
     - `user:email` - Access user email addresses
   - These are the ONLY permissions needed
   - No additional scopes required

2. **Optional - Setup for Organizations**:
   - If you want to allow sign-in via GitHub organization accounts:
   - Scroll to "Organization access"
   - Click "Request" for each organization
   - Organization admin must approve

3. **Verify Configuration**:
   - Application name: `AImpactScanner`
   - Homepage URL: `https://aimpactscanner.com`
   - Callback URL: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
   - Client ID: Visible on page
   - Client Secret: Generated and copied

### GitHub OAuth Setup Complete ✅

**You Should Now Have**:
- [x] GitHub OAuth App created
- [x] Client ID copied
- [x] Client Secret generated and copied
- [x] Authorization callback URL configured
- [x] Permissions verified

**Next**: Configure these credentials in Supabase (see [Supabase Configuration](#supabase-configuration))

---

## Supabase Configuration

### Prerequisites
- Google OAuth Client ID and Secret (from above)
- GitHub OAuth Client ID and Secret (from above)
- Access to Supabase dashboard

### Step 1: Configure Google OAuth in Supabase (5 minutes)

1. **Access Supabase Dashboard**:
   - Go to: https://supabase.com/dashboard
   - Select project: `aimpactscanner-mvp`

2. **Navigate to Authentication Providers**:
   - Left sidebar → Authentication → Providers
   - Find "Google" in the provider list

3. **Enable Google Provider**:
   - Toggle: **Enabled** = ON (green)

4. **Configure Google OAuth Settings**:

   **Client ID (for OAuth)**:
   ```
   [Paste your Google Client ID from Step 3]
   Example: 123456789-abc123.apps.googleusercontent.com
   ```

   **Client Secret (for OAuth)**:
   ```
   [Paste your Google Client Secret from Step 3]
   Example: GOCSPX-abc123def456...
   ```

   **Authorized Client IDs** (Optional - leave empty):
   - Only needed for Google Sign-In JavaScript library
   - Not required for standard OAuth flow

   **Skip nonce check**: Leave UNCHECKED

   Click "Save"

5. **Verify Configuration**:
   - Green checkmark appears next to Google provider
   - "Callback URL" displayed: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
   - Status shows "Enabled"

### Step 2: Configure GitHub OAuth in Supabase (5 minutes)

1. **Navigate to Authentication Providers**:
   - Same page as above (Authentication → Providers)
   - Find "GitHub" in the provider list

2. **Enable GitHub Provider**:
   - Toggle: **Enabled** = ON (green)

3. **Configure GitHub OAuth Settings**:

   **Client ID (for OAuth)**:
   ```
   [Paste your GitHub Client ID from Step 1]
   Example: Iv1.abc123def456...
   ```

   **Client Secret (for OAuth)**:
   ```
   [Paste your GitHub Client Secret from Step 1]
   Example: 1234567890abcdef1234567890abcdef12345678
   ```

   Click "Save"

4. **Verify Configuration**:
   - Green checkmark appears next to GitHub provider
   - "Callback URL" displayed: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
   - Status shows "Enabled"

### Supabase Configuration Complete ✅

**You Should Now Have**:
- [x] Google provider enabled in Supabase
- [x] Google Client ID and Secret configured
- [x] GitHub provider enabled in Supabase
- [x] GitHub Client ID and Secret configured
- [x] Both providers showing "Enabled" status

**Next**: Test OAuth flows (see [Testing OAuth Flows](#testing-oauth-flows))

---

## Testing OAuth Flows

### Prerequisites
- OAuth providers configured in Supabase
- Frontend application running locally or deployed

### Test 1: Google OAuth Flow (5 minutes)

1. **Navigate to Signup Page**:
   - Local: `http://localhost:5173/#/signup`
   - Production: `https://aimpactscanner.com/#/signup`

   Note: You should see TierSelector and AuthMethodSelector components with Google/GitHub OAuth buttons.

2. **Click "Sign in with Google"**:
   - Should redirect to Google login page
   - Google consent screen appears (if first time)
   - Shows requested permissions: email, profile, openid

3. **Authorize Application**:
   - Select Google account
   - Review permissions
   - Click "Allow" or "Continue"

4. **Verify Redirect**:
   - Should redirect back to application
   - User should be logged in
   - Check: User appears in Supabase dashboard → Authentication → Users
   - User metadata includes: email, full_name, avatar_url

5. **Expected User Data**:
   ```json
   {
     "id": "uuid-generated-by-supabase",
     "email": "user@gmail.com",
     "email_confirmed_at": "2025-10-02T...",
     "app_metadata": {
       "provider": "google",
       "providers": ["google"]
     },
     "user_metadata": {
       "avatar_url": "https://lh3.googleusercontent.com/...",
       "email": "user@gmail.com",
       "email_verified": true,
       "full_name": "John Doe",
       "iss": "https://accounts.google.com",
       "name": "John Doe",
       "picture": "https://lh3.googleusercontent.com/...",
       "provider_id": "1234567890...",
       "sub": "1234567890..."
     }
   }
   ```

### Test 2: GitHub OAuth Flow (5 minutes)

1. **Navigate to Signup Page**:
   - Same as above

2. **Click "Sign in with GitHub"**:
   - Should redirect to GitHub authorization page
   - GitHub consent screen appears (if first time)
   - Shows requested permissions: read:user, user:email

3. **Authorize Application**:
   - Click "Authorize [your-username]"
   - May request password confirmation

4. **Verify Redirect**:
   - Should redirect back to application
   - User should be logged in
   - Check: User appears in Supabase dashboard → Authentication → Users
   - User metadata includes: email, full_name, avatar_url

5. **Expected User Data**:
   ```json
   {
     "id": "uuid-generated-by-supabase",
     "email": "user@github.com",
     "email_confirmed_at": "2025-10-02T...",
     "app_metadata": {
       "provider": "github",
       "providers": ["github"]
     },
     "user_metadata": {
       "avatar_url": "https://avatars.githubusercontent.com/u/...",
       "email": "user@github.com",
       "email_verified": true,
       "full_name": "John Doe",
       "name": "John Doe",
       "picture": "https://avatars.githubusercontent.com/u/...",
       "preferred_username": "johndoe",
       "provider_id": "12345678",
       "sub": "12345678",
       "user_name": "johndoe"
     }
   }
   ```

### Test 3: Existing User Login (5 minutes)

1. **Test Google Login** (for user created via Google):
   - Logout of application
   - Click "Sign in with Google"
   - Should immediately redirect (no consent screen)
   - User logged in successfully

2. **Test GitHub Login** (for user created via GitHub):
   - Logout of application
   - Click "Sign in with GitHub"
   - Should immediately redirect (no consent screen)
   - User logged in successfully

### Testing Complete ✅

**Success Criteria**:
- [x] Google OAuth signup creates new user
- [x] GitHub OAuth signup creates new user
- [x] Google OAuth login works for existing users
- [x] GitHub OAuth login works for existing users
- [x] Email addresses captured correctly
- [x] User metadata populated (name, avatar)
- [x] No errors in browser console
- [x] No errors in Supabase logs

---

## Troubleshooting

### Google OAuth Issues

#### Error: "redirect_uri_mismatch"

**Cause**: Redirect URI in Google Cloud Console doesn't match Supabase callback URL

**Solution**:
1. Verify exact URL in Google Cloud Console → Credentials → OAuth 2.0 Client
2. Must match exactly: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
3. No trailing slash
4. Check for typos
5. Save and retry

#### Error: "invalid_client"

**Cause**: Client ID or Client Secret incorrect in Supabase

**Solution**:
1. Go to Google Cloud Console → Credentials
2. Find your OAuth 2.0 Client ID
3. Copy Client ID and Client Secret again
4. Update in Supabase → Authentication → Providers → Google
5. Save and retry

#### Error: "access_denied"

**Cause**: User clicked "Cancel" or app not published for external users

**Solution**:
1. If testing mode: Add user as test user in Google Cloud Console
2. If production: Publish app in OAuth consent screen
3. User must click "Allow" when authorizing

#### Error: "Google+ API not enabled"

**Cause**: Google+ API not enabled for project

**Solution**:
1. Go to Google Cloud Console → APIs & Services → Library
2. Search "Google+ API"
3. Click "ENABLE"
4. Wait 30 seconds and retry

### GitHub OAuth Issues

#### Error: "redirect_uri_mismatch"

**Cause**: Authorization callback URL doesn't match

**Solution**:
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Click on "AImpactScanner" app
3. Verify "Authorization callback URL" exactly matches: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
4. Update and retry

#### Error: "invalid_client_id"

**Cause**: Client ID incorrect in Supabase

**Solution**:
1. Go to GitHub OAuth App settings
2. Copy Client ID (visible at top of page)
3. Update in Supabase → Authentication → Providers → GitHub
4. Save and retry

#### Error: "bad_verification_code"

**Cause**: Client Secret incorrect or regenerated

**Solution**:
1. Go to GitHub OAuth App settings
2. Generate new Client Secret
3. Copy immediately
4. Update in Supabase → Authentication → Providers → GitHub
5. Save and retry

### General OAuth Issues

#### Error: "Error loading external provider"

**Cause**: Provider not properly configured in Supabase

**Solution**:
1. Check Supabase → Authentication → Providers
2. Verify provider is "Enabled" (toggle is green)
3. Verify Client ID and Secret are filled
4. Save configuration again
5. Refresh page and retry

#### Issue: Email not captured

**Cause**: Email scope not requested or user email private

**Solution**:
1. Verify email scope requested in OAuth consent
2. For GitHub: User may have email set to private
3. Check user_metadata in Supabase for email field
4. Fallback: Prompt user to provide email if missing

#### Issue: User created but not redirected

**Cause**: Frontend callback handling not implemented

**Solution**:
1. Verify `/oauth-callback` route exists in application
2. Check OAuthCallback component implementation
3. Review browser console for errors
4. Check Supabase session is established

---

## Security Best Practices

### OAuth Security Checklist

**Google OAuth**:
- ✅ Use minimal scopes (email, profile, openid only)
- ✅ Verify redirect URIs match exactly
- ✅ HTTPS enforced on production URLs
- ✅ Keep Client Secret secure (never commit to code)
- ✅ Rotate secrets every 90 days
- ✅ Monitor usage in Google Cloud Console

**GitHub OAuth**:
- ✅ Use minimal permissions (read:user, user:email)
- ✅ Verify callback URL matches exactly
- ✅ HTTPS enforced on production URLs
- ✅ Keep Client Secret secure (never commit to code)
- ✅ Rotate secrets every 90 days
- ✅ Monitor usage in GitHub settings

**Supabase Security**:
- ✅ Never expose service role key in frontend
- ✅ Use anon key for frontend authentication
- ✅ RLS policies protect user data
- ✅ Session tokens stored in httpOnly cookies
- ✅ CSRF protection via OAuth state parameter
- ✅ Regular security audits

### Credential Management

**Storage**:
- ✅ Client IDs and Secrets stored in Supabase dashboard
- ✅ Never commit OAuth secrets to git
- ✅ Use environment variables for frontend config
- ✅ Restrict access to Supabase project settings

**Rotation Strategy**:
- Rotate OAuth secrets every 90 days
- Update both provider and Supabase when rotating
- Test authentication after rotation
- Document rotation dates

---

## Cost Structure

### Google OAuth
- **Cost**: FREE (unlimited)
- **Quotas**: 10,000 requests/day to Google APIs (more than sufficient)
- **Scaling**: No cost increase with user growth

### GitHub OAuth
- **Cost**: FREE (unlimited)
- **Rate Limits**: Standard GitHub API rate limits apply
- **Scaling**: No cost increase with user growth

### Total Cost for OAuth
- **Setup**: $0
- **Monthly**: $0
- **Per User**: $0

---

## Next Steps

After completing OAuth setup:

1. **Review Environment Variables Guide**: `/docs/environment-variables.md`
2. **Test Magic Link Setup**: Verify SMTP configuration (see `/docs/email-setup-guide.md`)
3. **Deploy Database Migrations**: Run Migration 020 for auth columns
4. **Implement Frontend Components**: Create OAuth buttons and callback handler
5. **Test Complete Auth Flow**: End-to-end testing with all providers

---

## Reference Documentation

### Official Documentation
- **Google OAuth 2.0**: https://developers.google.com/identity/protocols/oauth2
- **GitHub OAuth**: https://docs.github.com/en/developers/apps/building-oauth-apps
- **Supabase Auth**: https://supabase.com/docs/guides/auth
- **Supabase OAuth Providers**: https://supabase.com/docs/guides/auth/social-login

### Related Guides
- **Environment Variables**: `/docs/environment-variables.md`
- **Email Setup (Magic Link)**: `/docs/email-setup-guide.md`
- **Technical Design**: `/TECHNICAL_DESIGN_AUTH_MONETIZATION.md`
- **Handoff Notes**: `/handoff-notes.md`

---

## Summary

**Configuration Time**: 60-90 minutes total
- Google OAuth: 30-40 minutes
- GitHub OAuth: 20-30 minutes
- Supabase Configuration: 10 minutes
- Testing: 10 minutes

**Success Criteria**:
- ✅ Google OAuth working end-to-end
- ✅ GitHub OAuth working end-to-end
- ✅ Email addresses captured from both providers
- ✅ User metadata populated correctly
- ✅ Secure credential storage
- ✅ Zero cost implementation

**Confidence Level**: 100% - Industry-standard OAuth implementation with comprehensive security

---

*Last Updated: October 2, 2025*
*Status: Ready for immediate implementation*
*Next Action Required: Create Google Cloud Project and GitHub OAuth App using steps above*
