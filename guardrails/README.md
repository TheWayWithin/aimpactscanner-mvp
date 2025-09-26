# Deployment Guardrails

This directory contains scripts and tools to prevent deployment regressions like the "130-factor incident" from happening again.

## Background

On July 21, 2025, a deployment regression caused the AImpactScanner Edge Function to fail, resulting in a 33% analysis failure rate. The issue was misreported as implementing a "130-factor system" when it was actually:
1. A legitimate expansion from 10 to 15 factors
2. Edge Function module import failures forcing code inlining
3. Documentation miscounting the implementations

## Guardrail Tools

### 1. deployment-validation.sh
**Purpose**: Validate Edge Function deployments before and after deployment

**Usage**:
```bash
# Run full validation including health check
./guardrails/deployment-validation.sh

# Skip health check (for pre-deployment only)
./guardrails/deployment-validation.sh --skip-health-check

# Continuous monitoring
watch -n 60 './guardrails/deployment-validation.sh'
```

**What it checks**:
- Factor count in source code (max 20, expected 15)
- Temporary workaround markers (TODO, FIXME, TEMPORARY)
- File size (warns if >1000 lines)
- Edge Function health check
- Response time validation

### 2. factor-count-validator.js
**Purpose**: Prevent accidental factor proliferation

**Usage**:
```bash
# Run validation
node ./guardrails/factor-count-validator.js

# Add to package.json scripts
"scripts": {
  "validate:factors": "node ./guardrails/factor-count-validator.js"
}
```

**What it checks**:
- Unique factor count across codebase
- Duplicate factor definitions
- Sequential numbering patterns (might indicate auto-generation)
- MASTERY framework compliance

### 3. Pre-commit Hook (Recommended)

Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
# Run factor validation before committing
node ./guardrails/factor-count-validator.js || exit 1
```

### 4. CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Validate Factor Count
  run: node ./guardrails/factor-count-validator.js

- name: Pre-deployment Validation
  run: ./guardrails/deployment-validation.sh --skip-health-check

- name: Deploy Edge Function
  run: supabase functions deploy analyze-page

- name: Post-deployment Health Check
  run: ./guardrails/deployment-validation.sh
```

## Key Metrics to Monitor

### Critical Thresholds
- **Factor Count**: Max 20, Expected 15
- **Analysis Failure Rate**: Must be <5%
- **Edge Function Response Time**: Must be <30 seconds
- **File Size**: Warning if >1000 lines

### Health Check Frequency
- **Production**: Every 60 minutes
- **After Deployment**: Immediately and after 1 hour
- **During Issues**: Every 5 minutes until resolved

## Common Issues and Solutions

### Issue: "Too many factors detected"
**Solution**: 
1. Run `factor-count-validator.js` to identify duplicates
2. Check if factors are being counted multiple times
3. Verify against MASTERY-AI Framework documentation

### Issue: "Edge Function not responding"
**Solution**:
1. Check Supabase Edge Function logs
2. Verify environment variables are set
3. Test with minimal payload
4. Check for module import issues

### Issue: "Large file detected"
**Solution**:
1. Consider if Supabase now supports module imports
2. Refactor to smaller functions if possible
3. Document why inlining is necessary if it is

## Rollback Procedures

If validation fails after deployment:

```bash
# 1. Get current version
CURRENT_VERSION=$(supabase functions list | grep analyze-page | awk '{print $5}')

# 2. Rollback to previous version
supabase functions deploy analyze-page --version $((CURRENT_VERSION - 1))

# 3. Verify rollback
./guardrails/deployment-validation.sh

# 4. Document the issue
echo "Rollback performed on $(date) from v$CURRENT_VERSION" >> rollback.log
```

## Best Practices

1. **Always run validation before deployment**
2. **Never ignore warnings without documentation**
3. **Mark temporary workarounds with FIXME comments**
4. **Update expected values when making intentional changes**
5. **Monitor for 1 hour after any deployment**

## Emergency Contacts

If deployment issues occur:
1. Check `post-mortem-analysis.md` for known issues
2. Review `deployment-fix-summary.md` for recent fixes
3. Run health checks to identify the specific failure
4. Document all issues in `progress.md`

## Continuous Improvement

These guardrails should be updated when:
- New factors are legitimately added (update EXPECTED_FACTORS)
- Supabase adds new features (e.g., better module support)
- New failure patterns are discovered
- Performance requirements change

Remember: **Prevention is better than debugging in production!**