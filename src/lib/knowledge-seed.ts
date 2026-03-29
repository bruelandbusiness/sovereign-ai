/**
 * Knowledge base seed data.
 *
 * Provides 20 curated articles across 5 categories. Import these into the
 * knowledge API route as a fallback when the database is empty.
 */

export interface KnowledgeArticle {
  id: string;
  slug: string;
  category: string;
  title: string;
  content: string;
  order: number;
}

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  // ─── Getting Started ──────────────────────────────────────────
  {
    id: "seed-gs-1",
    slug: "how-to-access-your-dashboard",
    category: "getting_started",
    title: "How to Access Your Dashboard",
    order: 1,
    content: `# How to Access Your Dashboard

Your Sovereign AI dashboard is the central hub for managing every aspect of your AI-powered marketing. Here is how to log in and start using it right away.

## Logging In with Magic Links

Sovereign AI uses passwordless authentication for security and convenience. When you visit the login page and enter your email address, we send a magic link directly to your inbox. Click the link and you are instantly signed in — no passwords to remember or reset.

Magic links expire after 15 minutes for security. If your link has expired, simply request a new one from the login page. Each new link automatically invalidates any previous ones.

## Staying Signed In

Once authenticated, your session remains active for 30 days. You will not need to log in again unless you explicitly sign out or clear your browser cookies. If you access the platform from multiple devices, each device maintains its own session.

## Dashboard Layout

After logging in, you land on the main dashboard view featuring:

- **KPI Grid**: A quick-glance summary of leads, reviews, conversion rate, and revenue for the current period.
- **Lead Table**: A sortable, filterable list of all incoming leads with source attribution.
- **Activity Feed**: Real-time updates from every active service, so you always know what your AI marketing team is doing.
- **Onboarding Progress**: A checklist that guides you through the initial setup steps.

## Troubleshooting Access

If you are not receiving magic link emails, check your spam or junk folder first. Ensure you are using the same email address you registered with. If problems persist, reach out to support from the login page — we can verify your account and resend the link manually.

## Mobile Access

The dashboard is fully responsive. You can access it from any modern browser on your phone or tablet with the same functionality available on desktop.`,
  },
  {
    id: "seed-gs-2",
    slug: "understanding-your-kpi-metrics",
    category: "getting_started",
    title: "Understanding Your KPI Metrics",
    order: 2,
    content: `# Understanding Your KPI Metrics

Key Performance Indicators (KPIs) give you an at-a-glance view of how your AI marketing is performing. Here is what each metric means and why it matters for your business.

## Leads This Month

This number represents every new prospect captured across all channels — website chatbot conversations, inbound phone calls, form submissions, ad clicks, and social media inquiries. A healthy local service business typically generates 40 to 80 leads per month. If your number is below that range, consider activating additional services or adjusting your ad budget.

## Total Reviews

Your cumulative review count across platforms, primarily Google. This metric includes the total number of reviews and your average star rating. Google weighs review volume and recency heavily in local search rankings, so a steady flow of new reviews is critical for visibility.

## Conversion Rate

The percentage of leads that become booked appointments or paying customers. Industry average for home services sits around 15 to 25 percent, but Sovereign AI's automated follow-up sequences and AI-powered lead nurturing typically push this to 25 to 40 percent. Monitor this metric closely — a sudden drop may indicate a problem with your follow-up process.

## Monthly Revenue Attribution

This tracks estimated revenue generated from leads that originated through your Sovereign AI marketing. The platform follows each lead from initial capture through your pipeline to a completed job, giving you a clear picture of return on investment.

## Additional Metrics by Service

Depending on which services you have active, your dashboard may also display:

- **Ad Spend and ROAS**: How much you are spending on ads and the revenue generated per dollar spent.
- **Call Volume**: Total inbound and outbound AI-powered calls handled.
- **Content Published**: Number of blog posts, social posts, and emails sent.
- **SEO Rankings**: Your position for target keywords in local search results.

## Setting and Tracking Goals

Use the goal banner at the top of your dashboard to set monthly targets. Start with a realistic lead goal and increase it as your marketing engine matures. The platform tracks progress automatically and sends notifications when you hit milestones.`,
  },
  {
    id: "seed-gs-3",
    slug: "setting-up-your-first-ai-service",
    category: "getting_started",
    title: "Setting Up Your First AI Service",
    order: 3,
    content: `# Setting Up Your First AI Service

Activating your first AI service is the most important step after creating your account. This guide walks you through the process from start to finish.

## Choosing Your First Service

We recommend starting with one of these three high-impact services:

- **AI Chatbot**: Captures leads on your website 24/7 with zero effort from you. Ideal if you already have website traffic.
- **Review Management**: Automates review collection and response. Best if you have recent customers who have not yet left reviews.
- **AI Content Engine**: Generates SEO-optimized blog posts and social content. Perfect for building long-term organic traffic.

## Activation Steps

1. Navigate to **Dashboard > Services** from the top navigation bar.
2. Browse the available services and click on the one you want to activate.
3. Review the service description, features, and any prerequisites.
4. Click **Activate** to enable the service on your account.
5. Follow the service-specific setup wizard that appears.

## Configuring Your Service

Each service has its own configuration panel. Common settings include:

- **Business Information**: Confirm your business name, service area, and contact details are correct.
- **Tone and Voice**: Choose how the AI should communicate — professional, friendly, casual, or authoritative.
- **Notification Preferences**: Decide whether you want email or SMS alerts when the service takes an action.
- **Integration Points**: Connect any required external accounts such as Google Business Profile or social media.

## Testing Before Going Live

Before making any service customer-facing, use the built-in test mode. For the chatbot, you can preview conversations in the dashboard. For review management, send a test request to your own email. For the content engine, generate a draft post and review it before publishing.

## Monitoring Results

Once active, check your dashboard daily for the first week to see how the service is performing. Early data helps you fine-tune settings for optimal results. After the initial period, weekly check-ins are usually sufficient as the AI learns and improves automatically.`,
  },
  {
    id: "seed-gs-4",
    slug: "connecting-your-google-business-profile",
    category: "getting_started",
    title: "Connecting Your Google Business Profile",
    order: 4,
    content: `# Connecting Your Google Business Profile

Your Google Business Profile (GBP) is one of the most important assets for local search visibility. Connecting it to Sovereign AI unlocks powerful automation features across multiple services.

## Why Connect Your GBP

When your Google Business Profile is linked, Sovereign AI can:

- **Monitor and respond to reviews** automatically with AI-crafted, personalized responses.
- **Track your local search rankings** for the keywords that matter most to your business.
- **Publish Google Posts** to keep your listing fresh and engaging.
- **Analyze competitor activity** in your local market to identify opportunities.
- **Track calls and website clicks** originating from your Google listing.

## How to Connect

1. Go to **Dashboard > Settings > Integrations**.
2. Find the Google Business Profile section and click **Connect**.
3. Sign in with the Google account that owns or manages your business listing.
4. Grant the requested permissions — Sovereign AI needs read and write access to manage reviews and posts on your behalf.
5. Select the correct business location if you have multiple listings.
6. Click **Confirm** to complete the connection.

## Permissions Explained

We request only the permissions necessary to provide our services:

- **Read reviews**: To monitor new reviews and display them in your dashboard.
- **Reply to reviews**: To post AI-generated responses on your behalf.
- **Manage posts**: To publish Google Posts that keep your listing active.
- **View insights**: To pull performance data into your analytics.

You can revoke access at any time from your Google account settings or from the Sovereign AI integrations page.

## After Connecting

Once connected, the platform begins syncing your existing reviews and listing data. This initial sync typically takes 5 to 10 minutes. After that, new reviews and data are synced in near real-time. You will see your review metrics appear on your main dashboard within minutes.

## Troubleshooting

If the connection fails, ensure you are signing in with the correct Google account — the one that has ownership or management access to the business listing. If you manage the listing through an agency account, you may need the agency to grant you direct access first.`,
  },
  {
    id: "seed-gs-5",
    slug: "your-first-30-days-checklist",
    category: "getting_started",
    title: "Your First 30 Days Checklist",
    order: 5,
    content: `# Your First 30 Days Checklist

The first month with Sovereign AI sets the foundation for long-term marketing success. Follow this week-by-week checklist to ensure you are getting maximum value from the platform.

## Week 1: Foundation

- Complete your business profile with accurate name, address, phone, service area, and business hours.
- Connect your Google Business Profile to enable review monitoring and local SEO tracking.
- Activate the AI Chatbot and embed it on your website.
- Customize the chatbot greeting and system prompt to match your brand voice.
- Upload your business logo for use across all customer-facing features.

## Week 2: Engagement

- Activate Review Management and send your first batch of review requests to recent customers.
- Enable the Content Engine and approve your first AI-generated blog post.
- Connect your social media accounts for automated posting.
- Review your first week of chatbot conversations and adjust the system prompt if needed.
- Set monthly lead and revenue goals on your dashboard.

## Week 3: Expansion

- Activate the Voice Agent to handle inbound calls with AI.
- Set up email marketing and create your first drip campaign for new leads.
- Review your KPI dashboard and compare metrics against your goals.
- Respond to any reviews that came in during the first two weeks.
- Explore the CRM features to organize your lead pipeline.

## Week 4: Optimization

- Review your analytics across all active services and identify what is working best.
- Consider activating ad management if you have budget for paid campaigns.
- Fine-tune your chatbot and voice agent based on conversation logs.
- Schedule a monthly review routine — 15 minutes per week is usually enough.
- Share your early results with our support team for personalized optimization tips.

## What to Expect

Businesses that follow this checklist typically see measurable results by the end of month one: more leads, higher review counts, and improved search visibility. The AI continues to learn and improve over time, so results compound month over month.`,
  },

  // ─── Services Guide ───────────────────────────────────────────
  {
    id: "seed-sg-1",
    slug: "how-ai-lead-generation-works",
    category: "services",
    title: "How AI Lead Generation Works",
    order: 1,
    content: `# How AI Lead Generation Works

Sovereign AI's lead generation system uses multiple AI-powered channels working together to capture, qualify, and nurture prospects around the clock.

## The Multi-Channel Approach

Rather than relying on a single source, our platform captures leads from:

- **Website Chatbot**: Engages visitors the moment they land on your site, asks qualifying questions, and captures contact information.
- **AI Voice Agent**: Answers phone calls, qualifies callers, and books appointments without human intervention.
- **Content Marketing**: SEO-optimized blog posts and social media content that attract organic traffic from people searching for your services.
- **Paid Advertising**: AI-managed Google and Meta ad campaigns that target high-intent prospects in your service area.
- **Review Funnels**: Happy customers leave reviews that drive more traffic, creating a virtuous cycle.

## Lead Qualification

Not all leads are created equal. Our AI scores each lead based on:

- **Intent signals**: What they asked about, how they found you, and what actions they took.
- **Service match**: Whether their needs align with the services you offer.
- **Location**: Whether they are within your service area.
- **Engagement level**: How much they interacted with your chatbot or spent on your website.

High-quality leads are prioritized in your dashboard and can trigger immediate notifications so you can follow up quickly.

## Automated Follow-Up

Speed-to-lead is the single biggest factor in conversion. Our system automatically:

- Sends an SMS within 60 seconds of lead capture.
- Follows up with an email containing your business information and next steps.
- Schedules additional touchpoints if the lead does not respond immediately.
- Hands off to the Voice Agent for a phone follow-up if configured.

## Pipeline Management

Every lead flows into your CRM with full attribution data — you can see exactly which channel and campaign generated each prospect. Track leads through stages from new to contacted to booked to completed, giving you a clear view of your sales pipeline at all times.`,
  },
  {
    id: "seed-sg-2",
    slug: "how-ai-voice-agents-answer-your-calls",
    category: "services",
    title: "How AI Voice Agents Answer Your Calls",
    order: 2,
    content: `# How AI Voice Agents Answer Your Calls

Never miss a call again. The AI Voice Agent handles inbound and outbound phone calls with natural-sounding AI that represents your business professionally.

## How Inbound Calls Work

When a customer calls your business number, the AI Voice Agent:

1. Answers immediately with a professional greeting using your business name.
2. Asks the caller about their needs using natural, conversational language.
3. Collects their name, phone number, email, and service requirements.
4. Checks your availability and can book an appointment on the spot.
5. Logs the entire interaction in your dashboard with a transcript and AI-generated summary.

The voice sounds natural and conversational — callers often do not realize they are speaking with AI. The system handles interruptions, clarifying questions, and complex requests gracefully.

## Outbound Call Capabilities

The Voice Agent can also make calls on your behalf:

- **Lead Follow-Up**: Automatically calls new leads who submitted a form but have not been reached yet.
- **Appointment Reminders**: Calls to confirm upcoming appointments and reduce no-shows.
- **Re-engagement**: Reaches out to past customers for seasonal promotions or follow-up services.

## Missed Call Text-Back

When a call goes to voicemail or is not answered, the system immediately sends a text message to the caller. This simple automated response recovers a significant percentage of leads that would otherwise be lost. The message lets the caller know you received their call and will follow up shortly.

## Call Analytics

Every call is recorded with proper disclosure, transcribed, and analyzed. Your dashboard shows:

- **Call volume** broken down by day and time.
- **Average call duration** and resolution type.
- **Sentiment analysis** indicating whether callers were satisfied, neutral, or frustrated.
- **Lead quality scores** based on the conversation content.

## Configuration

Customize the Voice Agent from Dashboard > Services > Voice. You can adjust the greeting script, qualifying questions, business hours handling, and appointment booking rules. Test the agent by calling your own number before going live with customers.`,
  },
  {
    id: "seed-sg-3",
    slug: "how-review-management-gets-you-5-star-reviews",
    category: "services",
    title: "How Review Management Gets You 5-Star Reviews",
    order: 3,
    content: `# How Review Management Gets You 5-Star Reviews

Online reviews are the most influential factor in a customer's decision to hire a local service provider. Sovereign AI automates the entire review lifecycle from request to response.

## Automated Review Requests

After completing a job, the system sends a personalized review request to your customer via SMS and email. The AI optimizes:

- **Timing**: Requests are sent within 24 to 48 hours while the experience is still fresh.
- **Messaging**: Each request is personalized with the customer's name and the service performed.
- **Follow-Up**: A gentle reminder is sent if the customer has not left a review after a few days.
- **Channel**: SMS typically achieves higher response rates than email, so it is prioritized.

## Smart Routing

The system uses a satisfaction pre-screen. Before directing customers to Google, it asks a simple satisfaction question. Customers who indicate high satisfaction are directed to leave a public Google review. Those who express concerns are routed to a private feedback form, giving you a chance to resolve issues before they become public negative reviews.

## AI-Powered Review Responses

Every review — positive or negative — deserves a response. The AI generates professional, personalized replies that:

- Thank the customer by name for positive reviews.
- Address specific concerns mentioned in negative reviews.
- Maintain a professional and empathetic tone.
- Include a call to action when appropriate.

You can review and edit AI-generated responses before they are posted, or allow automatic posting for faster response times.

## Impact on Your Business

Consistent review management delivers compounding benefits:

- **Higher search rankings**: Google rewards businesses with frequent, recent, high-rated reviews.
- **Increased trust**: 93 percent of consumers read reviews before choosing a provider.
- **Better conversion**: Businesses with 4.5 or more stars convert at two to three times the rate of lower-rated competitors.
- **Customer insights**: Review content reveals what customers value most and where you can improve.`,
  },
  {
    id: "seed-sg-4",
    slug: "how-ai-content-engine-publishes-for-you",
    category: "services",
    title: "How AI Content Engine Publishes for You",
    order: 4,
    content: `# How AI Content Engine Publishes for You

The Content Engine is your automated content marketing department. It researches, writes, and publishes SEO-optimized content tailored to your business and local market without you writing a single word.

## How Content Generation Works

The AI analyzes multiple data sources to create relevant, high-quality content:

- **Your business profile**: Services offered, service area, and unique selling points.
- **Keyword research**: Identifies the search terms your potential customers use, such as "emergency plumber near me" or "best HVAC company in [city]."
- **Competitor analysis**: Reviews what competitors are publishing to identify content gaps and opportunities.
- **Seasonal trends**: Adjusts topics based on time of year — furnace maintenance in fall, AC tune-ups in spring.

## Content Types

The engine produces several content formats:

- **Blog Posts**: Long-form articles of 800 to 1500 words targeting informational search queries. These build your website's authority over time.
- **Social Media Posts**: Platform-appropriate content for Facebook, Instagram, LinkedIn, and Twitter/X.
- **Google Business Posts**: Short updates that keep your Google listing active and engaging.
- **Service Pages**: Detailed descriptions of each service you offer, optimized for local search.

## Publishing Workflow

You have full control over the publishing process:

1. The AI generates draft content on a schedule you define.
2. Drafts appear in your dashboard for review.
3. You can approve, edit, or reject each piece.
4. Approved content is published automatically to the configured platforms.
5. Alternatively, enable auto-publish to skip the review step entirely.

## SEO Benefits

Content marketing is a long-term strategy with compounding returns. Each published article creates a new entry point for search traffic. Over six to twelve months, a consistent publishing schedule can generate dozens of keyword rankings, driving organic leads that cost nothing per click. The Content Engine makes this strategy effortless by handling the entire process from ideation to publication.`,
  },
  {
    id: "seed-sg-5",
    slug: "how-ai-ads-management-optimizes-your-spend",
    category: "services",
    title: "How AI Ads Management Optimizes Your Spend",
    order: 5,
    content: `# How AI Ads Management Optimizes Your Spend

Paid advertising delivers the fastest results, but only when managed properly. Sovereign AI's ad management service uses artificial intelligence to maximize every dollar of your ad budget across Google and Meta platforms.

## Supported Platforms

- **Google Ads**: Search ads targeting people actively looking for your services, Local Services Ads for Google Guaranteed placement, and display campaigns for brand awareness.
- **Meta Ads**: Facebook and Instagram campaigns targeting homeowners in your service area based on demographics, interests, home ownership status, and behavioral signals.

## AI-Powered Optimization

Traditional ad management requires constant manual monitoring. Our AI handles this continuously:

- **Bid Management**: Adjusts bids in real-time based on conversion data, time of day, device type, and competition levels.
- **Audience Refinement**: Analyzes which demographics and interest groups convert best and shifts budget accordingly.
- **Creative Testing**: Generates multiple ad variations with different headlines, descriptions, and images, then allocates budget to the best performers.
- **Budget Allocation**: Automatically moves spend between campaigns and platforms based on where the lowest cost-per-lead is found.
- **Negative Keywords**: Identifies and excludes search terms that waste budget on irrelevant clicks.

## Transparent Reporting

Your ad dashboard provides clear, actionable data:

- Daily, weekly, and monthly spend tracking.
- Cost per lead broken down by platform, campaign, and ad group.
- Conversion tracking from initial click to booked appointment.
- Return on ad spend (ROAS) calculations showing revenue generated per dollar spent.

## Getting Started

To launch ad campaigns, set a monthly budget in Dashboard > Services > Ad Management. We recommend a minimum of 500 to 1000 dollars per month for meaningful data and results. The AI handles campaign structure, ad creation, targeting, and ongoing optimization. Most businesses see their first leads from ads within 48 to 72 hours of launch.

## Budget Recommendations

Start conservatively and scale based on results. Once your cost per lead stabilizes, increase budget incrementally. The AI's optimization improves with more data, so larger budgets often achieve lower cost per lead over time.`,
  },

  // ─── Billing & Account ────────────────────────────────────────
  {
    id: "seed-ba-1",
    slug: "understanding-your-subscription-plan",
    category: "billing",
    title: "Understanding Your Subscription Plan",
    order: 1,
    content: `# Understanding Your Subscription Plan

Sovereign AI offers flexible subscription plans designed to match your business size and marketing ambitions. Here is a complete breakdown of what is available.

## Available Plans

### Starter Bundle
Perfect for businesses beginning their AI marketing journey. Includes core services:
- AI Chatbot for website lead capture.
- Review Management for automated review collection and response.
- Content Engine for SEO blog posts and social media content.
- Basic analytics dashboard with KPI tracking.

### Growth Bundle
Our most popular plan for businesses ready to scale. Includes everything in Starter plus:
- AI Voice Agent for inbound and outbound calls.
- Email Marketing with drip campaigns and broadcasts.
- Social Media management across all major platforms.
- Advanced SEO tracking and keyword monitoring.

### Empire Bundle
The complete marketing suite with all 16 AI services for maximum growth:
- Everything in Growth plus Ad Management, Revenue Attribution, Quarterly Business Reviews, and advanced integrations.
- Priority support with dedicated account management.
- Custom reporting and white-label options.

## A La Carte Services

Prefer to build your own stack? Individual services are available on an a la carte basis. Mix and match to create exactly the marketing toolkit you need. A la carte pricing is shown on each service's detail page in your dashboard.

## Free Trial

Every new subscriber starts with a free trial period. During the trial you have full access to all features in your selected plan. No credit card is required to begin. At the end of the trial, you can choose to subscribe, switch plans, or cancel with no obligation.

## Viewing Your Plan

Check your current plan, billing date, and included services anytime at Dashboard > Billing. You will also find your payment history and invoice downloads there.`,
  },
  {
    id: "seed-ba-2",
    slug: "how-to-upgrade-or-downgrade",
    category: "billing",
    title: "How to Upgrade or Downgrade",
    order: 2,
    content: `# How to Upgrade or Downgrade

Changing your Sovereign AI subscription is straightforward and can be done at any time from your dashboard. Here is how each scenario works.

## Upgrading Your Plan

When you move to a higher-tier plan:

1. Go to **Dashboard > Billing > Change Plan**.
2. Select the plan you want to upgrade to and review the feature comparison.
3. Click **Upgrade Now** to confirm.
4. New services are activated immediately — no waiting period.
5. You are charged a prorated amount for the remaining days in your current billing cycle.
6. Your next invoice reflects the full new plan price.

All your existing data, configurations, chatbot settings, and service histories are fully preserved during the upgrade. Nothing is lost or reset.

## Downgrading Your Plan

When you move to a lower-tier plan:

1. Go to **Dashboard > Billing > Change Plan**.
2. Select the plan you want to downgrade to.
3. Click **Downgrade** to confirm.
4. The change takes effect at the end of your current billing period — you keep full access until then.
5. Services not included in your new plan are gracefully deactivated.
6. All data from deactivated services is preserved for 90 days. If you re-upgrade within that window, everything is restored.

## Switching to A La Carte

If you want to move from a bundle to individual service subscriptions, contact support. We will help you transition smoothly and ensure you are only paying for what you need.

## Recommendations

Not sure which plan is right for you? Here are some guidelines:

- **Starter**: You are new to AI marketing and want to test the waters with core services.
- **Growth**: You are seeing results and ready to add more channels for faster scaling.
- **Empire**: You want the full suite and maximum competitive advantage.

Our support team is available to review your account data and recommend the optimal plan based on your usage patterns and business goals.`,
  },
  {
    id: "seed-ba-3",
    slug: "billing-faq-and-payment-methods",
    category: "billing",
    title: "Billing FAQ and Payment Methods",
    order: 3,
    content: `# Billing FAQ and Payment Methods

Everything you need to know about how billing works, accepted payment methods, and answers to common billing questions.

## Accepted Payment Methods

Sovereign AI processes all payments securely through Stripe. We accept:

- Visa, Mastercard, American Express, and Discover credit cards.
- Debit cards with Visa or Mastercard branding.
- Digital wallets where supported by Stripe.

You can add, update, or remove payment methods at any time from **Dashboard > Billing > Payment Methods**.

## Billing Cycle

Your subscription renews monthly on the anniversary of your signup date. For example, if you signed up on March 15th, you are billed on the 15th of each month. Each invoice covers the upcoming month of service.

## Invoices

Detailed invoices are generated for every billing cycle and include:

- Your plan name and included services.
- Any prorated charges from mid-cycle plan changes.
- Applicable taxes based on your business location.
- Total amount charged.

All invoices are available for download from your billing dashboard and are also emailed to your registered address.

## Frequently Asked Questions

**Can I pause my subscription instead of canceling?**
Yes. Contact support to request a pause. Your account and data are preserved, and billing stops until you reactivate.

**What happens if my payment fails?**
We retry the charge automatically after 3 days. You receive an email notification to update your payment method. Services remain active during the retry period. After multiple failures, your account enters a grace period before services are paused.

**Do you offer annual billing?**
Annual billing with a discount is available for Growth and Empire plans. Contact support or check the billing page for current annual pricing.

**Can I get a receipt for tax purposes?**
Every invoice in your billing dashboard serves as an official receipt. You can download PDF versions for your records.

**Is my payment information secure?**
All payment data is handled by Stripe and never touches our servers. Stripe is PCI Level 1 certified, the highest level of payment security compliance.`,
  },
  {
    id: "seed-ba-4",
    slug: "cancellation-and-refund-policy",
    category: "billing",
    title: "Cancellation and Refund Policy",
    order: 4,
    content: `# Cancellation and Refund Policy

We want you to stay because you love the results, not because canceling is difficult. Here is our straightforward cancellation and refund policy.

## How to Cancel

1. Go to **Dashboard > Billing**.
2. Click **Cancel Subscription**.
3. You will see a summary of what happens when you cancel.
4. Confirm your cancellation.

That is it — no phone calls, no retention hoops, no hidden steps.

## What Happens After Cancellation

- **Immediate**: Your cancellation is confirmed via email.
- **Until period end**: You retain full access to all services through the end of your current billing period. If you paid through April 15th, you have access until April 15th.
- **After period end**: Active services are deactivated. Your data — leads, conversations, reviews, content, and analytics — is preserved for 90 days.
- **90-day window**: You can reactivate your subscription at any time during the 90-day retention period and pick up exactly where you left off.
- **After 90 days**: Your data is permanently deleted in accordance with our privacy policy.

## 60-Day Money-Back Guarantee

New subscribers are covered by our 60-day money-back guarantee. If you cancel within 60 days of your initial signup and are not satisfied with the results, you can request a full refund of all subscription charges. Contact support with your refund request.

## Refunds After 60 Days

After the guarantee period, refunds are handled on a case-by-case basis. We are fair and reasonable — if something went wrong on our end, we will make it right. Contact support to discuss your situation.

## Pausing Instead of Canceling

If you need a temporary break rather than a permanent cancellation, ask support about pausing your subscription. Your account, data, and configurations are preserved while billing is suspended. Resume anytime without losing your setup.

## Reactivation

To reactivate a canceled account within the 90-day retention window, simply log in and choose a new plan from the billing page. All your previous data and settings will be restored automatically.`,
  },

  // ─── Troubleshooting ──────────────────────────────────────────
  {
    id: "seed-ts-1",
    slug: "common-issues-and-solutions",
    category: "troubleshooting",
    title: "Common Issues and Solutions",
    order: 1,
    content: `# Common Issues and Solutions

Here are the most frequently encountered issues on the Sovereign AI platform and how to resolve them quickly.

## Login and Access

**Magic link not arriving**: Check your spam or junk folder first. Ensure you are entering the exact email address used during registration. Magic links expire after 15 minutes — request a new one if needed. If the problem persists, contact support to verify your account email.

**Session expired unexpectedly**: Sessions last 30 days, but clearing browser cookies or using private browsing mode will end your session. Simply request a new magic link to log back in.

## Dashboard and Data

**Dashboard shows no data**: New accounts may take a few minutes for initial data to populate after onboarding. Refresh the page after a minute. If data is still missing, verify that at least one service is active under the Services tab.

**KPIs seem incorrect**: Metrics are calculated based on your billing period. Recent plan changes or service reactivations may cause a recalculation that takes up to 24 hours to complete. If numbers still look wrong after 24 hours, open a support ticket.

## AI Chatbot

**Chatbot not appearing on website**: Verify the embed code is placed correctly before the closing body tag. Check your browser developer console for JavaScript errors. Confirm the chatbot is set to Active in Dashboard > Services > AI Chatbot. Some ad blockers can interfere with the widget — test in an incognito window.

**Chatbot giving wrong information**: The chatbot relies on your system prompt and business profile for accuracy. Review and update both in your dashboard. Add specific FAQs to the system prompt to handle common questions correctly.

## Voice Agent

**Calls not being answered by AI**: Confirm the Voice Agent is active and your business phone number is correctly configured. Check that call forwarding is set up properly with your phone provider.

## Reviews

**Review requests not sending**: Verify the customer's phone number and email are correct. Check your daily send limit has not been exceeded. Ensure the Review Management service is active.

## General Tips

When reporting any issue to support, include the steps you took, what you expected to happen, and what actually happened. Screenshots are extremely helpful for faster resolution.`,
  },
  {
    id: "seed-ts-2",
    slug: "how-to-contact-support",
    category: "troubleshooting",
    title: "How to Contact Support",
    order: 2,
    content: `# How to Contact Support

Our support team is committed to helping you succeed with Sovereign AI. Here are all the ways to get help and tips for the fastest resolution.

## Support Ticket System (Recommended)

The fastest and most reliable way to get help:

1. Navigate to **Dashboard > Support**.
2. Click **New Ticket**.
3. Select a category that best matches your issue.
4. Describe the problem in detail.
5. Set the priority level.
6. Attach screenshots if relevant.
7. Submit your ticket.

Our team typically responds within 2 to 4 hours during business hours (9 AM to 6 PM Eastern, Monday through Friday).

## Priority Levels

Choose the right priority to ensure appropriate response times:

- **Low**: General questions, feature requests, non-urgent configuration help. Response within 24 hours.
- **Medium**: A service is not working as expected, you need configuration assistance, or something seems off. Response within 4 hours.
- **High**: A service is completely non-functional, you have a billing discrepancy, or there is a data concern. Response within 1 hour.

## What to Include in Your Ticket

Help us help you faster by providing:

- A clear, specific description of the problem.
- The steps you took before the issue appeared.
- What you expected to happen versus what actually happened.
- Screenshots or screen recordings showing the issue.
- Your browser name and version.
- Whether the issue is consistent or intermittent.

## Self-Service Resources

Before opening a ticket, check these resources — your answer may already be here:

- **This Knowledge Base**: Covers setup guides, service documentation, billing questions, and troubleshooting.
- **Community Forum**: Other business owners may have encountered and solved the same issue.
- **Onboarding Checklist**: Many early issues are resolved by completing all onboarding steps.

## Emergency Support

For critical issues outside business hours — such as a complete platform outage or security concerns — email emergency@trysovereignai.com. This channel is monitored around the clock and reserved for urgent matters only.`,
  },
  {
    id: "seed-ts-3",
    slug: "service-status-and-uptime",
    category: "troubleshooting",
    title: "Service Status and Uptime",
    order: 3,
    content: `# Service Status and Uptime

Sovereign AI is built for reliability, but transparency matters. Here is how we communicate platform status and what to do during rare service disruptions.

## Our Uptime Commitment

We target 99.9 percent uptime for all platform services. This means less than 8.8 hours of total downtime per year. Our infrastructure is hosted on enterprise-grade cloud providers with redundancy across multiple availability zones.

## Checking Current Status

You can check the real-time status of all Sovereign AI services at any time:

- **Status Page**: Visit status.trysovereignai.com for a live dashboard showing the current operational state of each service.
- **Dashboard Banner**: If any service is experiencing issues, a notification banner appears at the top of your dashboard with details and estimated resolution time.
- **Email Notifications**: Subscribe to status updates on the status page to receive email alerts for incidents and maintenance windows.

## What Each Status Means

- **Operational**: The service is running normally with no known issues.
- **Degraded Performance**: The service is functional but may be slower than usual.
- **Partial Outage**: Some users or features are affected.
- **Major Outage**: The service is unavailable for most or all users.
- **Maintenance**: A planned maintenance window is in progress.

## Planned Maintenance

We schedule maintenance during off-peak hours, typically between 2 AM and 5 AM Eastern on weekdays. You will receive advance notice of any planned maintenance that may affect your services. We strive to keep maintenance windows under 30 minutes.

## During an Outage

If you experience a service disruption:

1. Check the status page first to see if there is a known incident.
2. If no incident is reported, try refreshing your browser or clearing your cache.
3. Test from a different browser or device to rule out local issues.
4. If the problem persists and is not reflected on the status page, report it via a support ticket with High priority.

## Incident Communication

During incidents, we post updates to the status page every 15 to 30 minutes until the issue is resolved. After resolution, we publish a post-incident report explaining what happened, how we fixed it, and what steps we are taking to prevent recurrence.`,
  },

  // ─── Best Practices ───────────────────────────────────────────
  {
    id: "seed-bp-1",
    slug: "maximizing-your-roi",
    category: "best_practices",
    title: "Maximizing Your ROI",
    order: 1,
    content: `# Maximizing Your ROI

Getting the best return on your Sovereign AI investment comes down to activating the right services, monitoring your metrics, and optimizing based on data. Here are proven strategies from our highest-performing clients.

## Activate Multiple Channels

The businesses that see the highest ROI use at least three or four services together. Each channel reinforces the others:

- The **Content Engine** drives organic traffic to your website.
- The **AI Chatbot** captures that traffic as leads.
- **Review Management** builds social proof that increases conversion rates.
- The **Voice Agent** follows up with leads who do not convert online.

This multi-channel approach creates a marketing flywheel where each service amplifies the others.

## Speed to Lead

The single most impactful factor in conversion is how quickly you follow up with new leads. Research shows that responding within 5 minutes makes you 21 times more likely to convert a lead compared to waiting 30 minutes. Sovereign AI's automated follow-up sequences handle this for you, but reviewing and personally reaching out to high-value leads within the first hour adds another conversion boost.

## Monitor and Adjust Weekly

Set aside 15 minutes each week to review your dashboard. Focus on:

- **Cost per lead** by channel — shift budget toward what works.
- **Conversion rate** — if it drops, check your follow-up sequences and chatbot conversations.
- **Review velocity** — aim for at least 4 to 5 new reviews per month.
- **Content performance** — see which blog posts drive the most traffic and create more on similar topics.

## Optimize Your Chatbot

Your chatbot is often the first interaction a prospect has with your business. Review conversation logs monthly and update the system prompt to address common questions, overcome frequent objections, and guide visitors toward booking.

## Leverage Seasonal Trends

Plan your marketing around seasonal demand in your industry. Use the Content Engine and Ad Management to ramp up before peak seasons. For example, HVAC businesses should increase content and ads for AC services starting in April and heating services starting in September.

## Track Revenue Attribution

Use the ROI section of your dashboard to track actual revenue generated from each marketing channel. This data is invaluable for making informed decisions about where to invest more and where to cut back.`,
  },
  {
    id: "seed-bp-2",
    slug: "getting-the-most-from-ai-chatbots",
    category: "best_practices",
    title: "Getting the Most from AI Chatbots",
    order: 2,
    content: `# Getting the Most from AI Chatbots

Your AI chatbot can be your most productive team member — available 24/7, never taking a break, and consistently capturing leads. Here is how to optimize it for maximum performance.

## Craft an Effective System Prompt

The system prompt is the most important configuration for your chatbot. It determines how the AI responds, what information it provides, and how it guides conversations. Best practices:

- **Be specific about your services**: List every service you offer with brief descriptions so the AI can match visitors to the right solutions.
- **Define your service area**: Include the cities and zip codes you serve so the chatbot can qualify leads geographically.
- **Set the tone**: Specify whether you want the chatbot to be formal, friendly, casual, or authoritative.
- **Include pricing guidance**: Even general ranges help the chatbot set expectations. For example, "AC tune-ups start at $89" or "We provide free estimates for all roofing projects."
- **Add FAQs**: Include answers to your most common questions so the chatbot handles them accurately.

## Optimize the Greeting Message

Your greeting is the first thing visitors see. Make it:

- **Action-oriented**: "Need help with your AC? I can get you a free quote in 60 seconds!" performs better than a generic "How can I help you?"
- **Specific to your business**: Mention your industry or most popular service.
- **Brief**: Keep it under 2 sentences. Long greetings reduce engagement.

## Review Conversations Regularly

Check your chatbot conversation logs weekly. Look for:

- Questions the chatbot struggles to answer — add these to your system prompt.
- Points where visitors drop off — simplify the conversation flow at those moments.
- Successful conversations — identify what works and reinforce those patterns.

## Enable SMS Follow-Up

When the chatbot captures a phone number, automatic SMS follow-up dramatically increases conversion. The text message keeps the conversation going even after the visitor leaves your website, providing your contact information and a clear next step.

## Test Frequently

Use the preview feature in your dashboard to test conversations as if you were a customer. Try different scenarios — emergency requests, price shopping, after-hours inquiries — and adjust the system prompt until the chatbot handles each one well.`,
  },
  {
    id: "seed-bp-3",
    slug: "review-response-best-practices",
    category: "best_practices",
    title: "Review Response Best Practices",
    order: 3,
    content: `# Review Response Best Practices

How you respond to reviews matters as much as the reviews themselves. Potential customers read your responses to gauge how you treat people. Here are best practices for both positive and negative reviews.

## Responding to Positive Reviews

Even a glowing 5-star review deserves a thoughtful response. Here is why and how:

- **Thank the customer by name**: Personalization shows you genuinely care, not just copying and pasting a template.
- **Reference the specific service**: Mentioning what you did ("Glad we could get your AC running before the heat wave!") shows future customers the range of services you offer.
- **Keep it brief**: Two to three sentences is ideal. A short, genuine response is more impactful than a lengthy one.
- **Invite them back**: A subtle mention like "We are here whenever you need us" encourages repeat business.

## Responding to Negative Reviews

Negative reviews are opportunities to demonstrate professionalism. How you respond influences future customers more than the complaint itself.

- **Respond quickly**: Aim to reply within 24 hours. Delayed responses suggest you do not care.
- **Stay calm and professional**: Never argue, get defensive, or blame the customer. Even if the review is unfair, your response is public.
- **Acknowledge the concern**: Show empathy with phrases like "We are sorry to hear about your experience" or "We understand your frustration."
- **Take it offline**: Provide a direct contact method: "Please call us at [phone] or email [address] so we can make this right." This shows you want to resolve the issue without airing details publicly.
- **Follow through**: Actually resolve the issue. Many customers update their review after a positive resolution.

## General Response Guidelines

- Respond to every review, not just negative ones. Consistency matters.
- Avoid using the same template repeatedly — Google and customers both notice.
- Never offer incentives in exchange for changing a review, as this violates platform terms.
- Keep responses free of sensitive customer information.

## Using AI-Generated Responses

Sovereign AI's review management generates personalized responses automatically. Review the suggested response before posting to ensure it sounds natural and addresses the specific feedback. Over time, the AI learns your preferred tone and becomes increasingly accurate. You can choose to auto-publish responses or approve each one manually based on your comfort level.`,
  },
];
