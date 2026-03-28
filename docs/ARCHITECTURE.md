# Sovereign AI -- Architecture Overview

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.x |
| UI | React | 19.2.x |
| Styling | Tailwind CSS | 4.x |
| ORM | Prisma (with `@prisma/adapter-pg`) | 7.5.x |
| Database | PostgreSQL (Neon serverless) | -- |
| Payments | Stripe | 20.x |
| AI | Anthropic Claude SDK | 0.79.x |
| Validation | Zod | 4.x |
| Data Fetching | SWR | 2.x |
| Error Monitoring | Sentry (`@sentry/nextjs`) | 10.x |
| Email | Custom (with queue system) | -- |
| SMS/Voice | Twilio | 5.x |
| Push | web-push | 3.x |
| Animations | Framer Motion | 12.x |
| UI Components | shadcn/ui + Base UI | -- |
| Testing | Vitest (unit), Playwright (e2e) | 4.x / 1.x |
| Storybook | Storybook | 10.x |

Deployed on **Vercel** with cron jobs defined in `vercel.json`.

---

## Directory Structure

```
sovereign-ai/
├── middleware.ts            # Edge middleware (CSRF, auth redirects, security headers)
├── vercel.json              # Cron schedules, security headers
├── prisma/
│   └── schema.prisma        # Database schema
├── src/
│   ├── app/
│   │   ├── api/             # API route handlers (Next.js App Router)
│   │   │   ├── auth/        # Magic link, Google OAuth, sessions
│   │   │   ├── dashboard/   # Authenticated client endpoints
│   │   │   ├── admin/       # Admin-only endpoints
│   │   │   ├── payments/    # Stripe checkout, webhooks, subscriptions
│   │   │   ├── services/    # AI service-specific endpoints
│   │   │   ├── leads/       # Lead capture and management
│   │   │   ├── cron/        # ~50 scheduled jobs (Vercel cron)
│   │   │   ├── health/      # Public health check
│   │   │   ├── webhooks/    # Telegram webhook
│   │   │   └── ...          # Discovery, outreach, MCP, etc.
│   │   └── (pages)/         # App Router pages (dashboard, admin, marketing)
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── dashboard/       # Dashboard-specific components
│   │   ├── admin/           # Admin panel components
│   │   ├── landing/         # Marketing pages
│   │   └── shared/          # Cross-cutting components
│   ├── hooks/               # Custom React hooks
│   │   ├── useDashboard.ts  # Dashboard data fetching
│   │   ├── useAutopilot.ts  # Autopilot service controls
│   │   ├── useNotifications.ts
│   │   └── ...
│   ├── lib/                 # Server-side utilities and business logic
│   │   ├── auth.ts          # Session/magic link management
│   │   ├── db.ts            # Prisma client (lazy, pooled via pg)
│   │   ├── stripe.ts        # Stripe client
│   │   ├── rate-limit.ts    # Rate limiter (Upstash Redis or in-memory)
│   │   ├── cache.ts         # In-memory LRU cache with TTL
│   │   ├── logger.ts        # Structured logger (JSON in prod)
│   │   ├── csrf.ts          # Origin-based CSRF validation
│   │   ├── require-client.ts # Auth guard for client routes
│   │   ├── require-admin.ts # Auth guard for admin routes
│   │   ├── email.ts         # Email sending
│   │   ├── email-queue.ts   # Async email queue
│   │   ├── telegram/        # Telegram bot integration
│   │   ├── constants/       # Service definitions, tier limits
│   │   ├── compliance/      # GDPR/consent management
│   │   ├── security/        # Security utilities
│   │   └── ...              # 80+ modules for AI services, integrations
│   ├── generated/           # Prisma generated client
│   ├── styles/              # Global styles
│   ├── tokens/              # Design tokens
│   └── types/               # TypeScript type definitions
├── e2e/                     # Playwright end-to-end tests
├── stories/                 # Storybook stories
├── scripts/                 # Build/deploy helper scripts
└── public/                  # Static assets
```

---

## Key Patterns

### Authentication Flow

1. **Magic Link** (primary):
   - User submits email to `POST /api/auth/send-magic-link`
   - Server generates a token (32 random bytes), stores in `MagicLink` table with 15-min expiry
   - Email sent with link to `GET /api/auth/verify?token=<token>`
   - On verify: token validated, marked used, session created (30-day expiry)
   - Session token set as `sovereign-session` HTTP-only cookie (Secure, SameSite=Lax)

2. **Google OAuth**:
   - `GET /api/auth/google` redirects to Google with CSRF state cookie
   - Callback validates state, exchanges code for tokens, calls `findOrCreateAccountByEmail`
   - Session created via same `createSession()` flow

3. **Session Management**:
   - `getSession()` reads cookie, looks up session in DB, validates expiry
   - `touchSession()` updates `lastUsedAt` in background (non-blocking)
   - `rotateSession()` generates new token, invalidates old one
   - `revokeSession()` / `revokeAllSessions()` for explicit logout

### API Route Structure

Every API route follows a consistent pattern:

```typescript
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // 1. Rate limit by IP
  const rl = await rateLimitByIP(ip, "action-name", maxPerHour);
  if (!rl.allowed) return 429 response with rate limit headers;

  // 2. Auth check (one of three patterns)
  //    - requireClient() → client-facing routes (throws AuthError)
  //    - requireAdmin()  → admin routes (throws AuthError)
  //    - getSession()    → optional auth

  // 3. Input validation with Zod schema
  const parsed = schema.safeParse(body);
  if (!parsed.success) return 400 with field errors;

  // 4. Business logic (Prisma queries, external API calls)
  // 5. Return JSON response
}
```

### Rate Limiting

- **Production**: Upstash Redis (INCR + EXPIRE fixed-window pattern)
- **Development**: In-memory token bucket with automatic cleanup
- Graceful degradation: if Redis fails, requests are allowed through
- Standard headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Per-endpoint limits (e.g., 5/hr for magic links, 10/hr for checkout, 60/hr for reads)

### Error Handling

- **AuthError class**: Typed errors with HTTP status codes (401, 403, 500)
- **Structured logging**: `logger.errorWithCause()` serializes errors safely (no leaked connection strings)
- **Sentry integration**: Client, server, and edge configs (`sentry.*.config.ts`); 10% trace sampling in production
- **Best-effort side effects**: Non-critical operations (email queue, follow-up enrollment) catch errors silently
- **Health endpoint sanitization**: Raw DB errors stripped in production

### Middleware (Edge)

The `middleware.ts` runs on every matched request:

1. **Body size limit**: Rejects payloads > 1 MB (413)
2. **CSRF protection**: Validates Origin header on POST/PUT/PATCH/DELETE to `/api/*` (excludes Stripe webhooks)
3. **Auth redirects**: Unauthenticated users on `/dashboard` or `/admin` redirected to `/login`
4. **Security headers**: HSTS, CSP, X-Frame-Options, CORP, COOP, etc.
5. **Performance**: Server-Timing header with middleware duration

---

## AI Service Architecture

The platform manages **16 client-facing AI services** (defined in `src/lib/constants.ts`) plus internal service modules for backend automation. Internal service module IDs include:

| Service | Description |
|---------|-------------|
| `ads` | Paid advertising management |
| `aeo` | AI Engine Optimization (LLM visibility) |
| `analytics` | Performance analytics |
| `booking` | Appointment booking automation |
| `chatbot` | AI chatbot for lead engagement |
| `content` | AI-generated content (blog, social) |
| `email` | Email campaign automation |
| `estimate` | AI-powered job estimating |
| `fsm` | Field service management integration |
| `gbp` | Google Business Profile optimization |
| `ltv` | Lifetime value optimization |
| `receptionist` | AI phone receptionist |
| `referral-program` | Referral program management |
| `reputation` | Online reputation management |
| `retargeting` | Ad retargeting automation |
| `reviews` | Review monitoring and response |
| `seo` | Search engine optimization |
| `social` | Social media management |
| `social-proof` | Social proof widgets |
| `voice` | Voice/TTS capabilities |

**Activation Model**:
- Services are linked to clients via the `ClientService` table
- Each record has a `serviceId`, `status`, and `activatedAt` timestamp
- The `GET /api/dashboard/services` endpoint returns active services for the authenticated client
- Service bundles (DIY $497, Starter $3,497, Growth $6,997, Empire $12,997) pre-configure sets of services

**Cron Automation**:
- ~50 cron jobs defined in `vercel.json` run service-specific automation
- Frequencies range from every 5 minutes (email queue, system health) to quarterly (QBR generation)
- Each cron route is protected by `CRON_SECRET` bearer token

---

## Data Flow

```
┌─────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Client  │────>│  Middleware   │────>│  API Route   │────>│    Prisma    │
│ (Browser)│     │  (Edge)      │     │  Handler     │     │   (ORM)      │
└─────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                 │                    │                     │
                 ├─ Body size check   ├─ Rate limit         ├─ PrismaPg adapter
                 ├─ CSRF validation   ├─ Auth (session)     ├─ pg Pool (max 10)
                 ├─ Auth redirect     ├─ Zod validation     ├─ Lazy initialization
                 └─ Security headers  ├─ Business logic     └─> PostgreSQL (Neon)
                                      ├─ Cache (in-memory)
                                      └─> External APIs
                                           ├─ Stripe
                                           ├─ Anthropic (Claude)
                                           ├─ Twilio
                                           ├─ Google OAuth
                                           └─ Telegram
```

**Database Connection**:
- Prisma uses `@prisma/adapter-pg` with a `pg.Pool` (max 10 connections, 10s connect timeout, 30s idle timeout)
- The Prisma client is **lazily initialized** via a `Proxy` -- it only connects when first accessed, preventing crashes during static builds
- In development, the client is stored on `globalThis` to survive HMR
- Graceful shutdown handlers on SIGTERM/SIGINT disconnect the pool

**Caching**:
- In-memory LRU cache (max 500 entries) with TTL per key
- Cache-aside pattern via `cache.wrap(key, ttlSeconds, factory)`
- Used for dashboard data, service lists, and other read-heavy endpoints
- Per-instance cache (not shared across Vercel function instances)

---

## Deployment

- **Platform**: Vercel (serverless functions + edge middleware)
- **Database**: Neon PostgreSQL (serverless, connection pooling via pg)
- **Monitoring**: Sentry (errors + 10% traces), Telegram alerts, Vercel logs
- **CI/CD**: Vercel Git integration (auto-deploy on push)
- **Migrations**: `prisma migrate dev` (local), `prisma migrate deploy` (production)
- **Build**: `prisma generate && next build`

---

## Key Configuration Files

| File | Purpose |
|------|---------|
| `middleware.ts` | Edge middleware (CSRF, auth, security headers) |
| `vercel.json` | Cron schedules, security headers |
| `prisma/schema.prisma` | Database schema |
| `next.config.ts` | Next.js configuration |
| `sentry.*.config.ts` | Sentry init (client, server, edge) |
| `.env.example` | Required environment variables |
| `prisma.config.ts` | Prisma configuration |
