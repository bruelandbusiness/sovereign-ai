# Sovereign AI -- API Reference

## Overview

All endpoints are under `/api/` and return JSON. The app runs on Next.js App Router.

**Base URL**: `https://trysovereignai.com/api` (prod) or `http://localhost:3000/api` (dev)

### Authentication Methods

| Method | Mechanism | Used By |
|--------|-----------|---------|
| Session cookie | `sovereign-session` HTTP-only cookie | Dashboard, admin routes |
| Cron secret | `Authorization: Bearer <CRON_SECRET>` header | `/api/cron/*` endpoints |
| MCP API key | `Authorization: Bearer mcp_<key>` header | `/api/mcp/*` endpoints |
| Inbound API key | `Authorization: Bearer <INBOUND_LEADS_API_KEY>` header | `/api/leads/inbound` |
| Stripe signature | `Stripe-Signature` header | `/api/payments/webhooks/*` |
| Telegram signature | Request body verification | `/api/webhooks/telegram` |
| None (public) | No auth required | Health, lead capture, webhooks |

### Common Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Validation error (Zod) |
| 401 | Not authenticated |
| 403 | CSRF failure or insufficient permissions |
| 413 | Request body too large (>1MB) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 502 | Backend proxy unreachable |

Rate limit headers are included on rate-limited endpoints: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## Authentication

### `POST /api/auth/send-magic-link`
**Auth:** None
**Rate Limit:** 5/hr per IP (fail-closed)
**Description:** Sends a magic link email for passwordless login. Always returns success to prevent email enumeration.
**Request Body:** `{ email: string }`
**Response:** `{ success: true }`

### `GET /api/auth/verify`
**Auth:** None
**Rate Limit:** 10/hr per IP (fail-closed)
**Description:** Verifies a magic link token from the email link. Creates a session and redirects to `/dashboard` on success, or `/login?error=...` on failure.
**Query Params:** `token` (64-char hex string)
**Response:** 302 redirect

### `GET /api/auth/google`
**Auth:** None
**Rate Limit:** 30/hr per IP
**Description:** Initiates Google OAuth flow. Sets a CSRF state cookie and redirects to Google's consent screen.
**Response:** 302 redirect to Google

### `GET /api/auth/google/callback`
**Auth:** None
**Description:** Handles Google OAuth callback, validates state, creates/finds account, sets session cookie, and redirects to dashboard.
**Response:** 302 redirect

### `POST /api/auth/signup-free`
**Auth:** None
**Rate Limit:** 5/hr per IP (fail-closed)
**Description:** Creates a free account with a client profile. Sends a magic link email. If account already exists, silently sends a login link instead.
**Request Body:** `{ name: string, email: string, businessName: string, vertical?: string }`
**Response:** `{ success: true }`

### `GET /api/auth/session`
**Auth:** Session cookie
**Rate Limit:** 120/hr per IP
**Description:** Returns the current authenticated user's session info including account details and linked client profile.
**Response:** `{ success: true, user: { id, email, name, role, client: { id, businessName, ... } } }`

### `GET /api/auth/sessions`
**Auth:** Session cookie
**Rate Limit:** 60/hr per IP
**Description:** Lists all active sessions for the authenticated user. Marks which session is the current one.
**Response:** `{ success: true, data: { sessions: [{ id, createdAt, lastUsedAt, userAgent, isCurrent, ... }] } }`

### `DELETE /api/auth/sessions`
**Auth:** Session cookie
**Rate Limit:** 30/hr per IP
**Description:** Revokes a specific session by ID.
**Request Body:** `{ sessionId: string }`
**Response:** `{ success: true }`

### `POST /api/auth/signout`
**Auth:** Session cookie
**Rate Limit:** 30/hr per IP
**Description:** Signs out the current session. Clears the session cookie even if the DB delete fails.
**Response:** `{ success: true }`

### `POST /api/auth/rotate-session`
**Auth:** Session cookie
**Rate Limit:** 30/hr per IP
**Description:** Rotates the session token for security. Issues a new token and invalidates the old one.
**Response:** `{ ok: true }`

### `POST /api/auth/accept-terms`
**Auth:** Session cookie
**Rate Limit:** 10/hr per IP
**Description:** Records that the user accepted the terms of service at a specific version. Creates an audit log entry.
**Request Body:** `{ version: string }`
**Response:** `{ success: true, version, acceptedAt }`

---

## Dashboard (Session Required)

All dashboard endpoints require a valid session cookie and return 401 if not authenticated.

### `GET /api/dashboard/services`
**Auth:** Required
**Description:** Lists the client's active AI services with status and activation date.
**Response:** `[{ serviceId, status, activatedAt }]`

### `GET /api/dashboard/kpis`
**Auth:** Required
**Description:** Key performance indicators aggregated across all active services.
**Response:** KPI object with metrics like leads, revenue, reviews, etc.

### `GET /api/dashboard/leads`
**Auth:** Required
**Description:** Paginated lead list with filtering support.
**Query Params:** `page`, `limit`, `status`, `source`
**Response:** `{ data: [...], pagination: { page, limit, total, totalPages } }`

### `GET /api/dashboard/activity`
**Auth:** Required
**Description:** Recent activity feed for the client, paginated.
**Query Params:** `page` (default 1), `limit` (default 20, max 100)
**Response:** `{ data: [{ id, type, title, description, timestamp }], pagination }`

### `GET /api/dashboard/performance`
**Auth:** Required
**Description:** Performance metrics across services.
**Response:** Performance data object

### `GET /api/dashboard/roi`
**Auth:** Required
**Description:** ROI tracking data showing return on investment from services.
**Response:** ROI metrics object

### `GET /api/dashboard/billing`
**Auth:** Required
**Description:** Current billing info: plan, status, monthly amount, active services, trial status.
**Response:** `{ plan, status, monthlyAmount, services: [...] }`

### `GET /api/dashboard/subscription`
**Auth:** Required
**Description:** Subscription details including Stripe sync status.
**Response:** Subscription object

### `GET /api/dashboard/profile`
**Auth:** Required
**Description:** Returns the client's profile data.
**Response:** Client profile object

### `PUT /api/dashboard/profile`
**Auth:** Required
**Description:** Updates the client's profile.
**Request Body:** Profile fields to update
**Response:** Updated profile object

### `GET /api/dashboard/autopilot`
**Auth:** Required
**Description:** Lists recent AI agent executions (autopilot mode) with step counts and status.
**Response:** `[{ id, agentType, status, startedAt, completedAt, totalTokens, stepCount, ... }]`

### `POST /api/dashboard/autopilot`
**Auth:** Required
**Description:** Toggles autopilot settings for AI agent executions.
**Request Body:** Autopilot configuration
**Response:** Updated autopilot settings

### `GET /api/dashboard/benchmarks`
**Auth:** Required
**Description:** Industry benchmarks for the client's vertical plus predictive insights.
**Response:** `{ benchmarks: {...}, insights: [{ type, title, confidence, impact, recommendation, ... }] }`

### `GET /api/dashboard/attribution`
**Auth:** Required
**Description:** Revenue attribution data: ROI by channel, funnel metrics, ad spend, top leads.
**Query Params:** `period` (7d, 30d, 90d)
**Response:** `{ channelROI: [...], funnel: {...}, adCampaigns: [...], topLeadEvents: [...] }`

### `GET /api/dashboard/capacity`
**Auth:** Required
**Description:** Capacity planning: score, open slots, ad spend recommendation, 7-day booking utilization chart.
**Response:** `{ score, openSlots, recommendation, dailyUtilization: [...], upcomingBookings: [...] }`

### `GET /api/dashboard/checklist`
**Auth:** Required
**Description:** Onboarding checklist with step completion status. Auto-seeds default steps on first access.
**Response:** `[{ id, stepKey, label, completed }]`

### `POST /api/dashboard/checklist`
**Auth:** Required
**Description:** Marks an onboarding step as complete/incomplete.
**Request Body:** `{ stepKey: string, completed: boolean }`
**Response:** Updated step

### `GET /api/dashboard/voice`
**Auth:** Required
**Description:** Voice agent dashboard: call history with pagination, search, and stats.
**Query Params:** `page`, `limit`, `search`
**Response:** `{ calls: [...], stats: {...}, pagination }`

### `GET /api/dashboard/invoices`
**Auth:** Required
**Description:** Invoice history with optional status filter and pagination. Supports text-to-pay links.
**Query Params:** `status`, `page`, `limit`
**Response:** Paginated invoice list

### `POST /api/dashboard/invoices`
**Auth:** Required
**Description:** Creates a new invoice and optionally sends a text-to-pay SMS via Twilio.
**Request Body:** Invoice details
**Response:** Created invoice

### `GET /api/dashboard/webhooks`
**Auth:** Required
**Description:** Lists the client's configured webhook endpoints.
**Response:** `[{ id, url, events, secret, active }]`

### `POST /api/dashboard/webhooks`
**Auth:** Required
**Description:** Creates a new webhook endpoint. Auto-generates a signing secret.
**Request Body:** `{ url: string, events: ["lead.created" | "booking.confirmed" | "review.received"] }`
**Response:** Created webhook with secret

### `GET /api/dashboard/support`
**Auth:** Required
**Description:** Lists the client's support tickets.
**Response:** `[{ id, subject, status, priority, createdAt, ... }]`

### `POST /api/dashboard/support`
**Auth:** Required
**Description:** Creates a new support ticket.
**Request Body:** `{ subject: string, description: string, priority?: "low" | "medium" | "high" | "urgent" }`
**Response:** Created ticket

### `GET /api/dashboard/franchise`
**Auth:** Required
**Description:** Franchise intelligence dashboard: locations, KPIs, cross-location comparisons.
**Response:** `{ locations: [...], kpis: {...} }`

### `POST /api/dashboard/franchise`
**Auth:** Required
**Description:** Creates a new franchise location.
**Request Body:** `{ name, city?, state?, address?, zip?, phone?, manager? }`
**Response:** Created location

### `GET /api/dashboard/recruiting`
**Auth:** Required
**Description:** Recruiting pipeline: job postings, KPIs, and applicants.
**Response:** `{ jobs: [...], applicants: [...], kpis: {...} }`

### `POST /api/dashboard/recruiting`
**Auth:** Required
**Description:** Creates a new job posting.
**Request Body:** `{ title, description?, requirements?, compensation?, location?, type? }`
**Response:** Created job posting

### `GET /api/dashboard/qbr`
**Auth:** Required
**Description:** Lists quarterly business review reports for the client.
**Response:** `[{ id, quarter, summary, sentAt, createdAt }]`

### `POST /api/dashboard/data-deletion`
**Auth:** Required
**Description:** GDPR right-to-erasure. Soft-deletes the client account (30-day retention, then purged by cron).
**Request Body:** `{ confirmation: "DELETE MY DATA" }`
**Response:** `{ success: true, purgeAfter: ISO date }`

### `GET /api/dashboard/data-export`
**Auth:** Required
**Rate Limit:** 1/hr per account
**Description:** GDPR data portability. Exports all user data as a downloadable JSON file.
**Response:** JSON file download with all account, lead, service, and invoice data

### `GET /api/dashboard/export-data`
**Auth:** Required
**Rate Limit:** 1/hr per account
**Description:** Alternative data export with system field redaction (strips tokens, internal IDs, etc.).
**Response:** JSON file download

Additional dashboard endpoints: `/reports`, `/inbox`, `/quotes`, `/referrals`, `/locations`, `/financing`.

---

## Payments

### `POST /api/payments/checkout`
**Auth:** Session cookie
**Rate Limit:** 10/hr per IP
**Description:** Creates a Stripe Checkout session for a new subscription. Supports bundles, a-la-carte services, and referral codes.
**Request Body:** `{ bundleId?: string, services?: string[], billingInterval?: "monthly" | "annual", referralCode?: string }`
**Response:** `{ url: "https://checkout.stripe.com/...", sessionId: "cs_live_..." }`

### `GET /api/payments/subscriptions`
**Auth:** Session cookie
**Rate Limit:** 60/hr per IP
**Description:** Returns the current user's subscription details, synced from Stripe for real-time accuracy.
**Response:** `{ subscription: { id, status, bundleId, monthlyAmount, currentPeriodEnd, cancelAtPeriodEnd, ... } }`

### `POST /api/payments/portal`
**Auth:** Session cookie
**Rate Limit:** 10/hr per IP
**Description:** Creates a Stripe Billing Portal session for self-service subscription management.
**Response:** `{ url: "https://billing.stripe.com/..." }`

### `POST /api/payments/upgrade`
**Auth:** Session cookie
**Rate Limit:** 5/hr per IP
**Description:** Upgrades or downgrades the subscription to a different bundle. Uses Stripe proration.
**Request Body:** `{ newBundleId: string, billingInterval?: "monthly" | "annual" }`
**Response:** `{ subscription: { id, status, bundleId, monthlyAmount, currentPeriodEnd } }`

### `POST /api/payments/reactivate`
**Auth:** Session cookie
**Rate Limit:** 10/hr per IP
**Description:** Creates a new checkout session for a previously-canceled customer to reactivate.
**Request Body:** `{ bundleId?: string, services?: string[], billingInterval?: "monthly" | "annual" }`
**Response:** `{ url: "https://checkout.stripe.com/...", sessionId: "..." }`

### `POST /api/payments/refund`
**Auth:** Admin only
**Rate Limit:** 5/hr per IP
**Description:** Creates a Stripe refund for a client. Partial or full refund. Logs audit entry and notifies the client.
**Request Body:** `{ clientId: string, reason: string, amount?: number }`
**Response:** `{ success: true, refundId, amount }`

### `POST /api/payments/webhooks/stripe`
**Auth:** Stripe signature
**Description:** Main Stripe webhook handler. Processes checkout.session.completed, subscription updates, and cancellations. Creates accounts, activates services, sends welcome emails.
**Response:** `{ received: true }`

### `POST /api/payments/webhooks/invoice`
**Auth:** Stripe signature
**Description:** Stripe invoice webhook for text-to-pay payment link completions. Database-backed idempotency.
**Response:** `{ received: true }`

### `POST /api/payments/webhooks/products`
**Auth:** Stripe signature
**Description:** Stripe product/price sync webhook. Keeps the local product catalog in sync with Stripe.
**Response:** `{ received: true }`

---

## Leads & Outreach

### `POST /api/leads/capture`
**Auth:** None (public)
**Rate Limit:** 10/hr per IP
**Description:** Public lead capture form. Creates a lead record with UTM tracking, referral codes, and partner attribution.
**Request Body:** `{ name, email, phone?, source?, trade?, partnerSlug?, referralCode?, utmSource?, utmMedium?, utmCampaign? }`
**Response:** `{ success: true, id: "clx..." }`

### `POST /api/leads/inbound`
**Auth:** Inbound API key (Bearer token)
**Rate Limit:** 60/hr per IP
**Description:** Batch inbound lead import (e.g., from Clay). Supports single or batch mode (up to 100 leads).
**Request Body:** `{ leads: [{ name, email, phone?, trade?, source?, metadata? }] }`
**Response:** `{ success: true, created: number }`

### `GET /api/leads`
**Auth:** Session cookie
**Description:** Paginated lead list. Proxies to backend API.
**Query Params:** `page`, `limit`
**Response:** `{ data: [...], pagination }`

### `GET /api/leads/stats`
**Auth:** Session cookie
**Description:** Lead statistics (counts by stage, source, conversion rates). Cached for 60 seconds.
**Response:** Stats object

### `GET /api/outreach/campaigns`
**Auth:** Admin only
**Description:** Lists outreach campaigns with send stats.
**Response:** Campaign list

### `POST /api/outreach/campaigns`
**Auth:** Admin only
**Description:** Creates a new cold outreach campaign with warmup settings.
**Request Body:** `{ name, fromEmail, fromName, subjectVariants, bodyTemplate, dailySendLimit?, warmupEnabled?, ... }`
**Response:** Created campaign

### `GET /api/outreach/sequences`
**Auth:** Session cookie
**Description:** Lists outreach sequences for the authenticated client.
**Response:** Sequence list

### `POST /api/outreach/enroll`
**Auth:** Session cookie
**Description:** Enrolls a lead or discovered lead in an outreach sequence.
**Request Body:** `{ sequenceId, leadId?, discoveredLeadId?, contactEmail?, contactName? }`
**Response:** Created enrollment entry

### `GET /api/outreach/entries`
**Auth:** Session cookie
**Description:** Lists outreach entries (active, paused, completed, replied). Cursor-based pagination.
**Query Params:** `status`, `cursor`
**Response:** Outreach entry list

### `GET /api/outreach/prospects`
**Auth:** Admin only
**Rate Limit:** 60/hr per IP
**Description:** Lists scraped prospects with filters.
**Response:** Prospect list

### `POST /api/outreach/call`
**Auth:** Admin only
**Description:** Initiates an outbound AI sales call to a prospect via Twilio.
**Request Body:** `{ prospectId: string }`
**Response:** `{ success: true, callSid }`

### `GET /api/outreach/domains`
**Auth:** Session cookie
**Description:** Domain warmup status for client outreach domains.
**Response:** Domain warmup list

---

## Services

### `GET /api/services/aeo`
**Auth:** Session cookie
**Description:** Lists AEO (AI Engine Optimization) content for the client, optionally filtered by type.
**Query Params:** `type`
**Response:** `{ content: [...] }`

### `GET /api/services/gbp`
**Auth:** Session cookie
**Description:** Fetches the client's Google Business Profile info.
**Response:** `{ profile: { ... } }`

### `GET /api/services/estimate`
**Auth:** Session cookie
**Description:** Lists AI photo estimates for the client with pagination and search.
**Query Params:** `page`, `limit`, `status`, `search`
**Response:** Paginated estimate list

### `GET /api/services/referral-program`
**Auth:** Session cookie
**Description:** Returns the client's referral program configuration.
**Response:** `{ enabled, rewardText, rewardAmount, terms }`

### `POST /api/services/referral-program`
**Auth:** Session cookie
**Description:** Updates the referral program configuration.
**Request Body:** Referral program config fields
**Response:** Updated config

---

## Admin (Admin Role Required)

All admin endpoints require `requireAdmin()` which checks for admin role on the session.

### `GET /api/admin/stats`
**Auth:** Admin
**Description:** Platform-wide statistics: total clients, active services, MRR, churn rate, recent signups. Cached for 30 seconds.
**Response:** `{ totalClients, activeServices, subscriptions, recentClients, churnRate, ... }`

### `GET /api/admin/clients`
**Auth:** Admin
**Description:** Lists all clients with search, filtering, and pagination.
**Response:** Paginated client list

### `POST /api/admin/clients`
**Auth:** Admin
**Description:** Creates a new client account with profile.
**Request Body:** `{ email, businessName, ownerName, phone?, city?, state?, vertical?, website? }`
**Response:** Created client

### `GET /api/admin/agencies`
**Auth:** Admin
**Description:** Lists white-label agencies.
**Response:** Agency list

### `POST /api/admin/agencies`
**Auth:** Admin
**Description:** Creates a new white-label agency with branding.
**Request Body:** `{ name, slug, logoUrl?, primaryColor?, accentColor?, customDomain?, starterPrice?, growthPrice?, empirePrice? }`
**Response:** Created agency

### `GET /api/admin/subscriptions`
**Auth:** Admin
**Description:** Lists all subscriptions with client info and MRR breakdown. Paginated.
**Response:** Paginated subscription list with MRR totals

### `PUT /api/admin/subscriptions`
**Auth:** Admin
**Description:** Updates a subscription (status, bundle, amount).
**Request Body:** `{ id, bundleId?, monthlyAmount?, status? }`
**Response:** Updated subscription

### `GET /api/admin/products`
**Auth:** Admin
**Description:** Product catalog management.
**Response:** Product list

### `POST /api/admin/products`
**Auth:** Admin
**Description:** Creates a new product in the catalog.
**Request Body:** `{ name, slug, tagline, tier, category, price, features?, techStack?, ... }`
**Response:** Created product

### `GET /api/admin/activity`
**Auth:** Admin
**Description:** Platform-wide activity log across all clients (last 50 entries).
**Response:** `{ activities: [{ id, type, title, description, client, timestamp }] }`

### `GET /api/admin/audit-log`
**Auth:** Admin
**Description:** Paginated audit log with filters for compliance review.
**Query Params:** `page`, `limit` (max 200), `action`, `accountId`, `from`, `to` (ISO dates)
**Response:** Paginated audit log entries

### `GET /api/admin/monitoring`
**Auth:** Admin
**Description:** System monitoring dashboard: error trends, service health, performance metrics.
**Response:** Monitoring data with daily error trend chart

### `GET /api/admin/alerts`
**Auth:** Admin
**Description:** Lists alert logs, filterable by type/severity/resolved status.
**Response:** Alert log list

### `POST /api/admin/alerts`
**Auth:** Admin
**Description:** Creates a new alert rule or acknowledges an existing alert.
**Request Body:** Create: `{ name, type, config?, enabled? }` or Acknowledge: `{ id }`
**Response:** Created/acknowledged alert

### `GET /api/admin/errors`
**Auth:** Admin
**Description:** Recent errors grouped by message, with severity and occurrence count.
**Response:** Grouped error list

### `POST /api/admin/errors/report`
**Auth:** Admin
**Description:** Reports a client-side error for tracking.
**Request Body:** Error details
**Response:** `{ success: true }`

### `GET /api/admin/cron-status`
**Auth:** Admin
**Description:** Status of all cron jobs: last run time, expected schedule, staleness detection.
**Response:** `{ jobs: [{ path, schedule, lastRun, status, ... }] }`

### `GET /api/admin/snapshots`
**Auth:** Admin
**Description:** Lists snapshot reports (business audits) for the admin. Paginated.
**Response:** Paginated snapshot list

### `POST /api/admin/snapshots`
**Auth:** Admin
**Description:** Creates a new business snapshot/audit report.
**Request Body:** `{ businessName, website?, phone?, email?, vertical?, city?, state? }`
**Response:** Created snapshot

### `GET /api/admin/support`
**Auth:** Admin
**Description:** Support ticket queue across all clients.
**Response:** Ticket list

### `PUT /api/admin/support`
**Auth:** Admin
**Description:** Updates a support ticket (status, reply).
**Request Body:** `{ ticketId, status?, message? }`
**Response:** Updated ticket

### `GET /api/admin/webhooks`
**Auth:** Admin
**Description:** Lists webhook deliveries with status/date filters. Paginated.
**Query Params:** `status`, `dateFrom`, `dateTo`, `page`
**Response:** Paginated delivery list

### `POST /api/admin/webhooks`
**Auth:** Admin
**Description:** Retries a failed/dead-letter webhook delivery.
**Response:** Retry result

---

## Acquisition (Admin)

### `GET /api/acquisition/prospects`
**Auth:** Admin
**Description:** Lists acquisition prospects with filters.
**Response:** Prospect list

### `POST /api/acquisition/prospects`
**Auth:** Admin
**Description:** Creates a new acquisition prospect record.
**Request Body:** `{ businessName, ownerName?, email?, phone?, website?, vertical?, city?, state?, estimatedRevenue?, employeeCount?, source? }`
**Response:** Created prospect

### `GET /api/acquisition/case-studies`
**Auth:** None (public)
**Rate Limit:** 120/hr per IP
**Description:** Lists generated case studies, optionally filtered by vertical.
**Query Params:** `vertical`
**Response:** Case study list

### `POST /api/acquisition/case-studies/generate/[clientId]`
**Auth:** Admin
**Description:** Triggers AI case study generation for a specific client.
**Response:** Generated case study

### `POST /api/acquisition/proposals/generate/[prospectId]`
**Auth:** Admin
**Description:** Generates an AI-powered proposal for a prospect.
**Response:** Generated proposal

### `GET /api/acquisition/proposals/[shareToken]`
**Auth:** None (public via share token)
**Description:** Public proposal view page accessed via a unique share token.
**Response:** Proposal data

---

## Public Endpoints

### `GET /api/health`
**Auth:** None
**Description:** System health check. Checks database, Redis, Stripe, SendGrid, Twilio connectivity. Returns circuit breaker status.
**Response:** `{ status: "ok", checks: { database: { status, latencyMs }, redis, stripe, sendgrid, twilio }, circuitBreakers: {...} }`

### `GET /api/products`
**Auth:** None
**Rate Limit:** 60/hr per IP
**Description:** Public product catalog listing with optional tier/category filtering.
**Query Params:** `tier`, `category`
**Response:** Product list

### `GET /api/blog`
**Auth:** None
**Rate Limit:** 120/hr per IP
**Description:** Blog post listing with category filter and pagination.
**Query Params:** `category`, `page`, `limit` (max 50)
**Response:** `{ posts: [...], pagination }`

### `GET /api/blog/[slug]`
**Auth:** None
**Description:** Single blog post by slug.
**Response:** Blog post object

### `POST /api/contact`
**Auth:** None
**Rate Limit:** 5/hr per IP
**Description:** Public contact form submission. Sends an email notification to the team.
**Request Body:** `{ name, email, phone?, subject: "General" | "Sales" | "Support" | "Partnerships" | "Billing", message }`
**Response:** `{ success: true }`

### `POST /api/funnel-capture`
**Auth:** None
**Rate Limit:** 10/hr per IP
**Description:** Funnel lead capture for gated content (free audit, webinar, playbook, strategy call). Starts a nurture email drip sequence and scores the lead.
**Request Body:** `{ name, email, phone?, business?, trade?, source: "free-audit" | "webinar" | "playbook" | "strategy-call", utmSource?, utmMedium?, utmCampaign? }`
**Response:** `{ success: true, id }`

### `POST /api/exit-capture`
**Auth:** None
**Rate Limit:** 5/hr per IP
**Description:** Exit-intent email capture popup. Creates a lead with source "exit-intent".
**Request Body:** `{ email, clientId? }`
**Response:** `{ success: true }`

### `GET /api/social-proof`
**Auth:** None
**Rate Limit:** 60/hr per IP
**Description:** Returns recent lead signups (last 24h) for the social proof toast. Only shows first name + city for privacy.
**Response:** `{ items: [{ name, source, createdAt }] }`

### `POST /api/estimate/analyze`
**Auth:** None
**Description:** Public AI photo estimate tool. Accepts multipart form data with an image, analyzes it with AI, and returns an estimate range.
**Request Body:** Multipart: `image` (file), `clientId`, `vertical` (hvac/plumbing/roofing/electrical), `customerName?`, `customerEmail?`, `customerPhone?`
**Response:** AI analysis with estimate range

### `GET /api/knowledge`
**Auth:** None
**Rate Limit:** 120/hr per IP
**Description:** Knowledge base article listing with category filter and search. Auto-seeds articles on first access.
**Query Params:** `category`, `search`
**Response:** `{ articles: [...], categories: [...] }`

### `GET /api/find-a-pro`
**Auth:** None
**Rate Limit:** 60/hr per IP
**Description:** Public directory search for service businesses by ZIP code and vertical.
**Query Params:** `zip` (required), `vertical`, `page`, `limit` (max 50)
**Response:** Paginated business list

### `POST /api/find-a-pro/request`
**Auth:** None
**Rate Limit:** 10/hr per IP
**Description:** Homeowner quote request submitted through the Find a Pro directory. Creates a lead for the selected business.
**Request Body:** `{ clientId, name, email, phone?, serviceNeeded?, message? }`
**Response:** `{ success: true }`

### `GET /api/partners/[slug]`
**Auth:** None
**Rate Limit:** 60/hr per IP
**Description:** Public partner/affiliate page by slug.
**Response:** Partner data

### `GET /api/nps/respond`
**Auth:** None
**Rate Limit:** 20/hr per IP
**Description:** Records an NPS survey response via query params (from email link).
**Query Params:** `id`, `score`, `feedback?`
**Response:** `{ success: true }`

---

## Notifications

### `GET /api/notifications`
**Auth:** Session cookie
**Rate Limit:** 60/hr per IP
**Description:** Lists notifications for the authenticated user.
**Response:** Notification list

### `PUT /api/notifications`
**Auth:** Session cookie
**Description:** Marks notifications as read.
**Request Body:** `{ ids?: string[] }` (omit ids to mark all as read)
**Response:** `{ success: true }`

### `DELETE /api/notifications`
**Auth:** Session cookie
**Description:** Dismisses/deletes notifications.
**Request Body:** `{ ids: string[] }`
**Response:** `{ success: true }`

---

## Account

### `DELETE /api/account/delete`
**Auth:** Session cookie
**Rate Limit:** 3/hr per IP
**Description:** GDPR-compliant account deletion. Cascading deletes remove all associated data (client, leads, services, etc.). Clears the session cookie.
**Response:** `{ success: true }`

---

## MCP (Model Context Protocol)

### `GET /api/mcp/tools`
**Auth:** MCP API key
**Description:** Lists all available MCP tools with their input schemas and required scopes.
**Response:** `{ tools: [{ name, description, inputSchema, requiredScope }] }`

### `POST /api/mcp/execute`
**Auth:** MCP API key
**Description:** Executes an MCP tool. Checks scope permissions before execution. Logs usage.
**Request Body:** `{ tool: string, input?: Record<string, unknown> }`
**Response:** Tool execution result

### `GET /api/mcp/keys`
**Auth:** Admin session
**Description:** Lists all MCP API keys.
**Response:** API key list (keys are masked)

### `POST /api/mcp/keys`
**Auth:** Admin session
**Description:** Creates a new MCP API key with scoped permissions.
**Request Body:** `{ name, accountId, scopes: string[], expiresInDays? }`
**Response:** `{ key: "mcp_...", id }` (full key shown only at creation)

---

## Webhooks (External)

### `POST /api/webhooks/telegram`
**Auth:** Telegram signature verification
**Rate Limit:** 60/hr per chatId
**Description:** Telegram bot webhook. Receives messages and executes bot commands.
**Response:** `{ ok: true }`

---

## Cron Jobs

All cron endpoints require `Authorization: Bearer <CRON_SECRET>` and return `{ success: true, ... }` with job-specific metrics. Schedules are defined in `vercel.json`.

### High Frequency (every 5-15 min)

| Path | Schedule | Description |
|------|----------|-------------|
| `/api/cron/email-queue` | */5 * * * * | Processes queued emails (sent, failed, stuck recovery) |
| `/api/cron/orchestration-process` | */5 * * * * | Processes orchestration events |
| `/api/cron/agent-continue` | */10 * * * * | Resumes paused AI agent executions with approved actions |
| `/api/cron/followup-process` | */10 * * * * | Processes due follow-up entries |
| `/api/cron/outreach-process` | */10 * * * * | Processes outreach sequence steps |
| `/api/cron/outreach-send` | */15 * * * * | Sends cold outreach campaign emails (business hours) |
| `/api/cron/fsm-sync` | */15 * * * * | Syncs jobs/customers from FSM platforms (ServiceTitan, etc.) |
| `/api/cron/health-check` | */15 * * * * | Checks service health (DB, Redis, APIs), alerts on failures |

### Daily

| Path | Schedule | Description |
|------|----------|-------------|
| `/api/cron/content` | 0 6 * * * | Generates AI content for scheduled content jobs |
| `/api/cron/enrichment-run` | 0 6 * * * | Enriches unenriched leads and discovered leads (batch of 50) |
| `/api/cron/discovery-run` | 0 6 * * * | Runs lead discovery for clients with active sources |
| `/api/cron/morning-brief` | 0 7 * * * | Sends morning brief digest via Telegram |
| `/api/cron/email` | 0 10 * * * | Processes active drip email campaigns |
| `/api/cron/booking` | 0 12 * * * | Sends booking reminders for next-24-hour appointments |
| `/api/cron/booking-reminders` | 0 12 * * * | SMS + email booking reminders |
| `/api/cron/booking-noshow` | 0 18 * * * | Marks no-show bookings (30-min grace period) |
| `/api/cron/nps` | 0 14 * * * | Sends NPS surveys to clients at 30/90 day milestones |
| `/api/cron/lead-nurture` | 0 9 * * * | Follow-up reminders for leads past their next-contact date |
| `/api/cron/ltv-reminders` | 0 9 * * * | Service reminder emails for upcoming maintenance |
| `/api/cron/churn-check` | 0 10 * * * | Identifies churn-risk clients and sends retention emails |
| `/api/cron/expansion-check` | 0 11 * * * | Identifies upsell opportunities for tier upgrades |
| `/api/cron/abandoned-cart` | 0 10 * * * | Sends recovery emails for abandoned checkout sessions |
| `/api/cron/anomaly-detection` | 0 3 * * * | Detects anomalies across clients, expires stale approvals |
| `/api/cron/cleanup` | 0 3 * * * | Cleans expired sessions, magic links, old queue entries |
| `/api/cron/health-score` | 0 4 * * * | Daily health score calculation for all clients |
| `/api/cron/insight-generation` | 0 5 * * * | AI-generated predictive insights based on benchmarks |
| `/api/cron/evening-digest` | 0 20 * * * | Sends evening digest via Telegram |
| `/api/cron/ads-sync` | 0 2 * * * | Syncs Google Ads + Meta Ads metrics for active campaigns |
| `/api/cron/outreach-warmup` | 0 1 * * * | Resets daily send counts and ramps up warmup limits |
| `/api/cron/outreach-enqueue` | 0 6 * * * | Enqueues qualified prospects for cold outreach |

### Weekly

| Path | Schedule | Description |
|------|----------|-------------|
| `/api/cron/weekly-report` | 0 8 * * 1 | Weekly performance report generation |
| `/api/cron/aeo-check` | 0 4 * * 1 | AEO citation scoring for tracked queries |
| `/api/cron/benchmark-aggregation` | 0 3 * * 1 | Aggregates industry benchmark data |
| `/api/cron/lead-cleanup` | 0 3 * * 0 | Archives stale leads (90+ days, no activity) |
| `/api/cron/prospect-discovery` | 0 5 * * 1 | Discovers new acquisition prospects |
| `/api/cron/compliance-purge` | 0 3 * * 0 | Purges unconverted leads and old contact logs (GDPR) |

### Monthly

| Path | Schedule | Description |
|------|----------|-------------|
| `/api/cron/monthly-report` | 0 8 1 * * | Monthly performance report with MRR/NRR metrics |
| `/api/cron/performance-billing` | 0 2 1 * * | Bills performance plans (charges vs. monthly minimum) |
| `/api/cron/case-study-generation` | 0 6 1 * * | Auto-generates case studies for clients active 90+ days |
| `/api/cron/guarantee-check` | 0 4 1 * * | Checks ROI guarantees, issues credits if targets not met |
