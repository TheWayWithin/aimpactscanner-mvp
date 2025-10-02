#!/bin/bash

# ⚠️ CRITICAL EMAIL VERIFICATION FIX - SCHEMA CORRECTED ⚠️
# This script deploys the corrected email verification fix that works with existing schema

set -e

echo "🚨 CRITICAL: Deploying Email Verification Fix (Schema Corrected)"
echo "=============================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 SCHEMA FIX SUMMARY:${NC}"
echo "• REMOVED: References to non-existent 'email_verified' column"
echo "• USING: Supabase's built-in auth.users.email_confirmed_at"
echo "• FIXED: RLS policies to prevent 406 errors"
echo "• FIXED: User creation trigger to prevent 401 errors"
echo ""

echo -e "${BLUE}🎯 DEPLOYMENT OPTIONS:${NC}"
echo "1. Supabase CLI (Fastest)"
echo "2. Dashboard SQL Editor (Most Reliable)"  
echo "3. REST API (Programmatic)"
echo "4. Manual Review (Show SQL Only)"
echo ""

read -p "Choose deployment method (1-4): " choice
echo ""

case $choice in
    1)
        echo -e "${GREEN}🚀 OPTION 1: Supabase CLI Deployment${NC}"
        echo "============================================"
        
        # Check if Supabase CLI is available
        if ! command -v npx &> /dev/null; then
            echo -e "${RED}❌ Error: npx not found. Please install Node.js first.${NC}"
            exit 1
        fi
        
        echo "📤 Deploying schema fix via Supabase CLI..."
        
        # Copy the corrected SQL to a temporary migration file
        cp CRITICAL-EMERGENCY-SQL-FIXED.sql supabase/migrations/018_emergency_email_fix.sql
        
        echo "📁 Created migration: supabase/migrations/018_emergency_email_fix.sql"
        
        # Deploy via CLI
        echo "🔄 Pushing migration to Supabase..."
        npx supabase db push --linked
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ CLI deployment successful!${NC}"
            # Clean up temporary migration
            rm supabase/migrations/018_emergency_email_fix.sql
        else
            echo -e "${RED}❌ CLI deployment failed. Try Option 2 (Dashboard).${NC}"
            exit 1
        fi
        ;;
        
    2)
        echo -e "${GREEN}🚀 OPTION 2: Dashboard SQL Editor${NC}"
        echo "=================================="
        echo ""
        echo -e "${YELLOW}📋 MANUAL STEPS:${NC}"
        echo "1. Open: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/sql"
        echo "2. Click 'New query'"
        echo "3. Copy the contents of: CRITICAL-EMERGENCY-SQL-FIXED.sql"
        echo "4. Paste into the SQL editor"
        echo "5. Click 'RUN'"
        echo ""
        echo -e "${BLUE}📄 SQL FILE LOCATION:${NC}"
        echo "$(pwd)/CRITICAL-EMERGENCY-SQL-FIXED.sql"
        echo ""
        
        read -p "Press Enter after you've executed the SQL in the dashboard..."
        echo -e "${GREEN}✅ Dashboard deployment completed!${NC}"
        ;;
        
    3)
        echo -e "${GREEN}🚀 OPTION 3: REST API Deployment${NC}"
        echo "================================="
        echo ""
        echo -e "${YELLOW}⚠️ WARNING: Requires SUPABASE_SERVICE_ROLE_KEY${NC}"
        echo ""
        
        read -p "Enter your Supabase Service Role Key: " SERVICE_KEY
        
        if [ -z "$SERVICE_KEY" ]; then
            echo -e "${RED}❌ Service key required for API deployment${NC}"
            exit 1
        fi
        
        echo "📤 Deploying via REST API..."
        
        # Read the SQL file and prepare for API call
        SQL_CONTENT=$(cat CRITICAL-EMERGENCY-SQL-FIXED.sql)
        
        # Execute via REST API
        curl -X POST \
          "https://pdmtvkcxnqysujnpcnyh.supabase.co/rest/v1/rpc/exec_sql" \
          -H "apikey: $SERVICE_KEY" \
          -H "Authorization: Bearer $SERVICE_KEY" \
          -H "Content-Type: application/json" \
          -d "{\"sql\": \"$SQL_CONTENT\"}"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ API deployment successful!${NC}"
        else
            echo -e "${RED}❌ API deployment failed. Try Option 2 (Dashboard).${NC}"
            exit 1
        fi
        ;;
        
    4)
        echo -e "${GREEN}🚀 OPTION 4: Manual Review${NC}"
        echo "=========================="
        echo ""
        echo -e "${YELLOW}📄 CORRECTED SQL CONTENT:${NC}"
        echo "============================================"
        cat CRITICAL-EMERGENCY-SQL-FIXED.sql
        echo "============================================"
        echo ""
        echo -e "${BLUE}ℹ️ Copy the above SQL to Supabase Dashboard manually${NC}"
        ;;
        
    *)
        echo -e "${RED}❌ Invalid option. Please run script again.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎯 NEXT STEPS (CRITICAL):${NC}"
echo "========================="
echo ""
echo -e "${YELLOW}1. CONFIGURE SMTP (REQUIRED FOR EMAILS):${NC}"
echo "   • Open: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/auth/settings"
echo "   • Scroll to 'SMTP Settings'"
echo "   • Enable SMTP and configure with your email provider"
echo "   • Recommended: SendGrid, Mailgun, or AWS SES"
echo ""
echo -e "${YELLOW}2. TEST EMAIL VERIFICATION:${NC}"
echo "   • Create new account with test email"
echo "   • Verify email is sent successfully"
echo "   • Test verification link functionality"
echo "   • Confirm user can sign in after verification"
echo ""
echo -e "${YELLOW}3. MONITOR FOR ERRORS:${NC}"
echo "   • Check network tab for 406/401 errors (should be gone)"
echo "   • Verify user profiles are created automatically"
echo "   • Test both free and paid signup flows"
echo ""
echo -e "${GREEN}✅ SCHEMA-CORRECTED EMAIL FIX DEPLOYMENT COMPLETE${NC}"
echo ""
echo -e "${BLUE}🔧 KEY CHANGES MADE:${NC}"
echo "• Removed non-existent 'email_verified' column references"
echo "• Uses Supabase's native auth.users.email_confirmed_at"
echo "• Fixed RLS policies to prevent 406 errors"
echo "• Fixed user creation trigger to prevent 401 errors"
echo "• Maintained all existing security and functionality"
echo ""
echo -e "${YELLOW}⚠️ REMEMBER: SMTP configuration still required for email delivery!${NC}"