#!/bin/bash

# Comprehensive Test Runner for AImpactScanner
# Executes prioritized test suites with proper reporting and failure handling

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${BASE_URL:-"https://app.aimpactscanner.com"}
TEST_TIMEOUT=${TEST_TIMEOUT:-60000}
REPORT_DIR="test-results"
PLAYWRIGHT_CONFIG="playwright.config.comprehensive.js"

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo "=============================================="
    print_status $BLUE "$1"
    echo "=============================================="
}

# Function to check prerequisites
check_prerequisites() {
    print_header "🔧 Checking Prerequisites"
    
    if ! command -v npx &> /dev/null; then
        print_status $RED "❌ npx not found. Please install Node.js"
        exit 1
    fi
    
    if ! npm list @playwright/test &> /dev/null; then
        print_status $YELLOW "⚠️ Playwright not found. Installing..."
        npm install @playwright/test
    fi
    
    # Install browsers if needed
    print_status $BLUE "🌐 Installing/updating browsers..."
    npx playwright install --with-deps
    
    print_status $GREEN "✅ Prerequisites check complete"
}

# Function to setup test environment
setup_environment() {
    print_header "🛠️ Setting Up Test Environment"
    
    # Create test results directory
    mkdir -p $REPORT_DIR
    rm -rf $REPORT_DIR/* # Clean previous results
    
    # Set environment variables
    export BASE_URL=$BASE_URL
    export TEST_TIMEOUT=$TEST_TIMEOUT
    export CI=${CI:-false}
    
    print_status $GREEN "✅ Environment setup complete"
    print_status $BLUE "🔗 Base URL: $BASE_URL"
    print_status $BLUE "⏱️ Timeout: $TEST_TIMEOUT ms"
}

# Function to run specific test suite
run_test_suite() {
    local suite_name=$1
    local description=$2
    local priority=$3
    
    print_header "🧪 Running $description"
    
    local start_time=$(date +%s)
    local exit_code=0
    
    # Run the test suite
    if npx playwright test --config=$PLAYWRIGHT_CONFIG --project=$suite_name --reporter=line; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        print_status $GREEN "✅ $description passed in ${duration}s"
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        print_status $RED "❌ $description failed in ${duration}s"
        return 1
    fi
}

# Function to run recent features tests (highest priority)
run_recent_features_tests() {
    print_header "🆕 PRIORITY 1: Recent Features Testing"
    
    local failed_tests=0
    
    # Messaging Clarity Updates
    if ! npx playwright test messaging-clarity-tests.spec.js --config=$PLAYWRIGHT_CONFIG; then
        print_status $RED "❌ Messaging Clarity tests failed"
        ((failed_tests++))
    else
        print_status $GREEN "✅ Messaging Clarity tests passed"
    fi
    
    # LLMs.txt Integration
    if ! npx playwright test llmstxt-integration-tests.spec.js --config=$PLAYWRIGHT_CONFIG; then
        print_status $RED "❌ LLMs.txt Integration tests failed"
        ((failed_tests++))
    else
        print_status $GREEN "✅ LLMs.txt Integration tests passed"
    fi
    
    # Account Fixes
    if ! npx playwright test account-fixes-tests.spec.js --config=$PLAYWRIGHT_CONFIG; then
        print_status $RED "❌ Account Fixes tests failed"
        ((failed_tests++))
    else
        print_status $GREEN "✅ Account Fixes tests passed"
    fi
    
    if [ $failed_tests -eq 0 ]; then
        print_status $GREEN "🎉 All recent features tests passed!"
        return 0
    else
        print_status $RED "⚠️ $failed_tests recent features test suite(s) failed"
        return 1
    fi
}

# Function to run regression tests
run_regression_tests() {
    print_header "🔄 PRIORITY 2: Regression Testing"
    
    if npx playwright test comprehensive-test-suite.spec.js --config=$PLAYWRIGHT_CONFIG; then
        print_status $GREEN "✅ Regression tests passed"
        return 0
    else
        print_status $RED "❌ Regression tests failed"
        return 1
    fi
}

# Function to run cross-browser tests
run_cross_browser_tests() {
    print_header "🌐 PRIORITY 3: Cross-Browser Compatibility"
    
    local failed_browsers=0
    
    # Test on Chromium
    if ! run_test_suite "chromium" "Chromium Tests" "high"; then
        ((failed_browsers++))
    fi
    
    # Test on Firefox
    if ! run_test_suite "firefox" "Firefox Tests" "medium"; then
        ((failed_browsers++))
    fi
    
    # Test on WebKit (Safari)
    if ! run_test_suite "webkit" "WebKit Tests" "medium"; then
        ((failed_browsers++))
    fi
    
    if [ $failed_browsers -eq 0 ]; then
        print_status $GREEN "🎉 All cross-browser tests passed!"
        return 0
    else
        print_status $YELLOW "⚠️ $failed_browsers browser(s) had test failures"
        return 1
    fi
}

# Function to run mobile responsive tests
run_mobile_tests() {
    print_header "📱 PRIORITY 4: Mobile Responsive Testing"
    
    local failed_mobile=0
    
    # Mobile Chrome
    if ! run_test_suite "Mobile Chrome" "Mobile Chrome Tests" "low"; then
        ((failed_mobile++))
    fi
    
    # Mobile Safari
    if ! run_test_suite "Mobile Safari" "Mobile Safari Tests" "low"; then
        ((failed_mobile++))
    fi
    
    if [ $failed_mobile -eq 0 ]; then
        print_status $GREEN "✅ Mobile tests passed"
        return 0
    else
        print_status $YELLOW "⚠️ Some mobile tests failed"
        return 1
    fi
}

# Function to generate comprehensive report
generate_report() {
    print_header "📊 Generating Test Report"
    
    # Generate HTML report
    npx playwright show-report --host=0.0.0.0 &
    local report_pid=$!
    
    # Wait a moment for report to generate
    sleep 2
    
    # Kill the report server
    kill $report_pid 2>/dev/null || true
    
    print_status $GREEN "✅ HTML report generated in playwright-report/"
    
    # Show summary if results exist
    if [ -f "$REPORT_DIR/results.json" ]; then
        print_status $BLUE "📈 Test Summary:"
        # Basic summary from JSON (would need jq for complex parsing)
        local total_tests=$(grep -o '"title"' $REPORT_DIR/results.json | wc -l)
        print_status $BLUE "Total tests executed: $total_tests"
    fi
}

# Function to handle test failures
handle_failures() {
    print_header "❌ Test Failure Analysis"
    
    print_status $RED "Some tests failed. Check the following:"
    echo "1. HTML Report: playwright-report/index.html"
    echo "2. Screenshots: test-results/"
    echo "3. Videos: test-results/"
    echo "4. Traces: test-results/"
    
    print_status $YELLOW "Common issues to investigate:"
    echo "- Network connectivity to $BASE_URL"
    echo "- Authentication state issues"
    echo "- Analysis timeout (current: ${TEST_TIMEOUT}ms)"
    echo "- Element selector changes"
    echo "- Browser compatibility issues"
    
    # Show recent failures if available
    if [ -d "test-results" ]; then
        echo ""
        print_status $BLUE "Recent failure artifacts:"
        find test-results -name "*.png" -o -name "*.webm" -o -name "*.zip" | head -5
    fi
}

# Main execution function
main() {
    local start_time=$(date +%s)
    local total_failures=0
    
    print_header "🚀 AImpactScanner Comprehensive Test Suite"
    print_status $BLUE "Started at: $(date)"
    
    # Setup
    check_prerequisites
    setup_environment
    
    # Priority 1: Recent Features (Must Pass)
    if ! run_recent_features_tests; then
        ((total_failures++))
        print_status $RED "🚨 CRITICAL: Recent features tests failed!"
    fi
    
    # Priority 2: Regression Tests (Should Pass)
    if ! run_regression_tests; then
        ((total_failures++))
        print_status $YELLOW "⚠️ WARNING: Regression tests failed"
    fi
    
    # Priority 3: Cross-Browser (Good to Pass)
    if ! run_cross_browser_tests; then
        ((total_failures++))
        print_status $YELLOW "📝 NOTE: Cross-browser issues detected"
    fi
    
    # Priority 4: Mobile (Nice to Pass)
    if ! run_mobile_tests; then
        ((total_failures++))
        print_status $BLUE "📱 INFO: Mobile compatibility issues"
    fi
    
    # Generate report
    generate_report
    
    # Final summary
    local end_time=$(date +%s)
    local total_duration=$((end_time - start_time))
    
    print_header "📋 Final Test Results"
    print_status $BLUE "Total execution time: ${total_duration}s"
    print_status $BLUE "Completed at: $(date)"
    
    if [ $total_failures -eq 0 ]; then
        print_status $GREEN "🎉 ALL TESTS PASSED! System is ready for deployment."
        exit 0
    else
        print_status $RED "⚠️ $total_failures test suite(s) had failures"
        handle_failures
        exit $total_failures
    fi
}

# Script options handling
case "${1:-run}" in
    "run")
        main
        ;;
    "recent-only")
        check_prerequisites
        setup_environment
        run_recent_features_tests
        exit $?
        ;;
    "regression-only")
        check_prerequisites
        setup_environment
        run_regression_tests
        exit $?
        ;;
    "cross-browser-only")
        check_prerequisites
        setup_environment
        run_cross_browser_tests
        exit $?
        ;;
    "mobile-only")
        check_prerequisites
        setup_environment
        run_mobile_tests
        exit $?
        ;;
    "help")
        echo "AImpactScanner Test Runner"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  run                 Run complete test suite (default)"
        echo "  recent-only         Run only recent features tests"
        echo "  regression-only     Run only regression tests"
        echo "  cross-browser-only  Run only cross-browser tests"
        echo "  mobile-only         Run only mobile responsive tests"
        echo "  help                Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  BASE_URL            Base URL for testing (default: https://app.aimpactscanner.com)"
        echo "  TEST_TIMEOUT        Test timeout in ms (default: 60000)"
        echo ""
        echo "Examples:"
        echo "  $0                                    # Run all tests"
        echo "  BASE_URL=http://localhost:3000 $0    # Test local instance"
        echo "  $0 recent-only                       # Test only recent features"
        ;;
    *)
        print_status $RED "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac