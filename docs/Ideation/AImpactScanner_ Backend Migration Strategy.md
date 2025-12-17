# AImpactScanner: Backend Migration Strategy

**Author:** Manus AI
**Date:** December 08, 2025

## 1. Executive Summary

This document outlines the strategic recommendation to migrate the `aimpactscanner.com` backend from Supabase Edge Functions to a dedicated Node.js service hosted on Railway. This move is not merely a technical change but a crucial business enabler. **The primary driver for this migration is the inherent 60-second timeout limitation of serverless functions, which makes supporting the analysis of modern Client-Side Rendered (CSR) websites impossible with the current architecture.**

By migrating to a persistent backend service on Railway, we unlock the ability to run long-running analysis jobs, integrate headless browsers like Puppeteer, and fully serve your target market of SaaS builders and solopreneurs. This migration is the foundational step required to close the application's most significant compatibility gap and secure its long-term viability and growth.

**Recommendation:** Proceed with a phased migration to Railway, starting with a "lift and shift" of existing logic, followed by the implementation of an asynchronous job queue and finally the integration of headless browser capabilities.

---

## 2. Strategic Rationale: Why Migrate from Supabase Edge Functions?

Your decision to consider this migration is strategically sound. While Supabase Edge Functions are excellent for short, stateless tasks, they are fundamentally unsuited for the computationally intensive and long-running process of analyzing modern, JavaScript-heavy websites.

| Aspect | Supabase Edge Functions (Current) | Railway Node.js Service (Proposed) |
| :--- | :--- | :--- |
| **Execution Time** | **Hard 60-second timeout** | Long-running, persistent process (minutes/hours) |
| **Headless Browser** | **Not feasible** due to timeouts and resource limits | **Fully supported** (e.g., Puppeteer, Playwright) |
| **CSR Site Analysis** | **Incompatible**. Fails to see client-rendered content. | **Fully compatible**. Can execute JavaScript. |
| **Processing Model** | Synchronous (request-response) | Asynchronous (job queue model) |
| **Scalability** | Scales on demand for short tasks | Scales by adding more service instances |
| **Cost Model** | Pay-per-invocation | Usage-based (CPU/RAM per hour) |

> The core issue is simple: analyzing a dynamic, client-rendered website requires a tool that can act like a real browser—loading scripts, rendering the page, and waiting for content to appear. This process can easily take more than 60 seconds. The current serverless architecture cannot accommodate this, creating a critical failure point for a large and growing segment of your target market.

Migrating to Railway is the necessary step to build a robust, scalable, and future-proof analysis engine.

---

## 3. Proposed Future-State Architecture on Railway

The proposed architecture decouples the frontend from the backend compute layer while retaining Supabase for its strengths in data and authentication.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                            Future-State Architecture                      │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────┐      HTTPS      ┌──────────────────┐     ┌───────────┐│
│  │ React Frontend  │───────────────▶│  Railway Service   │     │ Supabase  ││
│  │   (Netlify)     │◀───────────────│ (Node.js/Express)  │     │ (Backend) ││
│  └─────────────────┘      (API Calls)└─────────┬─────────┘     └─────┬─────┘│
│                                                │                       │      │
│                                                │ (Job Queue)           │ (DB/Auth)│
│                                                ▼                       │      │
│                                       ┌────────┴────────┐              │      │
│                                       │ Analysis Worker │◀─────────────┘      │
│                                       │ (Puppeteer)     │                     │
│                                       └─────────────────┘                     │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### Key Components:

1.  **React Frontend (Netlify):** Remains unchanged. Its API calls will be updated to point to the new Railway service URL.

2.  **Supabase (Database & Auth):** **Continue to use Supabase** for what it excels at: PostgreSQL database, user authentication (OAuth, Magic Links), and storage. This minimizes disruption and leverages your existing data structure.

3.  **Railway Backend Service (Node.js/Express):** This is the new core of your application. It will be a persistent Node.js server that:
    *   Exposes a REST API for the frontend.
    *   Handles business logic, user validation, and Stripe webhooks.
    *   Manages an asynchronous job queue for analysis tasks.

4.  **Analysis Worker (with Puppeteer):** This is the workhorse. It runs within the Railway service and:
    *   Pulls analysis jobs from the queue.
    *   Launches a headless browser (Puppeteer) to visit the target URL.
    *   Executes JavaScript and waits for the page to fully render.
    *   Performs the 27-factor analysis on the final, rendered HTML.
    *   Updates the Supabase database with the results.

---

## 4. Phased Migration Plan

A phased approach will ensure a smooth transition with minimal downtime and risk.

### Phase 1: Lift & Shift (1-2 Weeks)

**Goal:** Replicate the current functionality on Railway to validate the new architecture.

1.  **Create a Node.js/Express App:** Set up a new project on Railway linked to a GitHub repository.
2.  **Migrate Existing Logic:** Port the Deno code from your Supabase Edge Functions (`analyze-website`, `create-portal-session`, etc.) to Node.js controllers in the Express app.
3.  **Connect to Supabase:** Use the `supabase-js` library within the Node.js app to connect to your existing Supabase database and auth. Store Supabase URL and service role key as environment variables in Railway.
4.  **Update Frontend:** Change the API endpoints in your React app to call the new Railway service instead of the Supabase Edge Functions.
5.  **Test and Deploy:** Thoroughly test to ensure the application behaves exactly as it did before. At this point, you have removed the 60-second timeout constraint but haven't added new features.

### Phase 2: Implement Asynchronous Job Processing (1 Week)

**Goal:** Decouple the analysis task from the initial API request for a better user experience.

1.  **Set up a Job Queue:** For simplicity, you can start with a simple database-backed queue. Create a `jobs` table in your Supabase database.
2.  **Modify API Endpoint:** When a user requests an analysis, the `/analyze` endpoint will now:
    *   Create a new record in the `jobs` table with a `pending` status.
    *   Immediately return a `jobId` to the frontend.
3.  **Create a Worker:** Implement a background process in your Node.js service that periodically polls the `jobs` table for `pending` jobs.
4.  **Update Frontend:** The frontend will now poll a new `/analysis-status/:jobId` endpoint to get progress updates, which the backend reads from the `analysis_progress` table.

### Phase 3: Integrate Headless Browser (2 Weeks)

**Goal:** Add CSR compatibility to the analysis engine.

1.  **Add Puppeteer:** Install the `puppeteer` library in your Node.js service.
2.  **Implement Hybrid Logic:** In your analysis worker, implement the detection logic:
    *   First, `fetch` the page's initial HTML.
    *   If the content is rich (SSR/SSG), use the fast, direct parsing method.
    *   If the content is a sparse shell (CSR), launch Puppeteer to render the page fully before parsing.
3.  **Refine Analysis Logic:** Adapt your 27-factor analysis to work with the HTML content provided by Puppeteer.
4.  **Test Extensively:** Test against a wide range of websites (React SPAs, Next.js, WordPress, etc.) to ensure robust performance.

---

## 5. Recommendation

**Migrating your backend to a persistent service on Railway is the correct and necessary strategic decision.** It directly addresses the primary technical roadblock preventing `aimpactscanner.com` from serving its core market of modern web developers and SaaS builders.

By following the phased plan outlined above, you can de-risk the migration, maintain service continuity, and incrementally build towards a more powerful and scalable platform. This move not only solves the immediate problem of CSR compatibility but also provides a solid foundation for any future feature development that requires long-running or computationally intensive background tasks.
