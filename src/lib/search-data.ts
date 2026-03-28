/**
 * Centralized search data for public content.
 *
 * Gathers blog posts, help center articles, knowledge base articles,
 * services, and FAQ entries into a single searchable index.
 */

import { SERVICES } from "@/lib/constants";
import { KB_ARTICLES } from "@/lib/knowledge-base";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchResult {
  title: string;
  excerpt: string;
  url: string;
  category: "Blog" | "Help" | "Knowledge Base" | "Services" | "FAQ";
}

// ---------------------------------------------------------------------------
// Static blog post seed data (mirrors src/app/blog/page.tsx SEED_POSTS)
// ---------------------------------------------------------------------------

const BLOG_POSTS = [
  {
    slug: "hvac-company-6-to-52-leads-case-study",
    title:
      "Case Study: How One HVAC Company Went From 6 to 52 Leads in 45 Days",
    excerpt:
      "See exactly how one HVAC company went from 6 leads per month to 52 in just 45 days using AI-powered marketing. Full breakdown of services, timeline, and results.",
  },
  {
    slug: "signs-home-service-business-needs-marketing-automation",
    title:
      "7 Signs Your Home Service Business Needs Marketing Automation",
    excerpt:
      "Missed calls, inconsistent follow-up, and stale reviews are costing you jobs. Here are 7 warning signs your business needs AI marketing automation.",
  },
  {
    slug: "why-contractor-marketing-agencies-fail",
    title:
      "Why Most Contractor Marketing Agencies Fail (And What to Do Instead)",
    excerpt:
      "Most marketing agencies serving contractors deliver poor results. Learn the 5 reasons why and discover the AI-powered alternative replacing the traditional model.",
  },
  {
    slug: "roi-ai-review-management-hvac",
    title:
      "The ROI of AI-Powered Review Management for HVAC Companies",
    excerpt:
      "Online reviews are not just social proof. For HVAC companies, they are a direct revenue driver with measurable ROI that most business owners underestimate.",
  },
  {
    slug: "50-leads-per-month-plumbing-business",
    title:
      "How to Get 50+ Leads Per Month for Your Plumbing Business",
    excerpt:
      "Step-by-step guide to generating 50+ qualified plumbing leads every month using AI lead generation, review management, local SEO, and multi-channel marketing.",
  },
  {
    slug: "email-marketing-home-service-businesses-guide",
    title:
      "Email Marketing for Home Service Businesses: The Complete Guide",
    excerpt:
      "Most home service businesses ignore email marketing. The ones that do it right generate 30-40% of their revenue from repeat and referral customers at nearly zero cost.",
  },
  {
    slug: "ai-vs-traditional-marketing-agency-contractors",
    title:
      "AI vs Traditional Marketing Agency: Which Is Better for Contractors",
    excerpt:
      "The marketing landscape for contractors has changed. An honest comparison across speed, cost, consistency, scalability, and transparency.",
  },
  {
    slug: "ai-marketing-cost-home-service-businesses",
    title:
      "How Much Does AI Marketing Cost for Home Service Businesses in 2026",
    excerpt:
      "Complete breakdown of AI marketing costs for HVAC, plumbing, and roofing companies in 2026. Compare pricing vs traditional agencies and understand the real ROI.",
  },
  {
    slug: "google-business-profile-optimization-contractors",
    title:
      "Google Business Profile Optimization Guide for Contractors",
    excerpt:
      "Your Google Business Profile is the single most important asset for local lead generation. Step-by-step guide to setting it up for maximum visibility.",
  },
  {
    slug: "ai-chatbots-booking-appointments-roofers",
    title:
      "How AI Chatbots Are Booking 3x More Appointments for Roofers",
    excerpt:
      "The average roofing company misses 40% of inbound leads. AI chatbots are closing that gap and tripling appointment bookings in the process.",
  },
  {
    slug: "ai-transforming-home-service-marketing-2026",
    title:
      "5 Ways AI is Transforming Home Service Marketing in 2026",
    excerpt:
      "Discover how AI marketing tools are helping HVAC, plumbing, and roofing companies generate more leads, automate follow-ups, and dominate local search.",
  },
  {
    slug: "hvac-companies-switching-ai-marketing",
    title:
      "Why HVAC Companies Are Switching to AI Marketing Systems",
    excerpt:
      "Traditional marketing agencies charge $3,000-$8,000/month and deliver inconsistent results. AI marketing systems are changing the math entirely.",
  },
  {
    slug: "google-reviews-guide-home-service-business",
    title:
      "The Complete Guide to Getting More Google Reviews for Your Home Service Business",
    excerpt:
      "Google reviews are the #1 factor in local search rankings. Learn proven strategies to generate 5-star reviews consistently and on autopilot.",
  },
] as const;

// ---------------------------------------------------------------------------
// Help center articles (from src/app/help/[category]/page.tsx)
// ---------------------------------------------------------------------------

interface HelpArticle {
  title: string;
  summary: string;
  categorySlug: string;
}

const HELP_ARTICLES: HelpArticle[] = [
  // Getting Started
  { title: "How to complete onboarding", summary: "Walk through the 20-minute onboarding process step by step, from business details to service area configuration.", categorySlug: "getting-started" },
  { title: "Connecting your Google Business Profile", summary: "Link your GBP to Sovereign AI so our systems can manage reviews, optimize your listing, and track local rankings.", categorySlug: "getting-started" },
  { title: "Understanding your dashboard", summary: "A tour of the main dashboard sections including KPIs, lead pipeline, service status, and performance charts.", categorySlug: "getting-started" },
  { title: "Setting up your first campaign", summary: "Choose your target services, set your budget, and let the AI build and launch your first marketing campaign.", categorySlug: "getting-started" },
  { title: "Adding your service areas", summary: "Define the zip codes, cities, and radius where you want to generate leads for maximum local coverage.", categorySlug: "getting-started" },
  { title: "Inviting team members to your account", summary: "Add technicians, office staff, or partners to your dashboard with role-based permissions.", categorySlug: "getting-started" },
  { title: "Setting up notifications", summary: "Configure email, SMS, and push notifications so you never miss a new lead or important alert.", categorySlug: "getting-started" },
  { title: "Mobile app quick-start guide", summary: "Install the Sovereign AI progressive web app on your phone for on-the-go lead management.", categorySlug: "getting-started" },
  // Billing
  { title: "How billing works", summary: "Understand the billing cycle, when charges occur, and how prorated charges work when changing plans.", categorySlug: "billing" },
  { title: "Updating your payment method", summary: "Add or change your credit card, debit card, or ACH payment method from your account settings.", categorySlug: "billing" },
  { title: "Downloading invoices", summary: "Access and download PDF invoices for any billing period from your billing dashboard.", categorySlug: "billing" },
  { title: "Changing your plan", summary: "Upgrade, downgrade, or switch between bundles. Learn how prorated credits and charges work.", categorySlug: "billing" },
  { title: "Cancellation and refund policy", summary: "How to cancel your subscription and details about our 60-day money-back guarantee.", categorySlug: "billing" },
  { title: "Understanding your invoice line items", summary: "A breakdown of what each charge on your invoice represents, from base services to add-ons.", categorySlug: "billing" },
  // Services & Features
  { title: "How AI Review Management works", summary: "Automated review solicitation, response generation, and sentiment analysis for your Google and Yelp profiles.", categorySlug: "services" },
  { title: "Setting up AI Voice Agent", summary: "Configure your AI receptionist to answer calls, qualify leads, and book appointments 24/7.", categorySlug: "services" },
  { title: "Configuring email campaigns", summary: "Set up automated drip campaigns, seasonal promotions, and re-engagement sequences for past customers.", categorySlug: "services" },
  { title: "Using the CRM and lead tracking", summary: "Manage your leads pipeline, track conversions, and see which marketing channels drive the most revenue.", categorySlug: "services" },
  { title: "Social media automation setup", summary: "Connect your Facebook, Instagram, and other social profiles for AI-generated posts and engagement.", categorySlug: "services" },
  { title: "SEO and local search optimization", summary: "How our AI optimizes your website content, meta tags, and local citations to rank higher in search.", categorySlug: "services" },
  { title: "AI content generation", summary: "Blog posts, service pages, and landing pages created automatically by AI trained on your industry.", categorySlug: "services" },
  { title: "Reputation monitoring", summary: "Track your online reputation across 50+ review sites with real-time alerts and trend analysis.", categorySlug: "services" },
  { title: "Ad campaign management", summary: "AI-managed Google Ads and Facebook Ads with automated bidding, creative testing, and budget optimization.", categorySlug: "services" },
  { title: "Referral program setup", summary: "Launch a customer referral program with automated tracking, rewards, and follow-up emails.", categorySlug: "services" },
  { title: "Chat widget and lead capture", summary: "Install our AI chat widget on your website to capture leads and answer customer questions 24/7.", categorySlug: "services" },
  { title: "Autopilot mode explained", summary: "Let the AI run your entire marketing operation with minimal input. Understand what autopilot does and does not do.", categorySlug: "services" },
  // API & Integrations
  { title: "API authentication and keys", summary: "Generate API keys, understand authentication methods, and set proper scopes for your integration.", categorySlug: "api" },
  { title: "Webhook setup guide", summary: "Configure webhooks to receive real-time notifications when leads arrive, reviews post, or campaigns update.", categorySlug: "api" },
  { title: "Connecting to Zapier", summary: "Use our Zapier integration to connect Sovereign AI with 5,000+ apps without writing code.", categorySlug: "api" },
  { title: "CRM integration guide", summary: "Sync leads bidirectionally with ServiceTitan, Housecall Pro, Jobber, or other field service management tools.", categorySlug: "api" },
  { title: "Custom reporting via API", summary: "Pull performance data, lead details, and campaign metrics into your own reporting tools.", categorySlug: "api" },
  // Troubleshooting
  { title: "Leads not showing in dashboard", summary: "Diagnose why new leads may not be appearing, from tracking code issues to filter settings.", categorySlug: "troubleshooting" },
  { title: "Google Business Profile sync issues", summary: "Fix connection problems between your GBP and Sovereign AI, including re-authentication steps.", categorySlug: "troubleshooting" },
  { title: "Email deliverability problems", summary: "Troubleshoot emails landing in spam, low open rates, and domain authentication issues.", categorySlug: "troubleshooting" },
  { title: "Dashboard loading slowly", summary: "Steps to improve dashboard performance including clearing cache, checking browser compatibility, and more.", categorySlug: "troubleshooting" },
  { title: "Resetting your password", summary: "How to reset your password if you have forgotten it, or change it from your account settings.", categorySlug: "troubleshooting" },
  { title: "Webhook delivery failures", summary: "Debug failed webhook deliveries including checking endpoints, reviewing error logs, and retry settings.", categorySlug: "troubleshooting" },
  { title: "Phone number not connecting to AI Voice", summary: "Verify your phone forwarding setup and troubleshoot common call routing issues with the AI Voice Agent.", categorySlug: "troubleshooting" },
];

// ---------------------------------------------------------------------------
// FAQ entries (from src/app/faq/page.tsx)
// ---------------------------------------------------------------------------

interface FAQEntry {
  question: string;
  answer: string;
  categoryName: string;
}

const FAQ_ENTRIES: FAQEntry[] = [
  // Getting Started
  { question: "How does Sovereign AI work?", answer: "You choose a bundle or individual services, complete a 20-minute onboarding, and we deploy your AI marketing systems within 48 hours. From there, our AI works 24/7 generating leads, managing reviews, creating content, and more.", categoryName: "Getting Started" },
  { question: "How long does setup take?", answer: "All services are live within 48 hours of completing onboarding. Most clients see their first AI-generated lead within the first week.", categoryName: "Getting Started" },
  { question: "Do I need any technical skills?", answer: "Absolutely not. Sovereign AI is a done-for-you service. We handle everything — setup, configuration, optimization, and management.", categoryName: "Getting Started" },
  { question: "What industries do you serve?", answer: "We specialize in home service businesses: HVAC, plumbing, roofing, electrical, landscaping, and general contracting.", categoryName: "Getting Started" },
  // Pricing & Billing
  { question: "How much does Sovereign AI cost?", answer: "Our DIY bundle starts at $497/month with 3 core AI tools. Starter is $3,497/month. Growth is $6,997/month. Empire is $12,997/month.", categoryName: "Pricing & Billing" },
  { question: "Are there long-term contracts?", answer: "No. All plans are month-to-month. You can cancel anytime with no penalties or hidden fees.", categoryName: "Pricing & Billing" },
  { question: "Is there a setup fee?", answer: "No setup fees for any bundle. Individual website builds have a one-time $3,500 setup fee, but it's waived when included in a bundle.", categoryName: "Pricing & Billing" },
  { question: "What payment methods do you accept?", answer: "We accept all major credit cards through Stripe. ACH and wire transfers are available for annual plans.", categoryName: "Pricing & Billing" },
  // AI Services
  { question: "What does the AI Chatbot do?", answer: "Our AI chatbot is custom-trained on your specific business. It answers customer questions, captures lead information, and books appointments 24/7.", categoryName: "AI Services" },
  { question: "How does AI Lead Generation work?", answer: "Our AI identifies high-intent prospects in your service area using multiple data sources, then sends personalized outreach sequences via email and SMS.", categoryName: "AI Services" },
  { question: "What kind of content does the AI create?", answer: "The AI Content Engine produces 8 SEO-optimized blog posts per month, plus service pages, social media posts, and email campaigns.", categoryName: "AI Services" },
  { question: "How does review management work?", answer: "After each completed job, our system automatically sends review request sequences to your customers and monitors and responds to all reviews with AI-generated responses.", categoryName: "AI Services" },
  // Results & ROI
  { question: "What results can I expect?", answer: "Most clients see a 3-5x increase in leads within the first 60 days. Our average client ROI is 8.7x their monthly investment.", categoryName: "Results & ROI" },
  { question: "How quickly will I see results?", answer: "Most clients see their first AI-generated lead within the first week. Significant lead volume increases typically happen by day 30.", categoryName: "Results & ROI" },
  { question: "What's the money-back guarantee?", answer: "If you don't see measurable improvement in leads, reviews, or ROI within 60 days, we'll refund your full investment. No questions asked.", categoryName: "Results & ROI" },
  { question: "How do you track ROI?", answer: "Your dashboard shows real-time metrics: leads captured, appointments booked, reviews received, content published, email engagement, and estimated revenue impact.", categoryName: "Results & ROI" },
  // Technical
  { question: "Do I need a website?", answer: "No. Our AI Website Builder can create a high-converting site for you. If you already have a website, our chatbot and tracking can be added with a simple embed code.", categoryName: "Technical" },
  { question: "Will this work with my existing CRM?", answer: "Our AI CRM works as a standalone system. We also offer integrations with popular CRMs like HubSpot, ServiceTitan, and Housecall Pro via API.", categoryName: "Technical" },
  { question: "Is my data secure?", answer: "Yes. We use 256-bit encryption, SOC2-compliant infrastructure, and never share your data with third parties.", categoryName: "Technical" },
  // Support
  { question: "What kind of support do you offer?", answer: "All plans include in-app support tickets, email support, and access to our knowledge base. Growth and Empire plans include priority support.", categoryName: "Support" },
  { question: "Can I talk to a human?", answer: "Yes! While our AI handles most tasks, you always have access to our human support team. Empire plan clients get a dedicated account manager.", categoryName: "Support" },
  // Common Concerns
  { question: "This sounds too good to be true. What's the catch?", answer: "There is no catch. We offer a 60-day money-back guarantee specifically because we are confident the results speak for themselves.", categoryName: "Common Concerns" },
  { question: "Will AI-generated content sound robotic?", answer: "Our AI is specifically trained on home service businesses and produces content that sounds natural and professional.", categoryName: "Common Concerns" },
  { question: "What happens to my data if I cancel?", answer: "Your data belongs to you. When you cancel, we provide a complete export of all leads, contacts, analytics, and content.", categoryName: "Common Concerns" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function matchesQuery(text: string, lowerQuery: string): boolean {
  return text.toLowerCase().includes(lowerQuery);
}

/** Return an excerpt with the match highlighted via <mark> tags. */
function buildExcerpt(text: string, query: string): string {
  const maxLen = 160;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  let snippet: string;
  if (matchIndex === -1) {
    snippet = text.slice(0, maxLen);
  } else {
    const start = Math.max(0, matchIndex - 40);
    const end = Math.min(text.length, matchIndex + query.length + 100);
    snippet = (start > 0 ? "..." : "") + text.slice(start, end) + (end < text.length ? "..." : "");
  }

  if (snippet.length > maxLen + 10) {
    snippet = snippet.slice(0, maxLen) + "...";
  }

  // Highlight all occurrences of the query in the snippet
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const highlighted = snippet.replace(
    new RegExp(escaped, "gi"),
    (match) => `<mark>${match}</mark>`
  );

  return highlighted;
}

// ---------------------------------------------------------------------------
// Search function
// ---------------------------------------------------------------------------

const MAX_PER_CATEGORY = 5;
const MAX_TOTAL = 20;

export function searchPublicContent(query: string): SearchResult[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const lowerQuery = trimmed.toLowerCase();
  const results: SearchResult[] = [];

  // 1. Blog posts
  const blogResults: SearchResult[] = [];
  for (const post of BLOG_POSTS) {
    if (
      matchesQuery(post.title, lowerQuery) ||
      matchesQuery(post.excerpt, lowerQuery)
    ) {
      blogResults.push({
        title: post.title,
        excerpt: buildExcerpt(post.excerpt, trimmed),
        url: `/blog/${post.slug}`,
        category: "Blog",
      });
      if (blogResults.length >= MAX_PER_CATEGORY) break;
    }
  }
  results.push(...blogResults);

  // 2. Help center articles
  const helpResults: SearchResult[] = [];
  for (const article of HELP_ARTICLES) {
    if (
      matchesQuery(article.title, lowerQuery) ||
      matchesQuery(article.summary, lowerQuery)
    ) {
      helpResults.push({
        title: article.title,
        excerpt: buildExcerpt(article.summary, trimmed),
        url: `/help/${article.categorySlug}`,
        category: "Help",
      });
      if (helpResults.length >= MAX_PER_CATEGORY) break;
    }
  }
  results.push(...helpResults);

  // 3. Knowledge base articles
  const kbResults: SearchResult[] = [];
  for (const article of KB_ARTICLES) {
    if (
      matchesQuery(article.title, lowerQuery) ||
      matchesQuery(article.content, lowerQuery)
    ) {
      kbResults.push({
        title: article.title,
        excerpt: buildExcerpt(article.content, trimmed),
        url: `/knowledge/${article.slug}`,
        category: "Knowledge Base",
      });
      if (kbResults.length >= MAX_PER_CATEGORY) break;
    }
  }
  results.push(...kbResults);

  // 4. Services
  const serviceResults: SearchResult[] = [];
  for (const service of SERVICES) {
    if (
      matchesQuery(service.name, lowerQuery) ||
      matchesQuery(service.description, lowerQuery)
    ) {
      serviceResults.push({
        title: service.name,
        excerpt: buildExcerpt(service.description, trimmed),
        url: `/services#all-services`,
        category: "Services",
      });
      if (serviceResults.length >= MAX_PER_CATEGORY) break;
    }
  }
  results.push(...serviceResults);

  // 5. FAQ entries
  const faqResults: SearchResult[] = [];
  for (const faq of FAQ_ENTRIES) {
    if (
      matchesQuery(faq.question, lowerQuery) ||
      matchesQuery(faq.answer, lowerQuery)
    ) {
      faqResults.push({
        title: faq.question,
        excerpt: buildExcerpt(faq.answer, trimmed),
        url: "/faq",
        category: "FAQ",
      });
      if (faqResults.length >= MAX_PER_CATEGORY) break;
    }
  }
  results.push(...faqResults);

  return results.slice(0, MAX_TOTAL);
}
