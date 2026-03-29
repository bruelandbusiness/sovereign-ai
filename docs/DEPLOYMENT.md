# Deployment Runbook

> **Last Updated:** [PLACEHOLDER — DATE]
> **Owner:** [PLACEHOLDER — DEVOPS LEAD]
> **Review Cadence:** Quarterly

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Variable Reference](#environment-variable-reference)
3. [Production Deployment to Vercel](#production-deployment-to-vercel)
4. [Database Migration Procedures](#database-migration-procedures)
5. [Rollback Procedures](#rollback-procedures)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Incident Response](#incident-response)

---

## Pre-Deployment Checklist

Complete **every item** before initiating a production deployment.

### Code Quality

- [ ] All CI checks pass (lint, type-check, unit tests, integration tests)
- [ ] Code reviewed and approved by at least one peer
- [ ] No critical or high-severity Dependabot / security alerts open
- [ ] Feature branch merged into `main` via squash-merge
- [ ] Changelog / release notes updated

### Environment

- [ ] All required environment variables are set in Vercel dashboard (see table below)
- [ ] Secrets rotated if approaching expiration
- [ ] Database backups verified (< 24 hours old)
- [ ] Staging deployment tested and signed off

### Communication

- [ ] Deployment window communicated to team in `#deployments` channel
- [ ] Status page updated if maintenance window required
- [ ] On-call engineer confirmed and available

---

## Environment Variable Reference

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Prisma) | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `DIRECT_URL` | Yes | Direct DB connection (bypasses connection pooler) | `postgresql://user:pass@host:5432/db` |
| `STRIPE_SECRET_KEY` | Yes | Stripe API secret key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret | `whsec_...` |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (client-side) | `pk_live_...` |
| `SENDGRID_API_KEY` | Yes | SendGrid email API key | `SG....` |
| `SENDGRID_FROM_EMAIL` | Yes | Verified sender email | `notifications@[PLACEHOLDER].com` |
| `TWILIO_ACCOUNT_SID` | Yes | Twilio account SID | `AC...` |
| `TWILIO_AUTH_TOKEN` | Yes | Twilio auth token | `...` |
| `TWILIO_PHONE_NUMBER` | Yes | Twilio sending phone number | `+1XXXXXXXXXX` |
| `NEXT_PUBLIC_APP_URL` | Yes | Public-facing application URL | `https://app.[PLACEHOLDER].com` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (Next.js public) | `pk_live_...` |
| `NEXTAUTH_SECRET` | Yes | NextAuth.js session encryption secret | 32+ char random string |
| `NEXTAUTH_URL` | Yes | Canonical URL for NextAuth | `https://app.[PLACEHOLDER].com` |
| `OPENAI_API_KEY` | Conditional | OpenAI API key (if AI features enabled) | `sk-...` |
| `ANTHROPIC_API_KEY` | Conditional | Anthropic API key (Claude integration) | `sk-ant-...` |
| `REDIS_URL` | Optional | Redis connection for caching / queues | `redis://...` |
| `SENTRY_DSN` | Optional | Sentry error tracking DSN | `https://...@sentry.io/...` |
| `LOG_LEVEL` | Optional | Application log level | `info` |

> **Security Note:** Never commit secrets to version control. Use Vercel's encrypted environment variable store or a secrets manager.

---

## Production Deployment to Vercel

### Automated Deployment (Preferred)

Merging to `main` triggers an automatic Vercel production deployment.

```
1. Merge PR to main
2. Vercel build triggers automatically
3. Monitor build in Vercel dashboard → Deployments
4. Verify deployment URL resolves
5. Run post-deployment checks (see below)
```

### Manual Deployment

Use when automated deployment is disabled or a hotfix is needed.

```bash
# 1. Ensure you are on the correct branch
git checkout main
git pull origin main

# 2. Verify environment
vercel env ls --environment production

# 3. Deploy to production
vercel --prod

# 4. Note the deployment URL from output
# Example: https://sovereign-ai-XXXXXX.vercel.app
```

### Build Configuration

| Setting | Value |
|---|---|
| Framework | Next.js |
| Build Command | `npx prisma generate && next build` |
| Output Directory | `.next` |
| Install Command | `npm ci` |
| Node.js Version | 18.x |
| Root Directory | `/` |

---

## Database Migration Procedures

### Running Migrations in Production

```bash
# 1. Generate migration from schema changes (development)
npx prisma migrate dev --name descriptive_migration_name

# 2. Review the generated SQL in prisma/migrations/
cat prisma/migrations/YYYYMMDDHHMMSS_descriptive_migration_name/migration.sql

# 3. Commit the migration file
git add prisma/migrations/
git commit -m "db: add migration — descriptive_migration_name"

# 4. Deploy migration to production
#    Option A: Automatic — runs during Vercel build via postinstall
#    Option B: Manual —
npx prisma migrate deploy
```

### Migration Safety Checklist

- [ ] Migration SQL reviewed for destructive operations (DROP, ALTER column type)
- [ ] Large table migrations tested against production-size dataset
- [ ] Backward-compatible changes only (additive preferred)
- [ ] If destructive: two-phase migration planned (add new → migrate data → remove old)
- [ ] Database backup taken immediately before migration
- [ ] Estimated migration duration documented

### Seeding Production Data

```bash
# Only run for initial setup or reference data updates
npx prisma db seed
```

### Schema Drift Detection

```bash
# Compare current database state to Prisma schema
npx prisma migrate status

# If drift detected, resolve before deploying new migrations
npx prisma migrate resolve --applied MIGRATION_NAME
```

---

## Rollback Procedures

### Vercel Deployment Rollback

**Time to rollback: < 2 minutes**

1. Open [Vercel Dashboard](https://vercel.com) → Project → Deployments
2. Find the last known-good deployment
3. Click the three-dot menu → **Promote to Production**
4. Verify the rollback deployment is live
5. Notify team in `#deployments`

```bash
# CLI alternative
vercel rollback [DEPLOYMENT_URL]
```

### Database Rollback

> **WARNING:** Database rollbacks are destructive. Always prefer forward-fixing with a new migration.

#### Option A: Forward-Fix (Preferred)

```bash
# Create a new migration that reverses the problematic changes
npx prisma migrate dev --name revert_problematic_change
npx prisma migrate deploy
```

#### Option B: Point-in-Time Recovery

1. Contact database provider ([PLACEHOLDER — e.g., Supabase, Neon, PlanetScale])
2. Request point-in-time recovery to timestamp **before** the migration
3. Update `DATABASE_URL` to restored instance
4. Redeploy application
5. Verify data integrity

#### Option C: Manual SQL Rollback

```bash
# Connect to production database
psql $DATABASE_URL

# Execute the reverse SQL (must be prepared in advance)
\i rollback_scripts/YYYYMMDDHHMMSS_rollback.sql

# Mark migration as rolled back
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

### Rollback Decision Matrix

| Severity | Symptoms | Action |
|---|---|---|
| **P0 — Site Down** | 5xx errors, app unreachable | Immediate Vercel rollback |
| **P1 — Major Feature Broken** | Core workflow fails, payments affected | Rollback within 15 min if no hotfix |
| **P2 — Minor Feature Broken** | Non-critical feature regression | Forward-fix within 4 hours |
| **P3 — Cosmetic** | UI glitch, typo | Forward-fix in next release |

---

## Post-Deployment Verification

Run these checks within 10 minutes of every production deployment.

### Automated Smoke Tests

```bash
# Run production smoke test suite
npm run test:smoke -- --env=production
```

### Manual Verification Checklist

- [ ] Landing page loads correctly
- [ ] User can sign up / sign in
- [ ] Dashboard renders with data
- [ ] Stripe checkout flow works (use test card `4242 4242 4242 4242`)
- [ ] Email notifications trigger (check SendGrid activity)
- [ ] SMS notifications trigger (check Twilio logs)
- [ ] API health endpoint returns 200: `curl https://[PLACEHOLDER_APP_URL]/api/health`
- [ ] Webhook endpoints responding (Stripe dashboard → Webhooks)
- [ ] No new errors in Sentry / error tracking
- [ ] Database connection pool healthy (check provider dashboard)

---

## Incident Response

### During a Failed Deployment

1. **Assess** — Check Vercel build logs for errors
2. **Decide** — Rollback or forward-fix (see decision matrix above)
3. **Act** — Execute rollback or deploy hotfix
4. **Communicate** — Update `#incidents` channel with status
5. **Document** — Create post-incident report within 48 hours

### Contacts

| Role | Name | Contact |
|---|---|---|
| DevOps Lead | [PLACEHOLDER] | [PLACEHOLDER] |
| Backend Lead | [PLACEHOLDER] | [PLACEHOLDER] |
| Database Admin | [PLACEHOLDER] | [PLACEHOLDER] |
| On-Call Engineer | Rotating — see PagerDuty | [PLACEHOLDER] |

---

## Appendix: Useful Commands

```bash
# View Vercel deployment logs
vercel logs [DEPLOYMENT_URL]

# Check Prisma migration status
npx prisma migrate status

# Open Prisma Studio (database GUI)
npx prisma studio

# Verify environment variables are set
vercel env ls --environment production

# Tail application logs
vercel logs --follow
```
