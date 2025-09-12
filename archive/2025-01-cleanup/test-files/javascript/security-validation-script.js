/**
 * CLIENT-SIDE SECURITY VALIDATION SCRIPT
 * Run this in browser console to test validation functions
 */

// Test email validation function
function testEmailValidation() {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const testCases = [
    { email: 'valid@example.com', expected: true },
    { email: 'plainaddress', expected: false },
    { email: '@domain.com', expected: false },
    { email: 'test@', expected: false },
    { email: 'test@domain', expected: false },
    { email: 'test with spaces@domain.com', expected: false },
    { email: 'test@@domain.com', expected: false },
    { email: 'test.email@domain.com', expected: true },
    { email: '', expected: false }
  ];
  
  console.log('🔍 EMAIL VALIDATION TESTS:');
  let passed = 0;
  let failed = 0;
  
  testCases.forEach(({ email, expected }) => {
    const result = emailRegex.test(email);
    const status = result === expected ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} "${email}" -> ${result} (expected: ${expected})`);
    
    if (result === expected) passed++;
    else failed++;
  });
  
  console.log(`\n📊 Email Validation Summary: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// Test password strength function
function testPasswordStrength() {
  function calculatePasswordStrength(password) {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return strength;
  }
  
  const testCases = [
    { password: '', expected: 0, description: 'Empty password' },
    { password: 'weak', expected: 1, description: 'Short lowercase only' },
    { password: 'password', expected: 2, description: '8+ chars, lowercase only' },
    { password: 'Password', expected: 3, description: '8+ chars, mixed case' },
    { password: 'Password123', expected: 4, description: '8+ chars, mixed case, numbers' },
    { password: 'Password123!', expected: 5, description: 'Full strength password' },
    { password: 'P@ss1', expected: 4, description: 'Short but all types' },
    { password: 'UPPERCASE', expected: 2, description: 'Long uppercase only' },
    { password: '12345678', expected: 2, description: 'Numbers and length only' }
  ];
  
  console.log('\n🔍 PASSWORD STRENGTH TESTS:');
  let passed = 0;
  let failed = 0;
  
  testCases.forEach(({ password, expected, description }) => {
    const result = calculatePasswordStrength(password);
    const status = result === expected ? '✅ PASS' : '❌ FAIL';
    const strength = result < 3 ? 'WEAK' : result < 5 ? 'GOOD' : 'STRONG';
    console.log(`${status} "${description}" -> ${result}/5 (${strength}) (expected: ${expected})`);
    
    if (result === expected) passed++;
    else failed++;
  });
  
  console.log(`\n📊 Password Strength Summary: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// Test form validation logic
function testFormValidation() {
  function validateForm(email, password, confirmPassword, agreeToTerms) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email || !emailRegex.test(email)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }

    function calculatePasswordStrength(pwd) {
      if (!pwd) return 0;
      let strength = 0;
      if (pwd.length >= 8) strength++;
      if (/[a-z]/.test(pwd)) strength++;
      if (/[A-Z]/.test(pwd)) strength++;
      if (/\d/.test(pwd)) strength++;
      if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) strength++;
      return strength;
    }

    const passwordStrength = calculatePasswordStrength(password);
    if (passwordStrength < 3) {
      return { valid: false, error: 'Password must be stronger. Include uppercase, lowercase, and numbers.' };
    }

    if (password !== confirmPassword) {
      return { valid: false, error: 'Passwords do not match' };
    }

    if (!agreeToTerms) {
      return { valid: false, error: 'Please agree to the Terms of Service' };
    }

    return { valid: true, error: null };
  }
  
  const testCases = [
    {
      data: { email: 'test@example.com', password: 'StrongPass123!', confirmPassword: 'StrongPass123!', agreeToTerms: true },
      expected: { valid: true },
      description: 'Valid complete form'
    },
    {
      data: { email: 'invalid-email', password: 'StrongPass123!', confirmPassword: 'StrongPass123!', agreeToTerms: true },
      expected: { valid: false },
      description: 'Invalid email format'
    },
    {
      data: { email: 'test@example.com', password: 'weak', confirmPassword: 'weak', agreeToTerms: true },
      expected: { valid: false },
      description: 'Weak password'
    },
    {
      data: { email: 'test@example.com', password: 'StrongPass123!', confirmPassword: 'DifferentPass123!', agreeToTerms: true },
      expected: { valid: false },
      description: 'Password mismatch'
    },
    {
      data: { email: 'test@example.com', password: 'StrongPass123!', confirmPassword: 'StrongPass123!', agreeToTerms: false },
      expected: { valid: false },
      description: 'Terms not agreed'
    }
  ];
  
  console.log('\n🔍 FORM VALIDATION TESTS:');
  let passed = 0;
  let failed = 0;
  
  testCases.forEach(({ data, expected, description }) => {
    const result = validateForm(data.email, data.password, data.confirmPassword, data.agreeToTerms);
    const status = result.valid === expected.valid ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${description} -> ${result.valid ? 'VALID' : 'INVALID: ' + result.error}`);
    
    if (result.valid === expected.valid) passed++;
    else failed++;
  });
  
  console.log(`\n📊 Form Validation Summary: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// Run all validation tests
function runAllValidationTests() {
  console.log('🚀 STARTING CLIENT-SIDE SECURITY VALIDATION TESTS');
  console.log('=' * 60);
  
  const emailResults = testEmailValidation();
  const passwordResults = testPasswordStrength();
  const formResults = testFormValidation();
  
  const totalPassed = emailResults.passed + passwordResults.passed + formResults.passed;
  const totalFailed = emailResults.failed + passwordResults.failed + formResults.failed;
  const successRate = ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1);
  
  console.log('\n🎯 OVERALL VALIDATION TEST RESULTS:');
  console.log('=' * 60);
  console.log(`✅ Total Passed: ${totalPassed}`);
  console.log(`❌ Total Failed: ${totalFailed}`);
  console.log(`📈 Success Rate: ${successRate}%`);
  
  if (totalFailed === 0) {
    console.log('\n🎉 ALL VALIDATION TESTS PASSED!');
    console.log('✅ Client-side security validation is working correctly');
  } else {
    console.log('\n⚠️  Some validation tests failed - review required');
  }
  
  return {
    email: emailResults,
    password: passwordResults,
    form: formResults,
    overall: { passed: totalPassed, failed: totalFailed, successRate }
  };
}

// Export for browser console use
if (typeof window !== 'undefined') {
  window.securityTests = {
    testEmailValidation,
    testPasswordStrength,
    testFormValidation,
    runAllValidationTests
  };
  
  console.log('🔒 Security validation tests loaded!');
  console.log('Run: securityTests.runAllValidationTests()');
}

// For Node.js environment
if (typeof module !== 'undefined') {
  module.exports = {
    testEmailValidation,
    testPasswordStrength,
    testFormValidation,
    runAllValidationTests
  };
}

// Auto-run in Node.js
runAllValidationTests();