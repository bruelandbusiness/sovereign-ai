# Monitoring & Alerting

## Existing Monitoring Infrastructure

### Sentry Error Tracking

Sentry is initialized in `sentry.server.config.ts` and `sentry.edge.config.ts`,
loaded via `src/instrumentation.ts`. It captures:

- Unhandled promise rejections and uncaught exceptions (via `instrumentation.ts`)
- Request-level errors via `onRequestError` / `captureRequestError`
- Client-side errors via the global error boundary (`src/components/ui/ErrorBoundary.tsx`)

### Telegram Alerts

Critical errors are routed to Telegram via `src/lib/telegram/alerts.ts`.
Configuration is per-account in the `TelegramConfig` table, with alert level
filtering (`critical`, `warning`, `info`, `revenue`, `lead`, `report`).

The error logger (`src/lib/monitoring/error-logger.ts`) sends Telegram alerts
automatically for `critical` severity. All errors are also persisted to the
`AuditLog` table for the admin monitoring dashboard.

### Health Check Endpoints

| Endpoint | Purpose | Auth |
|---|---|---|
| `GET /api/health` | Basic health — DB connectivity, memory, uptime | None (public) |
| `GET /api/health/deep` | Full dependency check — DB, Stripe, SendGrid, Redis | None (rate-limited) |
| `GET /api/cron/system-health` | Scheduled health sweep with alerting | Cron secret |

### Admin Monitoring Dashboard

The admin UI at `/admin/monitoring` displays real-time health status, recent
errors, and system metrics using SWR polling against the health and monitoring
API routes.

## External Uptime Monitoring

Point an external monitor at **`/api/health`** (basic) or **`/api/health/deep`**
(full dependency check). Recommended services:

- **UptimeRobot** (free tier: 5-min intervals, 50 monitors)
- **Better Uptime** (1-min intervals, status pages, on-call scheduling)
- **Vercel Analytics** (built-in, no setup needed for Vercel-hosted apps)

Configure the monitor to alert on HTTP status >= 500. The deep health endpoint
returns 503 when critical dependencies (database, Stripe) are down.

## Performance Headers

### Server-Timing

The middleware (`middleware.ts`) sets a `Server-Timing` header on every response:

```
Server-Timing: total;dur=3
```

This measures middleware execution time and is visible in browser DevTools
(Network tab -> Timing) and in synthetic monitoring tools.

### Rate Limit Headers

All rate-limited endpoints return standard headers via `src/lib/rate-limit.ts`:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-RateLimit-Reset: 1711382400
```

The deep health endpoint is limited to 60 requests per minute per IP.

## Log Aggregation

Vercel automatically captures `console.log`, `console.error`, and structured
logger output. Access logs via:

- **Vercel Dashboard** -> Project -> **Logs** (real-time tail and search)
- **Vercel Log Drains** -> Forward to Datadog, Axiom, or Logflare for long-term retention

The app uses a structured logger (`src/lib/logger.ts`) that outputs JSON in
production, making log search and filtering straightforward.

## Alert Escalation

| Priority | Channel | Trigger | Response Time |
|---|---|---|---|
| P0 Critical | Sentry + Telegram + Email | Unhandled exceptions, DB down, payment failures | Immediate |
| P1 Warning | Sentry + Telegram | Degraded performance, high memory, slow queries | < 1 hour |
| P2 Info | Sentry dashboard | Non-critical warnings, rate limit hits | Next business day |

### Escalation Flow

1. **Sentry** captures the error and applies deduplication / fingerprinting
2. **Error logger** persists to AuditLog and fires Telegram alert for critical
3. **Telegram** delivers instant notification to configured chat(s)
4. **Email** (configure via Sentry notification rules) for P0 if unacknowledged

### Recommended Sentry Alert Rules

- **New unhandled error** -> Telegram + Email immediately
- **Error volume spike** (10x baseline in 5 min) -> Telegram
- **Transaction duration** > 5s p95 -> Slack/Email digest
