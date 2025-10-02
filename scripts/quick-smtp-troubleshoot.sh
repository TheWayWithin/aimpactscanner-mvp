#!/bin/bash

# Quick SMTP Troubleshooting Script for AImpact Scanner
# Provides instant diagnostics and solutions for common SMTP issues

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="aimpactscanner.com"
SMTP_HOST="smtp.resend.com"
SMTP_PORT="465"

# Helper functions
log_header() {
    echo -e "\n${BLUE}${BOLD}$1${NC}"
    echo -e "${BLUE}$(printf '%.0s=' {1..60})${NC}"
}

log_section() {
    echo -e "\n${YELLOW}${BOLD}$1${NC}"
    echo -e "${YELLOW}$(printf '%.0s-' $(seq 1 ${#1}))${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required tools are available
check_dependencies() {
    log_section "Checking Dependencies"
    
    local missing_tools=()
    
    if ! command -v dig &> /dev/null; then
        missing_tools+=("dig")
    fi
    
    if ! command -v nc &> /dev/null && ! command -v telnet &> /dev/null; then
        missing_tools+=("nc or telnet")
    fi
    
    if ! command -v node &> /dev/null; then
        missing_tools+=("node")
    fi
    
    if [ ${#missing_tools[@]} -eq 0 ]; then
        log_success "All required tools available"
    else
        log_warning "Missing tools: ${missing_tools[*]}"
        log_info "Install missing tools for complete diagnostics"
    fi
}

# Quick DNS check
check_dns_quick() {
    log_section "Quick DNS Check"
    
    # Check SPF record
    if command -v dig &> /dev/null; then
        log_info "Checking SPF record..."
        if dig TXT "$DOMAIN" +short | grep -q "spf1.*resend.com"; then
            log_success "SPF record found with Resend authorization"
        else
            log_error "SPF record missing or incorrect"
            log_info "Expected: v=spf1 include:_spf.resend.com ~all"
        fi
        
        # Check DMARC record
        log_info "Checking DMARC record..."
        if dig TXT "_dmarc.$DOMAIN" +short | grep -q "DMARC1"; then
            log_success "DMARC record found"
        else
            log_error "DMARC record missing"
            log_info "Expected: v=DMARC1; p=none; rua=mailto:dmarc@resend.com"
        fi
    else
        log_warning "dig not available - skipping DNS checks"
        log_info "Install dig for DNS validation"
    fi
}

# Quick SMTP connectivity test
check_smtp_connectivity() {
    log_section "SMTP Connectivity Test"
    
    if command -v nc &> /dev/null; then
        log_info "Testing connection to $SMTP_HOST:$SMTP_PORT..."
        if timeout 5 nc -z "$SMTP_HOST" "$SMTP_PORT" 2>/dev/null; then
            log_success "SMTP server is reachable"
        else
            log_error "Cannot connect to SMTP server"
            log_info "Check firewall settings and internet connectivity"
        fi
    elif command -v telnet &> /dev/null; then
        log_info "Testing connection with telnet..."
        if timeout 5 bash -c "echo quit | telnet $SMTP_HOST $SMTP_PORT" 2>/dev/null | grep -q "Connected"; then
            log_success "SMTP server is reachable"
        else
            log_error "Cannot connect to SMTP server"
        fi
    else
        log_warning "nc/telnet not available - skipping connectivity test"
    fi
}

# Check Supabase configuration files
check_supabase_config() {
    log_section "Supabase Configuration Check"
    
    # Check config.toml
    if [ -f "supabase/config.toml" ]; then
        log_info "Found supabase/config.toml"
        
        if grep -q "enable_confirmations = true" supabase/config.toml; then
            log_success "Email confirmations enabled"
        elif grep -q "enable_confirmations = false" supabase/config.toml; then
            log_warning "Email confirmations disabled - emails won't be required"
        else
            log_error "Email confirmations setting not found"
        fi
        
        if grep -q '\[auth\.email\.smtp\]' supabase/config.toml; then
            if grep -q 'host = "smtp.resend.com"' supabase/config.toml; then
                log_success "Resend SMTP configured in config.toml"
            else
                log_warning "SMTP section found but not configured for Resend"
            fi
        else
            log_info "No SMTP configuration in config.toml (dashboard config recommended)"
        fi
    else
        log_warning "supabase/config.toml not found"
        log_info "Configuration should be done in Supabase dashboard"
    fi
}

# Check environment variables
check_environment() {
    log_section "Environment Variables Check"
    
    local env_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY")
    local missing_vars=()
    
    for var in "${env_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        else
            log_success "$var is set"
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_warning "Missing environment variables: ${missing_vars[*]}"
        log_info "Load environment variables or check .env files"
    fi
}

# Quick fixes suggestions
suggest_quick_fixes() {
    log_section "Quick Fix Suggestions"
    
    log_info "Based on common issues, try these fixes:"
    echo
    
    echo "1. DNS Configuration (Netlify):"
    echo "   - Login to Netlify Dashboard"
    echo "   - Go to Domain Management → aimpactscanner.com → DNS panel"
    echo "   - Add TXT records from Resend dashboard"
    echo
    
    echo "2. SMTP Configuration (Supabase):"
    echo "   - Login to Supabase Dashboard"
    echo "   - Go to Authentication → Settings → SMTP"
    echo "   - Configure with Resend API key"
    echo
    
    echo "3. Test Email Delivery:"
    echo "   - Run: node scripts/test-email-delivery.js your-email@example.com"
    echo "   - Check spam/junk folders"
    echo "   - Try different email providers"
    echo
    
    echo "4. Full Configuration Validation:"
    echo "   - Run: node scripts/validate-smtp-config.js"
    echo "   - Follow the detailed setup guide"
    echo
}

# Generate quick report
generate_quick_report() {
    log_header "Quick Troubleshooting Summary"
    
    log_info "This script performed basic diagnostics for your email system."
    log_info "For complete configuration, follow the detailed setup guide."
    echo
    
    log_section "Next Steps"
    echo "1. Complete DNS setup if records are missing"
    echo "2. Configure SMTP in Supabase dashboard"
    echo "3. Test with real email delivery"
    echo "4. Monitor results in Resend dashboard"
    echo
    
    log_section "Additional Resources"
    echo "• Setup Guide: resend-smtp-setup-guide.md"
    echo "• Validation Script: node scripts/validate-smtp-config.js"
    echo "• Test Script: node scripts/test-email-delivery.js"
    echo "• Resend Dashboard: https://resend.com/domains"
    echo "• Supabase Dashboard: https://supabase.com/dashboard"
}

# Main function
main() {
    log_header "AImpact Scanner - Quick SMTP Troubleshooter"
    
    log_info "Running quick diagnostics for email delivery issues..."
    log_info "Domain: $DOMAIN"
    log_info "SMTP: $SMTP_HOST:$SMTP_PORT"
    echo
    
    # Run checks
    check_dependencies
    check_dns_quick
    check_smtp_connectivity
    check_supabase_config
    check_environment
    
    # Provide suggestions
    suggest_quick_fixes
    generate_quick_report
    
    log_section "Troubleshooting Complete"
    log_info "For detailed diagnostics, run the full validation script."
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi