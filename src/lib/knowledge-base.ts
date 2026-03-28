/**
 * Knowledge Base article seed data and helpers.
 *
 * These articles are stored in the database via the KnowledgeArticle model.
 * This module provides the seed data and category metadata.
 */

export const KB_CATEGORIES = [
  { id: "getting_started", label: "Getting Started", icon: "rocket" },
  { id: "services", label: "Services", icon: "zap" },
  { id: "billing", label: "Billing", icon: "credit-card" },
  { id: "integrations", label: "Integrations", icon: "puzzle" },
  { id: "troubleshooting", label: "Troubleshooting", icon: "wrench" },
] as const;

export type KBCategory = (typeof KB_CATEGORIES)[number]["id"];

export interface KBArticleSeed {
  slug: string;
  category: KBCategory;
  title: string;
  content: string;
  order: number;
}

export const KB_ARTICLES: KBArticleSeed[] = [
  // ─── Getting Started ─────────────────────────────────────────
  {
    slug: "welcome-to-sovereign-ai",
    category: "getting_started",
    title: "Welcome to Sovereign AI",
    order: 1,
    content: `# Welcome to Sovereign AI

Sovereign AI is your all-in-one AI-powered marketing platform designed specifically for local service businesses. Whether you run an HVAC company, plumbing service, roofing business, or any other home service operation, our platform works 24/7 to generate leads, book appointments, and grow your revenue.

## What Makes Sovereign AI Different

Unlike traditional marketing agencies that require constant oversight and manual work, Sovereign AI leverages artificial intelligence to automate the most time-consuming aspects of marketing. Our 16 AI-powered services work together seamlessly, creating a marketing ecosystem that continuously improves and adapts to your market.

## Your AI Marketing Team

Think of Sovereign AI as having an entire marketing department at your fingertips. From AI chatbots that capture leads on your website to automated review management that builds your online reputation, every service is designed to work autonomously while giving you full visibility and control through your dashboard.

## Getting the Most Out of Your Platform

We recommend starting with the onboarding checklist in your dashboard. This will walk you through connecting your business profile, customizing your AI chatbot, setting up review campaigns, and more. Each step is designed to take just a few minutes, and our system handles the rest.

If you ever need help, our support team is available through the dashboard, and this knowledge base contains detailed guides for every feature.

## Next Steps

- [Setting Up Your Dashboard](/knowledge/setting-up-your-dashboard) -- Get your command center configured
- [Onboarding Checklist Guide](/knowledge/onboarding-checklist-guide) -- Complete setup in minutes
- [Understanding Your KPIs](/knowledge/understanding-your-kpis) -- Learn what your metrics mean
- [Understanding Your Subscription](/knowledge/understanding-your-subscription) -- Review plans and pricing`,
  },
  {
    slug: "setting-up-your-dashboard",
    category: "getting_started",
    title: "Setting Up Your Dashboard",
    order: 2,
    content: `# Setting Up Your Dashboard

Your Sovereign AI dashboard is the command center for all your marketing activities. Here's how to get started and make the most of it.

## First Login

After signing up, you'll receive a magic link via email. Click it to access your dashboard instantly -- no passwords to remember. Your session stays active for 30 days, so you won't need to log in frequently.

## Dashboard Overview

The main dashboard gives you a bird's-eye view of your marketing performance:

- **KPI Grid**: See your leads this month, total reviews, conversion rate, and revenue at a glance
- **Lead Table**: View and manage all incoming leads with their source, status, and contact information
- **Activity Feed**: Real-time updates on everything happening across your marketing channels
- **ROI Section**: Track your return on investment with clear, easy-to-understand metrics

## Navigation

Use the top navigation bar to access specialized features:
- **Inbox**: Your unified message center for all customer communications
- **CRM**: Full customer relationship management with pipeline stages
- **Voice**: Manage inbound and outbound AI-powered phone calls
- **Billing**: View your subscription, invoices, and payment history
- **Community**: Connect with other business owners using the platform

## Customizing Your Experience

Your dashboard automatically adapts based on which services you have active. The more services you enable, the richer your dashboard data becomes. We recommend enabling at least the AI Chatbot, Review Management, and Content Engine to start seeing results quickly.

## Related Articles

- [Understanding Your KPIs](/knowledge/understanding-your-kpis) -- Learn what each dashboard metric means
- [Reading Your Dashboard Reports](/knowledge/reading-your-dashboard-reports) -- Detailed guide to interpreting your data
- [AI Chatbot Setup Guide](/knowledge/ai-chatbot-setup-guide) -- Configure your lead-capture chatbot
- [Common Issues](/knowledge/common-issues) -- Troubleshoot dashboard problems`,
  },
  {
    slug: "connecting-your-business-profile",
    category: "getting_started",
    title: "Connecting Your Business Profile",
    order: 3,
    content: `# Connecting Your Business Profile

A complete business profile is the foundation for all AI-generated content, chatbot responses, and marketing materials. Here's how to set up your profile for maximum effectiveness.

## Business Information

During onboarding, you'll provide key details about your business:

- **Business Name**: Your official business name as it appears on Google
- **Service Area**: The cities and radius you serve
- **Vertical/Industry**: Your specific trade (HVAC, plumbing, roofing, etc.)
- **Website**: Your current website URL for the AI to analyze
- **Phone Number**: Your primary business phone for call tracking

## Google Business Profile (GBP)

Connecting your Google Business Profile is one of the most impactful steps you can take. This allows Sovereign AI to:

- Automatically respond to Google reviews with AI-crafted responses
- Monitor your local search rankings for relevant keywords
- Optimize your GBP listing with AI-generated posts and updates
- Track calls and website visits from your Google listing

## Social Media Accounts

Connect your social media accounts to enable automated posting and engagement tracking across platforms including Facebook, Instagram, LinkedIn, and Twitter/X.

## Why This Matters

The more information you provide, the more personalized and effective your AI marketing becomes. Our AI uses your business details to craft messages that sound authentically like your brand, targeting the right customers in your service area with the right messaging.`,
  },
  {
    slug: "understanding-your-kpis",
    category: "getting_started",
    title: "Understanding Your KPIs",
    order: 4,
    content: `# Understanding Your KPIs

Key Performance Indicators (KPIs) are the metrics that matter most to your business growth. Here's what each metric on your dashboard means and why it matters.

## Leads This Month

This shows the total number of new leads captured across all channels (website chatbot, phone calls, forms, ads, social media) during the current month. A healthy local service business typically aims for 40-80 leads per month.

## Total Reviews

Your cumulative review count across platforms (primarily Google). More reviews at a higher average rating directly correlate with higher local search visibility and customer trust. We track both the count and your average star rating.

## Conversion Rate

This measures the percentage of leads that convert into booked appointments or paying customers. The industry average for home services is around 15-25%. Sovereign AI's lead nurturing and follow-up automation typically pushes this to 25-40%.

## Monthly Revenue (ROI)

Tracks the estimated revenue generated from leads attributed to your Sovereign AI marketing. This is calculated by tracking leads through the pipeline from capture to completed job, giving you a clear picture of your marketing ROI.

## Additional Metrics

Depending on your active services, you may also see:
- **Ad Spend & ROAS**: Return on ad spend for Google and Meta campaigns
- **Call Volume**: Inbound and outbound AI-powered calls
- **Content Published**: Blog posts, social posts, and email campaigns sent
- **SEO Rankings**: Your keyword positions in local search results

## Setting Goals

Use the goal banner at the top of your dashboard to track progress toward monthly targets. We recommend starting with a realistic lead goal and increasing it as your marketing engine ramps up.

## Related Articles

- [Reading Your Dashboard Reports](/knowledge/reading-your-dashboard-reports) -- Deep dive into your dashboard data
- [Setting Up Your Dashboard](/knowledge/setting-up-your-dashboard) -- Configure your command center
- [Ad Management](/knowledge/ad-management) -- Understanding ad spend and ROAS metrics`,
  },
  {
    slug: "onboarding-checklist-guide",
    category: "getting_started",
    title: "Onboarding Checklist Guide",
    order: 5,
    content: `# Onboarding Checklist Guide

The onboarding checklist in your dashboard walks you through the essential steps to get your AI marketing running at full speed. Here's a detailed walkthrough of each step.

## Step 1: Connect Google Business Profile

Link your Google Business Profile to enable review monitoring, local SEO tracking, and automated GBP posts. This step unlocks several AI services that depend on your Google presence.

## Step 2: Customize Chatbot Greeting

Your AI chatbot comes pre-configured with a greeting based on your business type, but personalizing it ensures visitors get the right first impression. Navigate to Dashboard > Services > AI Chatbot to customize the greeting message, colors, and behavior.

## Step 3: Set Business Hours

Letting our AI know your business hours helps it schedule appointments correctly, set expectations with callers, and time your marketing messages for maximum impact.

## Step 4: Publish Your First Post

Use the Content Engine to generate and publish your first AI-written blog post or social media update. This kickstarts your content marketing and gives the AI data to improve future content.

## Step 5: Upload Your Logo

Adding your business logo personalizes your chatbot widget, email campaigns, and any client-facing materials generated by the platform.

## Completion Rewards

Completing all onboarding steps ensures you're getting the maximum value from your subscription. Businesses that complete onboarding within the first week see 3x faster results on average. Your dashboard tracks your progress, and our team is standing by to help if you get stuck on any step.`,
  },

  // ─── Services ────────────────────────────────────────────────
  {
    slug: "ai-chatbot-setup-guide",
    category: "services",
    title: "AI Chatbot Setup Guide",
    order: 1,
    content: `# AI Chatbot Setup Guide

Your AI chatbot is one of the most powerful lead generation tools in the Sovereign AI platform. It engages website visitors 24/7, qualifies leads, captures contact information, and can even book appointments -- all without you lifting a finger.

## How It Works

The chatbot uses advanced AI trained specifically on your business information, services, and service area. When a visitor lands on your website, the chatbot greets them naturally and guides the conversation toward capturing their needs and contact details.

## Customization Options

Navigate to Dashboard > Services > AI Chatbot to customize:

- **System Prompt**: The core instructions that guide how your chatbot responds. Pre-populated based on your business type, but fully customizable.
- **Greeting Message**: The first message visitors see. Keep it friendly and action-oriented.
- **Primary Color**: Match your brand colors for a seamless website integration.
- **Active/Inactive Toggle**: Turn the chatbot on or off without losing your configuration.

## Embedding on Your Website

After configuration, you'll receive a simple embed code (a single script tag) to add to your website. The chatbot widget appears as a small icon in the bottom-right corner and expands when clicked.

## SMS Follow-Up

When the chatbot captures a lead's phone number, it can automatically send a follow-up SMS to keep the conversation going even after they leave your website. This dramatically increases conversion rates.

## Viewing Conversations

All chatbot conversations are logged in your dashboard. You can review conversations, see which ones captured leads, and identify common questions that might indicate content gaps on your website.`,
  },
  {
    slug: "review-management",
    category: "services",
    title: "Review Management",
    order: 2,
    content: `# Review Management

Online reviews are the lifeblood of local service businesses. Sovereign AI's review management system automates the entire process of collecting, monitoring, and responding to reviews.

## Automated Review Requests

The system sends personalized review requests to your customers via SMS and email. The timing, frequency, and messaging are all optimized by AI to maximize response rates while staying compliant with platform guidelines.

## Review Campaign Management

From your dashboard, you can:

- **Create Campaigns**: Enter customer details and let the system handle the rest
- **Track Status**: See which requests are pending, sent, reminded, or completed
- **Monitor Ratings**: Track your average rating trend over time
- **Respond to Reviews**: AI generates professional, personalized responses to both positive and negative reviews

## Why Reviews Matter

For local service businesses, reviews directly impact:
- **Search Rankings**: Google heavily weighs review quantity and quality in local results
- **Customer Trust**: 93% of consumers read reviews before choosing a service provider
- **Conversion Rate**: Businesses with 4.5+ stars convert at 2-3x the rate of lower-rated competitors

## Best Practices

- Request reviews within 24-48 hours of completing a job while the experience is fresh
- Respond to every review, positive or negative, to show you care
- Never incentivize reviews in a way that violates platform terms of service
- Let the AI craft your responses -- they're professional, timely, and personalized`,
  },
  {
    slug: "content-engine",
    category: "services",
    title: "Content Engine",
    order: 3,
    content: `# Content Engine

The Content Engine is your AI-powered content marketing machine. It generates SEO-optimized blog posts, social media content, and service pages tailored to your business and local market.

## How Content Generation Works

Our AI analyzes your business type, service area, target keywords, and competitor content to generate unique, high-quality articles. Each piece is optimized for local SEO, meaning it targets the specific search terms your potential customers are using.

## Content Types

- **Blog Posts**: Long-form articles (800-1500 words) targeting informational keywords like "how to know if you need a new AC unit" or "signs your roof needs replacement"
- **Social Media Posts**: Engaging, platform-appropriate posts for Facebook, Instagram, LinkedIn, and Twitter/X
- **Service Pages**: Detailed pages for each service you offer, optimized for "near me" searches

## Content Calendar

The Content Engine operates on an automated schedule. You can:
- View upcoming scheduled content
- Edit or approve content before publishing
- Adjust the publishing frequency
- Add custom topics or keywords to target

## SEO Benefits

Consistently publishing high-quality, locally-relevant content is one of the most effective long-term marketing strategies. Over time, your website builds authority for hundreds of local search terms, creating a steady stream of organic leads that cost nothing per click.`,
  },
  {
    slug: "email-marketing",
    category: "services",
    title: "Email Marketing",
    order: 4,
    content: `# Email Marketing

Sovereign AI's email marketing service automates customer communication through intelligent drip campaigns, broadcasts, and re-engagement sequences.

## Campaign Types

- **Drip Campaigns**: Automated sequences that nurture leads over time. For example, a new lead might receive a welcome email, followed by a case study 3 days later, then a special offer after a week.
- **Broadcasts**: One-time emails to your entire list or a segment. Great for seasonal promotions, company news, or holiday greetings.
- **Re-engagement**: Automated emails sent to inactive leads or past customers to bring them back. These are triggered based on inactivity thresholds.

## AI-Generated Content

The AI crafts email subject lines and body copy that are personalized to your business and optimized for open rates. Each email is designed to look professional while maintaining your brand voice.

## Tracking & Analytics

For every campaign, you can track:
- **Open Rate**: Percentage of recipients who opened the email
- **Click Rate**: Percentage who clicked a link
- **Conversions**: Leads or bookings attributed to the email
- **Unsubscribes**: Recipients who opted out (kept at industry-low rates through AI optimization)

## Compliance

All emails include proper unsubscribe links and comply with CAN-SPAM regulations. Our system automatically manages opt-outs and bounces to maintain a healthy sender reputation.`,
  },
  {
    slug: "voice-agent",
    category: "services",
    title: "Voice Agent",
    order: 5,
    content: `# Voice Agent

The Voice Agent is an AI-powered phone system that handles both inbound and outbound calls for your business. It answers calls, qualifies leads, books appointments, and follows up -- all with a natural-sounding AI voice.

## Inbound Calls

When a customer calls your business number:
1. The AI greets them professionally using your business name
2. It asks qualifying questions to understand their needs
3. It captures their contact information and service requirements
4. It can check your calendar and book an appointment on the spot
5. All call data flows into your CRM and lead pipeline

## Outbound Calls

The Voice Agent can also make outbound calls for:
- **Lead Follow-Up**: Automatically call new leads who haven't been reached
- **Appointment Reminders**: Confirm upcoming bookings to reduce no-shows
- **Re-engagement**: Reach out to past customers for repeat business

## Missed Call Text-Back

When a call goes unanswered, the system automatically sends a text message to the caller letting them know you'll call back. This simple feature recovers leads that would otherwise be lost.

## Call Analytics

Every call is recorded (with proper disclosure), transcribed, and analyzed for:
- **Sentiment**: Was the caller positive, neutral, or frustrated?
- **Summary**: AI-generated summary of the call's key points
- **Lead Quality**: Automatic scoring based on the conversation content

All this data is visible in your Voice dashboard and feeds into your overall analytics.`,
  },
  {
    slug: "ad-management",
    category: "services",
    title: "Ad Management",
    order: 6,
    content: `# Ad Management

Sovereign AI manages your paid advertising across Google Ads and Meta (Facebook/Instagram) platforms, using AI to optimize targeting, bidding, and creative for maximum ROI.

## Supported Platforms

- **Google Ads**: Search ads, Local Services Ads, and display campaigns targeting people actively searching for your services
- **Meta Ads**: Facebook and Instagram ads targeting homeowners in your service area based on demographics, interests, and behaviors

## AI Optimization

Our AI continuously monitors and adjusts your campaigns:
- **Bid Optimization**: Automatically adjusts bids to get the lowest cost per lead
- **Audience Refinement**: Narrows targeting based on which demographics convert best
- **Ad Copy Testing**: Generates and tests multiple ad variations to find top performers
- **Budget Allocation**: Shifts budget between campaigns and platforms based on performance

## Reporting

Your Ad dashboard shows:
- Daily/weekly/monthly spend
- Cost per lead by platform and campaign
- Conversion tracking from click to booked appointment
- ROAS (Return on Ad Spend) calculations

## Getting Started

To launch ad campaigns, you'll need to provide a monthly budget. We recommend starting with at least $500-1000/month for meaningful results. The AI handles everything else -- from campaign structure to ad creative to landing page optimization.`,
  },
  {
    slug: "social-media",
    category: "services",
    title: "Social Media",
    order: 7,
    content: `# Social Media

Keep your social media presence active and engaging without spending hours creating content. Sovereign AI's social media service handles content creation, scheduling, and posting across all major platforms.

## Supported Platforms

- Google Business Profile
- Facebook
- Instagram
- LinkedIn
- Twitter/X

## Content Creation

The AI generates platform-appropriate content including:
- **Educational Posts**: Tips and advice related to your services
- **Promotional Posts**: Special offers, seasonal promotions
- **Behind-the-Scenes**: Humanizing your brand with project highlights
- **Customer Spotlights**: Celebrating positive reviews and customer stories

## Scheduling & Publishing

Content is automatically scheduled at optimal times for engagement based on your audience and platform best practices. You can review and approve posts before they go live, or trust the AI to publish automatically.

## Engagement Tracking

Track likes, comments, shares, impressions, and reach for every post. The AI uses this data to learn what content resonates with your audience and adjusts future content accordingly.

## Best Practices

Consistency is key in social media marketing. Our AI ensures you maintain a regular posting schedule without gaps, which is one of the biggest factors in growing your social media presence organically.`,
  },

  // ─── Billing ─────────────────────────────────────────────────
  {
    slug: "understanding-your-subscription",
    category: "billing",
    title: "Understanding Your Subscription",
    order: 1,
    content: `# Understanding Your Subscription

Sovereign AI offers flexible subscription plans designed to scale with your business. Here's everything you need to know about your subscription.

## Available Plans

We offer four bundles, each with monthly and annual pricing (save ~17% with annual billing):

- **DIY ($497/mo)**: 3 core AI tools -- AI Chatbot, Review Management, and Booking. Perfect for owner-operators who want to start capturing more leads and reviews without a big commitment.
- **Starter ($3,497/mo)**: AI Lead Generation, Review Management, and Booking. Ideal for businesses doing $250K--$750K that need a steady pipeline of qualified leads.
- **Growth ($6,997/mo)**: Our most popular plan, chosen by 94% of clients. Includes 6 AI systems -- Lead Generation, Voice Agent, SEO, Email Marketing, Reviews, and CRM. Built for businesses doing $750K--$3M who want to dominate their local market.
- **Empire ($12,997/mo)**: All 16 AI services plus a dedicated account manager. Built for multi-truck operations doing $3M+ that want to own every lead in their service area.

## A La Carte Services

Don't need a full bundle? You can also subscribe to individual services on an a la carte basis. This gives you the flexibility to build exactly the marketing stack you need.

## 60-Day Money-Back Guarantee

Every plan comes with our 60-day money-back guarantee. If you're not satisfied within your first 60 days, request a full refund -- no questions asked. See [60-Day Guarantee Explained](/knowledge/60-day-guarantee-explained) for full details.

## Subscription Management

You can manage your subscription directly from your dashboard under Billing. View your current plan, see your next billing date, and access your payment history. All billing is handled securely through Stripe. For details on changing plans, see [Upgrading or Downgrading](/knowledge/upgrading-or-downgrading).`,
  },
  {
    slug: "upgrading-or-downgrading",
    category: "billing",
    title: "Upgrading or Downgrading",
    order: 2,
    content: `# Upgrading or Downgrading Your Plan

Changing your subscription plan is simple and takes effect immediately. Here's how it works.

## Upgrading

When you upgrade to a higher plan:
- New services are activated immediately
- You're charged a prorated amount for the remainder of your current billing period
- Your next invoice reflects the new plan price
- All your existing data and configurations are preserved

To upgrade, go to Dashboard > Billing > Change Plan and select your new plan.

## Downgrading

When you downgrade to a lower plan:
- The change takes effect at the end of your current billing period
- You retain access to all current services until the period ends
- Services not included in your new plan are gracefully deactivated
- Your data is preserved for 90 days in case you decide to re-upgrade

## Cancellation

If you need to cancel your subscription:
- Your access continues through the end of your paid period
- All your data is retained for 90 days
- You can reactivate at any time during the retention period
- Our 60-day money-back guarantee applies to new subscribers

## Need Help Deciding?

If you're not sure which plan is right for you, reach out to our support team through the dashboard. We'll review your business goals and recommend the best option.

## Related Articles

- [Understanding Your Subscription](/knowledge/understanding-your-subscription) -- Compare plans and pricing
- [How Billing Works](/knowledge/how-billing-works) -- Complete billing overview
- [60-Day Guarantee Explained](/knowledge/60-day-guarantee-explained) -- Refund guarantee details
- [Contacting Support](/knowledge/contacting-support) -- Get help choosing a plan`,
  },
  {
    slug: "invoices-and-payments",
    category: "billing",
    title: "Invoices and Payments",
    order: 3,
    content: `# Invoices and Payments

Managing your billing and payments is straightforward with Sovereign AI. Here's everything you need to know.

## Payment Methods

We accept all major credit and debit cards through our secure payment processor, Stripe. You can update your payment method at any time from Dashboard > Billing.

## Invoices

Every billing cycle, you receive a detailed invoice showing:
- Your plan and services
- Any prorated charges from plan changes
- Applicable taxes
- Total amount charged

All invoices are accessible from your billing dashboard and are also emailed to your registered email address.

## Billing Cycle

Subscriptions are billed monthly on the anniversary of your signup date. For example, if you signed up on March 15th, you'll be billed on the 15th of each month.

## Failed Payments

If a payment fails:
1. We'll retry the charge automatically after 3 days
2. You'll receive an email notification to update your payment method
3. Your services remain active during the retry period
4. After multiple failed attempts, your account enters a grace period before services are paused

## Refunds

Our 60-day money-back guarantee means you can request a full refund within the first 60 days if you're not satisfied. After that, refunds are handled on a case-by-case basis. Contact support for assistance.

## Related Articles

- [Understanding Your Subscription](/knowledge/understanding-your-subscription) -- Plan details and pricing
- [60-Day Guarantee Explained](/knowledge/60-day-guarantee-explained) -- Full guarantee terms
- [How Billing Works](/knowledge/how-billing-works) -- Complete billing overview
- [Contacting Support](/knowledge/contacting-support) -- Get help with billing issues`,
  },

  // ─── Integrations ────────────────────────────────────────────
  {
    slug: "webhook-setup",
    category: "integrations",
    title: "Webhook Setup",
    order: 1,
    content: `# Webhook Setup

Webhooks allow you to connect Sovereign AI with other tools and services in real-time. When specific events happen (like a new lead captured or a booking confirmed), we'll send a notification to your specified URL.

## Setting Up Webhooks

Navigate to Dashboard > Settings > Webhooks to configure:

1. **Endpoint URL**: The URL where you want to receive webhook notifications
2. **Events**: Choose which events trigger notifications:
   - \`lead.created\` -- New lead captured
   - \`booking.confirmed\` -- Appointment booked
   - \`review.received\` -- New review posted
   - \`call.completed\` -- Phone call finished
   - \`payment.received\` -- Invoice payment received
3. **Secret**: A shared secret for verifying webhook signatures

## Payload Format

Webhooks are sent as HTTP POST requests with a JSON payload containing:
- Event type
- Timestamp
- Resource data (lead details, booking info, etc.)
- Signature header for verification

## Integration Ideas

- **Zapier**: Connect to thousands of apps via Zapier webhooks
- **CRM Sync**: Push leads directly to your existing CRM
- **Slack Notifications**: Get instant alerts in your team's Slack channel
- **Accounting Software**: Sync payments with QuickBooks or Xero

## Testing

Use the "Send Test" button on your webhook configuration page to verify your endpoint is receiving and processing events correctly.`,
  },
  {
    slug: "embedding-widgets",
    category: "integrations",
    title: "Embedding Widgets",
    order: 2,
    content: `# Embedding Widgets

Sovereign AI provides several embeddable widgets that you can add to your website to enhance lead capture and customer engagement.

## AI Chatbot Widget

The chatbot widget is the most popular embed. It adds a floating chat icon to your website that visitors can click to start a conversation with your AI assistant.

**Installation**: Copy the script tag from Dashboard > Services > AI Chatbot and paste it before the closing \`</body>\` tag on your website.

**Customization**: The widget automatically uses your configured brand colors and greeting message.

## Booking Widget

If you have the booking service active, you can embed a scheduling widget that lets visitors book appointments directly on your website.

**Features**:
- Shows available time slots based on your business hours
- Captures customer name, email, phone, and service type
- Sends automatic confirmation emails
- Syncs with your dashboard calendar

## Social Proof Widget

Display your latest reviews and average rating on your website to build trust with potential customers.

**Options**:
- Floating badge showing star rating
- Review carousel showing recent positive reviews
- Full review page embed

## Implementation Notes

All widgets are lightweight (under 50KB) and load asynchronously, so they won't slow down your website. They're also fully responsive and work on mobile devices.`,
  },
  {
    slug: "api-documentation",
    category: "integrations",
    title: "API Documentation",
    order: 3,
    content: `# API Documentation

Sovereign AI provides a RESTful API for developers who want to integrate our platform with custom applications or workflows.

## Authentication

All API requests require authentication using a session token obtained through the magic link authentication flow. Include the session cookie with all requests.

## Available Endpoints

### Leads
- \`GET /api/leads/stats\` -- Lead statistics and pipeline overview
- \`POST /api/services/chatbot/conversations\` -- Retrieve chatbot conversations

### Reviews
- \`GET /api/services/reviews/campaigns\` -- List review campaigns
- \`POST /api/services/reviews/send\` -- Send a review request

### Content
- \`GET /api/services/content/posts\` -- List generated content
- \`POST /api/services/content/generate\` -- Generate new content

### Bookings
- \`GET /api/services/booking/upcoming\` -- List upcoming bookings
- \`GET /api/services/booking/slots\` -- Get available time slots

### Email
- \`GET /api/services/email/campaigns\` -- List email campaigns
- \`POST /api/services/email/send\` -- Send an email campaign

## Rate Limits

API requests are rate-limited to 100 requests per minute per account. If you exceed this limit, you'll receive a 429 status code. Implement exponential backoff for retries.

## Webhooks vs Polling

For real-time data, we recommend using webhooks instead of polling the API. Webhooks are more efficient and deliver data instantly when events occur.`,
  },

  // ─── Troubleshooting ─────────────────────────────────────────
  {
    slug: "common-issues",
    category: "troubleshooting",
    title: "Common Issues",
    order: 1,
    content: `# Common Issues & FAQ

Here are solutions to the most frequently encountered issues on the Sovereign AI platform.

## Login Issues

**Q: I'm not receiving my magic link email.**
A: Check your spam/junk folder first. Magic links are valid for 15 minutes. If you still don't see it, try requesting a new one. Make sure you're using the email address associated with your account.

**Q: My magic link says it's expired.**
A: Magic links expire after 15 minutes for security. Simply go back to the login page and request a new one. The new link will invalidate any previous ones.

## Dashboard Issues

**Q: My dashboard shows no data.**
A: New accounts may take a few minutes for initial data to populate. If you've just completed onboarding, refresh the page after a minute. If data is still missing, check that your services are active under the Services tab.

**Q: My KPIs seem incorrect.**
A: KPIs are calculated based on your billing period. If you recently changed plans or reactivated services, historical data may take up to 24 hours to fully recalculate.

## Chatbot Issues

**Q: My chatbot isn't appearing on my website.**
A: Verify that you've added the embed code correctly before the closing \`</body>\` tag. Check your browser's developer console for any JavaScript errors. Ensure the chatbot is set to "Active" in your dashboard.

**Q: The chatbot gives incorrect information.**
A: Review and update the system prompt in Dashboard > Services > AI Chatbot. The more detailed your business information, the more accurate the chatbot's responses will be.

## Billing Issues

**Q: I was charged after canceling.**
A: Cancellations take effect at the end of your billing period. The charge you see was for the current period that was already active. If you believe there's an error, contact support.

## Still Need Help?

If your issue isn't covered here, check these resources:

- [Contacting Support](/knowledge/contacting-support) -- Submit a support ticket for personalized help
- [Setting Up Your Dashboard](/knowledge/setting-up-your-dashboard) -- Walkthrough of dashboard features
- [AI Chatbot Setup Guide](/knowledge/ai-chatbot-setup-guide) -- Detailed chatbot configuration guide
- [Invoices and Payments](/knowledge/invoices-and-payments) -- Billing and payment troubleshooting`,
  },
  {
    slug: "contacting-support",
    category: "troubleshooting",
    title: "Contacting Support",
    order: 2,
    content: `# Contacting Support

Our support team is here to help you get the most out of Sovereign AI. Here's how to reach us.

## Support Ticket System

The fastest way to get help is through the built-in support ticket system:

1. Go to Dashboard > Support
2. Click "New Ticket"
3. Describe your issue with as much detail as possible
4. Set the priority level (low, medium, high)
5. Submit and track the status of your ticket

Our team typically responds within 2-4 hours during business hours (9am-6pm ET, Monday-Friday).

## What to Include in Your Ticket

To help us resolve your issue quickly, please include:
- A clear description of the problem
- Steps to reproduce the issue
- Screenshots if applicable
- Your browser and device information
- Any error messages you're seeing

## Priority Levels

- **Low**: General questions, feature requests, non-urgent issues
- **Medium**: Service not working as expected, configuration help needed
- **High**: Service completely down, billing errors, data concerns

## Self-Service Resources

Before contacting support, check these resources:
- **Knowledge Base**: This help center covers most common questions
- **Community Forum**: Other users may have encountered and solved similar issues
- **Onboarding Checklist**: Many issues are resolved by completing all onboarding steps

## Emergency Support

For critical issues outside business hours (such as complete service outage or security concerns), email emergency@trysovereignai.com. This channel is monitored 24/7.

## Related Articles

- [Common Issues](/knowledge/common-issues) -- Solutions to frequently encountered problems
- [Understanding Your Subscription](/knowledge/understanding-your-subscription) -- Plan details and billing info`,
  },

  // ─── Additional Getting Started ───────────────────────────────
  {
    slug: "reading-your-dashboard-reports",
    category: "getting_started",
    title: "Reading Your Dashboard Reports",
    order: 6,
    content: `# Reading Your Dashboard Reports

Your Sovereign AI dashboard provides real-time and historical data across all your marketing channels. This guide explains how to interpret each section so you can make informed decisions about your marketing strategy.

## KPI Grid (Top of Dashboard)

The four primary KPI cards at the top of your dashboard update in real time:

- **Leads This Month**: Total new leads captured across all channels. Click the card to drill down by source (chatbot, phone, ads, organic, referral). A green arrow means you are trending above last month; red means below.
- **Total Reviews**: Your cumulative review count and average star rating. This combines Google, Facebook, and other connected platforms.
- **Conversion Rate**: The percentage of leads that moved from "New" to "Won" in your pipeline. Hover to see a breakdown by lead source.
- **Revenue (ROI)**: Estimated revenue from leads attributed to Sovereign AI. This is calculated from closed deals in your CRM pipeline.

## Lead Table

Below the KPI grid, the lead table shows every incoming lead with:
- **Source**: Where the lead came from (chatbot, call, form, ad click, referral)
- **Status**: Current pipeline stage (New, Contacted, Qualified, Proposal, Won, Lost)
- **Contact Info**: Name, phone, and email
- **Created Date**: When the lead was captured

Use the filters and search bar to narrow results by date range, source, or status. Click any lead row to see the full conversation history and timeline.

## Activity Feed

The right sidebar shows a chronological feed of everything happening across your marketing channels -- new leads, reviews received, emails sent, calls completed, content published. This gives you a quick pulse check without drilling into individual services.

## ROI Section

The ROI section at the bottom of your dashboard shows:
- **Total Marketing Spend**: Your subscription cost plus any ad spend
- **Total Attributed Revenue**: Revenue from leads tracked through your pipeline
- **ROI Multiplier**: Revenue divided by spend -- aim for 5x or higher
- **Cost Per Lead**: Your total spend divided by leads generated

## Tips for Getting the Most from Your Reports

- Check your dashboard at least once a week to spot trends early
- Use the date range picker to compare month-over-month performance
- If your conversion rate drops, review your lead follow-up speed -- responding within 5 minutes dramatically increases conversions
- Export data to CSV from any table for offline analysis

## Related Articles

- [Understanding Your KPIs](/knowledge/understanding-your-kpis) -- What each metric means
- [Setting Up Your Dashboard](/knowledge/setting-up-your-dashboard) -- Configure your command center
- [Common Issues](/knowledge/common-issues) -- Troubleshoot dashboard display issues`,
  },

  // ─── Additional Billing ────────────────────────────────────────
  {
    slug: "60-day-guarantee-explained",
    category: "billing",
    title: "60-Day Guarantee Explained",
    order: 4,
    content: `# 60-Day Money-Back Guarantee

Every Sovereign AI subscription comes with a 60-day money-back guarantee. We are confident that our platform delivers results, and we want you to feel the same way.

## How It Works

- Your 60-day window starts on the date of your first payment
- If at any point within those 60 days you are not satisfied, you can request a full refund
- No questions asked -- simply contact our support team
- Your refund is processed within 5-7 business days back to your original payment method

## What Is Covered

The guarantee covers your subscription fees (monthly plan charges). It applies to all plans -- DIY, Starter, Growth, and Empire.

## What Is Not Covered

- **Ad spend**: Any budget you allocate to Google Ads or Meta Ads is paid directly to those platforms and is not refundable by Sovereign AI
- **One-time setup fees**: If applicable, setup fees for custom implementations may not be covered. Check your contract or ask support for details.
- **Third-party costs**: Domain registrations, premium integrations, or external tools purchased separately

## How to Request a Refund

1. Go to Dashboard > Support
2. Click "New Ticket"
3. Select "Billing" as the category
4. State that you would like to request a refund under the 60-day guarantee
5. Our team will confirm and process your refund promptly

## After the 60-Day Period

After 60 days, refunds are handled on a case-by-case basis. If you have concerns about your results, we encourage you to reach out to support -- we often find that a quick strategy call or configuration adjustment can dramatically improve performance.

## Related Articles

- [Understanding Your Subscription](/knowledge/understanding-your-subscription) -- Plan details and pricing
- [Invoices and Payments](/knowledge/invoices-and-payments) -- Payment methods and billing cycles
- [Contacting Support](/knowledge/contacting-support) -- How to reach our support team`,
  },

  // ─── Additional Services ──────────────────────────────────────
  {
    slug: "crm-usage-guide",
    category: "services",
    title: "CRM Usage Guide",
    order: 8,
    content: `# CRM Usage Guide

The Sovereign AI CRM (Customer Relationship Management) system helps you track every lead from first contact to closed deal. It is included in the Growth and Empire plans, or available as an a la carte add-on.

## Accessing the CRM

Navigate to the **CRM** tab in your top navigation bar. You will see a Kanban-style board with your lead pipeline.

## Pipeline Stages

Your pipeline comes preconfigured with stages optimized for home service businesses:

1. **New**: Leads just captured from chatbot, phone, ads, or other sources
2. **Contacted**: You or the AI have made initial contact
3. **Qualified**: The lead has a confirmed need and is in your service area
4. **Proposal**: You have sent a quote or estimate
5. **Won**: The job is booked or completed
6. **Lost**: The lead did not convert (tracking this helps identify patterns)

Drag and drop leads between stages, or click a lead card to update its status.

## Lead Details

Click any lead card to see the full profile:
- **Contact Information**: Name, phone, email, address
- **Source**: How the lead found you (chatbot, call, ad, organic, referral)
- **Conversation History**: Every interaction -- chat transcripts, call recordings, emails sent
- **Notes**: Add internal notes for your team
- **Tags**: Categorize leads by service type, urgency, or custom labels
- **Estimated Value**: Track the potential revenue for each lead

## Automation Features

The CRM works with your other Sovereign AI services to automate follow-ups:
- Leads in the "New" stage for more than 1 hour trigger an automatic follow-up SMS or email
- Leads in "Contacted" for more than 3 days get a reminder nudge
- Leads in "Proposal" for more than 5 days trigger a follow-up call from the Voice Agent

## Reporting

From the CRM dashboard you can view:
- **Pipeline Value**: Total estimated revenue across all active leads
- **Win Rate**: Percentage of leads that reach "Won" status
- **Average Time to Close**: How long it takes from first contact to closed deal
- **Source Performance**: Which channels produce the highest-converting leads

## Related Articles

- [AI Chatbot Setup Guide](/knowledge/ai-chatbot-setup-guide) -- Configure your lead-capture chatbot
- [Voice Agent](/knowledge/voice-agent) -- Automate phone-based follow-up
- [Email Marketing](/knowledge/email-marketing) -- Set up drip campaigns for lead nurturing`,
  },
  {
    slug: "seo-tracking-guide",
    category: "services",
    title: "SEO Tracking Guide",
    order: 9,
    content: `# SEO Tracking Guide

Sovereign AI's SEO service monitors your local search rankings, tracks keyword performance, and optimizes your online presence to drive organic traffic. This guide explains how to read your SEO data and get the most from the service.

## Accessing SEO Data

Your SEO metrics are visible in two places:
- **Dashboard KPIs**: High-level rankings and organic traffic numbers appear in your main dashboard
- **SEO Dashboard**: Navigate to Dashboard > Services > SEO for detailed keyword and ranking data

## Key Metrics

### Keyword Rankings
Your SEO dashboard tracks the position of your target keywords in Google search results. Keywords are categorized as:
- **Top 3**: High-visibility positions that generate the most clicks
- **Top 10 (Page 1)**: Visible to searchers on the first page
- **Top 20 (Page 2)**: Close to page 1, small improvements can yield big results
- **Beyond 20**: Keywords that need more work

### Organic Traffic
The number of website visitors arriving through unpaid search results. This is tracked via your connected Google Business Profile and website analytics.

### Local Pack Appearances
How often your business appears in Google's local "map pack" (the 3-business listing shown for local searches). This is one of the most valuable positions for home service businesses.

## How the AI Optimizes Your SEO

The Sovereign AI SEO engine works in several ways:
- **Content Generation**: Publishes blog posts targeting keywords your competitors rank for (see [Content Engine](/knowledge/content-engine))
- **Google Business Profile Optimization**: Regular GBP posts, photo updates, and Q&A responses
- **Review Velocity**: More positive reviews improve your local search ranking (see [Review Management](/knowledge/review-management))
- **Technical SEO**: Monitors your website for crawl errors, slow page speed, and mobile issues

## Setting Realistic Expectations

SEO is a long-term strategy. Here is a typical timeline:
- **Month 1-2**: Initial audit, content strategy, and GBP optimization
- **Month 3-4**: First ranking improvements for low-competition keywords
- **Month 5-6**: Page 1 rankings for targeted local keywords begin appearing
- **Month 6+**: Compounding results as content library and review count grow

## Related Articles

- [Content Engine](/knowledge/content-engine) -- AI-generated SEO content
- [Review Management](/knowledge/review-management) -- Reviews impact local rankings
- [Connecting Your Business Profile](/knowledge/connecting-your-business-profile) -- GBP setup for SEO`,
  },
  {
    slug: "how-billing-works",
    category: "billing",
    title: "How Billing Works",
    order: 5,
    content: `# How Billing Works

This article provides a complete overview of how billing works at Sovereign AI, from your first signup to ongoing subscription management.

## Billing at a Glance

- All plans are billed monthly on your signup anniversary date
- Annual billing is available at a ~17% discount
- Payments are processed securely through Stripe
- You can update your payment method at any time from Dashboard > Billing

## Your First Bill

When you subscribe to a plan:
1. Your first payment is charged immediately
2. Your 60-day money-back guarantee window begins (see [60-Day Guarantee Explained](/knowledge/60-day-guarantee-explained))
3. Your services are activated within 48 hours
4. Your next bill will be on the same date next month

## What You Are Paying For

Your subscription fee covers:
- Access to all AI services included in your plan
- AI compute and API costs (chatbot, voice agent, content generation, etc.)
- Dashboard, CRM, and reporting tools
- Ongoing AI model updates and platform improvements
- Support access (response times vary by plan tier)

Your subscription does **not** cover:
- Ad spend for Google Ads or Meta Ads (paid directly to those platforms)
- Premium third-party integrations (if applicable)
- Custom development or white-label setup fees

## Changing Plans

You can upgrade or downgrade your plan at any time:
- **Upgrades** take effect immediately with prorated billing
- **Downgrades** take effect at the end of your current billing period
- See [Upgrading or Downgrading](/knowledge/upgrading-or-downgrading) for full details

## Cancellation

If you choose to cancel:
- Your services remain active until the end of your paid period
- Your data is retained for 90 days in case you reactivate
- The 60-day money-back guarantee applies if you are within your first 60 days
- To cancel, go to Dashboard > Billing > Cancel Subscription, or contact support

## Taxes and Receipts

- Applicable sales tax is calculated based on your business location
- Detailed invoices are emailed after each payment and available in Dashboard > Billing
- See [Invoices and Payments](/knowledge/invoices-and-payments) for more on payment methods and failed payments

## Related Articles

- [Understanding Your Subscription](/knowledge/understanding-your-subscription) -- Plans, pricing, and features
- [60-Day Guarantee Explained](/knowledge/60-day-guarantee-explained) -- Full guarantee details
- [Invoices and Payments](/knowledge/invoices-and-payments) -- Payment methods and invoice access
- [Contacting Support](/knowledge/contacting-support) -- Get help with billing questions`,
  },
];
