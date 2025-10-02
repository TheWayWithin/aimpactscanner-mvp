# Security Testing Checklist

**Mission**: Validate security posture of OAuth-first authentication system
**Priority**: CRITICAL - Security cannot be compromised
**Owner**: @tester (with @operator assistance)

---

## Security Testing Overview

This checklist ensures the authentication and monetization system follows security-first principles from CLAUDE.md:

> **NEVER compromise security for convenience**

All tests must PASS before production deployment.

---

## Authentication Security

### OAuth Security

- [ ] **CSRF Protection**
  - Test: Modify OAuth state parameter during flow
  - Expected: Authentication rejected with error
  - Command:
    ```bash
    # Capture OAuth URL
    # Manually change state parameter
    # Complete OAuth flow
    # Should fail with "Invalid state" error
    ```
  - **PASS/FAIL**: _______

- [ ] **Redirect URI Validation**
  - Test: Modify redirect_uri in OAuth request
  - Expected: OAuth provider rejects unauthorized URI
  - Verified URIs:
    - Production: `https://pdmtvkcxnqysujnpcnyh.supabase.co/auth/v1/callback`
    - Local: `http://localhost:54321/auth/v1/callback`
  - **PASS/FAIL**: _______

- [ ] **Token Security**
  - Test: Check OAuth tokens never exposed to client
  - Expected: No tokens in localStorage, sessionStorage, or JavaScript
  - Verification:
    ```javascript
    console.log(localStorage); // Should not contain access_token
    console.log(sessionStorage); // Should not contain refresh_token
    ```
  - **PASS/FAIL**: _______

- [ ] **Session Hijacking Prevention**
  - Test: Copy session cookie to different browser
  - Expected: Session invalid or requires re-authentication
  - **PASS/FAIL**: _______

### Magic Link Security

- [ ] **Single-Use Tokens**
  - Test: Click magic link twice
  - Expected: First click works, second shows "Already used"
  - **PASS/FAIL**: _______

- [ ] **Token Expiration**
  - Test: Wait 1 hour, then click magic link
  - Expected: "Link expired. Request new link."
  - **PASS/FAIL**: _______

- [ ] **Rate Limiting**
  - Test: Request 5 magic links in 1 minute
  - Expected: After 3 requests, rate limit error
  - **PASS/FAIL**: _______

- [ ] **Email Verification**
  - Test: Ensure email is verified after magic link login
  - Expected: `email_verified = true` in user metadata
  - Verification:
    ```sql
    SELECT email, email_confirmed_at FROM auth.users WHERE email = 'test@example.com';
    ```
  - **PASS/FAIL**: _______

---

## Payment Security

### Stripe Integration Security

- [ ] **Webhook Signature Verification**
  - Test: Send fake webhook without signature
  - Expected: Webhook rejected, tier not updated
  - Command:
    ```bash
    curl -X POST https://pdmtvkcxnqysujnpcnyh.supabase.co/functions/v1/stripe-webhook \
      -H "Content-Type: application/json" \
      -d '{"type": "checkout.session.completed", "data": {...}}'
    ```
  - Expected Response: 401 Unauthorized or 400 Bad Request
  - **PASS/FAIL**: _______

- [ ] **Webhook Signature Validation**
  - Test: Send webhook with invalid signature
  - Expected: Signature verification fails, no database update
  - **PASS/FAIL**: _______

- [ ] **Idempotency**
  - Test: Send same webhook event twice (same event_id)
  - Expected: Second event ignored (duplicate detection)
  - Verification:
    ```sql
    SELECT COUNT(*) FROM users WHERE stripe_customer_id = 'cus_test_123';
    -- Should be 1, not 2
    ```
  - **PASS/FAIL**: _______

- [ ] **Secret Key Protection**
  - Test: Check Stripe secret key not in client bundle
  - Command:
    ```bash
    grep -r "sk_test_" dist/ || echo "✅ No secret keys in bundle"
    grep -r "sk_live_" dist/ || echo "✅ No live keys in bundle"
    ```
  - Expected: No matches found
  - **PASS/FAIL**: _______

- [ ] **Payment Amount Validation**
  - Test: Modify checkout session amount in client
  - Expected: Server validates amount, rejects tampered request
  - **PASS/FAIL**: _______

---

## Data Security

### Database Security (RLS Policies)

- [ ] **User Data Isolation**
  - Test: Query another user's data
  - Command:
    ```sql
    -- As user A, try to read user B's data
    SELECT * FROM users WHERE id = 'user-b-uuid';
    ```
  - Expected: RLS policy prevents access (empty result or error)
  - **PASS/FAIL**: _______

- [ ] **Tier Update Authorization**
  - Test: Manually update own tier to 'scale'
  - Command:
    ```sql
    UPDATE users SET tier = 'scale' WHERE id = auth.uid();
    ```
  - Expected: Update rejected (only webhooks can upgrade tier)
  - **PASS/FAIL**: _______

- [ ] **Waitlist Access Control**
  - Test: Insert waitlist entry for another user
  - Command:
    ```sql
    INSERT INTO waitlist (user_id, interested_tier) VALUES ('other-user-uuid', 'growth');
    ```
  - Expected: RLS policy prevents insert
  - **PASS/FAIL**: _______

### Input Validation

- [ ] **SQL Injection Prevention**
  - Test: Enter SQL in form inputs
  - Input: `'; DROP TABLE users; --`
  - Expected: Input sanitized, no SQL execution
  - Locations to test:
    - Email input (magic link)
    - URL input (analysis)
  - **PASS/FAIL**: _______

- [ ] **XSS Prevention**
  - Test: Enter script tags in inputs
  - Input: `<script>alert('XSS')</script>`
  - Expected: Script not executed, content escaped
  - Locations to test:
    - Pending analysis URL
    - User profile fields
  - **PASS/FAIL**: _______

- [ ] **URL Validation**
  - Test: Store malicious URL in pendingAnalysisUrl
  - Input: `javascript:alert('XSS')`
  - Expected: URL rejected or sanitized
  - Verification:
    ```javascript
    localStorage.setItem('pendingAnalysisUrl', 'javascript:alert("XSS")');
    // Retrieve and check
    const context = getAnalysisContext();
    console.log(context); // Should be null or sanitized
    ```
  - **PASS/FAIL**: _______

### Secret Management

- [ ] **Environment Variables Protected**
  - Test: Check no secrets committed to Git
  - Command:
    ```bash
    git log --all --full-history --source -- .env
    git log --all --full-history --source -S "sk_test_"
    git log --all --full-history --source -S "sk_live_"
    ```
  - Expected: No matches (secrets never committed)
  - **PASS/FAIL**: _______

- [ ] **Client-Side Bundle Inspection**
  - Test: Check production bundle for secrets
  - Command:
    ```bash
    npm run build
    grep -r "sk_test_" dist/
    grep -r "sk_live_" dist/
    grep -r "SUPABASE_SERVICE_ROLE_KEY" dist/
    ```
  - Expected: No matches found (only public keys)
  - **PASS/FAIL**: _______

- [ ] **Supabase Service Role Key**
  - Test: Ensure service role key only server-side
  - Expected: Key only in Supabase Edge Functions, never exposed
  - **PASS/FAIL**: _______

---

## Session & Authorization

### Session Management

- [ ] **Session Timeout**
  - Test: Leave session idle for extended period
  - Expected: Session expires, user must re-authenticate
  - **PASS/FAIL**: _______

- [ ] **Logout Functionality**
  - Test: Sign out, then attempt to access protected route
  - Expected: Redirected to login page
  - **PASS/FAIL**: _______

- [ ] **Session Regeneration**
  - Test: Check session token changes after login
  - Expected: New session token issued on each login
  - **PASS/FAIL**: _______

### Authorization Checks

- [ ] **Unauthenticated Access**
  - Test: Access protected routes without authentication
  - URLs to test:
    - `/dashboard`
    - `/analyze`
    - `/account`
    - `/upsell/coffee`
  - Expected: Redirected to `/login`
  - **PASS/FAIL**: _______

- [ ] **Tier-Based Access Control**
  - Test: Free user tries to access Coffee-only features
  - Feature: PDF export
  - Expected: Upgrade prompt or feature disabled
  - **PASS/FAIL**: _______

- [ ] **Waitlist Access Control**
  - Test: Non-authenticated user tries to join waitlist
  - Expected: Must be logged in
  - **PASS/FAIL**: _______

---

## Privacy & Compliance

### Data Minimization

- [ ] **Personal Data Collection**
  - Review: What personal data is stored?
  - Expected: Only essential data (email, name, tier)
  - Verified Fields:
    - Email: ✅ (required for auth)
    - Name: ✅ (from OAuth, optional)
    - Tier: ✅ (required for features)
    - IP Address: ❌ (not stored)
    - Device Info: ❌ (not stored)
  - **PASS/FAIL**: _______

- [ ] **localStorage Content Review**
  - Test: Check what's stored in localStorage
  - Command:
    ```javascript
    Object.keys(localStorage).forEach(key => {
      console.log(key, localStorage.getItem(key));
    });
    ```
  - Expected: Only non-sensitive data (URLs, timestamps)
  - **PASS/FAIL**: _______

- [ ] **Cookie Review**
  - Test: Check cookies set by application
  - Expected: Only Supabase auth cookies (secure, httpOnly)
  - **PASS/FAIL**: _______

### GDPR Compliance (if applicable)

- [ ] **Cookie Consent**
  - Test: Cookie banner shown on first visit
  - Expected: User can accept/reject non-essential cookies
  - **PASS/FAIL**: _______

- [ ] **Data Export**
  - Test: User can export their data
  - Expected: "Download my data" feature available
  - **PASS/FAIL**: _______

- [ ] **Data Deletion**
  - Test: User can delete their account
  - Expected: "Delete account" feature available
  - **PASS/FAIL**: _______

---

## Network Security

### HTTPS Enforcement

- [ ] **HTTP Redirect**
  - Test: Visit http://aimpactscanner.com
  - Expected: Automatic redirect to https://
  - **PASS/FAIL**: _______

- [ ] **Mixed Content**
  - Test: Check for HTTP resources on HTTPS pages
  - Command: Browser console → Look for mixed content warnings
  - Expected: No warnings (all resources HTTPS)
  - **PASS/FAIL**: _______

### Content Security Policy (CSP)

- [ ] **CSP Header Present**
  - Test: Check CSP header in response
  - Command:
    ```bash
    curl -I https://aimpactscanner.com | grep -i content-security-policy
    ```
  - Expected: CSP header present with strict policy
  - **PASS/FAIL**: _______

- [ ] **CSP Violation Handling**
  - Test: Attempt to load unauthorized script
  - Expected: CSP blocks script, logs violation
  - **PASS/FAIL**: _______

- [ ] **Inline Script Restriction**
  - Test: CSP prevents inline scripts
  - Expected: Only nonce-based scripts allowed
  - **PASS/FAIL**: _______

### CORS Configuration

- [ ] **CORS Headers**
  - Test: Check CORS headers on API endpoints
  - Command:
    ```bash
    curl -H "Origin: https://malicious.com" \
      https://pdmtvkcxnqysujnpcnyh.supabase.co/rest/v1/users
    ```
  - Expected: CORS blocks unauthorized origin
  - **PASS/FAIL**: _______

---

## Error Handling

### Information Disclosure

- [ ] **Error Messages**
  - Test: Trigger various errors (invalid email, failed auth, etc.)
  - Expected: Generic error messages (no sensitive info leaked)
  - Example Good: "Authentication failed. Please try again."
  - Example Bad: "User 'admin' not found in database 'prod_db'"
  - **PASS/FAIL**: _______

- [ ] **Stack Traces**
  - Test: Cause server error, check response
  - Expected: No stack traces in production
  - **PASS/FAIL**: _______

- [ ] **Database Errors**
  - Test: Malformed query, check error response
  - Expected: Generic "Database error" message
  - **PASS/FAIL**: _______

---

## Logging & Monitoring

### Security Logging

- [ ] **Authentication Attempts Logged**
  - Test: Check logs for login attempts
  - Expected: Successful and failed logins logged
  - **PASS/FAIL**: _______

- [ ] **Suspicious Activity Detection**
  - Test: Multiple failed login attempts
  - Expected: Anomaly detected, possible account lockout
  - **PASS/FAIL**: _______

- [ ] **Webhook Processing Logged**
  - Test: Check Edge Function logs for webhook events
  - Command:
    ```bash
    supabase functions logs stripe-webhook --limit 20
    ```
  - Expected: All webhook events logged with timestamps
  - **PASS/FAIL**: _______

---

## Penetration Testing (Advanced)

### OWASP Top 10 Coverage

- [ ] **A01: Broken Access Control**
  - Covered by: RLS policy tests, tier access tests
  - **PASS/FAIL**: _______

- [ ] **A02: Cryptographic Failures**
  - Covered by: HTTPS enforcement, token security
  - **PASS/FAIL**: _______

- [ ] **A03: Injection**
  - Covered by: SQL injection tests, XSS tests
  - **PASS/FAIL**: _______

- [ ] **A04: Insecure Design**
  - Covered by: Security-first principles review
  - **PASS/FAIL**: _______

- [ ] **A05: Security Misconfiguration**
  - Covered by: CSP, CORS, error handling tests
  - **PASS/FAIL**: _______

- [ ] **A07: Identification and Authentication Failures**
  - Covered by: OAuth security, session management
  - **PASS/FAIL**: _______

- [ ] **A08: Software and Data Integrity Failures**
  - Covered by: Webhook signature verification
  - **PASS/FAIL**: _______

- [ ] **A09: Security Logging and Monitoring Failures**
  - Covered by: Logging tests
  - **PASS/FAIL**: _______

- [ ] **A10: Server-Side Request Forgery (SSRF)**
  - Covered by: URL validation tests
  - **PASS/FAIL**: _______

---

## Security Checklist Summary

**Total Tests**: 50+
**Critical Tests**: 15
**High Priority Tests**: 20
**Medium Priority Tests**: 15+

**Deployment Criteria**:
- ✅ ALL critical tests must PASS
- ✅ 95%+ high priority tests must PASS
- ✅ 80%+ medium priority tests must PASS
- ✅ No security vulnerabilities found in automated scans

**Sign-Off**:
- Security Tester: _________________ Date: _______
- Operator: _________________ Date: _______
- Product Owner: _________________ Date: _______

---

## Security Tools Recommended

1. **OWASP ZAP**: Automated security scanner
   ```bash
   docker run -t owasp/zap2docker-stable zap-baseline.py \
     -t https://aimpactscanner.com
   ```

2. **Burp Suite**: Manual penetration testing

3. **npm audit**: Check for vulnerable dependencies
   ```bash
   npm audit
   npm audit fix
   ```

4. **Supabase Security Advisor**: Check RLS policies
   - Supabase Dashboard → Security Advisor

5. **Stripe Security Tools**: Webhook testing
   ```bash
   stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
   ```

---

**Remember**: Security is not a checklist, it's a mindset. Continuously review and improve.

*"Never compromise security for convenience."* 🔒
