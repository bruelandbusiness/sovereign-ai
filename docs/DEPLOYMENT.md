# Deployment Runbook -- Sovereign AI Platform

> **Stack:** Next.js, Prisma (PostgreSQL), Stripe, SendGrid, Twilio, Sentry, Upstash Redis, Vercel
> **Review Cadence:** Quarterly

---

## Table of Contents

1. [Pre-deployment Checklist](#1-pre-deployment-checklist)
2. [Environment Variables](#2-environment-variables)
3. [Deployment Steps (Vercel)](#3-deployment-steps-vercel)
4. [Database Migration Procedure](#4-database-migration-procedure)
5. [Rollback Procedure](#5-rollback-procedure)
6. [Post-deployment Verification](#6-post-deployment-verification)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Pre-deployment Checklist

Complete every item before initiating a production deployment. Do not skip steps.

### Build and Tests

- [ ] `npx next build` completes with 0 errors
- [ ] `npx vitest run` -- all unit and integration tests pass
- [ ] `npx playwright test` -- all E2E tests pass
- [ ] `npx tsc --noEmit` -- no TypeScript errors
- [ ] `npx eslint .` -- no lint errors or warnings

### Environment

- [ ] All required environment variables are set in the Vercel dashboard (see Section 2)
- [ ] Secrets reviewed and rotated if approaching expiration
- [ ] Database backups verified (less than 24 hours old)

### Database

- [ ] All pending Prisma migrations committed to `prisma/migrations/`
- [ ] Migration SQL reviewed for destructive operations (DROP, ALTER column type)
- [ ] `npx prisma migrate status` shows no drift
- [ ] If destructive changes exist, two-phase migration plan documented

### Code Review and Communication

- [ ] Code reviewed and approved by at least one peer
- [ ] No critical or high-severity Dependabot/security alerts open
- [ ] Feature branch merged into `main` via squash-merge
- [ ] Deployment window communicated to team
- [ ] On-call engineer confirmed and available

---

## 2. Environment Variables

Set all variables in the Vercel dashboard under Settings > Environment Variables. Never commit secrets to version control.

### Database

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (pooled, used by Prisma Client) | `postgresql://user:pass@host:5432/db?sslmode=require&pgbouncer=true` |
| `DIRECT_URL` | Yes | Direct PostgreSQL connection (bypasses connection pooler, used by Prisma Migrate) | `postgresql://user:pass@host:5432/db?sslmode=require` |

### Authentication

| Variable | Required | Description | Example |
|---|---|---|---|
| `NEXTAUTH_SECRET` | Yes | Session encryption secret (32+ random characters) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Canonical application URL for NextAuth callbacks | `https://app.example.com` |
| `MAGIC_LINK_SECRET` | Yes | Secret for signing magic link tokens | `openssl rand -base64 32` |

### Stripe (Payments)

| Variable | Required | Description | Example |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Yes | Stripe API secret key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook endpoint signing secret | `whsec_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (exposed to client) | `pk_live_...` |

### Email (SendGrid)

| Variable | Required | Description | Example |
|---|---|---|---|
| `SENDGRID_API_KEY` | Yes | SendGrid API key for transactional email | `SG.xxxx` |
| `EMAIL_FROM` | Yes | Verified sender email address | `notifications@example.com` |

### AI Services

| Variable | Required | Description | Example |
|---|---|---|---|
| `OPENAI_API_KEY` | Conditional | OpenAI API key (required if AI content features are enabled) | `sk-...` |
| `ANTHROPIC_API_KEY` | Conditional | Anthropic API key (required for Claude integration) | `sk-ant-...` |

### Twilio (SMS/Voice)

| Variable | Required | Description | Example |
|---|---|---|---|
| `TWILIO_ACCOUNT_SID` | Yes | Twilio account SID | `AC...` |
| `TWILIO_AUTH_TOKEN` | Yes | Twilio auth token | `(secret)` |
| `TWILIO_PHONE_NUMBER` | Yes | Twilio sending phone number (E.164 format) | `+15551234567` |

### Monitoring (Sentry)

| Variable | Required | Description | Example |
|---|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Yes | Sentry DSN for client and server error tracking | `https://xxx@xxx.ingest.sentry.io/xxx` |
| `SENTRY_AUTH_TOKEN` | Yes | Sentry auth token for source map uploads during build | `sntrys_...` |

### Cron Jobs

| Variable | Required | Description | Example |
|---|---|---|---|
| `CRON_SECRET` | Yes | Shared secret to authenticate Vercel cron job requests | `openssl rand -base64 32` |

### Redis (Upstash)

| Variable | Required | Description | Example |
|---|---|---|---|
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis REST API URL | `https://xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis REST API token | `AXxx...` |

### Vercel Platform

| Variable | Required | Description | Example |
|---|---|---|---|
| `NEXT_PUBLIC_VERCEL_ENV` | Auto | Set automatically by Vercel (`production`, `preview`, `development`) | `production` |
| `NEXT_PUBLIC_VERCEL_URL` | Auto | Set automatically by Vercel (deployment URL without protocol) | `sovereign-ai-xxx.vercel.app` |

> **Note:** `NEXT_PUBLIC_VERCEL_ENV` and `NEXT_PUBLIC_VERCEL_URL` are injected automatically by Vercel. Do not set them manually.

---

## 3. Deployment Steps (Vercel)

### Automated Deployment (Preferred)

Merging to `main` triggers an automatic Vercel production deployment.

```
1. Open a PR against main
2. Vercel creates a preview deployment automatically
3. Review the preview deployment URL in the PR checks
4. Merge PR to main (squash-merge)
5. Vercel production build triggers automatically
6. Monitor build at: Vercel Dashboard > Project > Deployments
7. Run post-deployment verification (Section 6)
```

### Preview Deployments

Every pull request receives an automatic preview deployment:

- Preview URL appears as a GitHub check on the PR
- Preview deployments use the `preview` environment variables in Vercel
- Use preview deployments for QA, stakeholder review, and E2E testing against a live environment
- Preview deployments are automatically deleted when the branch is deleted

### Manual Deployment via Vercel CLI

Use when automated deployment is disabled or a hotfix is required.

```bash
# Install the Vercel CLI (if not already installed)
npm i -g vercel

# Authenticate
vercel login

# Pull environment variables locally
vercel env pull .env.local

# Deploy to preview (for testing)
vercel

# Deploy to production
vercel --prod
```

### Build Configuration

| Setting | Value |
|---|---|
| Framework | Next.js |
| Build Command | `prisma generate && next build` |
| Output Directory | `.next` |
| Install Command | `npm ci` |
| Node.js Version | 18.x |
| Root Directory | `/` |

---

## 4. Database Migration Procedure

### Production: Apply Pending Migrations

Use `prisma migrate deploy` in production. This command applies all pending migrations from `prisma/migrations/` without generating new ones.

```bash
# Check current migration status
npx prisma migrate status

# Apply all pending migrations to production
DATABASE_URL="<production-direct-url>" npx prisma migrate deploy
```

> **Important:** Use the `DIRECT_URL` (not the pooled connection) when running migrations. Connection poolers like PgBouncer do not support the transactional DDL required by migrations.

### Development: Push Schema Changes

For rapid iteration in development, use `db push` to sync the schema without creating migration files:

```bash
npx prisma db push
```

To create a formal migration for production:

```bash
# Generate a migration file from schema diff
npx prisma migrate dev --name descriptive_migration_name

# Review the generated SQL
cat prisma/migrations/<timestamp>_descriptive_migration_name/migration.sql

# Commit the migration
git add prisma/migrations/
git commit -m "db: add migration -- descriptive_migration_name"
```

### Migration Safety Checklist

- [ ] Migration SQL reviewed for destructive operations
- [ ] Large table migrations tested against production-size dataset
- [ ] Backward-compatible (additive) changes preferred
- [ ] If destructive: two-phase migration planned (add new column > migrate data > drop old column)
- [ ] Database backup taken immediately before running migration
- [ ] Estimated migration duration documented for large tables

### Rollback a Failed Migration

```bash
# Mark a failed migration as rolled back
npx prisma migrate resolve --rolled-back <migration_name>

# Then either fix the migration and re-deploy, or create a new corrective migration
```

### Schema Drift Detection

```bash
# Compare database state to Prisma schema
npx prisma migrate status

# If a migration was applied outside of Prisma, mark it as applied
npx prisma migrate resolve --applied <migration_name>
```

---

## 5. Rollback Procedure

### Vercel Instant Rollback

**Time to rollback: under 2 minutes.**

#### Via Dashboard

1. Open the Vercel Dashboard > Project > Deployments
2. Find the last known-good deployment (green checkmark)
3. Click the three-dot menu on that deployment
4. Select **Promote to Production**
5. Verify the rolled-back deployment is live
6. Notify the team

#### Via CLI

```bash
# List recent deployments
vercel ls

# Rollback to a specific deployment
vercel rollback <DEPLOYMENT_URL>
```

### Rollback Decision Matrix

| Severity | Symptoms | Action | Timeline |
|---|---|---|---|
| **P0 -- Site Down** | 5xx errors, app unreachable, blank page | Immediate Vercel rollback | < 5 minutes |
| **P1 -- Major Feature Broken** | Payments failing, auth broken, data loss | Rollback if no hotfix within 15 min | < 15 minutes |
| **P2 -- Minor Feature Broken** | Non-critical feature regression | Forward-fix with hotfix PR | < 4 hours |
| **P3 -- Cosmetic** | UI glitch, copy error | Forward-fix in next release | Next deploy |

### Database Rollback Considerations

> **WARNING:** Database rollbacks are destructive and may cause data loss. Always prefer forward-fixing with a new migration.

#### Option A: Forward-Fix (Preferred)

Create a new migration that reverses the problematic changes:

```bash
npx prisma migrate dev --name revert_problematic_change
# Review the SQL, commit, and deploy
npx prisma migrate deploy
```

#### Option B: Point-in-Time Recovery

1. Contact your database provider (Supabase, Neon, etc.)
2. Request point-in-time recovery to a timestamp before the migration
3. Update `DATABASE_URL` and `DIRECT_URL` to point to the restored instance
4. Redeploy the application
5. Verify data integrity

#### Option C: Manual SQL Rollback

```bash
# Connect to production database
psql "$DIRECT_URL"

# Execute pre-prepared rollback SQL
\i rollback_scripts/<migration_name>_rollback.sql

# Mark the migration as rolled back in Prisma
npx prisma migrate resolve --rolled-back <migration_name>
```

> **Best practice:** For every destructive migration, prepare a rollback SQL script in advance and store it in `rollback_scripts/`.

---

## 6. Post-deployment Verification

Run these checks within 10 minutes of every production deployment.

### Health Check Endpoint

```bash
curl -sf https://<YOUR_DOMAIN>/api/health | jq .
# Expected: HTTP 200 with JSON body indicating healthy status
```

If the health endpoint returns a non-200 status, initiate rollback immediately.

### Smoke Test Critical Flows

```bash
# Run the tagged smoke test suite against production
PLAYWRIGHT_BASE_URL=https://<YOUR_DOMAIN> npx playwright test --grep @smoke
```

Manual verification checklist:

- [ ] Landing page loads correctly (no blank page, no console errors)
- [ ] User can sign up and sign in (magic link flow)
- [ ] Dashboard renders with data
- [ ] Stripe checkout flow works (use test card `4242 4242 4242 4242` on staging only)
- [ ] Email notifications trigger (check SendGrid Activity Feed)
- [ ] SMS notifications trigger (check Twilio console logs)
- [ ] Webhook endpoints responding (Stripe Dashboard > Webhooks > Recent events)

### Monitor Sentry for New Errors

1. Open the Sentry dashboard
2. Filter by the release tag matching the deployment
3. Check for any new unresolved issues in the first 30 minutes
4. If new P0/P1 errors appear, initiate rollback

### Verify Cron Jobs Running

The platform has 50+ cron jobs defined in `vercel.json`. Key jobs to verify after deployment:

| Job | Schedule | What to Check |
|---|---|---|
| `/api/cron/system-health` | Every 5 min | Vercel Functions tab shows recent invocations |
| `/api/cron/email-queue` | Every 5 min | Emails are being sent (check SendGrid) |
| `/api/cron/health-check` | Every hour | Vercel Cron tab shows successful runs |
| `/api/cron/content` | Daily 6 AM UTC | Content generation ran after deploy |
| `/api/cron/reviews` | Daily 9 AM UTC | Review collection ran |

To verify cron jobs:

1. Open Vercel Dashboard > Project > Cron Jobs
2. Confirm all cron jobs are listed and active
3. Check the "Last Run" column for recent successful executions
4. Verify `CRON_SECRET` is set -- cron endpoints validate this secret on every request

---

## 7. Troubleshooting

### Build Failures

**Symptom:** `npx next build` fails during Vercel deployment.

| Error | Cause | Fix |
|---|---|---|
| `prisma generate` fails | Prisma schema syntax error or missing `prisma/schema.prisma` | Run `npx prisma validate` locally, fix schema errors |
| TypeScript errors | Type mismatches introduced in PR | Run `npx tsc --noEmit` locally before pushing |
| Module not found | Missing dependency or incorrect import path | Run `npm ci` to ensure clean install, check import paths |
| Out of memory | Build exceeds Vercel memory limit | Add `NODE_OPTIONS=--max-old-space-size=4096` to Vercel env vars |
| ESLint errors | Lint rules violated | Run `npx eslint .` locally and fix before pushing |

### Environment Variable Issues

**Symptom:** Application boots but features fail silently.

```bash
# Verify all env vars are set in Vercel
vercel env ls --environment production

# Common mistakes:
# - NEXT_PUBLIC_ prefix missing on client-side variables
# - Variable set for "Preview" but not "Production"
# - Trailing whitespace in secret values
# - Using test keys (sk_test_) instead of live keys (sk_live_)
```

### Database Connection Errors

**Symptom:** `PrismaClientInitializationError` or `Connection refused`.

| Error | Cause | Fix |
|---|---|---|
| `Can't reach database server` | Wrong `DATABASE_URL` or DB is down | Verify connection string, check provider status page |
| `Too many connections` | Connection pool exhausted | Use connection pooler (PgBouncer), reduce pool size in `DATABASE_URL` (`?connection_limit=5`) |
| `Migration failed` | Schema drift or lock contention | Run `npx prisma migrate status`, resolve conflicts |
| `Prepared statement already exists` | PgBouncer in transaction mode with prepared statements | Add `&pgbouncer=true` to `DATABASE_URL` |

### Stripe Webhook Failures

**Symptom:** Stripe Dashboard shows failed webhook deliveries.

1. Verify `STRIPE_WEBHOOK_SECRET` matches the active webhook endpoint in Stripe
2. Check that the webhook URL points to the current production domain
3. Inspect the Vercel function logs for the webhook route
4. Test locally with `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Cron Job Failures

**Symptom:** Cron jobs not executing or returning errors.

1. Verify `CRON_SECRET` is set correctly in Vercel environment variables
2. Check Vercel Cron tab for error logs
3. Cron jobs have a 60-second timeout on the Hobby plan, 300 seconds on Pro
4. If a cron job consistently times out, optimize the handler or break it into smaller jobs
5. Verify the cron schedule in `vercel.json` matches expectations (schedules are in UTC)

### Sentry Source Maps Missing

**Symptom:** Sentry errors show minified stack traces.

1. Verify `SENTRY_AUTH_TOKEN` is set in Vercel environment variables
2. Check that `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts` are present in the project root
3. Confirm the Sentry webpack plugin runs during build (check build logs for "Uploading source maps")
4. Verify the Sentry org and project names in `next.config.ts`

### Redis/Upstash Connection Issues

**Symptom:** Rate limiting or caching not working.

1. Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
2. Test connectivity: `curl -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_URL/ping"`
3. Check Upstash dashboard for rate limit or quota exhaustion

### Preview Deployment Uses Wrong Environment

**Symptom:** Preview deployment connects to production database or services.

1. In Vercel, ensure separate values are set for "Preview" vs "Production" environments
2. Use test/staging credentials for all Preview environment variables
3. Never share `DATABASE_URL` between production and preview

---

## Appendix: Useful Commands

```bash
# View Vercel deployment logs
vercel logs <DEPLOYMENT_URL>

# Tail live logs
vercel logs --follow

# Check Prisma migration status
npx prisma migrate status

# Open Prisma Studio (database GUI)
npx prisma studio

# Verify environment variables
vercel env ls --environment production

# Run the pre-deploy checklist script
npm run deploy:checklist

# Seed the database (initial setup or reference data)
npm run db:seed

# Analyze bundle size
npm run analyze
```
