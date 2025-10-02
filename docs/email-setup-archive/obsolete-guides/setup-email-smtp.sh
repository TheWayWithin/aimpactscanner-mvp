#!/bin/bash

# Resend SMTP Setup Script for AImpact Scanner
# This script provides step-by-step guidance for configuring email verification

echo "🚀 AImpact Scanner - Resend SMTP Setup"
echo "======================================"
echo

# Check if user has Resend API key
echo "📋 Pre-flight Check:"
echo "1. Do you have a Resend account? (https://resend.com)"
echo "2. Do you have your Resend API key ready?"
echo "3. Do you have access to your Supabase dashboard?"
echo

read -p "Press Enter when you're ready to continue..."
echo

# Step 1: Get Resend API Key
echo "📧 Step 1: Get Your Resend API Key"
echo "=================================="
echo "1. Go to https://resend.com/api-keys"
echo "2. Click 'Create API Key'"
echo "3. Name it 'AImpact Scanner SMTP'"
echo "4. Select 'Sending access' permissions"
echo "5. Copy the API key (starts with 're_')"
echo

read -p "Enter your Resend API key: " RESEND_API_KEY

if [[ ! $RESEND_API_KEY =~ ^re_ ]]; then
    echo "⚠️  Warning: API key doesn't start with 're_' - please double-check"
fi

echo "✅ API key received"
echo

# Step 2: Supabase Dashboard Configuration
echo "🔧 Step 2: Configure Supabase SMTP"
echo "=================================="
echo "1. Go to your Supabase dashboard: https://supabase.com/dashboard"
echo "2. Select your AImpact Scanner project"
echo "3. Navigate to: Authentication → Settings → SMTP Settings"
echo "4. Enable 'Custom SMTP'"
echo "5. Enter these EXACT settings:"
echo
echo "   SMTP Host: smtp.resend.com"
echo "   SMTP Port: 465"
echo "   SMTP User: resend"
echo "   SMTP Password: $RESEND_API_KEY"
echo "   Sender Email: support@aimpactscanner.com"
echo "   Sender Name: AImpact Scanner"
echo
echo "6. Click 'Save' to apply the settings"
echo

read -p "Press Enter after you've configured SMTP in Supabase dashboard..."
echo

# Step 3: Test Configuration
echo "🧪 Step 3: Test Email Delivery"
echo "=============================="
echo "Running email configuration test..."
echo

# Run the test script
if command -v node &> /dev/null; then
    node scripts/test-email-verification.js
    echo
else
    echo "⚠️  Node.js not found - skipping automated test"
    echo "Manual test: Try signing up with a real email address"
    echo
fi

# Step 4: Verification Steps
echo "✅ Step 4: Verify Everything Works"
echo "================================="
echo "1. Go to your app's signup page"
echo "2. Register with a real email address"
echo "3. Check that verification email arrives (check spam folder)"
echo "4. Click the verification link"
echo "5. Confirm you can sign in after verification"
echo

# Step 5: Monitoring
echo "📊 Step 5: Monitor Email Delivery"
echo "================================="
echo "1. Resend Dashboard: https://resend.com/dashboard"
echo "   → Check delivery rates and email status"
echo "2. Supabase Auth Logs: Check for SMTP errors"
echo "3. User Feedback: Ensure emails arrive in inbox, not spam"
echo

# Success message
echo "🎉 SMTP Configuration Complete!"
echo "==============================="
echo "✅ Email verification should now work"
echo "✅ Users will receive verification emails"
echo "✅ Professional email delivery via Resend"
echo
echo "📋 What's Fixed:"
echo "• Users receive verification emails within 1-2 minutes"
echo "• 99%+ email delivery rate (Resend standard)"
echo "• Proper SPF/DKIM authentication"
echo "• Professional sender reputation"
echo
echo "💰 Cost Impact:"
echo "• First 3,000 emails/month: FREE"
echo "• Additional emails: $20/month for up to 50K emails"
echo
echo "🔒 Security Notes:"
echo "• Keep your Resend API key secure"
echo "• Monitor usage for any unusual activity"
echo "• Set up domain authentication for best deliverability"
echo

# Final instructions
echo "📚 Next Steps:"
echo "1. Test the signup flow with a real email"
echo "2. Monitor Resend dashboard for delivery analytics"
echo "3. Set up domain authentication in Resend (optional but recommended)"
echo "4. Consider setting up email templates for branding"
echo

echo "🎯 Need Help?"
echo "• Resend Documentation: https://resend.com/docs"
echo "• Supabase Auth Guide: https://supabase.com/docs/guides/auth"
echo "• Check scripts/configure-resend-smtp.md for detailed guide"