// UAT Setup Script - Initialize test environment and users

import { createClient } from '@supabase/supabase-js';
import { TEST_USERS, getEnvironment } from './test-users.config.js';
import bcrypt from 'bcryptjs';

const env = getEnvironment();

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  env.supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || env.supabaseAnonKey
);

async function createTestUser(userConfig) {
  try {
    // Skip anonymous and temp email users
    if (!userConfig.email || userConfig.email === 'TEMP_EMAIL') {
      return null;
    }

    console.log(`Creating test user: ${userConfig.email}`);

    // Hash password if provided
    const hashedPassword = userConfig.password 
      ? await bcrypt.hash(userConfig.password, 10)
      : null;

    // Create user in auth system
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userConfig.email,
      password: userConfig.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        tier: userConfig.tier,
        test_user: true
      }
    });

    if (authError && !authError.message.includes('already exists')) {
      throw authError;
    }

    const userId = authData?.user?.id || await getUserIdByEmail(userConfig.email);

    // Create/update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: userConfig.email,
        tier: userConfig.tier,
        analysis_count: userConfig.analysisUsed || 0,
        analysis_limit: userConfig.analysisLimit,
        stripe_customer_id: userConfig.stripeCustomerId,
        subscription_status: userConfig.subscriptionStatus || 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.warn(`Profile creation warning for ${userConfig.email}:`, profileError.message);
    }

    // Create subscription record if paid tier
    if (userConfig.tier !== 'free' && userConfig.stripeCustomerId) {
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: userConfig.stripeCustomerId,
          stripe_subscription_id: `sub_test_${userConfig.tier}_${Date.now()}`,
          status: userConfig.subscriptionStatus || 'active',
          tier: userConfig.tier,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        });

      if (subError) {
        console.warn(`Subscription creation warning for ${userConfig.email}:`, subError.message);
      }
    }

    console.log(`✅ Created test user: ${userConfig.email}`);
    return userId;

  } catch (error) {
    console.error(`❌ Failed to create test user ${userConfig.email}:`, error.message);
    return null;
  }
}

async function getUserIdByEmail(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  return data?.id;
}

async function cleanupTestUsers() {
  console.log('Cleaning up existing test users...');
  
  try {
    // Get all test users
    const { data: testUsers, error } = await supabase
      .from('profiles')
      .select('id, email')
      .like('email', 'uat.%@test.com');

    if (error) {
      console.warn('Could not fetch test users:', error.message);
      return;
    }

    // Delete each test user
    for (const user of testUsers || []) {
      console.log(`Removing test user: ${user.email}`);
      
      // Delete from auth
      await supabase.auth.admin.deleteUser(user.id);
      
      // Profile and related data should cascade delete
    }

    console.log('✅ Cleanup complete');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

async function setupTestData() {
  console.log('Setting up test data...');

  try {
    // Create sample analysis results for some users
    const starterUserId = await getUserIdByEmail('uat.starter@test.com');
    
    if (starterUserId) {
      // Create sample analyses
      const analyses = [
        {
          user_id: starterUserId,
          url: 'https://example.com',
          score: 75,
          status: 'completed',
          results: {
            factors: {
              personalization: 70,
              contentDepth: 80,
              userEngagement: 75,
              conversion: 65,
              accessibility: 85,
              dataEthics: 80,
              valueCreation: 70,
              technicalExcellence: 75,
              credibility: 80,
              innovation: 70
            }
          },
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          user_id: starterUserId,
          url: 'https://github.com',
          score: 82,
          status: 'completed',
          results: {
            factors: {
              personalization: 60,
              contentDepth: 85,
              userEngagement: 80,
              conversion: 70,
              accessibility: 90,
              dataEthics: 85,
              valueCreation: 85,
              technicalExcellence: 95,
              credibility: 90,
              innovation: 80
            }
          },
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
        }
      ];

      for (const analysis of analyses) {
        const { error } = await supabase
          .from('analyses')
          .insert(analysis);

        if (error) {
          console.warn('Could not create sample analysis:', error.message);
        }
      }
    }

    console.log('✅ Test data setup complete');
  } catch (error) {
    console.error('❌ Test data setup failed:', error.message);
  }
}

async function main() {
  console.log('\n🚀 UAT Environment Setup\n');
  console.log(`Environment: ${process.env.TEST_ENV || 'local'}`);
  console.log(`Supabase URL: ${env.supabaseUrl}\n`);

  // Option to clean up first
  const shouldCleanup = process.argv.includes('--cleanup');
  
  if (shouldCleanup) {
    await cleanupTestUsers();
    console.log('');
  }

  // Create test users
  console.log('Creating test users...\n');
  
  for (const [key, userConfig] of Object.entries(TEST_USERS)) {
    // Skip certain user types
    if (key === 'anonymous' || key === 'freeNew') {
      continue;
    }
    
    await createTestUser(userConfig);
  }

  // Setup test data
  console.log('');
  await setupTestData();

  console.log('\n✅ UAT setup complete!');
  console.log('\nTest users created with password: UATtest123!');
  console.log('\nRun tests with: npm run test:uat');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

export { createTestUser, cleanupTestUsers, setupTestData };