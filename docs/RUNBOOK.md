# Sovereign AI -- Incident Response Runbook

## 1. System Health Check

### Quick Status

```bash
# Production health check
curl -s https://trysovereignai.com/api/health | jq .

# Expected response:
# { "status": "ok", "version": "0.1.0", "timestamp": "...", "checks": { "database": { "status": "connected", "latencyMs": 12 }, "memory": { ... }, "uptime": { ... } } }
```

**Status values**:
- `ok` -- all systems operational
- `degraded` -- DB latency >1s, DB timeout, or heap usage >90%
- `error` -- DB connection failed (returns HTTP 503)

### Automated Monitoring

- **Cron health check**: `/api/cron/system-health` runs every 5 minutes
- **Hourly health check**: `/api/cron/health-check` runs every hour
- **Sentry**: Errors auto-reported; dashboard at https://sentry.io (10% trace sampling)

---

## 2. Checking Logs

### Vercel Logs

```bash
# Via Vercel CLI
vercel logs --follow
vercel logs --since 1h

# Or: Vercel Dashboard > Project > Deployments > Functions tab
```

### Sentry

- **URL**: https://sentry.io (check `.env` for `NEXT_PUBLIC_SENTRY_DSN`)
- Errors include serialized stack traces, request context
- Structured JSON logs in production (via `logger.ts`)
- Filter by: `level:error`, endpoint path, user ID

### Telegram Alerts

- Cron digest: `/api/cron/telegram-digest` runs daily at 8am UTC
- Morning brief: `/api/cron/morning-brief` runs daily at 3pm UTC
- Evening digest: `/api/cron/evening-digest` runs daily at 1am UTC
- Bot webhook at `/api/webhooks/telegram` for interactive commands

### Application Logs (Structured)

In production, all logs are JSON-formatted single-line entries:
```json
{"timestamp":"2026-03-25T10:00:00.000Z","level":"error","message":"[leads/capture] Nurture email queue failed:","error":{"name":"Error","message":"..."}}
```

---

## 3. Common Issues and Fixes

### Database Connection Failures

**Symptoms**: Health endpoint returns `"status": "error"`, API routes return 500s.

**Diagnosis**:
```bash
curl -s https://trysovereignai.com/api/health | jq '.checks.database'
```

**Fixes**:
1. Check Neon dashboard for database status (https://console.neon.tech)
2. Verify `DATABASE_URL` is correctly set in Vercel environment variables
3. Check if connection pool is exhausted (max 10 connections configured in `db.ts`)
4. Neon serverless may cold-start -- retry after 5-10 seconds
5. If persistent, check Neon status page for outages

### Rate Limit Hit (429 Responses)

**Symptoms**: Users getting "Too many requests" errors.

**Diagnosis**: Check `X-RateLimit-Remaining` and `X-RateLimit-Reset` response headers.

**Fixes**:
1. If Upstash Redis is configured, check Redis dashboard for key inspection
2. Without Redis (in-memory fallback), rate limits reset per Vercel function instance
3. Rate limits by endpoint: magic link (5/hr), checkout (10/hr), lead capture (10/hr), reads (60/hr)
4. For legitimate high-traffic, adjust limits in the relevant route handler

### Stripe Webhook Failures

**Symptoms**: Payments succeed in Stripe but subscriptions not created in DB.

**Diagnosis**:
1. Check Stripe Dashboard > Developers > Webhooks > Recent events
2. Look for failed deliveries and error messages
3. Check Vercel logs for `/api/payments/webhooks/stripe` errors

**Fixes**:
1. Verify `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are set in Vercel env vars
2. Verify webhook endpoint URL is correct in Stripe Dashboard
3. Check that webhook signing secret matches (`STRIPE_WEBHOOK_SECRET`)
4. Stripe webhooks bypass CSRF validation (excluded in middleware.ts)
5. Re-send failed events from Stripe Dashboard > Webhooks > Resend

### Cron Job Failures

**Symptoms**: Automated tasks not running (emails not sent, reports not generated).

**Diagnosis**:
```bash
# Check Vercel cron execution logs
vercel logs --since 24h | grep "cron"
```

**Fixes**:
1. Verify `CRON_SECRET` is set in Vercel environment variables
2. Check `vercel.json` for correct cron schedule syntax
3. Individual cron routes are in `src/app/api/cron/` -- check the specific handler
4. Cron jobs have a 60-second execution limit on Vercel Hobby plan

### Email Delivery Issues

**Symptoms**: Magic links or nurture emails not arriving.

**Fixes**:
1. Check email queue: `/api/cron/email-queue` runs every 5 minutes
2. Verify email provider credentials in environment variables
3. Check spam folders -- review SPF/DKIM/DMARC records
4. Check `logger` output for `[email]` prefixed errors

---

## 4. Deployment Rollback

### Vercel Rollback (Recommended)

```bash
# List recent deployments
vercel ls

# Promote a previous deployment to production
vercel promote <deployment-url>
```

Or via Vercel Dashboard:
1. Go to Project > Deployments
2. Find the last known-good deployment
3. Click the three-dot menu > "Promote to Production"

### Git Rollback (if needed)

```bash
# Revert the problematic commit
git revert <commit-sha>
git push origin main

# Vercel will auto-deploy the revert
```

---

## 5. Database Migration Procedure

### Development

```bash
# Create and apply a new migration
npx prisma migrate dev --name descriptive_name

# Seed the database
npm run db:seed

# Open Prisma Studio for inspection
npm run db:studio
```

### Production

```bash
# Apply pending migrations (non-interactive, safe for CI)
npx prisma migrate deploy
```

**Pre-migration checklist**:
1. Test migration locally against a copy of production data
2. Check for destructive changes (column drops, type changes)
3. Ensure `prisma generate` runs as part of the build (`package.json` build script)
4. Back up the database via Neon dashboard before destructive migrations
5. Schedule migrations during low-traffic windows

**Rollback a migration**:
- Prisma does not auto-rollback. Write a corrective migration to undo changes.
- For emergencies, restore from Neon point-in-time recovery.

---

## 6. Emergency Contacts / Escalation

| Level | Action | Responsible |
|-------|--------|-------------|
| L1 | Check health endpoint, review logs | On-call engineer |
| L2 | Vercel rollback, Stripe webhook resend | Senior engineer |
| L3 | Database restore, infrastructure changes | Platform lead |

**External Service Status Pages**:
- Vercel: https://www.vercel-status.com
- Neon: https://neonstatus.com
- Stripe: https://status.stripe.com
- Sentry: https://status.sentry.io

---

## 7. Quick Reference

| Task | Command / Action |
|------|-----------------|
| Check health | `curl /api/health` |
| View logs | `vercel logs --follow` |
| Rollback deploy | `vercel promote <url>` or Vercel Dashboard |
| Run migration | `npx prisma migrate deploy` |
| Open DB GUI | `npm run db:studio` |
| Check Stripe webhooks | Stripe Dashboard > Developers > Webhooks |
| Resend failed webhook | Stripe Dashboard > Webhooks > Resend |
| Check cron schedules | `vercel.json` > `crons` array |
| Deploy checklist | `npm run deploy:checklist` |
