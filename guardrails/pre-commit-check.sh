#!/bin/bash

# Pre-Commit Validation Check
# Runs essential validations before allowing commits

echo "🔍 Pre-Commit Validation"
echo "========================"
echo ""

FAILED=0

# 1. Check factor count
echo "1. Validating factor count..."
if [ -f "./guardrails/factor-count-validator.js" ]; then
    node ./guardrails/factor-count-validator.js
    if [ $? -ne 0 ]; then
        echo "❌ Factor count validation failed"
        FAILED=1
    else
        echo "✅ Factor count valid"
    fi
else
    echo "⚠️  Factor count validator not found, skipping"
fi
echo ""

# 2. Check auth flow if App.jsx was modified
echo "2. Checking authentication flow..."
if git diff --cached --name-only | grep -q "src/App.jsx"; then
    echo "App.jsx modified - validating auth flow..."
    ./guardrails/auth-flow-validator.sh
    if [ $? -ne 0 ]; then
        echo "❌ Auth flow validation failed"
        FAILED=1
    else
        echo "✅ Auth flow validation passed"
    fi
else
    echo "✅ App.jsx not modified - skipping auth check"
fi
echo ""

# 3. Check for console.log statements in production code
echo "3. Checking for debug console.log statements..."
CONSOLE_LOGS=$(git diff --cached --name-only --diff-filter=ACM | xargs grep -l "console\.log" 2>/dev/null | grep -v test | grep -v spec | wc -l)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo "⚠️  Warning: Found console.log statements in staged files"
    echo "   Consider removing debug statements before commit"
fi
echo ""

# 4. Check for FIXME or TODO comments
echo "4. Checking for FIXME/TODO comments..."
TODOS=$(git diff --cached --name-only --diff-filter=ACM | xargs grep -E "(FIXME|TODO)" 2>/dev/null | wc -l)
if [ "$TODOS" -gt 0 ]; then
    echo "ℹ️  Info: Found $TODOS FIXME/TODO comments in staged files"
    echo "   Remember to address these in future commits"
fi
echo ""

# Summary
echo "========================"
if [ "$FAILED" -eq 0 ]; then
    echo "✅ Pre-commit checks passed!"
    echo ""
    echo "Proceeding with commit..."
    exit 0
else
    echo "❌ Pre-commit checks failed!"
    echo ""
    echo "Please fix the issues above before committing."
    echo "To bypass (NOT RECOMMENDED), use: git commit --no-verify"
    exit 1
fi