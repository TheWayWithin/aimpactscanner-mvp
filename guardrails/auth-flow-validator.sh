#!/bin/bash

# Authentication Flow Validator
# Ensures critical auth paths are never blocked by optimizations
# Run this after ANY changes to App.jsx or authentication components

echo "🔐 Authentication Flow Validator"
echo "================================"
echo ""

ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "Checking for blocking conditions in critical auth paths..."
echo ""

# Check App.jsx for problematic visibility blocks in auth handler
echo "1. Checking auth state handler for blocking conditions..."
AUTH_BLOCKS=$(grep -n "onAuthStateChange" src/App.jsx -A 20 | grep -E "^\s*if.*isTabVisible.*return" | head -5)
if [ ! -z "$AUTH_BLOCKS" ]; then
    echo -e "${RED}❌ ERROR: Found blocking visibility check in auth handler:${NC}"
    echo "$AUTH_BLOCKS"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ Auth state handler looks clean${NC}"
fi
echo ""

# Check for unconditional returns in auth flow
echo "2. Checking for unconditional blocks in authentication flow..."
UNCONDITIONAL_BLOCKS=$(grep -n "if.*!isTabVisible.*{" src/App.jsx -A 1 | grep "return;" | grep -v "&&")
if [ ! -z "$UNCONDITIONAL_BLOCKS" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Found potentially problematic visibility checks:${NC}"
    echo "Make sure these don't block critical auth operations"
    WARNINGS=$((WARNINGS+1))
fi
echo ""

# Check Login component for proper routing
echo "3. Checking Login component for proper success handling..."
LOGIN_SUCCESS=$(grep -n "onLoginSuccess" src/components/Login.jsx | wc -l)
if [ "$LOGIN_SUCCESS" -lt 2 ]; then
    echo -e "${RED}❌ ERROR: Login success handler may not be properly configured${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ Login success handler present${NC}"
fi
echo ""

# Check for handleLoginComplete implementation
echo "4. Checking handleLoginComplete implementation..."
LOGIN_COMPLETE=$(grep -n "handleLoginComplete.*=.*=>" src/App.jsx | wc -l)
if [ "$LOGIN_COMPLETE" -eq 0 ]; then
    echo -e "${RED}❌ ERROR: handleLoginComplete function not found${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ handleLoginComplete function found${NC}"
fi
echo ""

# Check for setCurrentView('dashboard') in login flow
echo "5. Checking for dashboard redirect after login..."
DASHBOARD_REDIRECT=$(grep -n "setCurrentView.*dashboard" src/App.jsx | wc -l)
if [ "$DASHBOARD_REDIRECT" -eq 0 ]; then
    echo -e "${RED}❌ ERROR: No dashboard redirect found in App.jsx${NC}"
    ERRORS=$((ERRORS+1))
else
    echo -e "${GREEN}✅ Dashboard redirect logic present (${DASHBOARD_REDIRECT} instances)${NC}"
fi
echo ""

# Check UserInitializer doesn't block on visibility
echo "6. Checking UserInitializer mounting conditions..."
USER_INIT_BLOCK=$(grep -n "session && currentView.*&&.*isTabVisible" src/App.jsx | wc -l)
if [ "$USER_INIT_BLOCK" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  WARNING: UserInitializer may be blocked by tab visibility${NC}"
    echo "This could prevent user initialization after login"
    WARNINGS=$((WARNINGS+1))
else
    echo -e "${GREEN}✅ UserInitializer mounting not blocked by visibility${NC}"
fi
echo ""

# Summary
echo "================================"
echo "Validation Summary:"
echo "================================"

if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Auth flow appears healthy.${NC}"
    exit 0
elif [ "$ERRORS" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  ${WARNINGS} warning(s) found. Review recommended but not blocking.${NC}"
    exit 0
else
    echo -e "${RED}❌ ${ERRORS} error(s) and ${WARNINGS} warning(s) found!${NC}"
    echo ""
    echo "Critical auth paths may be blocked. Please review and fix before deployment."
    echo ""
    echo "Common fixes:"
    echo "1. Remove unconditional visibility checks from auth handlers"
    echo "2. Ensure handleLoginComplete properly sets dashboard view"
    echo "3. Don't block UserInitializer with visibility conditions"
    echo ""
    echo "See CLAUDE.md 'Critical Path Protection' section for guidelines."
    exit 1
fi