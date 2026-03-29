import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * DIAGNOSTIC SIGNUP PAGE
 *
 * This component performs a comprehensive test of the entire signup flow
 * and captures EVERY detail in a single, copyable diagnostic report.
 *
 * Purpose: End 15 hours of back-and-forth debugging with ONE test run.
 *
 * Tests performed:
 * 1. Auth signup attempt
 * 2. Database user creation (via trigger)
 * 3. RLS policy evaluation
 * 4. Trigger execution verification
 * 5. Database state before/after
 * 6. Session state
 * 7. Service role bypass test (to isolate RLS vs trigger issues)
 */

export default function DiagnosticSignup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState(null);

  const generateTestEmail = () => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    return `diagnostic-${timestamp}-${randomId}@test.aimpactscanner.com`;
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    const startTime = Date.now();
    const testEmail = email || generateTestEmail();
    const testPassword = password || 'DiagnosticTest123!@#';

    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        testEmail,
        environment: import.meta.env.MODE,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      },
      tests: {},
      errors: [],
      summary: {},
    };

    try {
      // ================================================================
      // TEST 1: Check current auth session
      // ================================================================
      report.tests.initialSession = await (async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          return {
            success: !error,
            session: session ? {
              userId: session.user.id,
              email: session.user.email,
              emailConfirmed: session.user.email_confirmed_at,
            } : null,
            error: error?.message,
          };
        } catch (err) {
          return { success: false, error: err.message };
        }
      })();

      // ================================================================
      // TEST 2: Pre-signup database state
      // ================================================================
      report.tests.preSignupDatabase = await (async () => {
        try {
          // Check auth.users count (we can't query directly, but we can check public.users)
          const { data: existingUsers, error } = await supabase
            .from('users')
            .select('id, email, tier, email_verified, created_at')
            .eq('email', testEmail);

          return {
            success: !error,
            existingUsers: existingUsers || [],
            userExists: existingUsers && existingUsers.length > 0,
            error: error?.message,
          };
        } catch (err) {
          return { success: false, error: err.message };
        }
      })();

      // ================================================================
      // TEST 3: Trigger and function existence check
      // ================================================================
      report.tests.triggerCheck = await (async () => {
        try {
          // Query pg_trigger to check what triggers exist on auth.users
          const { data: triggers, error: triggerError } = await supabase.rpc('check_auth_triggers');

          // Query pg_proc to check what functions exist
          const { data: functions, error: functionError } = await supabase.rpc('check_user_functions');

          return {
            success: !triggerError && !functionError,
            triggers: triggers || [],
            functions: functions || [],
            triggerError: triggerError?.message,
            functionError: functionError?.message,
          };
        } catch (err) {
          return {
            success: false,
            error: err.message,
            note: 'RPC functions might not exist - this is expected if not created yet',
          };
        }
      })();

      // ================================================================
      // TEST 4: RLS policies check
      // ================================================================
      report.tests.rlsPolicies = await (async () => {
        try {
          const { data: policies, error } = await supabase.rpc('check_user_policies');

          return {
            success: !error,
            policies: policies || [],
            policyCount: policies?.length || 0,
            error: error?.message,
          };
        } catch (err) {
          return {
            success: false,
            error: err.message,
            note: 'RPC function might not exist - this is expected if not created yet',
          };
        }
      })();

      // ================================================================
      // TEST 5: Sign up attempt
      // ================================================================
      report.tests.signupAttempt = await (async () => {
        try {
          const { data, error } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
            options: {
              data: {
                signup_source: 'diagnostic_test',
                test_run: true,
              },
            },
          });

          return {
            success: !error,
            userId: data?.user?.id,
            userEmail: data?.user?.email,
            emailConfirmed: data?.user?.email_confirmed_at,
            sessionExists: !!data?.session,
            error: error?.message,
            errorCode: error?.code,
            errorStatus: error?.status,
            fullError: error ? JSON.stringify(error, null, 2) : null,
          };
        } catch (err) {
          return {
            success: false,
            error: err.message,
            stack: err.stack,
          };
        }
      })();

      const userId = report.tests.signupAttempt.userId;

      // ================================================================
      // TEST 6: Post-signup auth state
      // ================================================================
      report.tests.postSignupSession = await (async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          return {
            success: !error,
            session: session ? {
              userId: session.user.id,
              email: session.user.email,
              emailConfirmed: session.user.email_confirmed_at,
              metadata: session.user.user_metadata,
            } : null,
            error: error?.message,
          };
        } catch (err) {
          return { success: false, error: err.message };
        }
      })();

      // ================================================================
      // TEST 7: Check if user created in auth.users
      // ================================================================
      report.tests.authUserCheck = await (async () => {
        try {
          // We can't query auth.users directly, but signup response tells us
          return {
            success: !!userId,
            userId,
            note: 'User ID from signup response indicates auth.users record created',
          };
        } catch (err) {
          return { success: false, error: err.message };
        }
      })();

      // ================================================================
      // TEST 8: Check if user created in public.users (TRIGGER TEST)
      // ================================================================
      if (userId) {
        report.tests.publicUserCheck = await (async () => {
          try {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId);

            return {
              success: !error,
              userExists: data && data.length > 0,
              userData: data?.[0] || null,
              error: error?.message,
              errorCode: error?.code,
              errorStatus: error?.status,
              errorHint: error?.hint,
              errorDetails: error?.details,
              fullError: error ? JSON.stringify(error, null, 2) : null,
            };
          } catch (err) {
            return {
              success: false,
              error: err.message,
              stack: err.stack,
            };
          }
        })();

        // ================================================================
        // TEST 9: Try to query with email instead of ID (RLS TEST)
        // ================================================================
        report.tests.emailQuery = await (async () => {
          try {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('email', testEmail);

            return {
              success: !error,
              userExists: data && data.length > 0,
              userData: data?.[0] || null,
              error: error?.message,
              errorCode: error?.code,
              errorStatus: error?.status,
              note: 'Tests if RLS allows querying by email vs ID',
            };
          } catch (err) {
            return { success: false, error: err.message };
          }
        })();

        // ================================================================
        // TEST 10: Service role bypass test (isolate RLS issues)
        // ================================================================
        report.tests.serviceRoleTest = {
          note: 'Service role test requires backend API endpoint',
          skipped: true,
          reason: 'Cannot use service role from client-side code (security)',
          recommendation: 'Check Supabase logs for trigger execution errors',
        };

        // ================================================================
        // TEST 11: Try to insert user manually (fallback test)
        // ================================================================
        report.tests.manualInsert = await (async () => {
          try {
            const { data, error } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: testEmail,
                tier: 'free',
                monthly_analyses_used: 0,
                subscription_status: 'active',
                email_verified: false,
              })
              .select();

            return {
              success: !error,
              inserted: !!data,
              data: data?.[0] || null,
              error: error?.message,
              errorCode: error?.code,
              errorHint: error?.hint,
              note: 'Tests if RLS allows INSERT (should fail if trigger already created user)',
            };
          } catch (err) {
            return { success: false, error: err.message };
          }
        })();
      }

      // ================================================================
      // TEST 12: Check database logs (if accessible)
      // ================================================================
      report.tests.databaseLogs = {
        note: 'Database logs only accessible via Supabase dashboard',
        location: 'Supabase Dashboard  Logs  Postgres Logs',
        lookFor: [
          'Trigger execution errors',
          'RLS violation messages',
          'UNIQUE constraint violations',
          'Function execution errors',
        ],
      };

      // ================================================================
      // CLEANUP: Sign out the test user
      // ================================================================
      try {
        await supabase.auth.signOut();
      } catch (err) {
        report.errors.push({ step: 'cleanup', error: err.message });
      }

    } catch (err) {
      report.errors.push({
        step: 'overall',
        error: err.message,
        stack: err.stack,
      });
    }

    // ================================================================
    // GENERATE SUMMARY
    // ================================================================
    const endTime = Date.now();
    report.summary = {
      totalTime: `${endTime - startTime}ms`,
      signupSucceeded: report.tests.signupAttempt?.success || false,
      authUserCreated: !!report.tests.signupAttempt?.userId,
      publicUserCreated: report.tests.publicUserCheck?.userExists || false,
      rlsBlocking: report.tests.publicUserCheck?.errorCode === 'PGRST116' ||
                   report.tests.publicUserCheck?.errorStatus === 406,
      triggerFailed: report.tests.signupAttempt?.success &&
                     !report.tests.publicUserCheck?.userExists,
      errorCount: report.errors.length,
    };

    // ================================================================
    // DIAGNOSIS
    // ================================================================
    report.diagnosis = generateDiagnosis(report);

    setDiagnosticReport(report);
    setIsRunning(false);
  };

  const generateDiagnosis = (report) => {
    const diagnosis = {
      rootCause: 'Unknown',
      confidence: 'Low',
      recommendation: '',
      evidence: [],
    };

    // Check if signup failed
    if (!report.tests.signupAttempt?.success) {
      diagnosis.rootCause = 'Auth signup failed';
      diagnosis.confidence = 'High';
      diagnosis.recommendation = 'Check Supabase auth configuration and email settings';
      diagnosis.evidence.push(`Signup error: ${report.tests.signupAttempt?.error}`);
      return diagnosis;
    }

    // Check if user created in auth but not in public.users
    if (report.tests.signupAttempt?.userId && !report.tests.publicUserCheck?.userExists) {
      diagnosis.rootCause = 'Trigger not executing or failing silently';
      diagnosis.confidence = 'Very High';
      diagnosis.recommendation = 'Check trigger exists and function has SECURITY DEFINER. Review Postgres logs for trigger errors.';
      diagnosis.evidence.push('User created in auth.users but NOT in public.users');
      diagnosis.evidence.push(`Trigger check: ${JSON.stringify(report.tests.triggerCheck)}`);
      return diagnosis;
    }

    // Check if RLS is blocking
    if (report.tests.publicUserCheck?.errorCode === 'PGRST116' ||
        report.tests.publicUserCheck?.errorStatus === 406) {
      diagnosis.rootCause = 'RLS policy blocking SELECT';
      diagnosis.confidence = 'Very High';
      diagnosis.recommendation = 'Review RLS policies - likely missing "users can read their own data" policy or policy has wrong condition';
      diagnosis.evidence.push(`RLS error: ${report.tests.publicUserCheck?.error}`);
      diagnosis.evidence.push(`Error code: ${report.tests.publicUserCheck?.errorCode}`);
      diagnosis.evidence.push(`Policies: ${JSON.stringify(report.tests.rlsPolicies)}`);
      return diagnosis;
    }

    // Check if manual insert failed (RLS blocking INSERT)
    if (report.tests.manualInsert && !report.tests.manualInsert.success) {
      diagnosis.rootCause = 'RLS policy blocking INSERT';
      diagnosis.confidence = 'High';
      diagnosis.recommendation = 'Add RLS policy allowing authenticated users to insert their own record';
      diagnosis.evidence.push(`Manual insert error: ${report.tests.manualInsert?.error}`);
      return diagnosis;
    }

    // Everything worked!
    if (report.summary.publicUserCreated) {
      diagnosis.rootCause = 'No issues detected - signup flow working correctly';
      diagnosis.confidence = 'Very High';
      diagnosis.recommendation = 'Test with production signup flow to verify end-to-end';
      diagnosis.evidence.push('User successfully created in both auth.users and public.users');
      diagnosis.evidence.push('RLS policies allowing read access');
      return diagnosis;
    }

    return diagnosis;
  };

  const copyToClipboard = () => {
    const reportText = JSON.stringify(diagnosticReport, null, 2);
    navigator.clipboard.writeText(reportText).then(() => {
      alert('Diagnostic report copied to clipboard! Paste this into your chat.');
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Signup Flow Diagnostic Tool
          </h1>
          <p className="text-gray-600 mb-8">
            Run comprehensive diagnostics on the entire signup flow. This will test auth, triggers, RLS, and database state.
          </p>

          {!diagnosticReport ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Email (optional - will auto-generate if empty)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="diagnostic-test@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Password (optional - will auto-generate if empty)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="DiagnosticTest123!@#"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={runDiagnostics}
                disabled={isRunning}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-white ${
                  isRunning
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isRunning ? 'Running Diagnostics...' : 'Run Complete Diagnostic'}
              </button>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">What this tests:</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>✓ Auth signup (supabase.auth.signUp)</li>
                  <li>✓ User created in auth.users</li>
                  <li>✓ Trigger execution (user created in public.users)</li>
                  <li>✓ RLS policy evaluation</li>
                  <li>✓ Database state before/after</li>
                  <li>✓ Session state</li>
                  <li>✓ Manual insert test (RLS verification)</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-blue-900 mb-4">
                  Diagnosis Summary
                </h2>
                <div className="space-y-2 text-blue-800">
                  <p className="text-lg font-semibold">
                    Root Cause: {diagnosticReport.diagnosis.rootCause}
                  </p>
                  <p className="text-sm">
                    Confidence: <span className="font-bold">{diagnosticReport.diagnosis.confidence}</span>
                  </p>
                  <p className="font-medium mt-4">Recommendation:</p>
                  <p className="text-sm bg-white p-3 rounded border border-blue-200">
                    {diagnosticReport.diagnosis.recommendation}
                  </p>
                  {diagnosticReport.diagnosis.evidence.length > 0 && (
                    <>
                      <p className="font-medium mt-4">Evidence:</p>
                      <ul className="text-sm space-y-1">
                        {diagnosticReport.diagnosis.evidence.map((evidence, idx) => (
                          <li key={idx} className="bg-white p-2 rounded border border-blue-200">
                            {evidence}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg ${diagnosticReport.summary.signupSucceeded ? 'bg-green-100' : 'bg-red-100'}`}>
                  <p className="text-sm font-medium text-gray-700">Signup</p>
                  <p className="text-2xl font-bold">
                    {diagnosticReport.summary.signupSucceeded ? '✓' : '✗'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${diagnosticReport.summary.authUserCreated ? 'bg-green-100' : 'bg-red-100'}`}>
                  <p className="text-sm font-medium text-gray-700">Auth User</p>
                  <p className="text-2xl font-bold">
                    {diagnosticReport.summary.authUserCreated ? '✓' : '✗'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${diagnosticReport.summary.publicUserCreated ? 'bg-green-100' : 'bg-red-100'}`}>
                  <p className="text-sm font-medium text-gray-700">Public User</p>
                  <p className="text-2xl font-bold">
                    {diagnosticReport.summary.publicUserCreated ? '✓' : '✗'}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${!diagnosticReport.summary.rlsBlocking ? 'bg-green-100' : 'bg-red-100'}`}>
                  <p className="text-sm font-medium text-gray-700">RLS</p>
                  <p className="text-2xl font-bold">
                    {!diagnosticReport.summary.rlsBlocking ? '✓' : 'BLOCKING'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                >
                  Copy Full Report
                </button>
                <button
                  onClick={() => {
                    setDiagnosticReport(null);
                    setEmail('');
                    setPassword('');
                  }}
                  className="flex-1 py-3 px-6 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold"
                >
                  Run Another Test
                </button>
              </div>

              {/* Full Report */}
              <div className="bg-gray-900 rounded-lg p-6 overflow-auto max-h-96">
                <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
                  {JSON.stringify(diagnosticReport, null, 2)}
                </pre>
              </div>

              <p className="text-sm text-gray-500 text-center">
                Click "Copy Full Report" above and paste the JSON into your chat for analysis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
