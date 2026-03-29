# Client Onboarding Standard Operating Procedure

> **Last Updated:** 2026-03-29
> **Owner:** Client Success Manager
> **Review Cadence:** Monthly
> **Version:** 2.0

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Pre-Onboarding](#phase-1-pre-onboarding)
3. [Phase 2: Day 0 -- Account Setup](#phase-2-day-0----account-setup)
4. [Phase 3: Day 1-3 -- Initial Configuration](#phase-3-day-1-3----initial-configuration)
5. [Phase 4: Week 1 -- Service Activation](#phase-4-week-1----service-activation)
6. [Phase 5: Week 2-4 -- Optimization](#phase-5-week-2-4----optimization)
7. [Phase 6: 30-Day Review](#phase-6-30-day-review)
8. [Escalation Procedures](#escalation-procedures)
9. [Templates](#templates)
10. [Appendix: Quick Reference](#appendix-quick-reference)

---

## Overview

This SOP ensures every new Sovereign AI client receives a consistent, high-quality onboarding experience. The goal is to achieve **Time to First Value (TTFV) within 48 hours** of contract signature and **full service activation within 7 business days**.

Every team member involved in onboarding should read this document in full before participating in any client onboarding. When in doubt, follow this procedure exactly -- do not improvise or skip steps.

### Onboarding Timeline at a Glance

| Phase | Timeframe | Owner | Key Deliverable |
|---|---|---|---|
| Pre-Onboarding | Before Day 0 | Sales + Operations | Signed contract, payment confirmed, handoff complete |
| Day 0: Account Setup | Within 2 hours of signature | Operations | Account provisioned, welcome email sent |
| Day 1-3: Configuration | First 3 business days | Client Success + Client | Business info gathered, profiles connected |
| Week 1: Activation | Business days 4-7 | Client Success + Technical | All purchased services live |
| Week 2-4: Optimization | Days 8-28 | Client Success | KPIs baselined, targeting tuned |
| 30-Day Review | Day 30 | Client Success + Account Manager | Performance report, ROI calculation |

### Service Bundles

Sovereign AI offers three standard bundles. The onboarding process adapts based on which bundle the client purchased. Always confirm the bundle before starting.

| Service | Starter | Growth | Enterprise |
|---|---|---|---|
| AI Chat Assistant | Basic | Advanced | Full |
| AI Review Management | Included | Included | Included |
| AI Content Engine | 4 posts/mo | 12 posts/mo | Unlimited |
| AI Email Marketing | 1,000/mo | 10,000/mo | Unlimited |
| AI Ad Management | -- | Included | Included |
| AI SEO Domination | -- | Basic | Advanced |
| AI Voice Agent | -- | -- | Included |
| Client Dashboard | Standard | Branded | Custom |
| Analytics | Basic | Advanced | Custom + API |
| Support Level | Email | Email + Chat | Dedicated CSM |

---

## Phase 1: Pre-Onboarding

**Timeline:** Before the client signs the contract
**Owner:** Sales Team (with Operations support)
**Goal:** Ensure all discovery information is captured, the right package is selected, and the deal is ready for a clean handoff to Client Success.

### Step 1.1: Discovery Call Notes Review

After the discovery call is complete (see `docs/SALES-PROCESS.md` for the discovery call script), the Account Executive must compile and review the following before sending a proposal.

**Required Discovery Data:**

- [ ] Client company name and legal entity name
- [ ] Industry and business type (e.g., "HVAC contractor", "dental practice", "law firm")
- [ ] Company size (employees, revenue range if shared)
- [ ] Primary contact: name, title, email, phone
- [ ] Billing contact (if different from primary): name, email
- [ ] Technical contact (if different from primary): name, email
- [ ] Current pain points (list the top 3 verbatim from the call)
- [ ] Current tools and solutions in use
- [ ] Desired outcomes and success metrics
- [ ] Budget range discussed
- [ ] Decision timeline
- [ ] Decision makers identified (names and titles)
- [ ] BANT score recorded in CRM (must be 7+ to proceed)
- [ ] Competitors being evaluated (if any)
- [ ] Special requirements or customizations discussed

**Where to Record:** CRM deal record, "Discovery Notes" section.

**Quality Check:** Before proceeding, the Account Executive should verify:
1. Can I clearly articulate this client's top 3 problems?
2. Do I know exactly which services map to each problem?
3. Do I have all contact information needed for account creation?

If any answer is "no," schedule a brief follow-up call to fill the gaps.

### Step 1.2: Service Package Confirmation

Based on the discovery data, recommend the appropriate bundle. Use this decision matrix:

| Criteria | Starter | Growth | Enterprise |
|---|---|---|---|
| Monthly budget | $297-$497 | $797-$1,497 | $1,997+ |
| Number of locations | 1 | 1-3 | 3+ |
| Advertising needs | None | Google/Meta ads | Multi-channel |
| Phone/voice needs | None | None | Inbound + outbound |
| Integration complexity | Low | Medium | High (custom API) |
| Support needs | Self-serve ok | Needs guidance | Dedicated support |

**Steps:**
1. Match the client's needs to the bundle matrix above
2. Document the recommended bundle in the CRM deal record
3. Note any add-ons or customizations requested
4. Get verbal confirmation from the client on the selected package
5. If the client's needs span multiple tiers, recommend the higher tier and explain the additional value

### Step 1.3: Custom Proposal Review (AI-Generated)

Sovereign AI uses the built-in proposal generator (powered by Claude) to create customized proposals.

**Steps:**
1. Navigate to **Sales Tools > Proposal Generator** in the admin panel
2. Enter the compiled discovery data from Step 1.1:
   - Client name and industry
   - Primary pain points (verbatim from discovery notes)
   - Selected bundle
   - Any custom pricing or terms
   - Relevant case studies to include
3. Click **Generate Proposal**
4. Review the AI-generated proposal for:
   - [ ] Client name spelled correctly throughout
   - [ ] Industry-specific language is accurate
   - [ ] Pain points are reflected accurately (not generic)
   - [ ] Pricing matches approved rates for the selected bundle
   - [ ] ROI projections are reasonable and defensible
   - [ ] Implementation timeline is realistic
   - [ ] No placeholder text remains (search for "[PLACEHOLDER]" and "TODO")
   - [ ] Case study is relevant to the client's industry
5. Edit any sections that need refinement
6. Get manager approval for:
   - Any custom pricing outside standard rates
   - Any non-standard contract terms
   - Enterprise deals over $3,000/month
7. Export as PDF and send with a personalized cover email (see template in `docs/SALES-PROCESS.md`)
8. Log the proposal in CRM with the sent date

### Step 1.4: Payment Setup via Stripe

Once the client verbally agrees to the proposal and signs the contract:

**Steps:**
1. Create the Stripe customer record:
   - Navigate to **Admin Panel > Clients > Create New**
   - Enter client company name, billing email, and billing address
   - The system auto-creates the Stripe customer via the payments API (`src/app/api/payments/`)
2. Generate a Stripe Checkout link for the selected bundle:
   - Select the appropriate price ID for the bundle (Starter / Growth / Enterprise)
   - Add any approved add-ons
   - Set the billing cycle (monthly or annual)
   - Include any promotional discount codes
3. Send the checkout link to the billing contact
4. Monitor for payment completion:
   - The Stripe webhook (`src/app/api/payments/webhooks/stripe/route.ts`) automatically processes successful payments
   - Upon successful payment, the system triggers the account provisioning flow
5. Verify in Stripe Dashboard:
   - [ ] Subscription status shows "Active"
   - [ ] Correct plan and pricing confirmed
   - [ ] Payment method is valid and charged successfully
   - [ ] Invoice generated and sent to billing contact

**If payment fails:**
- Contact the billing contact within 1 business hour
- Offer to troubleshoot or provide an alternative checkout link
- Do not proceed with account provisioning until payment is confirmed

### Step 1.5: Sales-to-Success Handoff

This is the bridge between Sales and Client Success. Do not skip any items.

**Sales Rep completes:**
- [ ] CRM updated with final deal details, contacts, and all discovery notes
- [ ] Handoff document completed (use the template below)
- [ ] Handoff meeting scheduled with the assigned Client Success Manager (30 min)
- [ ] Introduction email sent (Sales introduces CSM to client -- see template in Templates section)

**Handoff Document Must Include:**
1. Client company background (1-2 paragraphs)
2. Key contacts and their roles
3. Bundle selected and any custom terms
4. Top 3 pain points and stated goals (verbatim from discovery)
5. Promises made during the sales process (be specific -- the CSM will be held to these)
6. Potential risks or concerns flagged during sales
7. Upsell opportunities identified for future
8. Client's communication preferences (email, phone, text)
9. Client's timezone and preferred meeting times

**Handoff Meeting Agenda (Sales + CSM, 30 min):**
1. Review the handoff document together (10 min)
2. Discuss client personality, communication style, and any sensitivities (5 min)
3. Walk through any promises or special commitments made (5 min)
4. Agree on the onboarding timeline and first-call date (5 min)
5. CSM asks clarifying questions (5 min)

---

## Phase 2: Day 0 -- Account Setup

**Timeline:** Within 2 hours of contract signature and payment confirmation
**Owner:** Operations Team (automated via platform)
**Goal:** Client's account is fully provisioned and they receive their welcome email.

### Step 2.1: Client Record Created in Database

The platform handles most of this automatically upon Stripe payment confirmation. Verify each step completes.

**Automated Steps (triggered by Stripe webhook):**
1. Client organization record created in the database (via Prisma/PostgreSQL)
2. Primary user account created with the client's email
3. Service tier limits configured based on the purchased bundle
4. Onboarding checklist auto-generated for each purchased service (see `src/lib/service-onboarding.ts`)

**Manual Verification:**
- [ ] Log into **Admin Panel > Clients** and confirm the new client record exists
- [ ] Verify the organization name matches the contract
- [ ] Verify the correct bundle is assigned (Starter / Growth / Enterprise)
- [ ] Verify all designated contacts have user accounts
- [ ] Verify the onboarding checklist is populated in the client dashboard

**If automated provisioning fails:**
1. Check the server logs for errors (`/api/payments/webhooks/stripe/` endpoint)
2. Check Sentry for any error reports
3. Manually create the client record via **Admin Panel > Clients > Create New**
4. Escalate to Engineering if the webhook is failing consistently

### Step 2.2: Stripe Subscription Activated

**Verification Checklist:**
- [ ] Stripe Dashboard shows subscription status: **Active**
- [ ] Billing cycle start date is correct
- [ ] Next invoice date is set correctly
- [ ] The correct products and prices are attached to the subscription
- [ ] Usage limits in the platform match the Stripe subscription tier
- [ ] Client received the Stripe receipt email

**If there is a discrepancy:**
1. Compare the CRM deal record with the Stripe subscription
2. Correct the subscription in Stripe if needed
3. Update the platform tier limits to match
4. Document the correction in the CRM notes

### Step 2.3: Services Auto-Provisioned via Activator System

When the subscription activates, the platform's service activator automatically provisions the services included in the client's bundle.

**Verify each service is provisioned:**

| Service | Check | Status |
|---|---|---|
| AI Chat Assistant | Dashboard shows "Chatbot" tab; widget code generated | [ ] Confirmed |
| AI Review Management | Dashboard shows "Reviews" tab; monitoring ready | [ ] Confirmed |
| AI Content Engine | Dashboard shows "Content" tab; calendar visible | [ ] Confirmed |
| AI Email Marketing | Dashboard shows "Email" tab; sender ready | [ ] Confirmed |
| AI Ad Management (Growth+) | Dashboard shows "Ads" tab; account connection ready | [ ] Confirmed |
| AI SEO Domination (Growth+) | Dashboard shows "SEO" tab; audit queued | [ ] Confirmed |
| AI Voice Agent (Enterprise) | Dashboard shows "Voice" tab; number provisioned | [ ] Confirmed |

**If a service fails to provision:**
1. Navigate to **Admin Panel > Services > [Client Name]**
2. Click **Re-provision** next to the failed service
3. If re-provisioning fails, check the service health dashboard (`src/lib/service-health.ts`)
4. Escalate to Engineering with the error details

### Step 2.4: Welcome Email Sent Automatically

The platform's drip sequence engine (`src/lib/drip-sequences.ts`) automatically enrolls new clients into the welcome email series (`src/lib/emails/welcome-series.ts`).

**Welcome Email Series:**

| Email | Timing | Content |
|---|---|---|
| Welcome Email | Immediate (Day 0) | Login credentials, dashboard link, CSM introduction |
| Getting Started Guide | Day 1 | Step-by-step setup walkthrough for their specific bundle |
| Tips & Best Practices | Day 3 | Industry-specific tips for maximizing their services |
| Check-In Prompt | Day 5 | "How's it going?" with link to schedule a call |

**Verification:**
- [ ] Check the drip sequence dashboard to confirm the client is enrolled in the "signup" sequence
- [ ] Verify the welcome email was delivered (check email logs in **Admin Panel > Email > Logs**)
- [ ] If the email bounced, contact the client via phone to get a corrected email address

### Step 2.5: Dashboard Access Confirmed

Before the welcome call, confirm the client can access their dashboard.

**Steps:**
1. Log in as the client (use admin impersonation in **Admin Panel > Clients > [Client Name] > Impersonate**)
2. Verify the following:
   - [ ] Dashboard loads without errors
   - [ ] Correct service tabs are visible for their bundle
   - [ ] Onboarding checklist is displayed with the right steps
   - [ ] Client's company name and branding area are visible
   - [ ] Analytics section shows (will be empty but should not error)
   - [ ] Support/help options are accessible
3. Send a test notification to verify the notification system works for this client
4. Exit impersonation mode

**If the client reports login issues:**
1. Verify their email address is correct in the system
2. Send a password reset / magic link
3. Check if their domain's email server is blocking our emails (SPF/DKIM/DMARC)
4. If needed, walk them through login via phone

---

## Phase 3: Day 1-3 -- Initial Configuration

**Timeline:** First 3 business days after account setup
**Owner:** Client Success Manager (with client participation)
**Goal:** Gather all business information needed to configure services and get initial integrations connected.

### Step 3.1: Business Information Gathered

This is typically done during the welcome call (Day 1) or via a self-serve form in the dashboard.

**Required Information:**

#### Basic Business Details
- [ ] Legal business name
- [ ] DBA / brand name (if different)
- [ ] Business address (street, city, state, zip)
- [ ] Phone number (main business line)
- [ ] Email address (main business email)
- [ ] Website URL
- [ ] Business hours (for each day of the week)
- [ ] Timezone

#### Business Profile
- [ ] Industry / business category
- [ ] Services offered (list of 5-10 key services)
- [ ] Service area / coverage geography
- [ ] Target customer demographics
- [ ] Unique selling propositions (what sets them apart)
- [ ] Key competitors (local)
- [ ] Average transaction value
- [ ] Current monthly customer volume (approximate)

#### Brand Assets
- [ ] Logo (high resolution, PNG or SVG preferred)
- [ ] Brand colors (primary and secondary hex codes)
- [ ] Tagline or slogan (if any)
- [ ] Brand photography (5-10 images of their business, team, work)

**How to Gather:**
1. During the welcome call, walk through the business information form together
2. For items the client cannot provide immediately, assign as action items with a 48-hour deadline
3. Enter all information into the client's profile in the dashboard (**Admin Panel > Clients > [Client Name] > Business Profile**)
4. If the client prefers self-service, send them the dashboard link and point them to the "Business Info" section of their onboarding checklist

### Step 3.2: Google Business Profile Connected

This is critical for the Review Management service and local SEO.

**Steps:**
1. Ask the client if they have an existing Google Business Profile
   - **If yes:** Proceed to connection
   - **If no:** Help them create one (or note it as an action item for the client)
2. Navigate to the client's dashboard > **Reviews** > **Connect Google Business Profile**
3. Walk the client through the OAuth authorization flow:
   - Client clicks "Connect Google"
   - Client logs into their Google account
   - Client grants permission to access their Google Business Profile
   - System confirms the connection
4. Verify the connection:
   - [ ] Business name appears correctly
   - [ ] Existing reviews are imported
   - [ ] Business address and phone match what was provided in Step 3.1
5. If the client has multiple locations, repeat for each location

**Common Issues:**
- Client uses a personal Gmail for the business profile: This is fine, just ensure they authorize with that account
- Client doesn't have admin access to their Google Business Profile: They need to claim or request access through Google
- OAuth flow fails: Try a different browser, clear cookies, or use an incognito window

### Step 3.3: Brand Voice and Tone Configured

The AI Content Engine and AI Chat Assistant both use the brand voice settings to generate on-brand content and responses.

**Steps:**
1. Navigate to the client's dashboard > **Settings** > **Brand Voice**
2. Work with the client to configure:

| Setting | Options | Description |
|---|---|---|
| Tone | Professional / Friendly / Casual / Authoritative / Warm | Overall communication style |
| Formality Level | Formal / Semi-formal / Informal | Language register |
| Personality Traits | Select 3-5 from list | e.g., "Helpful, knowledgeable, empathetic" |
| Industry Jargon | Use freely / Use sparingly / Avoid | Technical language preference |
| Humor Level | None / Light / Moderate | Appropriate humor in communications |
| First Person | We / I / Company name | How the business refers to itself |
| Audience Address | You / Customers / Clients / Patients | How to address the audience |

3. Add any specific phrases to use or avoid:
   - **Always use:** (e.g., "Schedule your free consultation" not "Book now")
   - **Never use:** (e.g., avoid "cheap," use "affordable" instead)
4. Generate a sample piece of content and review it with the client
5. Adjust settings based on feedback until the client approves
6. Mark the `content_brand_voice` onboarding step as complete

**Tip:** If the client is unsure about their brand voice, ask them to share 2-3 pieces of existing content they love (their own or a competitor's). Use those as reference.

### Step 3.4: Initial Content Calendar Set Up

For clients with the AI Content Engine service.

**Steps:**
1. Navigate to the client's dashboard > **Content** > **Calendar**
2. Configure the publishing schedule:

| Bundle | Default Schedule |
|---|---|
| Starter (4 posts/mo) | 1 post per week, Tuesday at 10:00 AM local time |
| Growth (12 posts/mo) | 3 posts per week, Mon/Wed/Fri at 10:00 AM local time |
| Enterprise (Unlimited) | Custom schedule based on client needs |

3. Select initial content topics:
   - Review the client's services and target audience
   - Choose 4-8 recurring topic categories (e.g., "Service tips," "Customer stories," "Industry news")
   - Map topics to a rotating calendar
4. Generate the first month's content titles:
   - Use the Content Engine's **Batch Generate** feature
   - Generate titles only first, then review with the client
   - Once titles are approved, generate full content
5. Set content approval preferences:
   - **Auto-publish:** Content goes live on schedule without client review (recommended for Growth/Enterprise after initial approval)
   - **Approval required:** Content is queued for client review before publishing (recommended for Starter and all clients during the first month)
6. Mark the `content_select_topics` and `content_publishing_schedule` onboarding steps as complete

### Step 3.5: Review Management Activated

For all clients (Review Management is included in every bundle).

**Steps:**
1. Verify Google Business Profile is connected (Step 3.2)
2. Configure review monitoring:
   - Navigate to dashboard > **Reviews** > **Settings**
   - Enable **Real-time Review Alerts** (sends notification when a new review is posted)
   - Set alert recipients (client's primary contact email + CSM email)
3. Configure auto-response rules:

| Review Type | Default Action | Customization |
|---|---|---|
| 5-star reviews | Auto-respond with thank you | Client can edit the response template |
| 4-star reviews | Auto-respond with thank you + offer | Client can edit the response template |
| 3-star reviews | Alert only, manual response | CSM assists with response |
| 1-2 star reviews | Alert only, manual response | CSM assists with response; flag for immediate attention |

4. Set up review request automation:
   - Configure the trigger (e.g., "3 days after service completion")
   - Customize the review request message template
   - Set the review link destination (Google Business Profile)
   - Enable SMS review requests if the client has customer phone numbers
5. Mark the `reviews_connect_google`, `reviews_auto_response_rules`, and `reviews_request_triggers` onboarding steps as complete

---

## Phase 4: Week 1 -- Service Activation

**Timeline:** Business days 4-7 after account setup
**Owner:** Client Success Manager + Technical Support
**Goal:** All purchased services are live and functioning. Client has seen their first results.

### Step 4.1: AI Chatbot Deployed on Client Website

**Prerequisites:** Business information gathered (Step 3.1), brand voice configured (Step 3.3)

**Steps:**
1. Configure the chatbot knowledge base:
   - Navigate to dashboard > **Chatbot** > **Knowledge Base**
   - Add business information: services, pricing, hours, location, FAQs
   - Import any existing FAQ content from the client's website
   - Add 10-15 common questions and approved answers
2. Configure chatbot settings:
   - Set the greeting message (e.g., "Hi! How can I help you today?")
   - Set business hours behavior (live chat during hours, bot-only after hours)
   - Configure lead capture fields (name, email, phone -- which are required?)
   - Set the escalation trigger (when should the bot hand off to a human?)
   - Apply the brand voice settings from Step 3.3
3. Test the chatbot:
   - Use the built-in preview mode to test 10+ conversations
   - Test edge cases: questions outside the knowledge base, rude messages, competitor mentions
   - Verify lead capture works and notifications are sent
   - Have the client test and provide feedback
4. Generate the embed code:
   - Navigate to dashboard > **Chatbot** > **Deploy**
   - Copy the widget snippet
5. Deploy to the client's website:
   - **Option A (preferred):** Client's web developer adds the snippet to their site
   - **Option B:** If the client uses WordPress, Squarespace, Wix, or similar, walk them through adding the snippet via their platform's custom code feature
   - **Option C:** If the client cannot add the snippet themselves, coordinate with their web host or developer
6. Verify deployment:
   - [ ] Visit the client's live website
   - [ ] Chat widget appears in the bottom-right corner
   - [ ] Widget loads within 2 seconds
   - [ ] Test a conversation on the live site
   - [ ] Verify lead notifications are received
7. Mark the `chatbot_business_info`, `chatbot_configure_faqs`, `chatbot_set_tone`, `chatbot_test_widget`, and `chatbot_deploy` onboarding steps as complete

### Step 4.2: Review Request Automation Enabled

**Prerequisites:** Google Business Profile connected (Step 3.2), review management configured (Step 3.5)

**Steps:**
1. Finalize the review request message template:
   - Navigate to dashboard > **Reviews** > **Request Templates**
   - Customize the email template (subject line, body, and call to action)
   - Customize the SMS template (if SMS is included in the bundle)
   - Include the client's business name and a direct link to their Google review page
2. Configure the automation trigger:
   - Set the trigger type: manual, scheduled, or API-triggered
   - If the client has a CRM or job management system, discuss API integration for automatic triggers
   - For manual mode, show the client how to send review requests from the dashboard
3. Send 3-5 test review requests:
   - Send to the client and/or their team members
   - Verify emails/SMS are delivered
   - Verify the review link goes to the correct Google Business Profile
4. Enable live automation:
   - Turn on the automated review request sequence
   - Set rate limits (e.g., max 5 requests per day to avoid spam)
   - Configure follow-up reminder (e.g., 3 days after first request if no review posted)
5. Mark the review request onboarding steps as complete

### Step 4.3: First Content Batch Generated and Approved

**Prerequisites:** Brand voice configured (Step 3.3), content calendar set up (Step 3.4)

**Steps:**
1. Generate the first content batch:
   - Navigate to dashboard > **Content** > **Generate**
   - Select the first 4 topics from the content calendar
   - Click **Generate Content** to produce drafts
2. Internal review (CSM):
   - Read each piece of content for accuracy, tone, and brand alignment
   - Check for any factual errors about the client's business
   - Verify the content matches the configured brand voice
   - Make any necessary edits
3. Client review:
   - Send the content to the client for approval via the dashboard's approval workflow
   - Set a 48-hour deadline for review
   - Walk the client through the approval process on their first time
4. Handle client feedback:
   - If the client requests changes, edit and resubmit
   - If the client is unhappy with the overall tone, revisit the brand voice settings (Step 3.3)
   - Document the client's preferences for future reference
5. Schedule approved content:
   - Once approved, schedule the content according to the content calendar
   - Verify the first piece of content publishes correctly
6. Mark the `content_approve_first_batch` onboarding step as complete

### Step 4.4: Ad Campaigns Configured (Growth and Enterprise Only)

**Prerequisites:** Business information gathered (Step 3.1)

**Steps:**
1. Connect advertising accounts:
   - Navigate to dashboard > **Ads** > **Connect Accounts**
   - Walk the client through connecting their Google Ads account (OAuth flow)
   - Walk the client through connecting their Meta Business account (OAuth flow)
   - If the client does not have existing ad accounts, help them create new ones
2. Set the advertising budget:
   - Enter the client's approved monthly ad spend
   - Allocate across platforms (recommended starting split: 60% Google, 40% Meta)
   - Set daily budget caps
3. Define target audience:
   - Geographic targeting (service area radius or specific zip codes)
   - Demographic targeting (age range, household income, homeowner status, etc.)
   - Interest and behavior targeting (industry-specific)
4. Create the first campaign:
   - Use the AI Ad Manager to generate ad copy variations
   - Review and edit headlines, descriptions, and calls to action
   - Upload or select creative assets (images, videos)
   - Set the landing page URL (client's website or a dedicated landing page)
5. Client approval:
   - Present the campaign setup to the client for approval
   - Walk through the budget, targeting, and ad copy
   - Get written approval (email confirmation is sufficient) before launching
6. Launch:
   - Enable the campaign
   - Set a calendar reminder to check performance after 48 hours
   - Verify tracking pixels are installed on the client's website
7. Mark the `ads_connect_accounts`, `ads_set_budget`, `ads_define_audience`, and `ads_first_campaign` onboarding steps as complete

### Step 4.5: Voice Agent Set Up (Enterprise Only)

**Prerequisites:** Business information gathered (Step 3.1), business hours confirmed

**Steps:**
1. Provision the voice phone number:
   - Navigate to dashboard > **Voice** > **Setup**
   - Select a local phone number in the client's area code (via Twilio integration)
   - Or port the client's existing number (takes 2-4 weeks; use a temporary number in the interim)
2. Configure the voice agent:
   - Set the greeting script (e.g., "Thank you for calling [Business Name]. How can I help you?")
   - Configure business hours routing:
     - During hours: AI answers, can transfer to a human
     - After hours: AI answers, takes messages, offers to schedule a callback
   - Set up call recording preferences (with appropriate legal disclosures)
   - Configure voicemail transcription
3. Build the conversation flow:
   - Import business information from Step 3.1 into the voice agent's knowledge base
   - Configure common scenarios: appointment scheduling, service inquiries, pricing questions
   - Set escalation rules (which situations transfer to a human?)
   - Add the client's team phone numbers for transfers
4. Test the voice agent:
   - Make 5+ test calls covering different scenarios
   - Test business hours vs. after-hours behavior
   - Test call transfers
   - Test voicemail and transcription
   - Have the client make test calls
5. Go live:
   - Update the client's website and Google Business Profile with the new number (or the existing number if ported)
   - Enable call answering
   - Set up performance alerts (missed calls, long hold times, failed transfers)
6. Mark all voice agent onboarding steps as complete

### Week 1 Completion Checklist

Before marking Week 1 as complete, verify every purchased service is live:

| Service | Live? | First Result? | Notes |
|---|---|---|---|
| AI Chat Assistant | [ ] Yes | [ ] First lead captured | |
| AI Review Management | [ ] Yes | [ ] First review request sent | |
| AI Content Engine | [ ] Yes | [ ] First content piece published | |
| AI Email Marketing | [ ] Yes | [ ] First campaign sent | |
| AI Ad Management | [ ] Yes | [ ] First impressions served | |
| AI Voice Agent | [ ] Yes | [ ] First call answered | |

---

## Phase 5: Week 2-4 -- Optimization

**Timeline:** Days 8-28 after account setup
**Owner:** Client Success Manager
**Goal:** Establish KPI baselines, optimize targeting and messaging, and address any issues.

### Step 5.1: Review KPI Baselines

At the end of Week 1, capture baseline metrics for each active service. These will be used for comparison in the 30-day review.

**Baseline Metrics to Capture:**

#### AI Chat Assistant
- [ ] Total conversations: ____
- [ ] Lead capture rate: ____% (leads / conversations)
- [ ] Average response time: ____ seconds
- [ ] Customer satisfaction rating (if enabled): ____/5
- [ ] Most common questions asked (top 5): ____

#### AI Review Management
- [ ] Current Google star rating: ____
- [ ] Total reviews at start: ____
- [ ] Review requests sent: ____
- [ ] Review requests converted: ____ (____%)
- [ ] Average review rating received: ____

#### AI Content Engine
- [ ] Posts published: ____
- [ ] Total views/impressions: ____
- [ ] Engagement rate: ____%
- [ ] Website traffic from content: ____ visits

#### AI Email Marketing
- [ ] Emails sent: ____
- [ ] Open rate: ____%
- [ ] Click rate: ____%
- [ ] Unsubscribe rate: ____%
- [ ] Leads generated from email: ____

#### AI Ad Management
- [ ] Impressions: ____
- [ ] Clicks: ____
- [ ] Click-through rate: ____%
- [ ] Cost per click: $____
- [ ] Conversions: ____
- [ ] Cost per conversion: $____
- [ ] Total spend: $____

#### AI Voice Agent
- [ ] Calls received: ____
- [ ] Calls handled by AI: ____
- [ ] Calls transferred to human: ____
- [ ] Average call duration: ____ minutes
- [ ] Appointments scheduled: ____

**Where to Record:** Client's analytics dashboard + CRM notes under "KPI Baselines"

### Step 5.2: Adjust Targeting and Messaging

Based on the first 1-2 weeks of data, make the following optimizations:

**Chatbot Optimization:**
1. Review the most common unanswered questions -- add them to the knowledge base
2. Review any conversations where the bot gave incorrect information -- correct the knowledge base
3. Adjust the greeting message if the engagement rate is below 5%
4. Refine lead capture requirements if the form abandonment rate is high

**Review Management Optimization:**
1. Adjust review request timing if the response rate is below 10%
2. Update the review request message template based on results
3. Review auto-responses for tone and accuracy
4. If negative reviews are coming in, schedule a call with the client to address root causes

**Content Optimization:**
1. Review content engagement metrics -- which topics performed best?
2. Adjust the content calendar to favor high-performing topics
3. Refine the brand voice settings based on client feedback
4. Increase posting frequency if engagement is strong (Growth/Enterprise)

**Ad Campaign Optimization:**
1. Pause underperforming ad variations (CTR below 1%)
2. Increase budget allocation to top-performing campaigns
3. Refine geographic targeting based on conversion data
4. A/B test new ad copy variations
5. Adjust bidding strategy based on cost-per-conversion trends

**Voice Agent Optimization:**
1. Review call transcripts for missed intents -- update the conversation flow
2. Adjust escalation rules if too many calls are being transferred unnecessarily
3. Update scripts based on common caller scenarios
4. Refine after-hours behavior based on caller patterns

### Step 5.3: First Performance Check-In Call

**Timing:** Day 14 (end of Week 2)
**Duration:** 30 minutes
**Attendees:** Client Success Manager + Client primary contact

**Pre-Call Preparation:**
- [ ] Pull 2-week performance report from the analytics dashboard
- [ ] Review all support tickets and interactions
- [ ] Note any optimizations made and their impact
- [ ] Prepare 2-3 specific recommendations based on data
- [ ] Review the client's stated goals from onboarding

**Call Agenda:**

1. **Check-In (5 min)**
   - "How has the experience been so far?"
   - "Any surprises -- positive or negative?"
   - "Are you finding the dashboard easy to use?"

2. **Performance Review (10 min)**
   - Walk through the key metrics for each active service
   - Compare to baseline where applicable
   - Highlight early wins (even small ones -- "You've already received 3 new reviews!")
   - Be transparent about areas needing improvement

3. **Optimizations Made (5 min)**
   - Explain any adjustments you've made and why
   - Share what you've learned from the data
   - Preview upcoming optimizations

4. **Client Feedback (5 min)**
   - "Is there anything about the service that's not meeting your expectations?"
   - "Any features you'd like to explore that we haven't set up yet?"
   - "How are your customers responding to the chatbot / review requests / content?"

5. **Action Items and Next Steps (5 min)**
   - Agree on action items for both sides
   - Confirm the 30-day review date
   - Remind the client of support channels

**Post-Call Actions:**
- [ ] Send check-in summary email within 2 hours (see template below)
- [ ] Update CRM with call notes and action items
- [ ] Implement any agreed-upon optimizations within 48 hours
- [ ] Escalate any unresolved issues

### Step 5.4: Address Any Issues or Questions

Throughout Weeks 2-4, be proactive about issue resolution:

**Daily (5 minutes per client):**
- Check the client's dashboard for any service alerts or errors
- Review any new support tickets
- Monitor ad spend pacing (for Ad Management clients)

**Weekly (15 minutes per client):**
- Review the week's performance metrics
- Check content publishing schedule is on track
- Verify review request automation is running
- Review chatbot conversation logs for quality

**If a client raises a concern:**
1. Acknowledge within 2 business hours (even if you don't have the answer yet)
2. Investigate and provide a substantive response within 24 business hours
3. If it requires Engineering support, escalate per the Escalation Procedures below
4. Follow up to confirm the issue is resolved
5. Document the issue and resolution in the CRM

---

## Phase 6: 30-Day Review

**Timeline:** Day 30 after account setup
**Owner:** Client Success Manager + Account Manager
**Duration:** 45 minutes
**Goal:** Present comprehensive performance data, calculate ROI, identify upsell opportunities, and collect client feedback.

### Step 6.1: Full Performance Report Generated

**Preparation (allow 1-2 hours):**

1. Pull the 30-day analytics report from the dashboard:
   - Navigate to **Admin Panel > Reports > Client Performance**
   - Select the client and the date range (Day 0 to Day 30)
   - Export as PDF
2. Compile metrics for each active service (use the baseline from Step 5.1 for comparison):

| Metric | Baseline (Week 1) | 30-Day Actual | Change |
|---|---|---|---|
| Chatbot conversations | ____ | ____ | +/- ___% |
| Chatbot lead capture rate | ____% | ____% | +/- ___ pts |
| Google star rating | ____ | ____ | +/- ____ |
| New reviews received | ____ | ____ | +____ |
| Content views/impressions | ____ | ____ | +/- ___% |
| Email open rate | ____% | ____% | +/- ___ pts |
| Ad conversions | ____ | ____ | +/- ___% |
| Ad cost per conversion | $____ | $____ | +/- ___% |
| Voice calls handled | ____ | ____ | +/- ___% |

3. Prepare a narrative summary:
   - 2-3 key wins to highlight
   - 1-2 areas for improvement with a plan
   - Comparison to industry benchmarks where available

### Step 6.2: ROI Calculation Presented

Calculate and present the client's return on investment.

**ROI Formula:**

```
Monthly ROI = (Value Generated - Monthly Cost) / Monthly Cost x 100

Value Generated =
  (New leads from chatbot x Estimated close rate x Average transaction value)
  + (New reviews x Estimated value per review)
  + (Ad conversions x Average transaction value)
  + (Time saved on manual tasks x Hourly labor cost)
```

**Example Calculation:**

| Value Driver | Quantity | Unit Value | Total |
|---|---|---|---|
| Chatbot leads | 15 leads | $200 avg. transaction x 30% close rate | $900 |
| New Google reviews | 8 reviews | $50 estimated value per review | $400 |
| Content-driven website visits | 200 visits | $2 per visit (industry benchmark) | $400 |
| Time saved (automated responses, content, etc.) | 10 hours | $25/hour labor cost | $250 |
| **Total estimated monthly value** | | | **$1,950** |
| **Monthly platform cost** | | | **($797)** |
| **Net monthly value** | | | **$1,153** |
| **ROI** | | | **145%** |

**Important Notes:**
- Use conservative estimates. Never inflate numbers.
- Make assumptions explicit ("We're assuming a 30% close rate on chatbot leads based on industry averages")
- If ROI is negative, focus on trends and the trajectory toward positive ROI
- Always ask the client to validate your assumptions

### Step 6.3: Upsell Opportunities Identified

Based on 30 days of data, identify natural upsell opportunities.

**Upsell Decision Matrix:**

| Client Signal | Opportunity | Approach |
|---|---|---|
| Starter client hitting content limits | Upgrade to Growth | "You've been publishing great content. With Growth, you'd get 12 posts/month instead of 4." |
| High chatbot engagement, no ads | Add Ad Management | "Your chatbot is converting at X%. Imagine driving more traffic to your site with targeted ads." |
| Strong review results, no SEO | Add SEO Domination | "Your reviews are excellent. Let's make sure people find you with AI-powered SEO." |
| Growth client with high call volume | Upgrade to Enterprise | "You're getting a lot of inbound calls. Our AI Voice Agent can handle those 24/7." |
| Client mentions new locations | Multi-location setup | "We can replicate your entire setup for your new location." |

**Rules for Upselling:**
1. Only mention upsell if the client is satisfied (satisfaction score >= 4/5)
2. Frame it as a natural extension of their success, not a sales pitch
3. If the client is not interested, do not push -- note it in CRM for future
4. Never upsell during a call where the client is raising complaints

### Step 6.4: Client Feedback Collected

Collect structured feedback at the 30-day mark.

**Feedback Collection Methods:**

1. **During the 30-day review call:** Ask the feedback questions below verbally and record answers
2. **Post-call survey:** Send the feedback survey link within 1 hour of the call

**Feedback Questions (ask all of these):**

1. On a scale of 1-10, how likely are you to recommend Sovereign AI to a colleague? (NPS)
2. On a scale of 1-5, how satisfied are you with:
   - The onboarding experience? ____/5
   - The platform/dashboard? ____/5
   - The quality of AI-generated content? ____/5
   - The responsiveness of our team? ____/5
   - The results you've seen so far? ____/5
3. What has been the most valuable part of the service so far?
4. What could we improve?
5. Is there anything we promised during the sales process that hasn't been delivered?
6. Would you be willing to provide a testimonial or case study? (Only ask if NPS >= 8)

**Post-Review Actions:**
- [ ] Send the 30-day review summary email within 24 hours (see template below)
- [ ] Update CRM with all feedback and scores
- [ ] Create action plan for any items scored 3/5 or below
- [ ] Schedule 60-day check-in (or move to quarterly cadence if all scores are 4+ and client prefers)
- [ ] Flag upsell opportunities to the Account Manager
- [ ] If NPS >= 8, request a Google review from the client for Sovereign AI
- [ ] If NPS <= 6, escalate to Client Success leadership for a retention intervention

---

## Escalation Procedures

### Escalation Triggers

| Trigger | Severity | Escalation Path | Response Time |
|---|---|---|---|
| Client cannot access platform | High | Technical Support > Engineering | 15 minutes |
| Service not functioning (chatbot down, ads paused, etc.) | High | Technical Support > Engineering | 30 minutes |
| Billing discrepancy | Medium | Client Success > Finance | 4 hours |
| Service not performing as sold | High | Client Success > Account Manager > VP Sales | 24 hours |
| Client threatens cancellation | Critical | Client Success > Account Manager > VP CS | 1 hour |
| Data loss or security concern | Critical | Technical Support > Engineering > CTO | Immediate |
| Integration failure | Medium | Technical Support > Engineering | 4 hours |
| Missed SLA or onboarding deadline | High | Client Success > Operations Manager | 2 hours |
| Client is unresponsive (no contact in 7+ days) | Medium | Client Success > Account Manager | 24 hours |

### Escalation Process

1. **Document** -- Record the issue, client impact, and steps already taken in the CRM
2. **Notify** -- Alert the next escalation level via Slack (#client-escalations channel) + email
3. **Own** -- The original assignee remains the client's single point of contact throughout
4. **Update** -- Provide the client with updates every 2 hours (High), every 4 hours (Medium), or every 30 minutes (Critical)
5. **Resolve** -- Confirm resolution with the client verbally and in writing
6. **Prevent** -- Document root cause and create an action item to prevent recurrence

---

## Templates

### Welcome Email Template

```
Subject: Welcome to Sovereign AI -- Your Account is Ready!

Hi [CLIENT FIRST NAME],

Welcome to Sovereign AI! We're thrilled to have [CLIENT COMPANY] on board.

Your account is set up and ready to go:

  Dashboard: https://app.sovereignai.com/dashboard
  Your email: [CLIENT EMAIL]
  Your plan: [STARTER / GROWTH / ENTERPRISE]

Here's what happens next:

  1. Log in and explore your dashboard
  2. Join your welcome call on [DATE] at [TIME]
     [CALENDAR LINK]
  3. Check out our getting started guide:
     https://help.sovereignai.com/getting-started

Your dedicated Client Success Manager is [CSM NAME] ([CSM EMAIL]).
Feel free to reach out anytime with questions.

We can't wait to help [CLIENT COMPANY] [STATED GOAL FROM DISCOVERY].

Best,
[CSM NAME]
Client Success Manager, Sovereign AI
[CSM EMAIL] | [CSM PHONE]
```

### Sales-to-CSM Introduction Email Template

```
Subject: Introducing [CSM NAME], Your Success Manager at Sovereign AI

Hi [CLIENT FIRST NAME],

I'm thrilled to officially welcome [CLIENT COMPANY] to Sovereign AI!

I'd like to introduce you to [CSM NAME], who will be your dedicated
Client Success Manager. [CSM NAME] will make sure you get the most
out of your [BUNDLE NAME] plan and will be your go-to person for
anything you need.

[CSM NAME], meet [CLIENT FIRST NAME] -- [BRIEF CONTEXT, e.g.,
"they run a growing HVAC company in Austin and are most excited
about automating their review requests and getting their AI
chatbot live."]

I'll let [CSM NAME] take it from here to schedule your welcome call.
It's been a pleasure working with you, [FIRST NAME], and I'll check
in from time to time to make sure everything is going well.

Best,
[SALES REP NAME]
```

### Week 2 Check-In Email Template

```
Subject: Your 2-Week Check-In -- How's Everything Going?

Hi [CLIENT FIRST NAME],

It's been two weeks since we got [CLIENT COMPANY] set up on
Sovereign AI. Here's a quick snapshot of your results so far:

HIGHLIGHTS:
  - [METRIC 1, e.g., "Your chatbot has handled 47 conversations
    and captured 12 leads"]
  - [METRIC 2, e.g., "You've received 5 new Google reviews,
    bringing your average to 4.7 stars"]
  - [METRIC 3, e.g., "Your first 4 blog posts generated 180
    website visits"]

During our call today, we discussed:
  - [KEY DISCUSSION POINT 1]
  - [KEY DISCUSSION POINT 2]

ACTION ITEMS:
  - [ACTION 1 -- OWNER -- DUE DATE]
  - [ACTION 2 -- OWNER -- DUE DATE]

WHAT'S NEXT:
  - We'll continue optimizing your [SERVICE] over the next two weeks
  - Your 30-day review is scheduled for [DATE] at [TIME]
  - As always, reach out anytime: [CSM EMAIL] or [CSM PHONE]

Best,
[CSM NAME]
Client Success Manager, Sovereign AI
```

### 30-Day Review Summary Email Template

```
Subject: Your 30-Day Performance Review -- [CLIENT COMPANY]

Hi [CLIENT FIRST NAME],

Thank you for a great 30-day review call! Here's a summary of
where things stand and where we're headed.

RESULTS SUMMARY (30 DAYS):

  Chatbot:
    - Conversations: [X]
    - Leads captured: [X] ([Y]% capture rate)

  Reviews:
    - New reviews: [X]
    - Average rating: [X] stars (was [Y] stars)
    - Review requests sent: [X]

  Content:
    - Posts published: [X]
    - Total views: [X]

  [ADS / VOICE -- if applicable]:
    - [KEY METRIC]: [VALUE]

ESTIMATED ROI:
  - Estimated value generated: $[X]
  - Monthly investment: $[Y]
  - Net value: $[X - Y]
  - ROI: [Z]%

WHAT WE HEARD FROM YOU:
  - You're most happy with: [FEEDBACK]
  - We need to improve: [FEEDBACK]

ACTION ITEMS:
  - [ACTION 1 -- OWNER -- DUE DATE]
  - [ACTION 2 -- OWNER -- DUE DATE]

NEXT CHECK-IN: [DATE]

Thank you for your partnership, [FIRST NAME]. We're committed
to helping [CLIENT COMPANY] grow.

Best,
[CSM NAME]
Client Success Manager, Sovereign AI
```

### Feedback Survey Questions

Use these questions in a survey tool (e.g., Typeform, Google Forms) or ask them verbally during the 30-day review call.

```
SOVEREIGN AI -- 30-DAY CLIENT FEEDBACK SURVEY

1. How likely are you to recommend Sovereign AI to a friend or
   colleague? (0-10 scale)
   [0] [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]

2. How satisfied are you with each of the following? (1-5 scale)

   a. The onboarding experience
      [1 Very Dissatisfied] [2] [3] [4] [5 Very Satisfied]

   b. The platform / dashboard
      [1 Very Dissatisfied] [2] [3] [4] [5 Very Satisfied]

   c. The quality of AI-generated content
      [1 Very Dissatisfied] [2] [3] [4] [5 Very Satisfied]

   d. The responsiveness of our team
      [1 Very Dissatisfied] [2] [3] [4] [5 Very Satisfied]

   e. The results you've seen so far
      [1 Very Dissatisfied] [2] [3] [4] [5 Very Satisfied]

3. What has been the most valuable part of Sovereign AI for
   your business?
   [Open text response]

4. What could we do better?
   [Open text response]

5. Is there anything we promised during the sales process that
   hasn't been delivered?
   [Open text response]

6. Are there additional services you'd be interested in
   learning about?
   [ ] AI Ad Management
   [ ] AI SEO Domination
   [ ] AI Voice Agent
   [ ] Additional locations
   [ ] Custom integrations
   [ ] Other: __________

7. Would you be willing to share your experience as a case
   study or testimonial?
   [ ] Yes, I'd love to
   [ ] Maybe, tell me more
   [ ] Not right now

8. Any other comments or feedback?
   [Open text response]
```

### Performance Report Template

Use this template when generating the 30-day performance report PDF.

```
===============================================
SOVEREIGN AI -- 30-DAY PERFORMANCE REPORT
===============================================

Client: [CLIENT COMPANY]
Report Period: [START DATE] to [END DATE]
Bundle: [STARTER / GROWTH / ENTERPRISE]
Prepared by: [CSM NAME]
Date: [REPORT DATE]

-----------------------------------------------
EXECUTIVE SUMMARY
-----------------------------------------------

[2-3 sentences summarizing overall performance,
key wins, and the trajectory of results.]

-----------------------------------------------
SERVICE PERFORMANCE
-----------------------------------------------

AI CHAT ASSISTANT
  Conversations:        [X]
  Lead capture rate:    [X]%
  Leads generated:      [X]
  Avg. response time:   [X] seconds
  Satisfaction score:   [X]/5
  Status:               [ON TRACK / NEEDS ATTENTION]

AI REVIEW MANAGEMENT
  Reviews received:     [X]
  Average rating:       [X] stars
  Rating change:        [+/- X] from baseline
  Requests sent:        [X]
  Response rate:        [X]%
  Status:               [ON TRACK / NEEDS ATTENTION]

AI CONTENT ENGINE
  Posts published:      [X]
  Total impressions:    [X]
  Engagement rate:      [X]%
  Website traffic:      [X] visits
  Status:               [ON TRACK / NEEDS ATTENTION]

AI EMAIL MARKETING
  Emails sent:          [X]
  Open rate:            [X]%
  Click rate:           [X]%
  Unsubscribe rate:     [X]%
  Status:               [ON TRACK / NEEDS ATTENTION]

AI AD MANAGEMENT (if applicable)
  Impressions:          [X]
  Clicks:               [X]
  CTR:                  [X]%
  Conversions:          [X]
  Cost per conversion:  $[X]
  Total spend:          $[X]
  ROAS:                 [X]:1
  Status:               [ON TRACK / NEEDS ATTENTION]

AI VOICE AGENT (if applicable)
  Calls received:       [X]
  Calls handled by AI:  [X]
  Transfer rate:        [X]%
  Appointments set:     [X]
  Status:               [ON TRACK / NEEDS ATTENTION]

-----------------------------------------------
ROI ANALYSIS
-----------------------------------------------

  Estimated value generated:    $[X]
  Monthly investment:           $[Y]
  Net value:                    $[X - Y]
  Monthly ROI:                  [Z]%

  Breakdown:
    - Leads x Close Rate x ATV:   $[X]
    - Review value:               $[X]
    - Content traffic value:      $[X]
    - Time savings:               $[X]
    - Ad conversions:             $[X]

-----------------------------------------------
RECOMMENDATIONS
-----------------------------------------------

1. [RECOMMENDATION 1 with rationale]
2. [RECOMMENDATION 2 with rationale]
3. [RECOMMENDATION 3 with rationale]

-----------------------------------------------
NEXT STEPS
-----------------------------------------------

- [ACTION ITEM 1 -- OWNER -- DUE DATE]
- [ACTION ITEM 2 -- OWNER -- DUE DATE]
- Next review: [DATE]

===============================================
```

---

## Appendix: Quick Reference

### Key Platform Paths

| Action | Location |
|---|---|
| Create new client | Admin Panel > Clients > Create New |
| View client dashboard | Admin Panel > Clients > [Name] > View Dashboard |
| Impersonate client | Admin Panel > Clients > [Name] > Impersonate |
| Check service health | Admin Panel > Services > Health Dashboard |
| View email logs | Admin Panel > Email > Logs |
| Generate proposal | Sales Tools > Proposal Generator |
| Generate performance report | Admin Panel > Reports > Client Performance |
| View drip sequence status | Admin Panel > Email > Drip Sequences |

### Key Source Files (for Engineering Escalations)

| System | File Path |
|---|---|
| Stripe webhook handler | `src/app/api/payments/webhooks/stripe/route.ts` |
| Service onboarding checklists | `src/lib/service-onboarding.ts` |
| Drip email sequences | `src/lib/drip-sequences.ts` |
| Welcome email series | `src/lib/emails/welcome-series.ts` |
| Service health monitoring | `src/lib/service-health.ts` |
| Onboarding API endpoint | `src/app/api/onboarding/route.ts` |
| Welcome drip cron job | `src/app/api/cron/welcome-drip/route.ts` |
| Communication templates | `src/lib/communication-templates.ts` |
| Client engagement tracking | `src/lib/client-engagement.ts` |
| Client health scoring | `src/lib/client-health-score.ts` |

### Onboarding Health Score Targets

| Metric | Green | Yellow | Red |
|---|---|---|---|
| Days to complete onboarding | <= 7 | 8-14 | > 14 |
| Client dashboard logins (Week 1) | >= 5 | 3-4 | < 3 |
| Onboarding checklist completion | >= 80% | 50-79% | < 50% |
| Support tickets (first 30 days) | <= 3 | 4-6 | > 6 |
| Client satisfaction (30-day NPS) | >= 8 | 6-7 | < 6 |
| Time to first value (TTFV) | <= 48 hrs | 48-96 hrs | > 96 hrs |

### Handoff Checklist (One-Page Summary)

Use this as a quick reference during the sales-to-success handoff meeting:

- [ ] CRM record complete with all discovery notes
- [ ] Bundle confirmed and any custom terms documented
- [ ] Payment confirmed in Stripe
- [ ] Client contacts entered (primary, billing, technical)
- [ ] Handoff document completed and shared with CSM
- [ ] Introduction email sent to client
- [ ] Welcome call scheduled within 48 hours
- [ ] CSM has reviewed all sales notes and promises made
- [ ] Any red flags or special requirements communicated verbally
