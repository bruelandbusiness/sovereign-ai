# Sovereign AI -- Production Deployment Runbook

## 1. Prerequisites

### Environment Variables (Required)

Verify all required environment variables are set in Vercel before deploying:

| Variable | Source | Notes |
|----------|--------|-------|
| `DATABASE_URL` | Neon console | Pooled connection string |
| `STRIPE_SECRET_KEY` | Stripe Dashboard | **Live** key (starts with `sk_live_`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard > Webhooks | Signing secret for webhook verification |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard | **Live** publishable key (starts with `pk_live_`) |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry project settings | Client-side error reporting |
| `SENTRY_AUTH_TOKEN` | Sentry > Settings > Auth Tokens | Source map uploads |
| `CRON_SECRET` | Self-generated | Random 32+ character string for cron auth |
| `TELEGRAM_BOT_TOKEN` | @BotFather | Telegram alert bot |
| `TELEGRAM_CHAT_ID` | Telegram | Alert destination chat/group |
| `TWILIO_ACCOUNT_SID` | Twilio console | SMS/voice services |
| `TWILIO_AUTH_TOKEN` | Twilio console | SMS/voice auth |
| `ANTHROPIC_API_KEY` | Anthropic console | Claude AI services |
| `AUTH_SECRET` | Self-generated | Random 32+ character string for session encryption |
| `ENCRYPTION_KEY` | Self-generated | Encryption key for sensitive data |
| `SENDGRID_API_KEY` | SendGrid console | Email delivery |
| `UPSTASH_REDIS_REST_URL` | Upstash console | Rate limiting (Redis) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash console | Rate limiting auth |
| `ELEVENLABS_API_KEY` | ElevenLabs console | Voice/TTS services |
| `NEXT_PUBLIC_APP_URL` | -- | Production URL (e.g., `https://trysovereignai.com`) |
| `NEXT_PUBLIC_GA_ID` | Google Analytics | GA4 measurement ID |

### Database

- [ ] Neon PostgreSQL database provisioned
- [ ] Connection string tested locally
- [ ] All migrations applied to production (`npx prisma migrate deploy`)
- [ ] Seed data applied if needed (`npm run db:seed`)

### Stripe (Live Mode)

- [ ] Stripe account activated (not test mode)
- [ ] Live API keys generated and stored in Vercel env vars
- [ ] Products and prices created in Stripe Dashboard
- [ ] Webhook endpoint configured: `https://trysovereignai.com/api/payments/webhooks/stripe`
- [ ] Webhook events subscribed: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

---

## 2. Step-by-Step Vercel Deployment

### Initial Setup (First Deploy)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Link project to Vercel
vercel link

# 3. Set all environment variables
vercel env add DATABASE_URL production
vercel env add STRIPE_SECRET_KEY production
# ... repeat for all variables above

# 4. Deploy to production
vercel --prod
```

### Subsequent Deployments

```bash
# Option A: Git push (recommended -- auto-deploys via Vercel GitHub integration)
git push origin main

# Option B: Manual CLI deploy
vercel --prod
```

### Vercel Project Settings

1. **Framework Preset**: Next.js
2. **Build Command**: `npm run build` (runs `prisma generate` then `next build`)
3. **Output Directory**: `.next`
4. **Install Command**: `npm ci`
5. **Node.js Version**: 20.x
6. **Root Directory**: `./`

---

## 3. Database Migration Procedure

### Pre-Migration

```bash
# 1. Check current migration status
npx prisma migrate status

# 2. Back up the database via Neon dashboard
#    Neon Console > Project > Branches > Create Branch (acts as snapshot)

# 3. Test migration locally
DATABASE_URL="<local-or-branch-url>" npx prisma migrate deploy
```

### Apply Migration

```bash
# Production migration (non-interactive, CI-safe)
npx prisma migrate deploy
```

### Post-Migration Verification

```bash
# Verify schema is in sync
npx prisma migrate status

# Verify application health
curl -s https://trysovereignai.com/api/health | jq '.checks.database'
# Expected: { "status": "connected", "latencyMs": <number> }
```

### Migration Rollback

Prisma does not support automatic rollback. Options:

1. **Corrective migration**: Write a new migration that reverses the changes
2. **Point-in-time recovery**: Restore from Neon branch snapshot
3. **Branch restore**: Switch `DATABASE_URL` to the pre-migration Neon branch

---

## 4. Post-Deployment Verification Checklist

Run through this checklist after every production deployment:

### Automated Checks

```bash
# Health endpoint
curl -s https://trysovereignai.com/api/health | jq .
# Expected: { "status": "ok", ... }

# Verify build version (check deployment timestamp)
curl -sI https://trysovereignai.com | grep x-vercel-id
```

### Manual Checks

- [ ] **Landing page** loads at `https://trysovereignai.com`
- [ ] **Login flow**: Request magic link, receive email, authenticate
- [ ] **Dashboard**: Loads after authentication, displays services
- [ ] **Stripe checkout**: Initiate checkout, verify redirect to Stripe
- [ ] **API health**: `/api/health` returns `"status": "ok"`
- [ ] **Cron jobs**: Check Vercel Dashboard > Cron Jobs for next scheduled run
- [ ] **Sentry**: Verify source maps uploaded (Sentry > Releases)
- [ ] **Telegram**: Send test alert via `/api/webhooks/telegram`
- [ ] **Error monitoring**: Trigger a test error, verify it appears in Sentry

### Performance Checks

- [ ] Lighthouse score > 90 on landing page
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] No console errors in browser DevTools

---

## 5. Rollback Procedure

### Vercel Instant Rollback (Recommended)

```bash
# List recent deployments
vercel ls

# Promote a previous deployment to production
vercel promote <deployment-url>
```

**Via Vercel Dashboard**:
1. Navigate to Project > Deployments
2. Find the last known-good deployment
3. Click the three-dot menu > "Promote to Production"

Rollback takes effect within seconds. No rebuild required.

### Git Revert (If Code Fix Needed)

```bash
# Identify the problematic commit
git log --oneline -10

# Revert the commit
git revert <commit-sha>
git push origin main

# Vercel auto-deploys the revert
```

### Database Rollback (If Migration Caused Issues)

1. Switch `DATABASE_URL` in Vercel to the pre-migration Neon branch
2. Redeploy: `vercel --prod`
3. Write a corrective migration once the issue is understood

---

## 6. DNS Configuration

### Domain Setup

1. **Vercel Dashboard** > Project > Settings > Domains
2. Add `trysovereignai.com` and `www.trysovereignai.com`
3. Vercel provides DNS records to configure

### DNS Records

Configure at your domain registrar:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `76.76.21.21` | 300 |
| CNAME | `www` | `cname.vercel-dns.com` | 300 |

### Email DNS (For Deliverability)

| Type | Name | Value |
|------|------|-------|
| TXT | `@` | `v=spf1 include:<email-provider> ~all` |
| CNAME | `dkim._domainkey` | Provided by email service |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:admin@trysovereignai.com` |

### Verification

```bash
# Check DNS propagation
dig trysovereignai.com +short
dig www.trysovereignai.com +short

# Check email DNS
dig txt trysovereignai.com +short
dig txt _dmarc.trysovereignai.com +short
```

---

## 7. SSL/TLS Setup

### Automatic via Vercel

Vercel automatically provisions and renews SSL/TLS certificates for all domains via Let's Encrypt. No manual configuration is required.

**What Vercel handles**:
- Certificate provisioning (issued within minutes of domain verification)
- Automatic renewal (before expiration)
- HTTP to HTTPS redirect (enabled by default)
- TLS 1.2 and 1.3 support
- HSTS headers (configured in `vercel.json`)

### Verification

```bash
# Check SSL certificate
curl -vI https://trysovereignai.com 2>&1 | grep -E "SSL|subject|expire"

# Check security headers
curl -sI https://trysovereignai.com | grep -iE "strict-transport|x-frame|x-content"
```

### Security Headers (Configured in vercel.json)

The following headers are set at the edge:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## 8. Quick Reference

| Task | Command / Action |
|------|-----------------|
| Deploy to production | `git push origin main` or `vercel --prod` |
| Check health | `curl https://trysovereignai.com/api/health` |
| View logs | `vercel logs --follow` |
| Rollback | `vercel promote <url>` |
| Run migration | `npx prisma migrate deploy` |
| Check migration status | `npx prisma migrate status` |
| View DB | `npm run db:studio` |
| Check DNS | `dig trysovereignai.com +short` |
| Check SSL | `curl -vI https://trysovereignai.com 2>&1 \| grep SSL` |
| Deploy checklist | `npm run deploy:checklist` |
