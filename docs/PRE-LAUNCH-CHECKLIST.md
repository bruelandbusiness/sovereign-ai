# Pre-Launch Checklist - Sovereign AI

Complete every item before going live at **trysovereignai.com**. Check items off as you complete them. Do not launch with any unchecked item unless it is explicitly marked as optional.

**Target Launch Date:** ___________
**Checklist Owner:** ___________
**Last Updated:** ___________

---

## Infrastructure

- [ ] Vercel project created and connected to the GitHub repo
- [ ] Production branch set (main) with automatic deployments enabled
- [ ] Custom domain configured (trysovereignai.com) in Vercel
- [ ] DNS records pointing to Vercel (A record and/or CNAME)
- [ ] SSL certificate active and auto-renewing (Vercel handles this)
- [ ] `www.trysovereignai.com` redirects to `trysovereignai.com` (or vice versa -- pick one and be consistent)
- [ ] All environment variables set in Vercel production environment:
  - [ ] `DATABASE_URL`
  - [ ] `AUTH_SECRET`
  - [ ] `STRIPE_SECRET_KEY` (live key, not test)
  - [ ] `STRIPE_WEBHOOK_SECRET` (production webhook)
  - [ ] `STRIPE_PUBLISHABLE_KEY` (live key)
  - [ ] `SENDGRID_API_KEY`
  - [ ] `TWILIO_ACCOUNT_SID`
  - [ ] `TWILIO_AUTH_TOKEN`
  - [ ] `TWILIO_PHONE_NUMBER`
  - [ ] `GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`
  - [ ] `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`
  - [ ] `TELEGRAM_BOT_TOKEN`
  - [ ] `TELEGRAM_CHAT_ID`
  - [ ] All other service-specific API keys
- [ ] Database migrated to production (`prisma migrate deploy`)
- [ ] Database backups configured (automated daily)
- [ ] Cron jobs verified in Vercel dashboard (check schedules and endpoints)
- [ ] Vercel deployment protection disabled for production (so the public site is accessible)
- [ ] Error monitoring confirmed working (trigger a test error, verify it appears in Sentry)

---

## Payments

- [ ] Stripe account fully activated (not in test mode)
- [ ] Stripe live API keys set in Vercel environment variables
- [ ] Stripe webhook endpoint configured for production URL (`https://trysovereignai.com/api/payments/webhooks/stripe`)
- [ ] Webhook events subscribed:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.paid`
  - [ ] `invoice.payment_failed`
  - [ ] `customer.created`
- [ ] Test a real $1 charge and refund to confirm end-to-end payment flow
- [ ] Subscription products created in Stripe:
  - [ ] DIY ($497/mo) -- product ID recorded
  - [ ] Starter ($3,497/mo) -- product ID recorded
  - [ ] Growth ($6,997/mo) -- product ID recorded
  - [ ] Empire ($12,997/mo) -- product ID recorded
- [ ] Product IDs mapped in application config/environment variables
- [ ] Stripe Customer Portal configured:
  - [ ] Clients can update payment method
  - [ ] Clients can view invoice history
  - [ ] Cancellation flow configured (cancels at end of period)
  - [ ] Portal link accessible from client dashboard
- [ ] Stripe tax settings configured (if applicable)
- [ ] Stripe receipt emails enabled

---

## Email & Communications

- [ ] SendGrid account activated and out of sandbox mode
- [ ] Sending domain verified in SendGrid (trysovereignai.com)
- [ ] DNS records set for email authentication:
  - [ ] SPF record added to DNS
  - [ ] DKIM records added to DNS (both CNAME records from SendGrid)
  - [ ] DMARC record added to DNS
- [ ] SendGrid domain authentication verified (green checkmarks in SendGrid dashboard)
- [ ] Test magic link email delivery:
  - [ ] Send to Gmail -- verify delivery to inbox (not spam)
  - [ ] Send to Outlook -- verify delivery to inbox (not spam)
  - [ ] Send to Yahoo -- verify delivery to inbox (not spam)
- [ ] All transactional email templates created and tested:
  - [ ] Welcome email
  - [ ] Magic link / sign-in email
  - [ ] Subscription confirmation
  - [ ] Payment receipt
  - [ ] Payment failed notification
  - [ ] Service activation notification
- [ ] Twilio account activated
- [ ] Twilio phone number provisioned and verified
- [ ] Twilio phone number configured in application
- [ ] Test inbound call to Twilio number -- verify routing to AI Phone Agent
- [ ] Test outbound call from AI Phone Agent -- verify delivery and quality
- [ ] Test SMS sending and receiving
- [ ] Support email (support@trysovereignai.com) configured and receiving mail

---

## Third-Party APIs

- [ ] Google OAuth credentials configured for production:
  - [ ] OAuth consent screen submitted for verification (or appropriate publishing status)
  - [ ] Production redirect URI set: `https://trysovereignai.com/api/auth/callback/google`
  - [ ] Test OAuth login flow end-to-end on production domain
- [ ] Google Ads API key configured (when ready -- can be post-launch)
- [ ] Meta Ads API key configured (when ready -- can be post-launch)
- [ ] Sentry project configured:
  - [ ] DSN set in environment variables
  - [ ] Source maps uploaded for production build
  - [ ] Alert rules configured (email + Telegram on new errors)
  - [ ] Test error captured and visible in Sentry dashboard
- [ ] Telegram bot configured:
  - [ ] Bot token set
  - [ ] Alert channel created
  - [ ] Test alert sent and received
- [ ] All API rate limits understood and within allowances

---

## Content & SEO

- [ ] All blog posts rendering correctly on production
- [ ] Blog post images loading properly
- [ ] Sitemap accessible at `https://trysovereignai.com/sitemap.xml`
- [ ] Sitemap includes all public pages and blog posts
- [ ] `robots.txt` accessible at `https://trysovereignai.com/robots.txt`
- [ ] `robots.txt` allows search engine crawling of public pages
- [ ] `robots.txt` blocks crawling of admin/dashboard/API routes
- [ ] OpenGraph meta tags present on all public pages:
  - [ ] Homepage
  - [ ] Pricing page
  - [ ] Blog posts
  - [ ] About page
- [ ] OpenGraph images rendering correctly when shared on social media (test with https://developers.facebook.com/tools/debug/)
- [ ] Twitter Card meta tags present and rendering
- [ ] Google Search Console connected and verified for trysovereignai.com
- [ ] Sitemap submitted to Google Search Console
- [ ] Google Analytics (GA4) installed and verified:
  - [ ] Tracking code present on all pages
  - [ ] Test pageview recorded in GA4 real-time view
  - [ ] Key events configured (signup, checkout, onboarding call booked)
- [ ] Page titles and meta descriptions set for all public pages
- [ ] Canonical URLs set correctly
- [ ] 404 page designed and functional
- [ ] Favicon and app icons set

---

## Legal

- [ ] Privacy policy published at `/privacy` and reviewed by a lawyer
- [ ] Terms of service published at `/terms` and reviewed by a lawyer
- [ ] Cookie consent banner working:
  - [ ] Appears on first visit
  - [ ] Respects user choice (blocks non-essential cookies until accepted)
  - [ ] Does not reappear after user makes a choice
- [ ] CCPA compliance verified:
  - [ ] "Do Not Sell My Personal Information" link present (if applicable)
  - [ ] Data deletion request process documented
- [ ] Client Master Service Agreement (MSA) template ready for Empire tier clients
- [ ] Data Processing Agreement (DPA) template ready (if handling client customer data)
- [ ] AI disclosure language included where required (e.g., AI-generated content, AI phone agent)
- [ ] Acceptable use policy defined for AI services

---

## Testing

- [ ] All unit tests passing (`npm run test`)
- [ ] All end-to-end tests passing (`npm run test:e2e`)
- [ ] Manual testing of full user journey:
  - [ ] Visit homepage
  - [ ] Navigate to pricing
  - [ ] Click "Get Started" on a plan
  - [ ] Complete signup (email/Google OAuth)
  - [ ] Complete Stripe checkout
  - [ ] Redirected to dashboard
  - [ ] Dashboard loads with correct subscription tier
  - [ ] Services section shows correct services for tier
  - [ ] Can access settings and update profile
  - [ ] Can access billing portal
  - [ ] Can log out and log back in
- [ ] Mobile responsive testing:
  - [ ] Homepage renders correctly on mobile (375px width)
  - [ ] Pricing page readable and buttons tappable on mobile
  - [ ] Dashboard functional on tablet (768px width)
  - [ ] Navigation menu works on mobile
- [ ] Cross-browser testing:
  - [ ] Chrome (latest)
  - [ ] Safari (latest)
  - [ ] Firefox (latest)
  - [ ] Edge (latest)
- [ ] Performance check:
  - [ ] Lighthouse score > 90 for Performance on homepage
  - [ ] Lighthouse score > 90 for Accessibility on homepage
  - [ ] Core Web Vitals passing (LCP, FID, CLS)
  - [ ] Page load time < 3 seconds on 3G connection
- [ ] Security check:
  - [ ] No API keys exposed in client-side code
  - [ ] Authentication required for all dashboard/admin routes
  - [ ] CSRF protection active
  - [ ] Rate limiting on auth endpoints
  - [ ] Input sanitization on all forms

---

## Operations

- [ ] Support email monitored (support@trysovereignai.com) -- confirmed someone receives and can respond
- [ ] Calendly booking link active and tested:
  - [ ] Onboarding call event type created (30 minutes)
  - [ ] Support call event type created (15 minutes)
  - [ ] Calendar integration connected
  - [ ] Confirmation and reminder emails configured
- [ ] Client onboarding SOP ready (`docs/CLIENT-ONBOARDING-SOP.md`) -- reviewed and current
- [ ] Support playbook ready (`docs/SUPPORT-PLAYBOOK.md`) -- reviewed and current
- [ ] Runbook ready (`docs/RUNBOOK.md`) -- reviewed and current
- [ ] Monitoring and alerting configured (`docs/MONITORING.md`) -- verified working
- [ ] First 3 client slots reserved (beta clients or early signups confirmed)
- [ ] On-call rotation established (even if it is just the founder for now)
- [ ] Incident response process documented:
  - [ ] How to identify an outage
  - [ ] Who to contact
  - [ ] Communication plan for affected clients
  - [ ] Post-mortem process
- [ ] Backup and recovery tested:
  - [ ] Database backup restoration tested
  - [ ] Recovery time acceptable (< 1 hour)

---

## Marketing

- [ ] Case studies ready (minimum 2):
  - [ ] Case study 1: _____________ (client name, industry, results)
  - [ ] Case study 2: _____________ (client name, industry, results)
- [ ] Social media accounts created and branded:
  - [ ] LinkedIn company page
  - [ ] Twitter/X account
  - [ ] Facebook business page
  - [ ] Instagram account (optional)
- [ ] Launch announcement drafted:
  - [ ] Blog post
  - [ ] Social media posts (LinkedIn, Twitter, Facebook)
  - [ ] Email to existing contacts/waitlist
- [ ] First 10 outreach emails drafted and ready to send
- [ ] Outreach target list built (minimum 50 prospects)
- [ ] Sales process documented (`docs/SALES-PROCESS.md`) -- reviewed and current
- [ ] Demo video recorded (optional but recommended):
  - [ ] Dashboard walkthrough (2-3 minutes)
  - [ ] "How it works" overview (1-2 minutes)
- [ ] Testimonials or quotes collected from beta users (if available)

---

## Final Pre-Launch Verification

Complete these in order on launch day:

1. [ ] Deploy latest code to production
2. [ ] Verify the production site loads at `https://trysovereignai.com`
3. [ ] Complete one full signup-to-dashboard flow on production
4. [ ] Verify Stripe webhook received for test signup
5. [ ] Verify welcome email delivered for test signup
6. [ ] Verify Sentry is capturing errors (trigger a test error)
7. [ ] Verify Telegram alerts are working (trigger a test alert)
8. [ ] Delete test data (test user, test subscription, test payment)
9. [ ] Take a deep breath
10. [ ] Launch

---

## Post-Launch (First 48 Hours)

- [ ] Monitor Sentry for new errors every 2 hours
- [ ] Monitor Stripe for failed payments
- [ ] Monitor SendGrid for email delivery issues
- [ ] Respond to all inbound inquiries within 2 hours
- [ ] Publish launch announcement on social media
- [ ] Send launch email to contacts/waitlist
- [ ] Begin outreach to first 10 prospects
- [ ] Daily stand-up with team (even if team is just founder + support)
- [ ] Document any issues encountered for post-launch retrospective
