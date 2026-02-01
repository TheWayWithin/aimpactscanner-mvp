import { type Page, expect } from '@playwright/test';

const SUPABASE_URL = 'https://pdmtvkcxnqysujnpcnyh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbXR2a2N4bnF5c3VqbnBjbnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODQ3MjAsImV4cCI6MjA2NjQ2MDcyMH0.EJmcxGQwsCsf4uGwNAz_D_DnJxGN2ZV3Doux_FyPtEg';

/**
 * Login helper — authenticates via Supabase signInWithPassword API,
 * then injects the session into localStorage so the app picks it up.
 *
 * Requires the test user to have email/password auth enabled in Supabase.
 * If credentials are invalid, throws an error (callers should test.skip).
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  // Authenticate via Supabase REST API (server-side, before page load)
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok || data.error_code || data.msg) {
    throw new Error(`Supabase login failed: ${data.msg || data.error_description || 'invalid credentials'}`);
  }

  // Navigate to the app first so we can set localStorage on the correct origin
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Inject the Supabase session into localStorage
  await page.evaluate((session) => {
    const storageKey = 'sb-pdmtvkcxnqysujnpcnyh-auth-token';
    localStorage.setItem(storageKey, JSON.stringify(session));
  }, data);

  // Reload the app so it picks up the session
  await page.goto('/#dashboard');
  await page.waitForLoadState('networkidle');

  // Verify we're on an authenticated view (not login)
  await expect(page).not.toHaveURL(/#login/, { timeout: 15_000 });
}
