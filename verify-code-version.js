// Run this in browser console to verify you have the NEW code loaded
// Paste this entire script into Console (F12) and press Enter

(async function verifyCodeVersion() {
  console.log('🔍 Checking which code version is loaded...\n');

  // Check 1: Look for the debug logs function signature in loaded JS
  const scripts = Array.from(document.scripts);
  let hasNewCode = false;

  for (const script of scripts) {
    if (script.src && script.src.includes('main') && script.src.includes('.js')) {
      console.log('📦 Found main JS bundle:', script.src);

      try {
        const response = await fetch(script.src);
        const code = await response.text();

        // Check for the NEW normalization code
        if (code.includes('normalizedIsTrial') || code.includes('Normalized isTrial')) {
          console.log('✅ NEW CODE DETECTED: Found normalizedIsTrial logic');
          hasNewCode = true;
        } else {
          console.log('❌ OLD CODE DETECTED: Missing normalizedIsTrial logic');
        }

        // Check for debug logs
        if (code.includes('[Signup] Normalized isTrial:')) {
          console.log('✅ NEW CODE DETECTED: Found new debug logs');
          hasNewCode = true;
        } else {
          console.log('❌ OLD CODE DETECTED: Missing new debug logs');
        }

        break;
      } catch (e) {
        console.log('⚠️ Could not fetch script for inspection');
      }
    }
  }

  // Check 2: Look for authContext in localStorage
  console.log('\n🔍 Checking localStorage for stale authContext...\n');
  const authContext = localStorage.getItem('authContext');
  if (authContext) {
    console.log('⚠️ Found existing authContext:', authContext);
    const parsed = JSON.parse(authContext);
    console.log('📊 Parsed authContext:', parsed);
    console.log('❗ This could be stale data from previous tests!');
  } else {
    console.log('✅ No authContext in localStorage (clean state)');
  }

  // Check 3: Look for session in localStorage (Supabase)
  console.log('\n🔍 Checking for existing Supabase session...\n');
  const supabaseKeys = Object.keys(localStorage).filter(k => k.includes('supabase'));
  if (supabaseKeys.length > 0) {
    console.log('⚠️ Found Supabase session keys:', supabaseKeys.length);
    console.log('❗ You may still be logged in!');
  } else {
    console.log('✅ No Supabase session found (logged out)');
  }

  // Final verdict
  console.log('\n' + '='.repeat(60));
  if (hasNewCode) {
    console.log('✅ RESULT: You have the NEW code loaded!');
    console.log('   Next: Clear localStorage and test the trial flow');
  } else {
    console.log('❌ RESULT: You have OLD cached code!');
    console.log('   Action Required:');
    console.log('   1. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R)');
    console.log('   2. Clear site data in DevTools Application tab');
    console.log('   3. Try Incognito mode if still fails');
  }
  console.log('='.repeat(60) + '\n');
})();
