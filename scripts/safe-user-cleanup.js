#!/usr/bin/env node

/**
 * SAFE USER CLEANUP SCRIPT
 *
 * Purpose: Delete all test users EXCEPT production account
 *
 * SAFETY FEATURES:
 * - Preserves jamie.watters.mail@icloud.com (production account)
 * - Dry run mode to preview deletions
 * - Explicit confirmation before deletion
 * - Detailed logging of all operations
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// PRODUCTION ACCOUNT - NEVER DELETE THIS
const PRODUCTION_EMAIL = 'jamie.watters.mail@icloud.com';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables in .env.local:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 The service role key can be found in Supabase Dashboard:');
  console.error('   Settings → API → Project API keys → service_role (secret)');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper to prompt user for confirmation
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function listAllUsers() {
  console.log('📋 Fetching all users from database...\n');

  try {
    // Get users from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message);
      return { authUsers: [], publicUsers: [] };
    }

    // Get users from public.users table
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, email, tier, subscription_tier, created_at');

    if (publicError) {
      console.error('❌ Error fetching public users:', publicError.message);
    }

    return {
      authUsers: authUsers?.users || [],
      publicUsers: publicUsers || []
    };
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return { authUsers: [], publicUsers: [] };
  }
}

async function performDryRun() {
  console.log('🔍 DRY RUN MODE - No changes will be made\n');
  console.log('═'.repeat(70));

  const { authUsers, publicUsers } = await listAllUsers();

  console.log(`\n📊 CURRENT DATABASE STATE:`);
  console.log('─'.repeat(70));
  console.log(`Total auth users: ${authUsers.length}`);
  console.log(`Total public users: ${publicUsers.length}`);
  console.log('─'.repeat(70));

  // Display all users
  console.log('\n👥 ALL USERS IN AUTH.USERS:');
  console.log('─'.repeat(70));

  authUsers.forEach((user, index) => {
    const isProduction = user.email === PRODUCTION_EMAIL;
    const marker = isProduction ? '🔒 PROTECTED' : '🗑️  DELETE';
    const authProvider = user.app_metadata?.provider || 'email';

    console.log(`${index + 1}. ${marker}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Provider: ${authProvider}`);
    console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`);
    console.log(`   Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log('');
  });

  // Show what will be deleted
  const toDelete = authUsers.filter(u => u.email !== PRODUCTION_EMAIL);
  const toPreserve = authUsers.filter(u => u.email === PRODUCTION_EMAIL);

  console.log('\n📋 DELETION PLAN:');
  console.log('─'.repeat(70));
  console.log(`✅ WILL PRESERVE: ${toPreserve.length} user(s)`);
  toPreserve.forEach(u => {
    console.log(`   • ${u.email} (${u.id.slice(0, 8)}...)`);
  });

  console.log(`\n❌ WILL DELETE: ${toDelete.length} user(s)`);
  toDelete.forEach(u => {
    console.log(`   • ${u.email} (${u.id.slice(0, 8)}...)`);
  });

  console.log('\n═'.repeat(70));
  console.log('✅ Dry run complete - No changes made');
  console.log('Run with --execute flag to perform actual deletion');
}

async function executeCleanup() {
  console.log('⚠️  EXECUTE MODE - This will DELETE users!\n');
  console.log('═'.repeat(70));

  const { authUsers, publicUsers } = await listAllUsers();

  const toDelete = authUsers.filter(u => u.email !== PRODUCTION_EMAIL);
  const toPreserve = authUsers.filter(u => u.email === PRODUCTION_EMAIL);

  console.log(`\n📋 DELETION SUMMARY:`);
  console.log('─'.repeat(70));
  console.log(`🔒 PROTECTED (will NOT delete): ${toPreserve.length} user(s)`);
  toPreserve.forEach(u => console.log(`   • ${u.email}`));

  console.log(`\n🗑️  TO DELETE: ${toDelete.length} user(s)`);
  toDelete.forEach(u => console.log(`   • ${u.email}`));

  console.log('\n═'.repeat(70));

  // Safety confirmation
  const answer = await askQuestion(
    '\n⚠️  Are you absolutely sure you want to DELETE these users? (type "DELETE" to confirm): '
  );

  if (answer.trim() !== 'DELETE') {
    console.log('\n❌ Deletion cancelled - no changes made');
    return;
  }

  console.log('\n🚀 Starting deletion process...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const user of toDelete) {
    console.log(`\n🗑️  Deleting ${user.email}...`);

    try {
      // Delete from public.users first
      const { error: publicError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (publicError && !publicError.message.includes('0 rows')) {
        console.log(`   ⚠️  Could not remove from public.users: ${publicError.message}`);
      } else {
        console.log(`   ✅ Removed from public.users`);
      }

      // Delete from auth.users
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

      if (authError) {
        console.log(`   ❌ Could not remove from auth.users: ${authError.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Removed from auth.users`);
        successCount++;
      }
    } catch (err) {
      console.log(`   ❌ Unexpected error: ${err.message}`);
      errorCount++;
    }
  }

  // Final summary
  console.log('\n\n═'.repeat(70));
  console.log('✅ CLEANUP COMPLETE');
  console.log('─'.repeat(70));
  console.log(`✅ Successfully deleted: ${successCount} user(s)`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`🔒 Protected (preserved): ${toPreserve.length} user(s)`);
  console.log('═'.repeat(70));

  // Verify protection
  console.log('\n🔍 Verifying production account preservation...');
  const { data: verifyAuth } = await supabase.auth.admin.listUsers();
  const productionExists = verifyAuth?.users.some(u => u.email === PRODUCTION_EMAIL);

  if (productionExists) {
    console.log(`✅ VERIFIED: ${PRODUCTION_EMAIL} still exists ✓`);
  } else {
    console.log(`⚠️  WARNING: Production account not found!`);
  }
}

// Main execution
const args = process.argv.slice(2);
const isDryRun = !args.includes('--execute');

async function main() {
  console.log('\n🧹 SAFE USER CLEANUP SCRIPT');
  console.log('═'.repeat(70));
  console.log(`🔒 Production Account (PROTECTED): ${PRODUCTION_EMAIL}`);
  console.log('═'.repeat(70));

  if (isDryRun) {
    await performDryRun();
  } else {
    await executeCleanup();
  }

  console.log('\n');
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
