# Sprint 11: Webhook Management UI

## Status: Planning

## Goal

Build a frontend dashboard for Scale tier users to manage their webhooks — create endpoints, select events, view delivery history, and test deliveries. The backend CRUD API already exists from Sprint 10 (API-2).

## Context

- Backend: `backend/src/routes/webhooks.ts` — 7 endpoints (POST, GET, GET/:id, PUT/:id, DELETE/:id, POST/:id/test, GET/:id/deliveries)
- Service: `backend/src/services/webhooks.ts` — HMAC signing, delivery, retry logic
- Tier: Scale only ($39.95/mo)
- Sprint 10 reference: `sprints/sprint-10-benchmark-improvement.md` (API-2 section)

---

### Task 1: WebhookManager component
**File**: `src/components/WebhookManager.jsx`
**What**: Full webhook management panel for the account dashboard

- [ ] List existing webhooks with status (active/inactive), URL, subscribed events
- [ ] "Add Webhook" form — URL input, event checkboxes (scan.complete, llmstxt.drift_detected, monitor.citation_found, monitor.citation_lost), save button
- [ ] Edit webhook — inline edit URL, toggle events, activate/deactivate
- [ ] Delete webhook — confirmation dialog, then remove
- [ ] Test webhook — "Send Test" button per webhook, show success/failure response
- [ ] Delivery history — expandable section per webhook showing last 10 deliveries with status code, timestamp, response time
- [ ] Empty state — "No webhooks configured. Webhooks let you receive real-time notifications when scans complete or citations change."
- [ ] Scale tier gate — show upgrade CTA for non-Scale users

### Task 2: Integrate into account dashboard
**File**: `src/components/SimpleAccountDashboard.jsx`
**What**: Add WebhookManager to the account dashboard for Scale tier users

- [ ] Import and render WebhookManager component
- [ ] Show only for Scale tier (alongside existing ApiKeysSection)
- [ ] Tab or section label: "Webhooks"

### Task 3: API client functions
**File**: `src/lib/railwayApi.js`
**What**: Add frontend API functions for webhook management

- [ ] `createWebhook(url, events)` — POST /api/webhooks
- [ ] `listWebhooks()` — GET /api/webhooks
- [ ] `updateWebhook(id, updates)` — PUT /api/webhooks/:id
- [ ] `deleteWebhook(id)` — DELETE /api/webhooks/:id
- [ ] `testWebhook(id)` — POST /api/webhooks/:id/test
- [ ] `getDeliveryHistory(id)` — GET /api/webhooks/:id/deliveries

---

## Notes

- Match existing dashboard design patterns (see ApiKeysSection.jsx for Scale-tier feature precedent)
- Webhook secret shown only on creation (same pattern as API keys)
- Events use human-readable labels in UI: "Scan Complete", "LLMs.txt Drift Detected", "New Citation", "Citation Lost"
