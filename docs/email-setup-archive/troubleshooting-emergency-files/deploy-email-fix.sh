#!/bin/bash

# EMERGENCY DEPLOYMENT SCRIPT: Email Verification Fix
# Purpose: Apply critical database fixes for production email verification system
# Date: 2025-09-30

echo "🚨 EMERGENCY DEPLOYMENT: Email Verification System Fix"
echo "=============================================="

# Configuration
PROJECT_REF="pdmtvkcxnqysujnpcnyh"
SUPABASE_URL="https://pdmtvkcxnqysujnpcnyh.supabase.co"

echo "📋 Deployment Summary:"
echo "  - Fix RLS policies for unverified users (406 errors)"
echo "  - Fix user creation permissions (401 errors)"  
echo "  - Enable robust error handling"
echo ""

# Check if migration file exists
if [ ! -f "supabase/migrations/017_fix_email_verification.sql" ]; then
    echo "❌ Migration file not found: supabase/migrations/017_fix_email_verification.sql"
    exit 1
fi

echo "✅ Migration file found"

# Method 1: Try Supabase CLI (if authenticated)
echo ""
echo "🔧 OPTION 1: Supabase CLI Deployment (Recommended)"
echo "Run the following command if you have Supabase CLI access:"
echo ""
echo "  npx supabase db push --linked"
echo ""
echo "If that fails due to existing migrations, use:"
echo "  npx supabase db push --include-all --linked"
echo ""

# Method 2: Direct SQL execution instructions
echo "🔧 OPTION 2: Manual SQL Execution"
echo "If CLI access is unavailable, execute the following SQL directly in Supabase Dashboard:"
echo ""
echo "1. Open: https://supabase.com/dashboard/project/$PROJECT_REF/sql"
echo "2. Copy and paste the contents of: supabase/migrations/017_fix_email_verification.sql"
echo "3. Click 'Run' to execute the migration"
echo ""

# Method 3: REST API approach
echo "🔧 OPTION 3: REST API Deployment"
echo "If you have the service role key, you can apply specific fixes via REST API:"
echo ""

echo "Fix 1 - Update RLS Policy (REST API):"
cat << 'EOF'
curl -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "DROP POLICY IF EXISTS \"Users can view their own profile\" ON users; CREATE POLICY \"Users can read own user data\" ON users FOR SELECT USING (auth.uid() = id OR (auth.uid() IS NOT NULL AND email_verified = true));"
  }'
EOF

echo ""
echo "Fix 2 - Add User Creation Policy (REST API):"
cat << 'EOF'
curl -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "CREATE POLICY IF NOT EXISTS \"Allow signup user creation\" ON users FOR INSERT WITH CHECK (auth.uid() = id);"
  }'
EOF

echo ""
echo "🔧 OPTION 4: SMTP Configuration"
echo "CRITICAL: Email sending will not work until SMTP is configured!"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/auth/settings"
echo "2. Scroll to 'SMTP Settings'"
echo "3. Configure your SMTP provider (SendGrid recommended):"
echo "   - Enable SMTP: ON"
echo "   - Host: smtp.sendgrid.net"
echo "   - Port: 587"
echo "   - Username: apikey"
echo "   - Password: [Your SendGrid API Key]"
echo "   - Sender email: support@aimpactscanner.com"
echo "   - Sender name: AImpactScanner"
echo ""

echo "📊 Verification Steps:"
echo "1. Apply database migration (using any method above)"
echo "2. Configure SMTP in Supabase dashboard"
echo "3. Test signup with new email address"
echo "4. Verify email is received and verification link works"
echo "5. Test complete user flow: signup → verify → dashboard"
echo ""

echo "🔍 Troubleshooting:"
echo "- 406 errors: RLS policy fix not applied"
echo "- 401 errors: User creation policy not applied"
echo "- No email received: SMTP not configured"
echo "- Module errors: Run build script: npm run build && ./scripts/fix-production-build.sh"
echo ""

echo "⚠️  IMPACT: Until this is deployed, users cannot complete registration!"
echo "⏰ URGENCY: This is blocking all new user signups and revenue"

# Make script executable
chmod +x "$0"

echo ""
echo "✅ Deployment script ready. Choose your deployment method above."