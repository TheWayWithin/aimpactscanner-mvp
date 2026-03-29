#!/usr/bin/env node
/**
 * API Keys Test Suite
 *
 * Tests API key CRUD, authentication, tier gating, and regression.
 * Run against staging backend (or local).
 *
 * Prerequisites:
 *   1. Run: node tests/api/setup-scale-user.js  (one-time)
 *   2. Ensure backend is running (local or deployed)
 *
 * Usage:
 *   node tests/api/api-keys-test.js                    # Default: local backend
 *   API_TEST_STAGING_URL=https://...railway.app node tests/api/api-keys-test.js  # Staging
 */

import { apiTestConfig, getJwtToken, apiRequest } from './api-test-config.js';

// Test state
let scaleToken = null;
let scaleUserId = null;
let growthToken = null;
let createdKeyId = null;
let createdKeyRaw = null;
const results = { passed: 0, failed: 0, skipped: 0, tests: [] };

// ─── Helpers ───────────────────────────────────────────

function log(icon, msg) { console.log(`  ${icon} ${msg}`); }

function record(name, passed, detail = '') {
  results.tests.push({ name, passed, detail });
  if (passed) { results.passed++; log('PASS', name); }
  else { results.failed++; log('FAIL', `${name} — ${detail}`); }
}

function skip(name, reason) {
  results.skipped++;
  results.tests.push({ name, passed: null, detail: reason });
  log('SKIP', `${name} — ${reason}`);
}

// ─── Auth Setup ────────────────────────────────────────

async function setupAuth() {
  console.log('\nBackend: ' + apiTestConfig.backendUrl);

  // Check health
  try {
    const health = await apiRequest('GET', '/health');
    if (!health.ok) throw new Error(`Status ${health.status}`);
    log('OK', `Backend healthy (${health.data?.version || 'unknown'})`);
  } catch (e) {
    console.error(`\nBackend not reachable at ${apiTestConfig.backendUrl}`);
    console.error('Start local backend or set API_TEST_STAGING_URL\n');
    process.exit(1);
  }

  // Get Scale tier JWT
  console.log('\nAuthenticating Scale user...');
  try {
    const s = await getJwtToken(apiTestConfig.scaleUser.email, apiTestConfig.scaleUser.password);
    scaleToken = s.token;
    scaleUserId = s.userId;
    log('OK', `Scale user: ${scaleUserId}`);
  } catch (e) {
    console.error(`Scale user auth failed: ${e.message}`);
    console.error('Run: node tests/api/setup-scale-user.js first');
    process.exit(1);
  }

  // Get Growth tier JWT (for tier gating tests)
  console.log('Authenticating Growth user...');
  try {
    const g = await getJwtToken(apiTestConfig.growthUser.email, apiTestConfig.growthUser.password);
    growthToken = g.token;
    log('OK', `Growth user authenticated`);
  } catch (e) {
    log('WARN', `Growth user auth failed (tier gating tests will skip): ${e.message}`);
  }
}

// ─── Test: Tier Gating ─────────────────────────────────

async function testTierGating() {
  console.log('\n--- Tier Gating ---');

  // Growth user should get 403 on key creation
  if (growthToken) {
    const r = await apiRequest('POST', '/api/keys', {
      token: growthToken,
      body: { name: 'should-fail' },
    });
    record('Growth user cannot create API keys', r.status === 403,
      `Expected 403, got ${r.status}`);

    // Growth user should get 403 listing keys
    const r2 = await apiRequest('GET', '/api/keys', { token: growthToken });
    record('Growth user cannot list API keys', r2.status === 403,
      `Expected 403, got ${r2.status}`);
  } else {
    skip('Growth user cannot create API keys', 'Growth user not available');
    skip('Growth user cannot list API keys', 'Growth user not available');
  }

  // Unauthenticated should get 401
  const r3 = await apiRequest('POST', '/api/keys', { body: { name: 'no-auth' } });
  record('Unauthenticated request returns 401', r3.status === 401,
    `Expected 401, got ${r3.status}`);
}

// ─── Test: Key CRUD ────────────────────────────────────

async function testKeyCrud() {
  console.log('\n--- API Key CRUD ---');

  // Create key
  const create = await apiRequest('POST', '/api/keys', {
    token: scaleToken,
    body: { name: 'Test Key - Regression Suite' },
  });
  record('Create API key returns 201', create.status === 201,
    `Expected 201, got ${create.status}`);
  record('Create returns raw key', create.data?.key?.startsWith('ais_sk_'),
    `Key: ${create.data?.key?.substring(0, 15) || 'missing'}...`);
  record('Create returns key prefix', !!create.data?.prefix,
    `Prefix: ${create.data?.prefix || 'missing'}`);
  record('Create returns warning', !!create.data?.warning,
    `Warning: ${create.data?.warning || 'missing'}`);

  createdKeyId = create.data?.id;
  createdKeyRaw = create.data?.key;

  // List keys
  const list = await apiRequest('GET', '/api/keys', { token: scaleToken });
  record('List API keys returns 200', list.status === 200,
    `Expected 200, got ${list.status}`);
  record('List contains created key', list.data?.keys?.some(k => k.id === createdKeyId),
    `Found ${list.data?.keys?.length || 0} keys`);

  const listedKey = list.data?.keys?.find(k => k.id === createdKeyId);
  record('Listed key has correct name', listedKey?.name === 'Test Key - Regression Suite',
    `Name: ${listedKey?.name}`);
  record('Listed key is active', listedKey?.is_active === true,
    `Active: ${listedKey?.is_active}`);
  record('Listed key has no raw key exposed', !listedKey?.key && !listedKey?.key_hash,
    'No raw key or hash in list response');

  // Validation: empty name
  const emptyName = await apiRequest('POST', '/api/keys', {
    token: scaleToken,
    body: { name: '' },
  });
  record('Empty name returns 400', emptyName.status === 400,
    `Expected 400, got ${emptyName.status}`);

  // Validation: missing name
  const noName = await apiRequest('POST', '/api/keys', {
    token: scaleToken,
    body: {},
  });
  record('Missing name returns 400', noName.status === 400,
    `Expected 400, got ${noName.status}`);
}

// ─── Test: API Key Authentication ──────────────────────

async function testApiKeyAuth() {
  console.log('\n--- API Key Authentication ---');

  if (!createdKeyRaw) {
    skip('API key auth on /health', 'No key created');
    skip('API key auth on /api/analyze', 'No key created');
    return;
  }

  // Use API key to hit health endpoint (no auth required, just verify no crash)
  const health = await apiRequest('GET', '/health', { apiKey: createdKeyRaw });
  record('Health endpoint works with API key header', health.ok,
    `Status: ${health.status}`);

  // Invalid key format
  const badFormat = await apiRequest('GET', '/api/keys', { apiKey: 'not_a_valid_key' });
  record('Invalid key format returns 401', badFormat.status === 401,
    `Expected 401, got ${badFormat.status}`);

  // Revoked/nonexistent key
  const fakeKey = 'ais_sk_0000000000000000000000000000abcd';
  const fakeResp = await apiRequest('POST', '/api/analyze', {
    apiKey: fakeKey,
    body: { url: 'https://example.com', userId: 'test', userTier: 'scale' },
  });
  record('Fake API key returns 401', fakeResp.status === 401,
    `Expected 401, got ${fakeResp.status}`);

  // Valid API key hits analyze endpoint (should get past auth, may fail on analysis itself)
  const analyzeResp = await apiRequest('POST', '/api/analyze', {
    apiKey: createdKeyRaw,
    body: { url: 'https://example.com', userId: scaleUserId, userTier: 'scale' },
  });
  // We expect it gets past auth (not 401/403). Could be 200 or 500 depending on analysis.
  const authPassed = analyzeResp.status !== 401 && analyzeResp.status !== 403;
  record('Valid API key passes auth on /api/analyze', authPassed,
    `Status: ${analyzeResp.status} (auth passed: ${authPassed})`);
}

// ─── Test: Key Revocation ──────────────────────────────

async function testKeyRevocation() {
  console.log('\n--- Key Revocation ---');

  if (!createdKeyId) {
    skip('Revoke API key', 'No key to revoke');
    return;
  }

  // Revoke key
  const revoke = await apiRequest('DELETE', `/api/keys/${createdKeyId}`, { token: scaleToken });
  record('Revoke API key returns 200', revoke.status === 200,
    `Expected 200, got ${revoke.status}`);
  record('Revoke confirms success', revoke.data?.success === true,
    `Success: ${revoke.data?.success}`);

  // Double revoke should fail
  const doubleRevoke = await apiRequest('DELETE', `/api/keys/${createdKeyId}`, { token: scaleToken });
  record('Double revoke returns 400', doubleRevoke.status === 400,
    `Expected 400, got ${doubleRevoke.status}`);

  // Revoked key should show in list as inactive
  const list = await apiRequest('GET', '/api/keys', { token: scaleToken });
  const revokedKey = list.data?.keys?.find(k => k.id === createdKeyId);
  record('Revoked key shows as inactive', revokedKey?.is_active === false,
    `Active: ${revokedKey?.is_active}`);
  record('Revoked key has revoked_at timestamp', !!revokedKey?.revoked_at,
    `Revoked at: ${revokedKey?.revoked_at || 'missing'}`);

  // Revoked key should fail auth
  if (createdKeyRaw) {
    const revokedAuth = await apiRequest('POST', '/api/analyze', {
      apiKey: createdKeyRaw,
      body: { url: 'https://example.com', userId: scaleUserId, userTier: 'scale' },
    });
    record('Revoked key returns 401', revokedAuth.status === 401,
      `Expected 401, got ${revokedAuth.status}`);
  }

  // Revoke nonexistent key
  const fakeRevoke = await apiRequest('DELETE', '/api/keys/00000000-0000-0000-0000-000000000000', {
    token: scaleToken,
  });
  record('Revoke nonexistent key returns 404', fakeRevoke.status === 404,
    `Expected 404, got ${fakeRevoke.status}`);
}

// ─── Test: Key Limit ───────────────────────────────────

async function testKeyLimit() {
  console.log('\n--- Key Limit (max 10) ---');

  // Clean up first - revoke all active keys
  const listBefore = await apiRequest('GET', '/api/keys', { token: scaleToken });
  const activeKeys = listBefore.data?.keys?.filter(k => k.is_active) || [];
  for (const k of activeKeys) {
    await apiRequest('DELETE', `/api/keys/${k.id}`, { token: scaleToken });
  }

  // Create 10 keys
  const keyIds = [];
  for (let i = 0; i < 10; i++) {
    const r = await apiRequest('POST', '/api/keys', {
      token: scaleToken,
      body: { name: `Limit Test Key ${i + 1}` },
    });
    if (r.data?.id) keyIds.push(r.data.id);
  }
  record('Can create 10 API keys', keyIds.length === 10,
    `Created ${keyIds.length}/10`);

  // 11th should fail
  const overflow = await apiRequest('POST', '/api/keys', {
    token: scaleToken,
    body: { name: 'Overflow Key' },
  });
  record('11th key returns 400 (limit reached)', overflow.status === 400,
    `Expected 400, got ${overflow.status}`);
  record('Error code is KEY_LIMIT_REACHED', overflow.data?.code === 'KEY_LIMIT_REACHED',
    `Code: ${overflow.data?.code}`);

  // Clean up
  for (const id of keyIds) {
    await apiRequest('DELETE', `/api/keys/${id}`, { token: scaleToken });
  }
}

// ─── Test: Dual Auth (JWT still works on analyze) ──────

async function testDualAuth() {
  console.log('\n--- Dual Auth Regression ---');

  // JWT auth should still work on analyze endpoint
  const jwtAnalyze = await apiRequest('POST', '/api/analyze', {
    token: scaleToken,
    body: { url: 'https://example.com', userId: scaleUserId, userTier: 'scale' },
  });
  const jwtPassed = jwtAnalyze.status !== 401 && jwtAnalyze.status !== 403;
  record('JWT auth still works on /api/analyze', jwtPassed,
    `Status: ${jwtAnalyze.status}`);

  // JWT auth should still work on health
  const jwtHealth = await apiRequest('GET', '/health', { token: scaleToken });
  record('Health endpoint still works', jwtHealth.ok,
    `Status: ${jwtHealth.status}`);
}

// ─── Run All Tests ─────────────────────────────────────

async function main() {
  console.log('=== AImpactScanner API Keys Test Suite ===');

  await setupAuth();
  await testTierGating();
  await testKeyCrud();
  await testApiKeyAuth();
  await testKeyRevocation();
  await testKeyLimit();
  await testDualAuth();

  // Summary
  console.log('\n=== Results ===');
  console.log(`  Passed:  ${results.passed}`);
  console.log(`  Failed:  ${results.failed}`);
  console.log(`  Skipped: ${results.skipped}`);
  console.log(`  Total:   ${results.tests.length}`);

  if (results.failed > 0) {
    console.log('\nFailed tests:');
    results.tests.filter(t => t.passed === false).forEach(t => {
      console.log(`  FAIL ${t.name}: ${t.detail}`);
    });
    process.exit(1);
  } else {
    console.log('\nAll tests passed!');
  }
}

main().catch(err => {
  console.error('\nTest suite crashed:', err);
  process.exit(1);
});
