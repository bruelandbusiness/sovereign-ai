t# Sovereign AI -- API Reference

## Overview

Sovereign AI exposes a Next.js App Router API under `/api/`. All endpoints return JSON (Content-Type: `application/json`) unless noted otherwise.

**Base URL**

```
Production:  https://<your-domain>/api
Development: http://localhost:3000/api
```

**Authentication methods** (three types):

| Method | Mechanism | Used by |
|--------|-----------|---------|
| Session cookie | `sovereign-session` HTTP-only cookie | Dashboard, admin, and authenticated client routes |
| Cron secret | `Authorization: Bearer <CRON_SECRET>` header | All `/api/cron/*` endpoints |
| MCP API key | `Authorization: Bearer mcp_<64-hex-chars>` header | `/api/mcp/*` endpoints |

**CSRF protection** applies to all mutation methods (POST, PUT, DELETE, PATCH). The middleware validates that the `Origin` or `Referer` header matches `NEXT_PUBLIC_APP_URL`. Exempt paths include inbound webhooks and public embed endpoints (see Webhooks section).

**Rate limiting** uses Upstash Redis in production (sliding window) with an in-memory fallback in development. Limits are per-IP unless stated otherwise.

**Standard error format**

```json
{
  "error": "Human-readable error message"
}
```

Validation errors include an additional `details` field:

```json
{
  "error": "Validation failed",
  "details": {
    "email": ["Invalid email address"]
  }
}
```

**HTTP status codes**

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Authentication required |
| 403 | Forbidden / CSRF failure / insufficient scope |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 503 | Service unavailable (health check DB failure) |

**Security headers** set on every response:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`
- `Content-Security-Policy` with per-request nonce
- `x-request-id` correlation header (sanitized, 1-128 alphanumeric chars)

---

## Quick Start

This section walks through the most common developer workflow: authenticate, create a lead, send a review request, and check dashboard KPIs.

### Step 1: Authenticate (Magic Link Flow)

Request a magic link email:

```bash
curl -X POST https://your-domain.com/api/auth/send-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "owner@mybusiness.com"}'
```

```json
{
  "success": true
}
```

The user receives an email with a link like `https://your-domain.com/api/auth/verify?token=abc123...`. Clicking it sets a `sovereign-session` HTTP-only cookie (valid for 14 days). All subsequent requests use this cookie automatically.

Verify your session is active:

```bash
curl https://your-domain.com/api/auth/session \
  -H "Cookie: sovereign-session=<session-token>"
```

```json
{
  "user": {
    "id": "acc_01HX...",
    "email": "owner@mybusiness.com",
    "name": "Jane Smith",
    "role": "client",
    "client": {
      "id": "cli_01HX...",
      "businessName": "Smith Plumbing",
      "ownerName": "Jane Smith",
      "vertical": "plumbing",
      "city": "Austin",
      "state": "TX"
    }
  }
}
```

### Step 2: Create a Lead

Use the booking widget to create a lead (public, no auth required):

```bash
curl -X POST https://your-domain.com/api/services/booking/book \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "cli_01HX...",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+15125551234",
    "serviceType": "Water heater repair",
    "startsAt": "2026-03-25T14:00:00.000Z",
    "endsAt": "2026-03-25T15:00:00.000Z"
  }'
```

```json
{
  "id": "bk_01HX...",
  "clientId": "cli_01HX...",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+15125551234",
  "serviceType": "Water heater repair",
  "startsAt": "2026-03-25T14:00:00.000Z",
  "endsAt": "2026-03-25T15:00:00.000Z",
  "status": "confirmed",
  "notes": null,
  "createdAt": "2026-03-20T10:30:00.000Z"
}
```

This also creates a lead record automatically with `source: "booking"` and `status: "appointment"`.

### Step 3: Send a Review Request

After completing the job, send a review request (requires session auth):

```bash
curl -X POST https://your-domain.com/api/services/reviews/campaigns \
  -H "Content-Type: application/json" \
  -H "Cookie: sovereign-session=<session-token>" \
  -d '{
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+15125551234",
    "reviewUrl": "https://g.page/r/smith-plumbing/review"
  }'
```

```json
{
  "id": "rc_01HX...",
  "name": "Review request for John Doe",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+15125551234",
  "status": "pending",
  "reviewUrl": "https://g.page/r/smith-plumbing/review",
  "sentAt": null,
  "remindedAt": null,
  "completedAt": null,
  "rating": null,
  "createdAt": "2026-03-20T11:00:00.000Z",
  "updatedAt": "2026-03-20T11:00:00.000Z"
}
```

The cron job at `/api/cron/reviews` (daily 9 AM) processes pending campaigns and sends the review request email.

### Step 4: Check Dashboard KPIs

```bash
curl https://your-domain.com/api/dashboard/kpis \
  -H "Cookie: sovereign-session=<session-token>"
```

```json
[
  {
    "label": "Leads This Month",
    "value": 42,
    "change": "+15%",
    "changeType": "positive"
  },
  {
    "label": "Active Services",
    "value": 8,
    "subtext": "of 16 available"
  },
  {
    "label": "Avg Review Rating",
    "value": "4.8",
    "subtext": "24 total reviews"
  },
  {
    "label": "Chatbot Conversations",
    "value": 156,
    "subtext": "this month"
  }
]
```

---

## Authentication

### Session-Based Auth

Sovereign AI uses **passwordless magic-link authentication**.

1. Client sends email to `POST /api/auth/send-magic-link`.
2. Server generates a cryptographically random 32-byte token, stores it with a 15-minute TTL, and emails a link to `/api/auth/verify?token=<token>`.
3. User clicks the link; `GET /api/auth/verify` atomically claims the token, creates a session, and sets the `sovereign-session` cookie.
4. Session cookie properties: `httpOnly`, `secure` (production), `sameSite=lax`, `path=/`, `maxAge=14 days`.
5. Sessions are automatically rotated (new token issued) after 1 hour via `x-session-needs-rotation` middleware signal and the `POST /api/auth/rotate-session` endpoint.
6. Welcome magic links (created from Stripe webhook flow) have a 48-hour TTL.

**Session object** includes nested `account -> client -> subscription` for authorization decisions.

**Middleware protections:**
- `/dashboard/*` and `/api/dashboard/*` require a session cookie (401 for API, redirect for pages).
- `/admin/*` and `/api/admin/*` require a session cookie at middleware level; admin role is verified server-side in each route handler.
- Logged-in users visiting `/login` are redirected to `/dashboard`.

### Cron Authentication

All `/api/cron/*` endpoints verify the request using `verifyCronSecret()`:

```
Authorization: Bearer <CRON_SECRET>
```

- Uses constant-time comparison (`timingSafeEqual`) to prevent timing attacks.
- In development without `CRON_SECRET` set, requests are allowed without verification.
- In production without `CRON_SECRET`, returns `500 CRON_SECRET not configured`.

### MCP API Key Auth

MCP (Model Context Protocol) endpoints use API keys with the format `mcp_<64-hex-chars>`.

```
Authorization: Bearer mcp_<64-hex-chars>
```

- Keys are stored as SHA-256 hashes; raw keys are only shown once at creation.
- Constant-time hash comparison prevents timing attacks.
- Keys support expiration (`expiresAt`) and revocation (`revokedAt`).
- Rate limited to **100 requests per minute** per API key (in-memory counter).
- `lastUsedAt` is updated on each request (fire-and-forget).

**Valid scopes:**

| Scope | Description |
|-------|-------------|
| `client.read` | Read client data (leads, metrics) |
| `client.write` | Write client data |
| `intelligence.read` | Read benchmarks and insights |
| `agency.read` | Read agency client list |
| `agency.write` | Write agency data |
| `*` | Wildcard -- grants all scopes |

**Auth failure reasons:**

| Reason | HTTP Status | Description |
|--------|-------------|-------------|
| `invalid_key` | 401 | Key missing, malformed, or not found |
| `revoked` | 403 | Key has been revoked |
| `expired` | 403 | Key has passed its expiration date |
| `rate_limited` | 429 | Per-key rate limit exceeded (includes `Retry-After` header) |

---

## Endpoints

### Health

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/health` | GET | None | 60/hr/IP | Health check; verifies database connectivity |

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-03-19T12:00:00.000Z"
}
```

---

### Auth

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/auth/send-magic-link` | POST | None | 10/hr/IP (route) + 5/min/IP (middleware) | Send a magic link email |
| `/api/auth/verify` | GET | None | 10/hr/IP | Verify magic link token and create session |
| `/api/auth/session` | GET | Cookie | 60/hr/IP | Get current session user info |
| `/api/auth/signout` | POST | Cookie | 20/hr/IP | Destroy session and clear cookie |
| `/api/auth/rotate-session` | POST | Cookie | 30/hr/IP | Rotate session token |
| `/api/auth/signup-free` | POST | None | 5/hr/IP | Create free trial account |

#### POST /api/auth/send-magic-link

**Request:**

```json
{
  "email": "string (required, valid email, max 254 chars)"
}
```

**Response (200):**

```json
{
  "success": true
}
```

#### POST /api/auth/signup-free

**Request:**

```json
{
  "name": "string (required, 2-100 chars)",
  "email": "string (required, valid email)",
  "businessName": "string (required, 2-200 chars)",
  "vertical": "string (optional)"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Account created. Check your email for a login link.",
  "trialEndsAt": "2026-04-02T12:00:00.000Z"
}
```

Creates an account, client, trial subscription (14 days), and three free-tier services (chatbot, CRM, analytics). Returns identical response shape for existing accounts to prevent account enumeration.

#### GET /api/auth/session

**Response (200):**

```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string | null",
    "role": "client | admin",
    "client": {
      "id": "string",
      "businessName": "string",
      "ownerName": "string",
      "vertical": "string | null",
      "city": "string | null",
      "state": "string | null"
    }
  }
}
```

---

### Dashboard

All dashboard endpoints require session cookie authentication and a linked client record.

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/dashboard/kpis` | GET | Session | -- | Key performance indicators |
| `/api/dashboard/leads` | GET | Session | -- | List leads with filtering, search, sort, pagination |
| `/api/dashboard/leads` | POST | Session | -- | Create a new lead (auto-scored) |
| `/api/dashboard/leads` | PUT | Session | -- | Update an existing lead |
| `/api/dashboard/profile` | GET | Session | -- | Client profile summary |
| `/api/dashboard/activity` | GET | Session | -- | Recent activity feed |
| `/api/dashboard/attribution` | GET | Session | -- | Lead attribution data |
| `/api/dashboard/services` | GET | Session | -- | Active services list |
| `/api/dashboard/subscription` | GET | Session | -- | Subscription details |
| `/api/dashboard/billing` | GET | Session | -- | Billing information |
| `/api/dashboard/billing/portal` | POST | Session | -- | Create Stripe billing portal session |
| `/api/dashboard/benchmarks` | GET | Session | -- | Industry benchmarks |
| `/api/dashboard/capacity` | GET | Session | -- | Service capacity metrics |
| `/api/dashboard/checklist` | GET | Session | -- | Onboarding checklist status |
| `/api/dashboard/financing` | GET | Session | -- | Financing options |
| `/api/dashboard/franchise` | GET | Session | -- | Franchise information |
| `/api/dashboard/voice` | GET | Session | -- | Voice agent dashboard |
| `/api/dashboard/inbox` | GET | Session | -- | Unified inbox threads |
| `/api/dashboard/inbox/[threadId]` | GET | Session | -- | Single inbox thread |
| `/api/dashboard/invoices` | GET | Session | -- | Invoice list |
| `/api/dashboard/invoices/[id]` | GET | Session | -- | Single invoice detail |
| `/api/dashboard/locations` | GET | Session | -- | Business locations list |
| `/api/dashboard/locations/[id]` | GET | Session | -- | Single location detail |
| `/api/dashboard/performance` | GET | Session | -- | Performance metrics |
| `/api/dashboard/performance/events` | GET | Session | -- | Performance events |
| `/api/dashboard/qbr` | GET | Session | -- | Quarterly business reviews list |
| `/api/dashboard/qbr/[id]` | GET | Session | -- | Single QBR detail |
| `/api/dashboard/quotes` | GET | Session | -- | Quotes list |
| `/api/dashboard/quotes/[id]` | GET | Session | -- | Single quote detail |
| `/api/dashboard/quotes/generate` | POST | Session | -- | Generate a new quote |
| `/api/dashboard/recruiting` | GET | Session | -- | Job postings list |
| `/api/dashboard/recruiting/[id]` | GET | Session | -- | Single job posting |
| `/api/dashboard/recruiting/[id]/applicants` | GET | Session | -- | Applicants for a job posting |
| `/api/dashboard/referrals` | GET | Session | -- | Referral program data |
| `/api/dashboard/reports` | GET | Session | -- | Reports list |
| `/api/dashboard/reports/generate` | POST | Session | -- | Generate a new report |
| `/api/dashboard/support` | GET | Session | -- | Support tickets |
| `/api/dashboard/support` | POST | Session | -- | Create support ticket |
| `/api/dashboard/support/[id]` | GET | Session | -- | Single support ticket |
| `/api/dashboard/webhooks` | GET | Session | -- | Configured webhooks |
| `/api/dashboard/webhooks` | POST | Session | -- | Create webhook |
| `/api/dashboard/webhooks/[id]` | GET | Session | -- | Single webhook detail |
| `/api/dashboard/webhooks/[id]` | PUT | Session | -- | Update webhook |
| `/api/dashboard/webhooks/[id]` | DELETE | Session | -- | Delete webhook |
| `/api/dashboard/webhooks/[id]/test` | POST | Session | -- | Test fire a webhook |
| `/api/dashboard/autopilot` | GET | Session | -- | Autopilot orchestration status |
| `/api/dashboard/autopilot/approvals` | GET | Session | -- | Pending autopilot approvals |
| `/api/dashboard/autopilot/approvals` | POST | Session | -- | Approve/reject autopilot action |
| `/api/dashboard/settings/account` | GET | Session | -- | Account settings |
| `/api/dashboard/settings/account` | PUT | Session | -- | Update account settings |
| `/api/dashboard/settings/automation` | GET | Session | -- | Automation settings |
| `/api/dashboard/settings/automation` | PUT | Session | -- | Update automation settings |

#### GET /api/dashboard/kpis

**Response (200):** Array of `KPIData` objects.

```json
[
  {
    "label": "Leads This Month",
    "value": 42,
    "change": "+15%",
    "changeType": "positive"
  },
  {
    "label": "Active Services",
    "value": 8,
    "subtext": "of 16 available"
  },
  {
    "label": "Avg Review Rating",
    "value": "4.8",
    "subtext": "24 total reviews"
  },
  {
    "label": "Chatbot Conversations",
    "value": 156,
    "subtext": "this month"
  }
]
```

#### GET /api/dashboard/leads

**Query parameters:** `page` (int, default 1), `limit` (int, 1-100, default 50), `status`, `stage`, `search`, `sort` (`score | date | value`).

**Response (200):**

```json
{
  "leads": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "phone": "string",
      "source": "string",
      "date": "ISO 8601 string",
      "status": "new | contacted | qualified | appointment | proposal | won | lost",
      "score": "number",
      "stage": "string",
      "notes": "string",
      "assignedTo": "string",
      "lastContactedAt": "ISO 8601 string | null",
      "nextFollowUpAt": "ISO 8601 string | null",
      "value": "number | null",
      "tags": "string"
    }
  ],
  "total": 142,
  "page": 1,
  "limit": 50
}
```

#### GET /api/dashboard/leads (simple)

The simple leads endpoint (used by the main dashboard leads widget) returns the 50 most recent leads for the authenticated client.

**Auth:** Session cookie (requires linked client record via `requireClient()`)

**Request:**

```bash
curl https://your-domain.com/api/dashboard/leads \
  -H "Cookie: sovereign-session=<session-token>"
```

**Response (200):**

```json
[
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+15125551234",
    "source": "booking",
    "date": "2026-03-20T10:30:00.000Z",
    "status": "appointment"
  },
  {
    "name": "Sarah Connor",
    "email": "sarah@example.com",
    "phone": "",
    "source": "chatbot",
    "date": "2026-03-19T16:45:00.000Z",
    "status": "new"
  },
  {
    "name": "Mike Johnson",
    "email": "mike@example.com",
    "phone": "+15125559876",
    "source": "website",
    "date": "2026-03-18T08:20:00.000Z",
    "status": "contacted"
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Lead's full name |
| `email` | string | Lead's email (empty string if not provided) |
| `phone` | string | Lead's phone (empty string if not provided) |
| `source` | string | How the lead was acquired: `booking`, `chatbot`, `website`, `referral`, `phone`, `manual`, etc. |
| `date` | string | ISO 8601 creation timestamp |
| `status` | string | Lead status: `new`, `contacted`, `qualified`, `appointment`, `proposal`, `won`, `lost` |

**Error responses:**

| Status | Body | When |
|--------|------|------|
| 401 | `{"error": "Authentication required"}` | Missing or invalid session |
| 403 | `{"error": "Client record required"}` | Session exists but no linked client |

#### GET /api/dashboard/profile

**Response (200):**

```json
{
  "businessName": "string",
  "ownerName": "string",
  "initials": "string (2 chars)",
  "city": "string",
  "vertical": "string",
  "plan": "string"
}
```

---

### Services

Service endpoints are grouped by service type. Most require session authentication via `requireClient()` which also enforces active subscription status.

#### Generic Service Endpoints

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/[serviceId]/config` | GET | Session | -- | Get service configuration |
| `/api/services/[serviceId]/config` | PUT | Session | -- | Update service configuration |
| `/api/services/[serviceId]/activity` | GET | Session | -- | Get service activity log |

#### Chatbot (`/api/services/chatbot/*`)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/chatbot/chat` | POST | None (CSRF-exempt) | Token bucket | Handle chat messages; AI-powered responses |
| `/api/services/chatbot/sms` | POST | None (CSRF-exempt) | -- | Inbound SMS webhook (Twilio) |
| `/api/services/chatbot/config` | GET | Session | -- | Get chatbot configuration |
| `/api/services/chatbot/config` | PUT | Session | -- | Update chatbot configuration |
| `/api/services/chatbot/conversations` | GET | Session | -- | List chatbot conversations |
| `/api/services/chatbot/actions` | GET | Session | -- | List chatbot action log |

#### POST /api/services/chatbot/chat

Send a message to an AI chatbot and receive a response. This is the primary endpoint for the embeddable chat widget. No authentication is required (CSRF-exempt), but requests are rate-limited per conversation.

**Auth:** None (public, CORS-enabled with `Access-Control-Allow-Origin: *`)

**Rate limit:** 30 messages per conversation per hour (token bucket)

**Request:**

```json
{
  "chatbotId": "cbot_01HX...",
  "message": "Do you offer emergency plumbing services?",
  "conversationId": "conv_01HX..."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `chatbotId` | string | Yes | The chatbot configuration ID (provided in the embed snippet) |
| `message` | string | Yes | The user's message text |
| `conversationId` | string | No | Existing conversation ID to continue a thread. Omit to start a new conversation |

**Response (200):**

```json
{
  "reply": "Yes! We offer 24/7 emergency plumbing services. Our team can typically arrive within 60 minutes. Would you like to schedule a visit?",
  "conversationId": "conv_01HX..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `reply` | string | The AI-generated response text |
| `conversationId` | string | Conversation ID to pass in subsequent messages to maintain context |

**Error responses:**

| Status | Body | When |
|--------|------|------|
| 400 | `{"error": "chatbotId is required"}` | Missing or invalid `chatbotId` |
| 400 | `{"error": "message is required"}` | Missing or invalid `message` |
| 403 | `{"error": "Chatbot is currently inactive"}` | Chatbot has been deactivated by the client |
| 404 | `{"error": "Chatbot not found"}` | No chatbot config exists for the given ID |
| 429 | `{"error": "Rate limit exceeded. Please wait before sending more messages."}` | Conversation rate limit exceeded |

#### Booking (`/api/services/booking/*`)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/booking/book` | POST | None (CSRF-exempt) | -- | Create a booking (public widget) |
| `/api/services/booking/slots` | GET | None | -- | Available time slots |
| `/api/services/booking/upcoming` | GET | Session | -- | Upcoming bookings for client |
| `/api/services/booking/widget-config` | GET | None | -- | Widget configuration (public) |

#### GET /api/services/booking/slots

Fetch available booking time slots for the next 7 days. Used by the public booking widget to display open appointment times.

**Auth:** None (public)

**Query parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `clientId` | string | Yes | The client whose availability to check |

**Request:**

```bash
curl "https://your-domain.com/api/services/booking/slots?clientId=cli_01HX..."
```

**Response (200):**

```json
[
  {
    "date": "2026-03-20",
    "slots": [
      {
        "start": "2026-03-20T14:00:00.000Z",
        "end": "2026-03-20T15:00:00.000Z"
      },
      {
        "start": "2026-03-20T15:00:00.000Z",
        "end": "2026-03-20T16:00:00.000Z"
      }
    ]
  },
  {
    "date": "2026-03-21",
    "slots": []
  },
  {
    "date": "2026-03-22",
    "slots": [
      {
        "start": "2026-03-22T09:00:00.000Z",
        "end": "2026-03-22T10:00:00.000Z"
      }
    ]
  }
]
```

Returns an array of 7 objects (one per day). Each object has a `date` string (YYYY-MM-DD) and a `slots` array. Empty `slots` means no availability for that day (e.g., weekends or fully booked). Slot duration defaults to 60 minutes but is configurable per client.

**Error responses:**

| Status | Body | When |
|--------|------|------|
| 400 | `{"error": "clientId query parameter is required"}` | Missing `clientId` |

#### POST /api/services/booking/book

Create a new booking. This is the public-facing endpoint used by the embeddable booking widget. On success, it also creates a lead record, sends an SMS confirmation (if phone provided), queues an email reminder, syncs to Google Calendar (if configured), and dispatches a `booking.confirmed` webhook.

**Auth:** None (public, CSRF-exempt)

**Rate limit:** 10 bookings per IP per hour

**Request:**

```json
{
  "clientId": "cli_01HX...",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+15125551234",
  "serviceType": "Water heater repair",
  "startsAt": "2026-03-25T14:00:00.000Z",
  "endsAt": "2026-03-25T15:00:00.000Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `clientId` | string | Yes | The client to book with |
| `customerName` | string | Yes | Customer's full name (max 200 chars) |
| `customerEmail` | string | Yes | Customer's email (validated) |
| `customerPhone` | string | No | Customer's phone number (max 30 chars). Triggers SMS confirmation if provided |
| `serviceType` | string | No | Type of service requested (max 200 chars) |
| `startsAt` | string | Yes | ISO 8601 datetime for appointment start (must be in the future) |
| `endsAt` | string | Yes | ISO 8601 datetime for appointment end (must be after `startsAt`) |

**Response (201):**

```json
{
  "id": "bk_01HX...",
  "clientId": "cli_01HX...",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+15125551234",
  "serviceType": "Water heater repair",
  "startsAt": "2026-03-25T14:00:00.000Z",
  "endsAt": "2026-03-25T15:00:00.000Z",
  "status": "confirmed",
  "notes": null,
  "createdAt": "2026-03-20T10:30:00.000Z"
}
```

**Error responses:**

| Status | Body | When |
|--------|------|------|
| 400 | `{"error": "Validation failed", "details": {...}}` | Invalid input (Zod validation) |
| 400 | `{"error": "Cannot book in the past"}` | `startsAt` is before current time |
| 400 | `{"error": "End time must be after start time"}` | `endsAt` is not after `startsAt` |
| 404 | `{"error": "Client not found"}` | Invalid `clientId` |
| 409 | `{"error": "Time slot is no longer available"}` | Double-booking detected (serializable transaction) |
| 429 | `{"error": "Too many booking requests. Please try again later."}` | IP rate limit exceeded |

#### Voice (`/api/services/voice/*`)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/voice/inbound` | POST | None (CSRF-exempt) | -- | Twilio inbound call webhook |
| `/api/services/voice/status` | POST | None (CSRF-exempt) | -- | Twilio call status callback |
| `/api/services/voice/conversation` | POST | None (CSRF-exempt) | -- | Twilio conversation webhook |
| `/api/services/voice/outbound` | POST | Session | -- | Initiate outbound call |
| `/api/services/voice/recording` | GET | Session | -- | Get call recordings |
| `/api/services/voice/textback-config` | GET | Session | -- | Text-back configuration |
| `/api/services/voice/textback-config` | PUT | Session | -- | Update text-back configuration |

#### POST /api/services/voice/inbound

Twilio webhook handler for incoming phone calls. Twilio sends form-encoded data when a call arrives on a provisioned number. The endpoint validates the Twilio signature, creates a `PhoneCall` record, and returns TwiML to greet the caller and gather speech input.

**Auth:** Twilio signature verification (`x-twilio-signature` header)

**Content-Type:** `application/x-www-form-urlencoded` (Twilio webhook format)

**Request (form data from Twilio):**

| Field | Type | Description |
|-------|------|-------------|
| `CallSid` | string | Unique Twilio call identifier |
| `From` | string | Caller phone number (e.g., `+15125551234`) |
| `To` | string | Called phone number (matched to client's voice-agent config) |

**Response (200, Content-Type: text/xml):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Thank you for calling Smith Plumbing. How can we help you today?</Say>
  <Gather input="speech" action="/api/services/voice/conversation?callSid=CA..." method="POST" speechTimeout="auto" language="en-US">
    <Say voice="Polly.Joanna">I'm listening.</Say>
  </Gather>
  <Say voice="Polly.Joanna">I didn't catch that. Goodbye!</Say>
  <Hangup/>
</Response>
```

The greeting text comes from the client's voice-agent service configuration. After gathering speech, Twilio redirects to `/api/services/voice/conversation` for AI processing.

**Error recovery:** On any server error, returns a TwiML fallback offering voicemail recording:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>We're experiencing technical difficulties. Please leave a message after the beep and we will return your call.</Say>
  <Record maxLength="120" transcribe="true" />
  <Say>Thank you. Goodbye.</Say>
  <Hangup/>
</Response>
```

**Error responses:**

| Status | Body | When |
|--------|------|------|
| 403 | `Forbidden` (plain text) | Invalid Twilio signature |

#### Receptionist (`/api/services/receptionist/*`)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/receptionist/inbound` | POST | None (CSRF-exempt) | -- | Twilio inbound call webhook |
| `/api/services/receptionist/conversation` | POST | None (CSRF-exempt) | -- | Twilio conversation webhook |
| `/api/services/receptionist/calls` | GET | Session | -- | Call history |
| `/api/services/receptionist/config` | GET | Session | -- | Receptionist configuration |
| `/api/services/receptionist/config` | PUT | Session | -- | Update configuration |
| `/api/services/receptionist/stats` | GET | Session | -- | Call statistics |

#### Reviews (`/api/services/reviews/*`)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/reviews/campaigns` | GET | Session | -- | List review campaigns |
| `/api/services/reviews/campaigns` | POST | Session | -- | Create review campaign |
| `/api/services/reviews/send` | POST | Session | -- | Send review request |

#### GET /api/services/reviews/campaigns

List all review campaigns for the authenticated client, ordered by most recent first.

**Auth:** Session cookie (requires linked client record)

**Request:**

```bash
curl https://your-domain.com/api/services/reviews/campaigns \
  -H "Cookie: sovereign-session=<session-token>"
```

**Response (200):**

```json
[
  {
    "id": "rc_01HX...",
    "name": "Review request for John Doe",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+15125551234",
    "status": "completed",
    "reviewUrl": "https://g.page/r/smith-plumbing/review",
    "sentAt": "2026-03-15T09:00:00.000Z",
    "remindedAt": "2026-03-18T09:00:00.000Z",
    "completedAt": "2026-03-19T14:22:00.000Z",
    "rating": 5,
    "createdAt": "2026-03-14T11:00:00.000Z",
    "updatedAt": "2026-03-19T14:22:00.000Z"
  },
  {
    "id": "rc_01HX...",
    "name": "Review request for Sarah Connor",
    "customerName": "Sarah Connor",
    "customerEmail": "sarah@example.com",
    "customerPhone": null,
    "status": "pending",
    "reviewUrl": null,
    "sentAt": null,
    "remindedAt": null,
    "completedAt": null,
    "rating": null,
    "createdAt": "2026-03-20T10:00:00.000Z",
    "updatedAt": "2026-03-20T10:00:00.000Z"
  }
]
```

Campaign statuses: `pending` (awaiting send), `sent` (email delivered), `reminded` (follow-up sent), `completed` (customer left review).

#### POST /api/services/reviews/campaigns

Create a new review request campaign for a customer. The campaign starts in `pending` status and is processed by the daily cron job (`/api/cron/reviews` at 9 AM).

**Auth:** Session cookie (requires linked client record)

**Request:**

```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+15125551234",
  "reviewUrl": "https://g.page/r/smith-plumbing/review"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customerName` | string | Yes | Customer's name (max 200 chars) |
| `customerEmail` | string | Yes | Customer's email (validated, max 320 chars) |
| `customerPhone` | string | No | Customer's phone (max 30 chars) |
| `reviewUrl` | string | No | Direct link to review page (validated URL, max 2048 chars). If omitted, the system uses the client's default review URL |

**Response (201):**

```json
{
  "id": "rc_01HX...",
  "name": "Review request for John Doe",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+15125551234",
  "status": "pending",
  "reviewUrl": "https://g.page/r/smith-plumbing/review",
  "sentAt": null,
  "remindedAt": null,
  "completedAt": null,
  "rating": null,
  "createdAt": "2026-03-20T11:00:00.000Z",
  "updatedAt": "2026-03-20T11:00:00.000Z"
}
```

**Error responses:**

| Status | Body | When |
|--------|------|------|
| 400 | `{"error": "Invalid input", "details": {"customerEmail": ["Invalid email"]}}` | Validation failure |
| 401 | `{"error": "Unauthorized"}` | Missing or invalid session |

#### Reputation (`/api/services/reputation/*`)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/reputation/reviews` | GET | Session | -- | Aggregated reviews |
| `/api/services/reputation/score` | GET | Session | -- | Reputation score |
| `/api/services/reputation/responses` | GET | Session | -- | AI review responses |
| `/api/services/reputation/responses` | POST | Session | -- | Generate AI response to review |
| `/api/services/reputation/responses/[id]` | PUT | Session | -- | Update/approve response |
| `/api/services/reputation/responses/[id]` | DELETE | Session | -- | Delete response |

#### Content (`/api/services/content/*`)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/content/generate` | POST | Session | -- | Generate AI content (blog posts) |
| `/api/services/content/posts` | GET | Session | -- | List content posts |

#### Email (`/api/services/email/*`)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/email/campaigns` | GET | Session | -- | List email campaigns |
| `/api/services/email/campaigns` | POST | Session | -- | Create email campaign |
| `/api/services/email/generate` | POST | Session | -- | AI-generate email content |
| `/api/services/email/send` | POST | Session | -- | Send email |

#### GET /api/services/email/campaigns

List all email campaigns for the authenticated client, ordered by most recent first.

**Auth:** Session cookie (requires linked client record)

**Request:**

```bash
curl https://your-domain.com/api/services/email/campaigns \
  -H "Cookie: sovereign-session=<session-token>"
```

**Response (200):**

```json
[
  {
    "id": "ec_01HX...",
    "name": "Spring HVAC Tune-Up Special",
    "subject": "Get 20% off your spring HVAC tune-up!",
    "body": "<h1>Spring Special</h1><p>Book your tune-up today...</p>",
    "type": "broadcast",
    "status": "sent",
    "recipients": 245,
    "opens": 89,
    "clicks": 34,
    "sentAt": "2026-03-15T10:00:00.000Z",
    "createdAt": "2026-03-14T16:00:00.000Z",
    "updatedAt": "2026-03-15T10:00:00.000Z"
  },
  {
    "id": "ec_01HX...",
    "name": "April Newsletter",
    "subject": "What's new at Smith Plumbing",
    "body": "",
    "type": "broadcast",
    "status": "draft",
    "recipients": 0,
    "opens": 0,
    "clicks": 0,
    "sentAt": null,
    "createdAt": "2026-03-20T09:00:00.000Z",
    "updatedAt": "2026-03-20T09:00:00.000Z"
  }
]
```

Campaign statuses: `draft` (not yet sent), `scheduled` (queued for send), `sending` (in progress), `sent` (delivery complete).

#### POST /api/services/email/campaigns

Create a new email campaign in `draft` status. Use `/api/services/email/send` to send it or schedule it via the daily cron.

**Auth:** Session cookie (requires linked client record)

**Request:**

```json
{
  "name": "April Newsletter",
  "subject": "What's new at Smith Plumbing",
  "body": "<h1>April Update</h1><p>Here's what we've been up to...</p>",
  "type": "broadcast"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Internal campaign name (max 200 chars) |
| `subject` | string | Yes | Email subject line (max 500 chars) |
| `body` | string | No | Email body content, supports HTML (max 50,000 chars). Defaults to empty string |
| `type` | string | No | Campaign type (max 50 chars). Defaults to `"broadcast"` |

**Response (201):**

```json
{
  "id": "ec_01HX...",
  "name": "April Newsletter",
  "subject": "What's new at Smith Plumbing",
  "body": "<h1>April Update</h1><p>Here's what we've been up to...</p>",
  "type": "broadcast",
  "status": "draft",
  "recipients": 0,
  "opens": 0,
  "clicks": 0,
  "sentAt": null,
  "createdAt": "2026-03-20T09:00:00.000Z",
  "updatedAt": "2026-03-20T09:00:00.000Z"
}
```

**Error responses:**

| Status | Body | When |
|--------|------|------|
| 400 | `{"error": "Invalid input", "details": {"name": ["Required"]}}` | Validation failure |
| 400 | `{"error": "Invalid JSON body"}` | Malformed request body |
| 401 | `{"error": "Unauthorized"}` | Missing or invalid session |

#### Ads (`/api/services/ads/*`)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/ads/campaigns` | GET | Session | -- | List ad campaigns |
| `/api/services/ads/campaigns` | POST | Session | -- | Create/update ad campaign |
| `/api/services/ads/metrics` | GET | Session | -- | Ad performance metrics |

#### SEO (`/api/services/seo/*`)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/seo/audit` | GET | Session | -- | SEO audit results |
| `/api/services/seo/audit` | POST | Session | -- | Run SEO audit |
| `/api/services/seo/keywords` | GET | Session | -- | Tracked keywords |

#### Social (`/api/services/social/*`)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/social/posts` | GET | Session | -- | Scheduled/published social posts |
| `/api/services/social/posts` | POST | Session | -- | Create social post |
| `/api/services/social/generate` | POST | Session | -- | AI-generate social content |

#### AEO (`/api/services/aeo/*`)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/aeo` | GET | Session | -- | AEO overview |
| `/api/services/aeo/[id]` | GET | Session | -- | Single AEO entry |
| `/api/services/aeo/queries` | GET | Session | -- | Tracked AI queries |
| `/api/services/aeo/score` | GET | Session | -- | AEO visibility score |
| `/api/services/aeo/generate` | POST | Session | -- | Generate AEO content |
| `/api/services/aeo/strategies` | GET | Session | -- | AEO strategies |

#### LTV (`/api/services/ltv/*`)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/ltv/overview` | GET | Session | -- | Customer LTV overview |
| `/api/services/ltv/customers` | GET | Session | -- | Customer list with LTV |
| `/api/services/ltv/campaigns` | GET | Session | -- | Retention campaigns |
| `/api/services/ltv/campaigns` | POST | Session | -- | Create retention campaign |
| `/api/services/ltv/reminders` | GET | Session | -- | Service reminders |

#### FSM (`/api/services/fsm/*`)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/fsm/webhook` | POST | Webhook sig (CSRF-exempt) | -- | Inbound FSM webhook (ServiceTitan, Jobber, Housecall Pro) |
| `/api/services/fsm/connections` | GET | Session | -- | FSM platform connections |
| `/api/services/fsm/connections` | POST | Session | -- | Create FSM connection |
| `/api/services/fsm/sync` | POST | Session | -- | Trigger manual FSM sync |
| `/api/services/fsm/logs` | GET | Session | -- | FSM sync logs |

#### Analytics (`/api/services/analytics/*`)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/analytics/overview` | GET | Session | -- | Analytics overview |
| `/api/services/analytics/roi` | GET | Session | -- | ROI analysis |

#### Estimate (`/api/services/estimate/*`)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/estimate` | GET | Session | -- | List estimates |
| `/api/services/estimate` | POST | Session | -- | Create estimate |
| `/api/services/estimate/[id]` | GET | Session | -- | Single estimate detail |
| `/api/services/estimate/[id]` | PUT | Session | -- | Update estimate |
| `/api/services/estimate/stats` | GET | Session | -- | Estimate statistics |

#### GET /api/services/estimate

List photo-based estimates for the authenticated client with pagination, filtering, and search.

**Auth:** Session cookie (requires linked client record)

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number (min 1) |
| `limit` | int | 20 | Results per page (1-100) |
| `status` | string | -- | Filter by status (e.g., `pending`, `analyzed`, `sent`) |
| `search` | string | -- | Search by customer name, email, or issue category (case-insensitive) |

**Request:**

```bash
curl "https://your-domain.com/api/services/estimate?page=1&limit=10&status=analyzed" \
  -H "Cookie: sovereign-session=<session-token>"
```

**Response (200):**

```json
{
  "estimates": [
    {
      "id": "est_01HX...",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "customerPhone": "+15125551234",
      "imageUrl": "https://storage.example.com/uploads/water-heater.jpg",
      "vertical": "plumbing",
      "issueCategory": "Water heater",
      "issueDescription": "Visible corrosion on tank, water pooling at base. Likely needs full replacement.",
      "estimateLow": 2500,
      "estimateHigh": 4200,
      "confidence": 0.85,
      "status": "analyzed",
      "leadId": "lead_01HX...",
      "bookingId": null,
      "createdAt": "2026-03-19T14:30:00.000Z"
    }
  ],
  "total": 28,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

| Field | Type | Description |
|-------|------|-------------|
| `estimateLow` | number | Low end of the cost estimate (in dollars) |
| `estimateHigh` | number | High end of the cost estimate (in dollars) |
| `confidence` | number | AI confidence score (0.0 - 1.0) |
| `vertical` | string | Business vertical used for estimate calibration |
| `issueCategory` | string | AI-detected issue category |
| `issueDescription` | string | AI-generated description of the detected issue |
| `leadId` | string or null | Associated lead record (if auto-created) |
| `bookingId` | string or null | Associated booking (if customer booked) |

**Error responses:**

| Status | Body | When |
|--------|------|------|
| 401 | `{"error": "Unauthorized"}` | Missing or invalid session |

#### Social Proof (`/api/services/social-proof/*`)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/social-proof/config` | GET | Session | -- | Social proof widget config |
| `/api/services/social-proof/config` | PUT | Session | -- | Update social proof config |
| `/api/services/social-proof/feed` | GET | None | -- | Public social proof feed |

#### Retargeting (`/api/services/retargeting/*`)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/retargeting/track` | POST | None (CSRF-exempt) | -- | Track retargeting event (pixel) |
| `/api/services/retargeting/audiences` | GET | Session | -- | Retargeting audiences |
| `/api/services/retargeting/pixel` | GET | Session | -- | Pixel configuration |

#### Referral Program (`/api/services/referral-program/*`)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/referral-program` | GET | Session | -- | Referral program config |
| `/api/services/referral-program` | POST | Session | -- | Create/update referral program |
| `/api/services/referral-program/referrals` | GET | Session | -- | List referrals |

#### GBP -- Google Business Profile (`/api/services/gbp/*`)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/services/gbp` | GET | Session | -- | GBP profile overview |
| `/api/services/gbp/hours` | GET | Session | -- | Business hours |
| `/api/services/gbp/hours` | PUT | Session | -- | Update business hours |
| `/api/services/gbp/photos` | GET | Session | -- | GBP photos |
| `/api/services/gbp/reviews` | GET | Session | -- | GBP reviews |
| `/api/services/gbp/insights` | GET | Session | -- | GBP insights/analytics |

---

### Admin

All admin endpoints require session authentication **and** `account.role === "admin"` (verified server-side in each handler). Middleware only checks for a valid session cookie.

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/admin/stats` | GET | Admin | -- | Platform-wide statistics |
| `/api/admin/clients` | GET | Admin | -- | List all clients |
| `/api/admin/clients/[id]` | GET | Admin | -- | Single client detail |
| `/api/admin/clients/[id]` | PUT | Admin | -- | Update client |
| `/api/admin/clients/[id]/manage` | POST | Admin | -- | Manage client (activate/deactivate/etc.) |
| `/api/admin/agencies` | GET | Admin | -- | List agencies |
| `/api/admin/agencies/[id]` | GET | Admin | -- | Single agency detail |
| `/api/admin/agencies/[id]` | PUT | Admin | -- | Update agency |
| `/api/admin/products` | GET | Admin | -- | List digital products |
| `/api/admin/products` | POST | Admin | -- | Create digital product |
| `/api/admin/products/[id]` | GET | Admin | -- | Single product detail |
| `/api/admin/products/[id]` | PUT | Admin | -- | Update product |
| `/api/admin/products/[id]` | DELETE | Admin | -- | Delete product |
| `/api/admin/products/analytics` | GET | Admin | -- | Product sales analytics |
| `/api/admin/subscriptions` | GET | Admin | -- | List all subscriptions |
| `/api/admin/activity` | GET | Admin | -- | Platform activity log |
| `/api/admin/alerts` | GET | Admin | -- | System alerts |
| `/api/admin/monitoring` | GET | Admin | -- | System monitoring data |
| `/api/admin/snapshots` | GET | Admin | -- | List report snapshots |
| `/api/admin/snapshots` | POST | Admin | -- | Create report snapshot |
| `/api/admin/snapshots/[id]` | GET | Admin | -- | Single snapshot detail |
| `/api/admin/support` | GET | Admin | -- | All support tickets |
| `/api/admin/support` | PUT | Admin | -- | Update support ticket |

#### GET /api/admin/stats

Platform-wide statistics for the admin dashboard. Returns aggregate metrics across all clients.

**Auth:** Session cookie with `admin` role

**Request:**

```bash
curl https://your-domain.com/api/admin/stats \
  -H "Cookie: sovereign-session=<session-token>"
```

**Response (200):**

```json
{
  "totalClients": 47,
  "mrr": 28500,
  "activeServices": 186,
  "avgRevenue": 606,
  "bundleBreakdown": {
    "starter": 12,
    "growth": 25,
    "empire": 8,
    "custom": 2
  },
  "recentClients": [
    {
      "id": "cli_01HX...",
      "businessName": "Smith Plumbing",
      "ownerName": "Jane Smith",
      "email": "owner@smithplumbing.com",
      "createdAt": "2026-03-18T14:00:00.000Z",
      "subscription": {
        "bundleId": "growth",
        "monthlyAmount": 599,
        "status": "active"
      }
    },
    {
      "id": "cli_01HX...",
      "businessName": "Cool Air HVAC",
      "ownerName": "Bob Johnson",
      "email": "bob@coolairhvac.com",
      "createdAt": "2026-03-16T09:00:00.000Z",
      "subscription": null
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `totalClients` | number | Total number of client accounts |
| `mrr` | number | Monthly recurring revenue in dollars (sum of all active subscriptions) |
| `activeServices` | number | Total active service instances across all clients |
| `avgRevenue` | number | Average revenue per client (MRR / totalClients, rounded) |
| `bundleBreakdown` | object | Count of active subscriptions per bundle ID |
| `recentClients` | array | 10 most recently created clients with subscription info |

**Error responses:**

| Status | Body | When |
|--------|------|------|
| 401 | `{"error": "Authentication required"}` | Missing or invalid session |
| 403 | `{"error": "Admin access required"}` | Session exists but user is not an admin |

#### GET /api/admin/clients

List all clients with optional search. Returns client details including account email, subscription info, and service count.

**Auth:** Session cookie with `admin` role

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | -- | Search by business name, owner name, or email (case-sensitive substring match) |

**Request:**

```bash
curl "https://your-domain.com/api/admin/clients?search=plumbing" \
  -H "Cookie: sovereign-session=<session-token>"
```

**Response (200):**

```json
{
  "clients": [
    {
      "id": "cli_01HX...",
      "businessName": "Smith Plumbing",
      "ownerName": "Jane Smith",
      "email": "owner@smithplumbing.com",
      "createdAt": "2026-03-10T14:00:00.000Z",
      "subscription": {
        "bundleId": "growth",
        "monthlyAmount": 599,
        "status": "active"
      },
      "servicesCount": 8
    },
    {
      "id": "cli_01HX...",
      "businessName": "Pro Plumbing Co",
      "ownerName": "Mike Davis",
      "email": "mike@proplumbing.com",
      "createdAt": "2026-02-28T10:00:00.000Z",
      "subscription": {
        "bundleId": "starter",
        "monthlyAmount": 299,
        "status": "active"
      },
      "servicesCount": 4
    }
  ]
}
```

**Error responses:**

| Status | Body | When |
|--------|------|------|
| 401 | `{"error": "Authentication required"}` | Missing or invalid session |
| 403 | `{"error": "Admin access required"}` | Session exists but user is not an admin |

#### POST /api/admin/clients

Create a new client account. This creates both the account (login) and client (business profile) records in a single transaction, and logs an audit event.

**Auth:** Session cookie with `admin` role

**Request:**

```json
{
  "email": "owner@newbusiness.com",
  "businessName": "New Business LLC",
  "ownerName": "Alice Johnson",
  "phone": "+15125559999",
  "city": "Austin",
  "state": "TX",
  "vertical": "plumbing",
  "website": "https://newbusiness.com",
  "serviceAreaRadius": "25 miles"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Account email (max 255 chars, validated) |
| `businessName` | string | Yes | Business name (1-200 chars) |
| `ownerName` | string | Yes | Owner's name (1-200 chars) |
| `phone` | string | No | Phone number (max 30 chars) |
| `city` | string | No | City (max 100 chars) |
| `state` | string | No | State (max 100 chars) |
| `vertical` | string | No | Business vertical (max 100 chars) |
| `website` | string | No | Business website URL (max 500 chars, validated) |
| `serviceAreaRadius` | string | No | Service area description (max 50 chars) |

**Response (201):**

```json
{
  "client": {
    "id": "cli_01HX...",
    "businessName": "New Business LLC",
    "ownerName": "Alice Johnson",
    "email": "owner@newbusiness.com",
    "createdAt": "2026-03-20T12:00:00.000Z"
  }
}
```

**Error responses:**

| Status | Body | When |
|--------|------|------|
| 400 | `{"error": "Invalid input", "details": {"email": ["Invalid email"]}}` | Validation failure |
| 401 | `{"error": "Authentication required"}` | Missing or invalid session |
| 403 | `{"error": "Admin access required"}` | Session exists but user is not an admin |
| 409 | `{"error": "An account with this email already exists"}` | Duplicate email address |

---

### Payments

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/payments/checkout` | POST | Optional session | 10/hr/IP | Create Stripe checkout session |
| `/api/payments/portal` | POST | Session | 10/hr/IP | Create Stripe billing portal session |
| `/api/payments/reactivate` | POST | Session | -- | Reactivate canceled subscription |
| `/api/payments/subscriptions` | GET | Admin | -- | List all subscriptions (admin) |

#### POST /api/payments/checkout

**Request:**

```json
{
  "bundleId": "string (starter | growth | empire, optional)",
  "services": ["string (service IDs, optional)"],
  "billingInterval": "monthly | annual (optional)",
  "onboardingData": "object (optional)",
  "customerName": "string (optional, max 200)",
  "businessName": "string (optional, max 200)",
  "email": "string (optional, valid email)"
}
```

**Response (200):**

```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_..."
}
```

#### POST /api/payments/portal

**Response (200):**

```json
{
  "url": "https://billing.stripe.com/..."
}
```

---

### Public

These endpoints are publicly accessible (no authentication required).

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/products` | GET | None | -- | List published digital products |
| `/api/products/[slug]` | GET | None | -- | Product detail by slug |
| `/api/products/[slug]/checkout` | POST | Session | -- | Initiate product purchase |
| `/api/products/[slug]/ownership` | GET | Session | -- | Check product ownership |
| `/api/products/[slug]/review` | POST | Session | -- | Submit product review |
| `/api/products/library` | GET | Session | -- | User's purchased products |
| `/api/products/library/[id]/download` | GET | Session | -- | Download purchased product |
| `/api/blog` | GET | None | -- | List blog posts |
| `/api/blog/[slug]` | GET | None | -- | Single blog post |
| `/api/knowledge` | GET | None | -- | Knowledge base articles list |
| `/api/knowledge/[slug]` | GET | None | -- | Single knowledge base article |
| `/api/find-a-pro` | GET | None | -- | Search for service professionals |
| `/api/find-a-pro/request` | POST | None | -- | Submit a pro request |
| `/api/careers/[id]` | GET | None | -- | Job posting detail |
| `/api/careers/[id]/apply` | POST | None | -- | Submit job application |
| `/api/leads` | GET | Session | -- | List leads (authenticated) |
| `/api/leads` | POST | Session (CSRF-exempt prefix) | -- | Create lead (public embed) |
| `/api/leads/stats` | GET | Session | -- | Lead statistics |
| `/api/bookings` | GET | Session | -- | List bookings |
| `/api/community/posts` | GET | None | -- | Community forum posts |
| `/api/community/posts` | POST | Session | -- | Create community post |
| `/api/community/posts/[id]` | GET | None | -- | Single community post |
| `/api/community/posts/[id]` | PUT | Session | -- | Update community post |
| `/api/quotes/[id]` | GET | None | -- | View quote (public link) |
| `/api/quotes/[id]/respond` | POST | None | -- | Respond to quote |
| `/api/referral/[clientId]` | GET | None | -- | Referral landing page data |
| `/api/referrals/track` | POST | None (CSRF-exempt) | -- | Track referral conversion |
| `/api/snapshots/[token]` | GET | None | -- | View report snapshot (public link) |
| `/api/templates` | GET | None | -- | List onboarding templates |
| `/api/templates/[id]` | GET | None | -- | Template detail |
| `/api/templates/[id]/apply` | POST | Session | -- | Apply template to client |
| `/api/estimate/analyze` | POST | None | -- | Public estimate analyzer |
| `/api/exit-capture` | POST | None | -- | Exit intent lead capture |
| `/api/financing/apply` | POST | None | -- | Financing application |
| `/api/financing/calculator` | POST | None | -- | Financing calculator |
| `/api/nps/respond` | POST | None (CSRF-exempt) | -- | NPS survey response |
| `/api/onboarding` | GET | Session | -- | Get onboarding status |
| `/api/onboarding` | POST | Session | -- | Submit onboarding data |
| `/api/notifications` | GET | Session | -- | User notifications |
| `/api/audit` | POST | None | -- | Run public marketing audit |
| `/api/agency/clients` | GET | Session | -- | Agency client list |
| `/api/push/subscribe` | POST | Session | -- | Subscribe to push notifications |
| `/api/push/unsubscribe` | POST | Session | -- | Unsubscribe from push |

#### Email Tracking (public, no auth)

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/email/track/open` | GET | None | -- | Track email open (pixel) |
| `/api/email/track/click` | GET | None | -- | Track email link click |
| `/api/email/unsubscribe` | GET | None | -- | Process email unsubscribe |

---

### MCP (Model Context Protocol)

All MCP endpoints require `Authorization: Bearer mcp_<key>` authentication.

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/mcp/tools` | GET | MCP API Key | 100/min/key | List available tools for current scopes |
| `/api/mcp/execute` | POST | MCP API Key | 100/min/key | Execute a tool |
| `/api/mcp/keys` | GET | Admin session | -- | List all API keys |
| `/api/mcp/keys` | POST | Admin session | -- | Create new API key |

#### GET /api/mcp/tools

**Response (200):**

```json
{
  "tools": [
    {
      "name": "string",
      "description": "string",
      "inputSchema": { "type": "object", "properties": { ... } }
    }
  ]
}
```

#### POST /api/mcp/execute

**Request:**

```json
{
  "tool": "string (required, tool name)",
  "input": { "key": "value (optional)" }
}
```

**Response (200):**

```json
{
  "result": { ... }
}
```

#### POST /api/mcp/keys (Admin only)

**Request:**

```json
{
  "name": "string (required, 1-200 chars)",
  "accountId": "string (required)",
  "scopes": ["client.read", "intelligence.read"],
  "expiresInDays": "number (optional, 1-365)"
}
```

**Response (200):**

```json
{
  "id": "string",
  "name": "string",
  "key": "mcp_<64-hex-chars> (only shown once!)",
  "scopes": ["client.read"],
  "expiresAt": "ISO 8601 string | null",
  "message": "Save this key -- it will not be shown again."
}
```

#### Available MCP Tools

| Tool Name | Scopes | Description |
|-----------|--------|-------------|
| `client.getLeads` | `client.read` | Fetch recent leads. Input: `limit` (int, max 100), `status` (enum). |
| `client.getMetrics` | `client.read` | Get KPIs. Input: `period` (7d/30d/90d). |
| `intelligence.getBenchmarks` | `intelligence.read` | Industry benchmarks. Input: `vertical` (enum), `region` (2-letter state). |
| `intelligence.getInsights` | `intelligence.read` | AI-generated insights. Input: `includeDismissed` (bool). |
| `agency.listClients` | `agency.read` | List managed clients. Input: `limit` (int, max 200). |

---

### Webhooks (Inbound)

These endpoints receive third-party webhook payloads. They are CSRF-exempt and verify authenticity using provider-specific mechanisms.

| Endpoint | Method | Provider | Signature Verification | Description |
|----------|--------|----------|----------------------|-------------|
| `/api/payments/webhooks/stripe` | POST | Stripe | `stripe-signature` header + `STRIPE_WEBHOOK_SECRET` via `stripe.webhooks.constructEvent()` | Main Stripe webhook handler |
| `/api/payments/webhooks/invoice` | POST | Stripe | Stripe signature | Invoice-specific events |
| `/api/payments/webhooks/products` | POST | Stripe | Stripe signature | Product/price sync events |
| `/api/email/webhooks/sendgrid` | POST | SendGrid | ECDSA P-256/SHA-256 via `x-twilio-email-event-webhook-signature` + `SENDGRID_WEBHOOK_KEY` | Email delivery events |
| `/api/services/fsm/webhook` | POST | FSM platforms | HMAC-SHA256 via `FSM_WEBHOOK_SECRET` (placeholder; see note) | ServiceTitan, Jobber, Housecall Pro events |
| `/api/services/chatbot/sms` | POST | Twilio | Twilio request validation | Inbound SMS messages |
| `/api/services/voice/inbound` | POST | Twilio | Twilio request validation | Inbound voice calls |
| `/api/services/voice/status` | POST | Twilio | Twilio request validation | Call status callbacks |
| `/api/services/voice/conversation` | POST | Twilio | Twilio request validation | Voice conversation events |
| `/api/services/receptionist/inbound` | POST | Twilio | Twilio request validation | AI receptionist inbound calls |
| `/api/services/receptionist/conversation` | POST | Twilio | Twilio request validation | AI receptionist conversation |
| `/api/services/booking/book` | POST | Public widget | CSRF-exempt; origin not checked | Public booking form |
| `/api/services/retargeting/track` | POST | Pixel | CSRF-exempt | Retargeting pixel events |
| `/api/referrals/track` | POST | Public | CSRF-exempt | Referral conversion tracking |
| `/api/nps/respond` | POST | Public | CSRF-exempt | NPS survey responses |

#### Stripe Webhook Events Handled

| Event Type | Handler |
|-----------|---------|
| `checkout.session.completed` | Provision new account, create subscription, activate services, or handle product purchase |
| `checkout.session.expired` | Log expiry, notify on failed reactivation |
| `customer.subscription.created` | Logged for observability (provisioning handled by checkout) |
| `customer.subscription.updated` | Update subscription status/amount, handle cancel-at-period-end |
| `customer.subscription.deleted` | Mark subscription canceled, deactivate all services |
| `customer.subscription.trial_will_end` | Send in-app notification 3 days before trial ends |
| `invoice.paid` | Recover past_due subscriptions, reactivate paused services |
| `invoice.payment_failed` | Mark subscription past_due, notify user |

Stripe webhooks include **event-ID deduplication** (in-memory, 5-minute TTL) to prevent double-processing on retries.

#### SendGrid Webhook Events Mapped

| SendGrid Event | Internal Type |
|---------------|--------------|
| `delivered` | `delivered` |
| `open` | `open` |
| `click` | `click` |
| `bounce` | `bounce` |
| `dropped` | `bounce` |
| `unsubscribe` | `unsubscribe` |

---

### Cron Jobs

All cron endpoints use `GET` method and require `Authorization: Bearer <CRON_SECRET>`. Schedules are configured in `vercel.json`.

| Endpoint | Schedule | Max Duration | Description |
|----------|----------|-------------|-------------|
| `/api/cron/content` | `0 6 * * *` (daily 6 AM) | 300s | Generate AI content (blog posts) for queued jobs |
| `/api/cron/reviews` | `0 9 * * *` (daily 9 AM) | 300s | Process review collection campaigns |
| `/api/cron/email` | `0 10 * * *` (daily 10 AM) | 300s | Process scheduled email campaigns |
| `/api/cron/booking` | `0 12 * * *` (daily 12 PM) | 300s | Process booking-related tasks |
| `/api/cron/reactivation` | `0 11 * * *` (daily 11 AM) | 300s | Send reactivation campaigns for churned clients |
| `/api/cron/nps` | `0 14 * * *` (daily 2 PM) | 300s | Send NPS surveys |
| `/api/cron/lead-nurture` | `30 9 * * *` (daily 9:30 AM) | 300s | Process lead nurture sequences |
| `/api/cron/ads-sync` | `30 6 * * *` (daily 6:30 AM) | 300s | Sync ad platform data |
| `/api/cron/booking-reminders` | `0 8 * * *` (daily 8 AM) | 60s | Send booking reminder notifications |
| `/api/cron/ltv-reminders` | `0 9 * * *` (daily 9 AM) | 300s | Send service reminders for LTV |
| `/api/cron/review-responses` | `0 10 * * *` (daily 10 AM) | 300s | Generate AI review responses |
| `/api/cron/trial-expiry` | `0 7 * * *` (daily 7 AM) | 60s | Notify users of expiring trials |
| `/api/cron/cleanup` | `0 3 * * *` (daily 3 AM) | 60s | Clean up expired sessions, old data |
| `/api/cron/anomaly-detection` | `0 1 * * *` (daily 1 AM) | 300s | Detect performance anomalies |
| `/api/cron/social-publish` | `*/15 * * * *` (every 15 min) | 300s | Publish scheduled social media posts |
| `/api/cron/fsm-sync` | `*/15 * * * *` (every 15 min) | 300s | Sync data with FSM platforms |
| `/api/cron/email-queue` | `*/5 * * * *` (every 5 min) | 60s | Process email send queue |
| `/api/cron/orchestration-process` | `*/5 * * * *` (every 5 min) | 300s | Process autopilot orchestration tasks |
| `/api/cron/agent-continue` | `*/5 * * * *` (every 5 min) | 300s | Continue long-running AI agent tasks |
| `/api/cron/weekly-report` | `0 8 * * 1` (Monday 8 AM) | 300s | Generate and send weekly reports |
| `/api/cron/seo-track` | `0 3 * * 1` (Monday 3 AM) | 300s | Track SEO keyword rankings |
| `/api/cron/insight-generation` | `0 6 * * 1` (Monday 6 AM) | 300s | Generate AI predictive insights |
| `/api/cron/benchmark-aggregation` | `0 2 * * 0` (Sunday 2 AM) | 300s | Aggregate industry benchmarks |
| `/api/cron/aeo-check` | `0 4 * * 1` (Monday 4 AM) | 300s | Check AI engine optimization visibility |
| `/api/cron/seasonal-campaigns` | `0 10 1 * *` (1st of month 10 AM) | 300s | Launch seasonal marketing campaigns |
| `/api/cron/performance-billing` | `0 5 1 * *` (1st of month 5 AM) | 300s | Process performance-based billing |
| `/api/cron/qbr` | `0 6 1 1,4,7,10 *` (quarterly, 1st day 6 AM) | 300s | Generate quarterly business reviews |

**Standard cron response format:**

```json
{
  "processed": 2,
  "results": [
    { "jobId": "string", "status": "published" }
  ]
}
```

---

## Rate Limits

Summary of all explicitly rate-limited endpoints:

| Endpoint | Limit | Window | Scope |
|----------|-------|--------|-------|
| `/api/auth/send-magic-link` | 5 attempts | 60 seconds | Per IP (middleware) |
| `/api/auth/send-magic-link` | 10 requests | 1 hour | Per IP (route) |
| `/api/auth/signup-free` | 5 requests | 1 hour | Per IP |
| `/api/auth/verify` | 10 requests | 1 hour | Per IP |
| `/api/auth/session` | 60 requests | 1 hour | Per IP |
| `/api/auth/signout` | 20 requests | 1 hour | Per IP |
| `/api/auth/rotate-session` | 30 requests | 1 hour | Per IP |
| `/api/payments/checkout` | 10 requests | 1 hour | Per IP |
| `/api/payments/portal` | 10 requests | 1 hour | Per IP |
| `/api/health` | 60 requests | 1 hour | Per IP |
| `/api/mcp/*` | 100 requests | 1 minute | Per API key |
| `/api/services/chatbot/chat` | Token bucket | Varies | Per chatbot ID |

Rate limit responses include HTTP `429` status and the standard error format:

```json
{
  "error": "Too many requests. Please try again later."
}
```

MCP rate limit responses also include a `Retry-After` header (in seconds).

---

## Error Format

All API errors follow a consistent JSON format:

```json
{
  "error": "Human-readable error message"
}
```

**With validation details (Zod):**

```json
{
  "error": "Validation failed",
  "details": {
    "fieldName": ["Error message for field"]
  }
}
```

**HTTP status code reference:**

| Status | Usage |
|--------|-------|
| `400` | Invalid input, malformed JSON, bad parameters |
| `401` | Missing or invalid authentication (session, API key, cron secret) |
| `403` | CSRF failure, insufficient permissions, revoked/expired API key, free-tier limit exceeded |
| `404` | Resource not found, unknown MCP tool |
| `429` | Rate limit exceeded |
| `500` | Internal server error, unhandled exceptions |
| `503` | Service unavailable (database connectivity failure) |

---

## Shared Types

### KPIData

```typescript
interface KPIData {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  subtext?: string;
}
```

### DashboardLead

```typescript
interface DashboardLead {
  name: string;
  email: string;
  phone: string;
  source: string;
  date: string;
  status: "new" | "contacted" | "qualified" | "appointment" | "proposal" | "won" | "lost";
}
```

### CheckoutRequest / CheckoutResponse

```typescript
interface CheckoutRequest {
  items: string[];
  customer_email: string;
  customer_name?: string;
  business_name?: string;
}

interface CheckoutResponse {
  checkout_url: string;
  session_id: string;
}
```

### ServiceId

```typescript
type ServiceId =
  | "lead-gen" | "voice-agent" | "chatbot" | "seo" | "ads"
  | "email" | "social" | "reviews" | "booking" | "crm"
  | "website" | "analytics" | "content" | "reputation"
  | "retargeting" | "ai-receptionist" | "customer-ltv"
  | "aeo" | "ai-estimate" | "fsm-sync" | "custom";
```

### BundleId

```typescript
type BundleId = "starter" | "growth" | "empire";
```

### MCPContext

```typescript
interface MCPContext {
  apiKeyId: string;
  accountId: string;
  clientId: string | null;
  scopes: string[];
}
```

### ProductListItem

```typescript
interface ProductListItem {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  tier: "infrastructure" | "revenue_engine" | "saas_lite";
  category: "mcp_server" | "rag_kit" | "security" | "agent" | "pipeline" | "template" | "toolkit" | "course" | "content_pack";
  price: number; // cents
  comparePrice: number | null;
  imageUrl: string | null;
  deliveryType: "download" | "access" | "api_key" | "github";
  features: string[];
  isPublished: boolean;
  isFeatured: boolean;
  salesCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
}
```
