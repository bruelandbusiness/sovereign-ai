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

Rate limit headers are included on rate-limited endpoints: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## Auth Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/send-magic-link` | None | Send magic link email (5/hr per IP) |
| GET | `/auth/verify` | None | Verify magic link token, create session |
| GET | `/auth/google` | None | Initiate Google OAuth flow |
| GET | `/auth/google/callback` | None | Google OAuth callback |
| GET | `/auth/session` | Session | Get current session info |
| GET | `/auth/sessions` | Session | List all active sessions |
| DELETE | `/auth/sessions` | Session | Revoke a specific session |
| POST | `/auth/signout` | Session | Sign out (delete session) |
| POST | `/auth/rotate-session` | Session | Rotate session token |
| POST | `/auth/signup-free` | None | Create free account |

## Dashboard Endpoints (Session Required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard/services` | List client's active AI services |
| GET | `/dashboard/kpis` | Key performance indicators |
| GET | `/dashboard/leads` | Lead list with filtering |
| GET | `/dashboard/activity` | Recent activity feed |
| GET | `/dashboard/performance` | Performance metrics |
| GET | `/dashboard/roi` | ROI tracking data |
| GET | `/dashboard/billing` | Billing information |
| GET | `/dashboard/subscription` | Subscription details |
| GET | `/dashboard/reports` | Generated reports |
| GET | `/dashboard/inbox` | Unified inbox |
| GET | `/dashboard/quotes` | Quote management |
| GET | `/dashboard/referrals` | Referral program data |
| GET | `/dashboard/benchmarks` | Industry benchmarks |
| GET | `/dashboard/profile` | Client profile |
| PUT | `/dashboard/profile` | Update client profile |
| GET | `/dashboard/autopilot` | Autopilot status |
| POST | `/dashboard/autopilot` | Toggle autopilot settings |
| GET | `/dashboard/voice` | Voice service settings |
| GET | `/dashboard/webhooks` | Client webhook config |
| GET | `/dashboard/export` | Export data (CSV) |
| GET | `/dashboard/checklist` | Onboarding checklist |
| GET | `/dashboard/attribution` | Revenue attribution |
| GET | `/dashboard/capacity` | Capacity planning |
| GET | `/dashboard/financing` | Financing options |
| GET | `/dashboard/franchise` | Franchise data |
| GET | `/dashboard/invoices` | Invoice history |
| GET | `/dashboard/locations` | Multi-location data |
| GET | `/dashboard/recruiting` | Recruiting pipeline |
| GET | `/dashboard/qbr` | Quarterly business review |
| GET | `/dashboard/support` | Support tickets |

## Payment Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/payments/checkout` | Session | Create Stripe Checkout session |
| GET | `/payments/subscriptions` | Session | Get subscription details |
| POST | `/payments/portal` | Session | Create Stripe Customer Portal session |
| POST | `/payments/upgrade` | Session | Upgrade subscription |
| POST | `/payments/reactivate` | Session | Reactivate canceled subscription |
| POST | `/payments/webhooks/stripe` | Stripe sig | Stripe webhook handler |
| POST | `/payments/webhooks/invoice` | Stripe sig | Invoice webhook handler |
| POST | `/payments/webhooks/products` | Stripe sig | Product sync webhook |

## Lead & Outreach Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/leads/capture` | None | Public lead capture form (10/hr per IP) |
| POST | `/leads/inbound` | Session | Log inbound lead |
| GET | `/leads` | Session | List leads |
| GET | `/leads/stats` | Session | Lead statistics |
| GET | `/outreach/campaigns` | Session | List outreach campaigns |
| GET | `/outreach/sequences` | Session | List outreach sequences |
| POST | `/outreach/enroll` | Session | Enroll prospect in sequence |
| GET | `/outreach/prospects` | Session | List outreach prospects |
| GET | `/outreach/entries` | Session | List outreach entries |
| POST | `/outreach/call` | Session | Initiate outreach call |
| GET | `/outreach/domains` | Session | Domain warmup status |

## Service-Specific Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST | `/services/aeo` | Session | AEO optimization |
| GET/POST | `/services/gbp` | Session | Google Business Profile |
| POST | `/services/estimate` | Session | AI job estimate |
| GET/POST | `/services/referral-program` | Session | Referral program config |
| GET | `/services/[serviceId]/*` | Session | Dynamic service endpoints |

## Admin Endpoints (Admin Role Required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/stats` | Platform-wide statistics |
| GET | `/admin/clients` | List all clients |
| GET | `/admin/agencies` | List agencies |
| GET | `/admin/subscriptions` | All subscriptions |
| GET | `/admin/products` | Product catalog management |
| GET | `/admin/activity` | Platform activity log |
| GET | `/admin/monitoring` | System monitoring |
| GET | `/admin/alerts` | Active alerts |
| GET | `/admin/errors` | Recent errors |
| GET | `/admin/snapshots` | Client snapshots |
| GET | `/admin/support` | Support queue |

## Other Public Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | System health check |
| GET | `/products` | None | Public product listing |
| GET | `/products/[slug]` | None | Product details |
| GET | `/blog` | None | Blog listing |
| GET | `/blog/[slug]` | None | Blog post |
| POST | `/funnel-capture` | None | Funnel lead capture |
| POST | `/exit-capture` | None | Exit intent capture |
| POST | `/social-proof` | None | Social proof data |
| GET | `/knowledge` | None | Knowledge base listing |
| GET | `/knowledge/[slug]` | None | Knowledge base article |
| POST | `/estimate/analyze` | None | Public estimate tool |
| GET | `/find-a-pro` | None | Find a pro directory |
| POST | `/find-a-pro/request` | None | Submit pro request |
| GET | `/partners/[slug]` | None | Partner page |
| POST | `/nps/respond` | None | NPS survey response |
| POST | `/webhooks/telegram` | Telegram sig | Telegram bot webhook |

---

## Request/Response Examples

### 1. Send Magic Link

```bash
POST /api/auth/send-magic-link
Content-Type: application/json

{ "email": "contractor@example.com" }
```

```json
// 200 OK (always returns success to prevent email enumeration)
{ "success": true }
```

### 2. Health Check

```bash
GET /api/health
```

```json
// 200 OK
{
  "status": "ok",
  "version": "0.1.0",
  "timestamp": "2026-03-25T12:00:00.000Z",
  "checks": {
    "database": { "status": "connected", "latencyMs": 12 },
    "memory": { "heapUsedMB": 45, "heapTotalMB": 80, "rssMB": 110, "heapPercent": 56 },
    "uptime": { "seconds": 3600, "human": "1h 0m" }
  }
}
```

### 3. Create Checkout Session

```bash
POST /api/payments/checkout
Cookie: sovereign-session=<token>
Content-Type: application/json

{
  "bundleId": "growth",
  "billingInterval": "monthly"
}
```

```json
// 200 OK
{
  "url": "https://checkout.stripe.com/c/pay/cs_live_...",
  "sessionId": "cs_live_..."
}
```

### 4. Capture Lead (Public)

```bash
POST /api/leads/capture
Content-Type: application/json

{
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "555-0100",
  "source": "website",
  "trade": "plumbing"
}
```

```json
// 200 OK
{ "success": true, "id": "clx..." }
```

### 5. Get Dashboard Services

```bash
GET /api/dashboard/services
Cookie: sovereign-session=<token>
```

```json
// 200 OK
[
  { "serviceId": "seo", "status": "active", "activatedAt": "2026-01-15T00:00:00.000Z" },
  { "serviceId": "content", "status": "active", "activatedAt": "2026-01-15T00:00:00.000Z" },
  { "serviceId": "reviews", "status": "paused", "activatedAt": "2026-02-01T00:00:00.000Z" }
]
```

---

## Cron Jobs

All cron jobs require `Authorization: Bearer <CRON_SECRET>`. Schedules are defined in `vercel.json`.

**High frequency** (every 5-15 min): email-queue, system-health, fsm-sync, orchestration-process, agent-continue, followup-process, outreach-process

**Daily**: content, reviews, email, booking, social, anomaly-detection, enrichment-run, discovery-run, health-score, morning-brief, evening-digest, and others

**Weekly**: weekly-report, weekly-digest, roi-weekly, aeo-check, benchmark-aggregation, lead-cleanup, prospect-discovery

**Monthly**: monthly-report, roi-monthly, seasonal-campaigns, performance-billing, case-study-generation, guarantee-check

**Quarterly**: qbr (Quarterly Business Review)

---

## MCP (Model Context Protocol) Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/mcp/tools` | MCP key | List available MCP tools |
| POST | `/mcp/execute` | MCP key | Execute an MCP tool |
| GET | `/mcp/keys` | Session | Manage MCP API keys |
