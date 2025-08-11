#!/usr/bin/env node
// tests/validate-phase2-setup.js - Validate Phase 2 Test Environment Setup

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔍 Validating Phase 2 Test Environment Setup...\n');

const checks = [
  {
    name: 'Playwright Configuration',
    check: () => fs.existsSync('playwright.config.js'),
    fix: 'Ensure playwright.config.js exists in project root'
  },
  {
    name: 'Phase 2 Test File',
    check: () => fs.existsSync('tests/phase2-auth-pricing.spec.js'),
    fix: 'Ensure phase2-auth-pricing.spec.js exists in tests/ directory'
  },
  {
    name: 'Test Helpers',
    check: () => fs.existsSync('tests/setup/test-helpers.js'),
    fix: 'Ensure test-helpers.js exists in tests/setup/ directory'
  },
  {
    name: 'Global Setup',
    check: () => fs.existsSync('tests/setup/global-setup.js'),
    fix: 'Ensure global-setup.js exists in tests/setup/ directory'
  },
  {
    name: 'Global Teardown',
    check: () => fs.existsSync('tests/setup/global-teardown.js'),
    fix: 'Ensure global-teardown.js exists in tests/setup/ directory'
  },
  {
    name: 'Test Environment Config',
    check: () => fs.existsSync('.env.test'),
    fix: 'Create .env.test file with test environment variables'
  },
  {
    name: 'Package.json Scripts',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.scripts && pkg.scripts['test:phase2'];
    },
    fix: 'Add Phase 2 test scripts to package.json'
  },
  {
    name: 'Playwright Dependencies',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.devDependencies && pkg.devDependencies['@playwright/test'];
    },
    fix: 'Install Playwright: npm install --save-dev @playwright/test'
  },
  {
    name: 'Node Modules',
    check: () => fs.existsSync('node_modules'),
    fix: 'Run npm install to install dependencies'
  }
];

let allChecksPass = true;

checks.forEach(({ name, check, fix }, index) => {
  const passed = check();
  const status = passed ? '✅' : '❌';
  
  console.log(`${index + 1}. ${status} ${name}`);
  
  if (!passed) {
    console.log(`   💡 Fix: ${fix}\n`);
    allChecksPass = false;
  }
});

console.log('\n' + '='.repeat(60));

if (allChecksPass) {
  console.log('✅ All checks passed! Phase 2 test environment is ready.');
  console.log('\n🚀 Quick start commands:');
  console.log('   npm run test:phase2           # Run all Phase 2 tests');
  console.log('   npm run test:phase2:ui        # Interactive test runner');
  console.log('   npm run test:phase2:debug     # Debug mode');
  console.log('   npm run test:phase2:auth      # Authentication tests only');
  console.log('   npm run test:phase2:pricing   # Pricing tests only');
  
  console.log('\n📚 Documentation:');
  console.log('   tests/PHASE2_TESTING_README.md - Comprehensive testing guide');
} else {
  console.log('❌ Setup incomplete. Please fix the issues above.');
  console.log('\n🔧 Quick fixes:');
  console.log('   npm install @playwright/test  # Install Playwright');
  console.log('   npx playwright install        # Install browsers');
  console.log('   npm run dev                   # Start development server');
}

console.log('\n📋 Test Coverage Summary:');
console.log('   • Email/password authentication flows');
console.log('   • Password strength validation');  
console.log('   • Three-tier pricing display');
console.log('   • Annual/monthly billing toggle');
console.log('   • Currency conversion (USD/EUR/GBP)');
console.log('   • Free and paid registration flows');
console.log('   • Stripe payment integration');
console.log('   • Mobile responsiveness');
console.log('   • Performance benchmarks');
console.log('   • Accessibility compliance');

// Attempt to run a quick smoke test if setup looks good
if (allChecksPass) {
  console.log('\n🧪 Running smoke test...');
  try {
    // Check if development server is running
    execSync('curl -f http://localhost:5173 > /dev/null 2>&1', { stdio: 'ignore' });
    console.log('✅ Development server is accessible');
    
    // Try to run a single test (dry run)
    try {
      execSync('npx playwright test --dry-run tests/phase2-auth-pricing.spec.js', { stdio: 'ignore' });
      console.log('✅ Test files are valid and can be executed');
    } catch (e) {
      console.log('⚠️  Test syntax validation failed - check test files');
    }
    
  } catch (e) {
    console.log('⚠️  Development server not running. Start with: npm run dev');
  }
}

console.log('\n' + '='.repeat(60));
process.exit(allChecksPass ? 0 : 1);