#!/usr/bin/env node

// UAT Test Runner - AImpactScanner MVP
// Executes comprehensive User Acceptance Testing suite

import { exec, spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  testFile: 'uat-comprehensive.spec.js',
  outputDir: path.join(__dirname, '../../test-results/uat'),
  reportName: `uat-report-${new Date().toISOString().split('T')[0]}`,
  browsers: ['chromium', 'firefox', 'webkit'],
  retries: 1,
  workers: 1, // Run tests sequentially for UAT
  timeout: 120000, // 2 minutes per test
  headless: process.env.HEADLESS !== 'false'
};

// Test categories for selective running
const TEST_CATEGORIES = {
  all: 'UAT:',
  anonymous: 'UAT: Anonymous User Journey',
  free: 'UAT: Free Tier User Journey',
  paid: 'UAT: Paid Tier User Journeys',
  auth: 'UAT: Authentication Flows',
  analysis: 'UAT: Analysis Engine',
  payment: 'UAT: Payment & Subscription Management',
  edge: 'UAT: Edge Cases & Error Handling',
  browser: 'UAT: Cross-Browser Compatibility',
  mobile: 'UAT: Mobile Responsiveness'
};

// Color codes for terminal output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    category: 'all',
    browser: null,
    headed: false,
    debug: false,
    report: true,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--category':
      case '-c':
        options.category = args[++i] || 'all';
        break;
      case '--browser':
      case '-b':
        options.browser = args[++i];
        break;
      case '--headed':
      case '-h':
        options.headed = true;
        break;
      case '--debug':
      case '-d':
        options.debug = true;
        break;
      case '--no-report':
        options.report = false;
        break;
      case '--help':
        options.help = true;
        break;
    }
  }

  return options;
}

// Display help message
function showHelp() {
  console.log(`
${COLORS.bright}UAT Test Runner - AImpactScanner MVP${COLORS.reset}

${COLORS.cyan}Usage:${COLORS.reset}
  npm run test:uat [options]

${COLORS.cyan}Options:${COLORS.reset}
  ${COLORS.green}--category, -c${COLORS.reset}  Test category to run (default: all)
                  Categories: ${Object.keys(TEST_CATEGORIES).join(', ')}
  
  ${COLORS.green}--browser, -b${COLORS.reset}   Specific browser to test (default: all)
                  Options: chromium, firefox, webkit, chrome, edge
  
  ${COLORS.green}--headed, -h${COLORS.reset}    Run tests in headed mode (show browser)
  
  ${COLORS.green}--debug, -d${COLORS.reset}     Run in debug mode with verbose output
  
  ${COLORS.green}--no-report${COLORS.reset}     Skip HTML report generation
  
  ${COLORS.green}--help${COLORS.reset}          Show this help message

${COLORS.cyan}Examples:${COLORS.reset}
  ${COLORS.yellow}npm run test:uat${COLORS.reset}                      # Run all UAT tests
  ${COLORS.yellow}npm run test:uat -c free${COLORS.reset}              # Run only free tier tests
  ${COLORS.yellow}npm run test:uat -b chromium${COLORS.reset}          # Test only in Chromium
  ${COLORS.yellow}npm run test:uat -c auth --headed${COLORS.reset}     # Run auth tests with visible browser
  ${COLORS.yellow}npm run test:uat -c payment -d${COLORS.reset}        # Debug payment tests
`);
}

// Ensure output directory exists
async function ensureOutputDir() {
  try {
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    console.log(`${COLORS.green}✓${COLORS.reset} Output directory ready: ${CONFIG.outputDir}`);
  } catch (error) {
    console.error(`${COLORS.red}✗${COLORS.reset} Failed to create output directory:`, error);
    process.exit(1);
  }
}

// Check if dev server is running
async function checkDevServer() {
  return new Promise((resolve) => {
    exec('curl -s -o /dev/null -w "%{http_code}" http://localhost:5173', (error, stdout) => {
      if (stdout === '200') {
        console.log(`${COLORS.green}✓${COLORS.reset} Dev server is running`);
        resolve(true);
      } else {
        console.log(`${COLORS.yellow}!${COLORS.reset} Dev server not detected, will start automatically`);
        resolve(false);
      }
    });
  });
}

// Build Playwright command
function buildPlaywrightCommand(options) {
  const parts = ['npx', 'playwright', 'test'];
  
  // Add test file
  parts.push(path.join(__dirname, CONFIG.testFile));
  
  // Add grep pattern for category
  if (options.category !== 'all') {
    parts.push('--grep', TEST_CATEGORIES[options.category] || TEST_CATEGORIES.all);
  }
  
  // Add browser selection
  if (options.browser) {
    parts.push('--project', options.browser);
  }
  
  // Add headed mode
  if (options.headed) {
    parts.push('--headed');
  }
  
  // Add debug mode
  if (options.debug) {
    parts.push('--debug');
  }
  
  // Add other configurations
  parts.push('--workers', CONFIG.workers);
  parts.push('--retries', CONFIG.retries);
  parts.push('--timeout', CONFIG.timeout);
  
  // Add reporter
  if (options.report) {
    parts.push('--reporter=html');
    parts.push(`--reporter-options=outputFolder=${CONFIG.outputDir}`);
  }
  
  return parts;
}

// Run Playwright tests
function runTests(command) {
  return new Promise((resolve, reject) => {
    console.log(`${COLORS.cyan}Running UAT tests...${COLORS.reset}`);
    console.log(`${COLORS.yellow}Command:${COLORS.reset} ${command.join(' ')}\n`);
    
    const child = spawn(command[0], command.slice(1), {
      stdio: 'inherit',
      env: {
        ...process.env,
        FORCE_COLOR: '1',
        NODE_ENV: 'test'
      }
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Generate test summary
async function generateSummary() {
  const summaryPath = path.join(CONFIG.outputDir, 'summary.json');
  
  try {
    // Check if Playwright generated a results file
    const resultsPath = path.join(__dirname, '../../test-results/playwright-results.json');
    const resultsExist = await fs.access(resultsPath).then(() => true).catch(() => false);
    
    if (resultsExist) {
      const results = JSON.parse(await fs.readFile(resultsPath, 'utf-8'));
      
      const summary = {
        date: new Date().toISOString(),
        totalTests: results.stats?.total || 0,
        passed: results.stats?.passed || 0,
        failed: results.stats?.failed || 0,
        skipped: results.stats?.skipped || 0,
        duration: results.stats?.duration || 0,
        categories: {}
      };
      
      // Group results by category
      if (results.suites) {
        for (const suite of results.suites) {
          const category = suite.title.replace('UAT: ', '');
          summary.categories[category] = {
            total: suite.tests?.length || 0,
            passed: suite.tests?.filter(t => t.status === 'passed').length || 0,
            failed: suite.tests?.filter(t => t.status === 'failed').length || 0
          };
        }
      }
      
      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
      
      // Display summary
      console.log(`\n${COLORS.bright}Test Summary:${COLORS.reset}`);
      console.log(`${COLORS.green}Passed:${COLORS.reset} ${summary.passed}`);
      console.log(`${COLORS.red}Failed:${COLORS.reset} ${summary.failed}`);
      console.log(`${COLORS.yellow}Skipped:${COLORS.reset} ${summary.skipped}`);
      console.log(`${COLORS.cyan}Duration:${COLORS.reset} ${(summary.duration / 1000).toFixed(2)}s`);
      
      return summary;
    }
  } catch (error) {
    console.log(`${COLORS.yellow}!${COLORS.reset} Could not generate summary:`, error.message);
  }
  
  return null;
}

// Create UAT sign-off document
async function createSignOffDocument(summary) {
  const signOffPath = path.join(CONFIG.outputDir, 'uat-signoff.md');
  
  const signOffContent = `# UAT Sign-off Document - AImpactScanner MVP

## Test Execution Summary
- **Date**: ${new Date().toISOString()}
- **Total Tests**: ${summary?.totalTests || 'N/A'}
- **Passed**: ${summary?.passed || 'N/A'}
- **Failed**: ${summary?.failed || 'N/A'}
- **Pass Rate**: ${summary?.totalTests ? ((summary.passed / summary.totalTests) * 100).toFixed(1) : 'N/A'}%

## Test Categories
${Object.entries(summary?.categories || {}).map(([category, stats]) => 
  `- **${category}**: ${stats.passed}/${stats.total} passed`
).join('\n')}

## Critical User Journeys
- [ ] Anonymous user can navigate and understand value proposition
- [ ] Free tier users can register with temporary email
- [ ] Free tier users can complete one analysis
- [ ] Paid tier users can checkout via Stripe
- [ ] Authentication flows work (OAuth and magic links)
- [ ] Analysis completes within 15 seconds
- [ ] PDF reports can be exported
- [ ] Subscription management works

## Cross-Platform Validation
- [ ] Chrome/Chromium: Tested
- [ ] Firefox: Tested
- [ ] Safari/WebKit: Tested
- [ ] Mobile responsive: Verified

## Production Readiness
- [ ] All critical paths functional
- [ ] Performance benchmarks met
- [ ] Security requirements validated
- [ ] Error handling confirmed

## Sign-off
**UAT Status**: ${summary?.failed === 0 ? 'PASSED ✅' : 'FAILED ❌'}

**Prepared by**: UAT Automation System
**Date**: ${new Date().toLocaleDateString()}

## Notes
${summary?.failed > 0 ? 'Issues detected - review failed tests before deployment' : 'All tests passed - ready for production deployment'}
`;
  
  await fs.writeFile(signOffPath, signOffContent);
  console.log(`${COLORS.green}✓${COLORS.reset} Sign-off document created: ${signOffPath}`);
}

// Main execution
async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  console.log(`\n${COLORS.bright}${COLORS.cyan}🚀 AImpactScanner UAT Test Runner${COLORS.reset}\n`);
  
  try {
    // Setup
    await ensureOutputDir();
    await checkDevServer();
    
    // Build and run tests
    const command = buildPlaywrightCommand(options);
    await runTests(command);
    
    // Generate reports
    const summary = await generateSummary();
    
    if (summary) {
      await createSignOffDocument(summary);
      
      if (options.report) {
        console.log(`\n${COLORS.green}✓${COLORS.reset} HTML report available at: ${path.join(CONFIG.outputDir, 'index.html')}`);
        console.log(`${COLORS.cyan}Open with:${COLORS.reset} npx playwright show-report ${CONFIG.outputDir}`);
      }
      
      // Exit with appropriate code
      process.exit(summary.failed > 0 ? 1 : 0);
    } else {
      console.log(`\n${COLORS.green}✓${COLORS.reset} Tests completed`);
      process.exit(0);
    }
    
  } catch (error) {
    console.error(`\n${COLORS.red}✗ UAT tests failed:${COLORS.reset}`, error.message);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === __filename) {
  main();
}

export { main, parseArgs, buildPlaywrightCommand };