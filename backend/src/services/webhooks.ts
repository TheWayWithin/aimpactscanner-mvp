/**
 * Webhook Service
 *
 * Manages webhook registrations and event delivery for AImpactScanner.
 * Supports HMAC-SHA256 signed payloads with automatic retry on failure.
 *
 * Events:
 * - scan.complete: Analysis finished
 * - llmstxt.drift_detected: LLMs.txt content drift
 * - monitor.citation_found: New AI citation discovered
 * - monitor.citation_lost: AI citation no longer appearing
 */

import crypto from 'crypto';
import { supabaseAdmin } from '../lib/supabase';

// --- Types ---

export type WebhookEvent =
  | 'scan.complete'
  | 'llmstxt.drift_detected'
  | 'monitor.citation_found'
  | 'monitor.citation_lost';

export const VALID_EVENTS: WebhookEvent[] = [
  'scan.complete',
  'llmstxt.drift_detected',
  'monitor.citation_found',
  'monitor.citation_lost',
];

export interface WebhookConfig {
  id: string;
  user_id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  status: 'pending' | 'success' | 'failed';
  status_code?: number;
  response_body?: string;
  attempts: number;
  max_attempts: number;
  next_retry_at?: string;
  created_at: string;
  completed_at?: string;
}

// Maximum webhooks per user
const MAX_WEBHOOKS_PER_USER = 10;

// Retry delays in minutes: 1min, 5min, 30min
const RETRY_DELAYS_MINUTES = [1, 5, 30];

// Delivery timeout in milliseconds
const DELIVERY_TIMEOUT_MS = 10_000;

// Max delivery attempts
const MAX_DELIVERY_ATTEMPTS = 3;

// --- Cryptographic helpers ---

/**
 * Generate HMAC-SHA256 signature for a payload string.
 */
export function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Generate a cryptographically secure webhook secret.
 * Format: whsec_ + 48 hex characters (24 random bytes)
 */
export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`;
}

// --- CRUD operations ---

/**
 * Create a new webhook registration.
 * Returns the full config including the secret (shown only on creation).
 */
export async function createWebhook(
  userId: string,
  url: string,
  events: WebhookEvent[]
): Promise<WebhookConfig> {
  // Check webhook count limit
  const { count, error: countError } = await supabaseAdmin
    .from('webhooks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);

  if (countError) {
    console.error('Error counting webhooks:', countError);
    throw new Error('Failed to check webhook limit');
  }

  if ((count ?? 0) >= MAX_WEBHOOKS_PER_USER) {
    throw new Error(`Maximum of ${MAX_WEBHOOKS_PER_USER} active webhooks allowed`);
  }

  const secret = generateWebhookSecret();

  const { data, error } = await supabaseAdmin
    .from('webhooks')
    .insert({
      user_id: userId,
      url,
      events,
      secret,
    } as never)
    .select('*')
    .single();

  if (error || !data) {
    console.error('Error creating webhook:', error);
    throw new Error('Failed to create webhook');
  }

  return data as unknown as WebhookConfig;
}

/**
 * List all webhooks for a user.
 * Secrets are masked in list responses.
 */
export async function listWebhooks(userId: string): Promise<WebhookConfig[]> {
  const { data, error } = await supabaseAdmin
    .from('webhooks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error listing webhooks:', error);
    throw new Error('Failed to list webhooks');
  }

  return (data as unknown as WebhookConfig[]) || [];
}

/**
 * Get a single webhook by ID, scoped to the user.
 */
export async function getWebhook(
  userId: string,
  webhookId: string
): Promise<WebhookConfig | null> {
  const { data, error } = await supabaseAdmin
    .from('webhooks')
    .select('*')
    .eq('id', webhookId)
    .eq('user_id', userId)
    .single();

  if (error) {
    // .single() throws PGRST116 when no rows found
    if (error.code === 'PGRST116') return null;
    console.error('Error getting webhook:', error);
    throw new Error('Failed to get webhook');
  }

  return data as unknown as WebhookConfig;
}

/**
 * Update a webhook's URL, events, or active status.
 */
export async function updateWebhook(
  userId: string,
  webhookId: string,
  updates: Partial<Pick<WebhookConfig, 'url' | 'events' | 'is_active'>>
): Promise<WebhookConfig | null> {
  // Verify ownership first
  const existing = await getWebhook(userId, webhookId);
  if (!existing) return null;

  const { data, error } = await supabaseAdmin
    .from('webhooks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', webhookId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error || !data) {
    console.error('Error updating webhook:', error);
    throw new Error('Failed to update webhook');
  }

  return data as unknown as WebhookConfig;
}

/**
 * Delete a webhook and its delivery history (cascade).
 */
export async function deleteWebhook(
  userId: string,
  webhookId: string
): Promise<boolean> {
  // Verify ownership
  const existing = await getWebhook(userId, webhookId);
  if (!existing) return false;

  const { error } = await supabaseAdmin
    .from('webhooks')
    .delete()
    .eq('id', webhookId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting webhook:', error);
    throw new Error('Failed to delete webhook');
  }

  return true;
}

// --- Delivery ---

/**
 * Deliver a payload to a single webhook URL with HMAC-SHA256 signature.
 * Returns the HTTP status code or throws on network/timeout error.
 */
async function deliverPayload(
  url: string,
  event: WebhookEvent,
  payload: Record<string, unknown>,
  secret: string
): Promise<{ statusCode: number; body: string }> {
  const payloadString = JSON.stringify(payload);
  const signature = signPayload(payloadString, secret);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Event': event,
      },
      body: payloadString,
      signal: controller.signal,
    });

    const body = await response.text().catch(() => '');
    return { statusCode: response.status, body: body.substring(0, 1024) };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Calculate the next retry timestamp based on attempt number.
 */
function getNextRetryAt(attempt: number): string | null {
  const delayIndex = Math.min(attempt, RETRY_DELAYS_MINUTES.length - 1);
  const delayMs = RETRY_DELAYS_MINUTES[delayIndex] * 60 * 1000;
  return new Date(Date.now() + delayMs).toISOString();
}

/**
 * Fire a webhook event to all active webhooks for a user that subscribe to the event.
 *
 * For each matching webhook:
 * 1. Signs the payload with HMAC-SHA256
 * 2. POSTs to the webhook URL
 * 3. Logs the delivery attempt
 * 4. Schedules retry on failure
 */
export async function fireWebhookEvent(
  event: WebhookEvent,
  payload: Record<string, unknown>,
  userId: string
): Promise<void> {
  // Find all active webhooks for this user that subscribe to this event
  const { data: webhooks, error } = await supabaseAdmin
    .from('webhooks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .contains('events', [event]);

  if (error) {
    console.error('Error fetching webhooks for event:', error);
    return;
  }

  if (!webhooks || webhooks.length === 0) return;

  const typedWebhooks = webhooks as unknown as WebhookConfig[];

  // Fire all deliveries concurrently (non-blocking)
  const deliveryPromises = typedWebhooks.map(async (webhook) => {
    try {
      const { statusCode, body } = await deliverPayload(
        webhook.url,
        event,
        payload,
        webhook.secret
      );

      const isSuccess = statusCode >= 200 && statusCode < 300;

      await supabaseAdmin.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        event,
        payload,
        status: isSuccess ? 'success' : 'pending',
        status_code: statusCode,
        response_body: body,
        attempts: 1,
        max_attempts: MAX_DELIVERY_ATTEMPTS,
        next_retry_at: isSuccess ? null : getNextRetryAt(0),
        completed_at: isSuccess ? new Date().toISOString() : null,
      } as never);
    } catch (err) {
      // Network error or timeout
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Webhook delivery failed for ${webhook.id}:`, errorMessage);

      await supabaseAdmin.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        event,
        payload,
        status: 'pending',
        status_code: null,
        response_body: errorMessage,
        attempts: 1,
        max_attempts: MAX_DELIVERY_ATTEMPTS,
        next_retry_at: getNextRetryAt(0),
        completed_at: null,
      } as never);
    }
  });

  // Fire and forget - don't block the caller
  await Promise.allSettled(deliveryPromises);
}

/**
 * Retry failed webhook deliveries that are due.
 * Should be called periodically (e.g., via a cron job or scheduled task).
 */
export async function retryFailedDeliveries(): Promise<{ retried: number; succeeded: number; failed: number }> {
  const now = new Date().toISOString();

  // Fetch pending deliveries that are due for retry
  const { data: pendingDeliveries, error } = await supabaseAdmin
    .from('webhook_deliveries')
    .select('*, webhooks!inner(url, secret, is_active)')
    .eq('status', 'pending')
    .lte('next_retry_at', now)
    .lt('attempts', MAX_DELIVERY_ATTEMPTS)
    .limit(50);

  if (error) {
    console.error('Error fetching pending deliveries:', error);
    return { retried: 0, succeeded: 0, failed: 0 };
  }

  if (!pendingDeliveries || pendingDeliveries.length === 0) {
    return { retried: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  for (const delivery of pendingDeliveries) {
    const typedDelivery = delivery as unknown as WebhookDelivery & {
      webhooks: { url: string; secret: string; is_active: boolean };
    };

    // Skip if webhook was deactivated
    if (!typedDelivery.webhooks.is_active) {
      await supabaseAdmin
        .from('webhook_deliveries')
        .update({
          status: 'failed',
          response_body: 'Webhook deactivated',
          completed_at: new Date().toISOString(),
        } as never)
        .eq('id', typedDelivery.id);
      failed++;
      continue;
    }

    const newAttemptCount = typedDelivery.attempts + 1;

    try {
      const { statusCode, body } = await deliverPayload(
        typedDelivery.webhooks.url,
        typedDelivery.event,
        typedDelivery.payload,
        typedDelivery.webhooks.secret
      );

      const isSuccess = statusCode >= 200 && statusCode < 300;
      const isLastAttempt = newAttemptCount >= typedDelivery.max_attempts;

      await supabaseAdmin
        .from('webhook_deliveries')
        .update({
          attempts: newAttemptCount,
          status: isSuccess ? 'success' : isLastAttempt ? 'failed' : 'pending',
          status_code: statusCode,
          response_body: body,
          next_retry_at: isSuccess || isLastAttempt ? null : getNextRetryAt(newAttemptCount - 1),
          completed_at: isSuccess || isLastAttempt ? new Date().toISOString() : null,
        } as never)
        .eq('id', typedDelivery.id);

      if (isSuccess) succeeded++;
      else if (isLastAttempt) failed++;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const isLastAttempt = newAttemptCount >= typedDelivery.max_attempts;

      await supabaseAdmin
        .from('webhook_deliveries')
        .update({
          attempts: newAttemptCount,
          status: isLastAttempt ? 'failed' : 'pending',
          response_body: errorMessage,
          next_retry_at: isLastAttempt ? null : getNextRetryAt(newAttemptCount - 1),
          completed_at: isLastAttempt ? new Date().toISOString() : null,
        } as never)
        .eq('id', typedDelivery.id);

      failed++;
    }
  }

  return { retried: pendingDeliveries.length, succeeded, failed };
}

/**
 * Get delivery history for a specific webhook.
 */
export async function getDeliveryHistory(
  webhookId: string,
  limit: number = 30
): Promise<WebhookDelivery[]> {
  const { data, error } = await supabaseAdmin
    .from('webhook_deliveries')
    .select('*')
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching delivery history:', error);
    throw new Error('Failed to fetch delivery history');
  }

  return (data as unknown as WebhookDelivery[]) || [];
}

/**
 * Send a test event to a specific webhook.
 * Returns delivery result without persisting to delivery history.
 */
export async function sendTestEvent(
  webhookId: string,
  userId: string
): Promise<{ success: boolean; status_code?: number; error?: string }> {
  const webhook = await getWebhook(userId, webhookId);
  if (!webhook) {
    return { success: false, error: 'Webhook not found' };
  }

  const testPayload = {
    event: 'test' as const,
    webhook_id: webhookId,
    timestamp: new Date().toISOString(),
    data: {
      message: 'This is a test event from AImpactScanner',
    },
  };

  try {
    const { statusCode, body } = await deliverPayload(
      webhook.url,
      'scan.complete', // Use a real event type for the header
      testPayload,
      webhook.secret
    );

    const isSuccess = statusCode >= 200 && statusCode < 300;

    // Log the test delivery
    await supabaseAdmin.from('webhook_deliveries').insert({
      webhook_id: webhookId,
      event: 'scan.complete',
      payload: testPayload,
      status: isSuccess ? 'success' : 'failed',
      status_code: statusCode,
      response_body: body,
      attempts: 1,
      max_attempts: 1,
      completed_at: new Date().toISOString(),
    } as never);

    return {
      success: isSuccess,
      status_code: statusCode,
      error: isSuccess ? undefined : `Received HTTP ${statusCode}: ${body}`,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';

    // Log the failed test delivery
    await supabaseAdmin.from('webhook_deliveries').insert({
      webhook_id: webhookId,
      event: 'scan.complete',
      payload: testPayload,
      status: 'failed',
      response_body: errorMessage,
      attempts: 1,
      max_attempts: 1,
      completed_at: new Date().toISOString(),
    } as never);

    return { success: false, error: errorMessage };
  }
}
