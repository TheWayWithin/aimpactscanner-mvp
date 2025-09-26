#!/bin/bash
# Deployment Validation Script - Prevent future deployment regressions
# Run this before and after deploying Edge Functions

set -e

echo "🔍 AImpactScanner Deployment Validation"
echo "========================================"

# Configuration
EDGE_FUNCTION_URL="${SUPABASE_URL:-https://pdmtvkcxnqysujnpcnyh.supabase.co}/functions/v1/analyze-page"
ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbXR2a2N4bnF5c3VqbnBjbnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE3Mzk2MzgsImV4cCI6MjAzNzMxNTYzOH0.OQLGQPhYJbvejqrJdSDV8LJJF77Jc6_E5RdxfxQ1Xd8}"
MAX_FACTORS=20
EXPECTED_FACTORS=15

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔧 Pre-deployment Checks"
echo "------------------------"

# 1. Check factor count in source code
if [ -f "supabase/functions/analyze-page/index.ts" ]; then
    FACTOR_COUNT=$(grep -o "factor_id:" supabase/functions/analyze-page/index.ts | wc -l | tr -d ' ')
    if [ "$FACTOR_COUNT" -gt "$MAX_FACTORS" ]; then
        echo -e "${RED}❌ ERROR: Too many factors detected ($FACTOR_COUNT > $MAX_FACTORS)${NC}"
        echo "   This might indicate accidental duplication or misconfiguration"
        exit 1
    elif [ "$FACTOR_COUNT" -ne "$EXPECTED_FACTORS" ]; then
        echo -e "${YELLOW}⚠️  WARNING: Unexpected factor count ($FACTOR_COUNT vs expected $EXPECTED_FACTORS)${NC}"
        echo "   Please verify this is intentional"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Factor count verified: $FACTOR_COUNT factors${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Source file not found, skipping factor count check${NC}"
fi

# 2. Check for TODO/FIXME/TEMPORARY markers
echo ""
echo "🔍 Checking for temporary workarounds..."
if [ -f "supabase/functions/analyze-page/index.ts" ]; then
    TEMP_MARKERS=$(grep -E "(TODO|FIXME|TEMPORARY|HACK|XXX)" supabase/functions/analyze-page/index.ts | wc -l | tr -d ' ')
    if [ "$TEMP_MARKERS" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Found $TEMP_MARKERS temporary markers in code:${NC}"
        grep -n -E "(TODO|FIXME|TEMPORARY|HACK|XXX)" supabase/functions/analyze-page/index.ts | head -5
        echo "   Please review these before deploying to production"
    else
        echo -e "${GREEN}✅ No temporary markers found${NC}"
    fi
fi

# 3. Check file size (large files might indicate inlining issues)
echo ""
echo "📏 Checking file size..."
if [ -f "supabase/functions/analyze-page/index.ts" ]; then
    FILE_SIZE=$(wc -l supabase/functions/analyze-page/index.ts | awk '{print $1}')
    if [ "$FILE_SIZE" -gt 1000 ]; then
        echo -e "${YELLOW}⚠️  Large file detected ($FILE_SIZE lines)${NC}"
        echo "   Consider refactoring to modules if Supabase supports it"
    else
        echo -e "${GREEN}✅ File size reasonable: $FILE_SIZE lines${NC}"
    fi
fi

echo ""
echo "🚀 Post-deployment Health Check"
echo "-------------------------------"

# Function to test Edge Function
test_edge_function() {
    echo "Testing Edge Function endpoint..."
    
    # Generate unique test ID
    TEST_ID="health-check-$(date +%s)"
    
    # Make the request
    RESPONSE=$(curl -s -X POST "$EDGE_FUNCTION_URL" \
        -H "Content-Type: application/json" \
        -H "apikey: $ANON_KEY" \
        -d "{\"url\":\"https://example.com\",\"userId\":\"health-check\",\"analysisId\":\"$TEST_ID\"}" \
        --max-time 35)
    
    # Check if response contains success
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Edge Function responding correctly${NC}"
        
        # Verify factor count in response
        RESPONSE_FACTORS=$(echo "$RESPONSE" | grep -o '"factor_id"' | wc -l | tr -d ' ')
        if [ "$RESPONSE_FACTORS" -eq "$EXPECTED_FACTORS" ]; then
            echo -e "${GREEN}✅ Correct number of factors returned: $RESPONSE_FACTORS${NC}"
        else
            echo -e "${RED}❌ Incorrect factor count in response: $RESPONSE_FACTORS (expected $EXPECTED_FACTORS)${NC}"
            exit 1
        fi
        
        # Check response time (basic check from response metadata if available)
        if echo "$RESPONSE" | grep -q '"processing_time_ms"'; then
            PROCESSING_TIME=$(echo "$RESPONSE" | grep -o '"processing_time_ms":[0-9]*' | cut -d':' -f2)
            if [ "$PROCESSING_TIME" -lt 30000 ]; then
                echo -e "${GREEN}✅ Response time acceptable: ${PROCESSING_TIME}ms${NC}"
            else
                echo -e "${YELLOW}⚠️  Slow response time: ${PROCESSING_TIME}ms${NC}"
            fi
        fi
        
        return 0
    else
        echo -e "${RED}❌ Edge Function test failed${NC}"
        echo "Response: $RESPONSE"
        return 1
    fi
}

# Run the test
if [ "$1" == "--skip-health-check" ]; then
    echo "Skipping health check as requested"
else
    test_edge_function || {
        echo ""
        echo -e "${RED}❌ DEPLOYMENT VALIDATION FAILED${NC}"
        echo "The Edge Function is not responding correctly."
        echo "Please check the deployment logs and fix any issues."
        exit 1
    }
fi

echo ""
echo "📊 Validation Summary"
echo "--------------------"
echo -e "${GREEN}✅ All critical checks passed${NC}"
echo ""
echo "Recommended next steps:"
echo "1. Monitor the Edge Function logs for the next hour"
echo "2. Check the analysis failure rate in the database"
echo "3. Run a few manual tests through the UI"
echo "4. Document any changes in CLAUDE.md"

echo ""
echo "To continuously monitor, run:"
echo "  watch -n 60 './guardrails/deployment-validation.sh'"