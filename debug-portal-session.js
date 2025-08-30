// Debug the create-portal-session issue
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pdmtvkcxnqysujnpcnyh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbXR2a2N4bnF5c3VqbnBjbnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODQ3MjAsImV4cCI6MjA2NjQ2MDcyMH0.EJmcxGQwsCsf4uGwNAz_D_DnJxGN2ZV3Doux_FyPtEg';

async function debugPortalSession() {
  try {
    console.log('1. Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('2. Checking user data for jamie.watters.mail@icloud.com...');
    
    // Get user data directly from service role
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'jamie.watters.mail@icloud.com');
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('No user found with that email');
      return;
    }
    
    const user = users[0];
    console.log('User found:');
    console.log('- ID:', user.id);
    console.log('- Email:', user.email);
    console.log('- Tier:', user.tier);
    console.log('- Stripe Customer ID:', user.stripe_customer_id);
    console.log('- Subscription Status:', user.subscription_status);
    
    // Check if stripe customer ID exists and looks valid
    if (!user.stripe_customer_id) {
      console.log('\n❌ PROBLEM FOUND: No Stripe Customer ID');
      console.log('   This is why create-portal-session is failing with 400 error');
      console.log('   The Edge Function checks for stripe_customer_id and throws error if not found');
      return;
    }
    
    if (!user.stripe_customer_id.startsWith('cus_')) {
      console.log('\n⚠️  WARNING: Stripe Customer ID doesn\'t look valid');
      console.log('   Expected format: cus_xxxxxxxxxxxx');
      console.log('   Actual value:', user.stripe_customer_id);
      return;
    }
    
    console.log('\n✅ Stripe Customer ID looks valid');
    console.log('   This should work for create-portal-session');
    
    // Let's also check if there are any subscription records
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id);
    
    if (subError) {
      console.error('Error checking subscriptions:', subError);
    } else {
      console.log('\nSubscription records found:', subscriptions?.length || 0);
      if (subscriptions && subscriptions.length > 0) {
        console.log('- Latest subscription status:', subscriptions[0].status);
        console.log('- Stripe Subscription ID:', subscriptions[0].stripe_subscription_id);
      }
    }
    
  } catch (error) {
    console.error('Debug script error:', error);
  }
}

// Also check the analysis count issue
async function debugAnalysisCount() {
  console.log('\n\n=== DEBUGGING ANALYSIS COUNT ISSUE ===');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: analyses, error } = await supabase
      .from('analyses')
      .select('id, created_at, status')
      .eq('user_id', 'e8fda207-946e-48dc-87c4-909cfde3f543')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching analyses:', error);
      return;
    }
    
    console.log('Total analyses found:', analyses?.length || 0);
    console.log('Recent analyses:');
    
    if (analyses && analyses.length > 0) {
      analyses.slice(0, 5).forEach((analysis, index) => {
        console.log(`${index + 1}. ${analysis.created_at} - Status: ${analysis.status}`);
      });
      
      // Check for completed analyses this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthAnalyses = analyses.filter(analysis => 
        new Date(analysis.created_at) >= startOfMonth
      );
      
      console.log(`\nAnalyses this month (since ${startOfMonth.toDateString()}):`, thisMonthAnalyses.length);
      
      const completedThisMonth = thisMonthAnalyses.filter(analysis => 
        analysis.status === 'completed'
      );
      console.log('Completed analyses this month:', completedThisMonth.length);
      
    } else {
      console.log('No analyses found for this user');
    }
    
  } catch (error) {
    console.error('Analysis count debug error:', error);
  }
}

// Run both debug functions
async function runAllDebug() {
  await debugPortalSession();
  await debugAnalysisCount();
}

runAllDebug();