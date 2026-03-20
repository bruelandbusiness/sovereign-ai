/**
 * Sovereign AI — Comprehensive Database Seed Script
 *
 * Populates the database with realistic demo data for development.
 *
 * Usage:
 *   npx tsx prisma/seed.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local first (Next.js convention), then fall back to .env
config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../.env") });

import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// ---------------------------------------------------------------------------
// Knowledge Base articles (imported inline to avoid tsx path-alias issues)
// ---------------------------------------------------------------------------

const KB_ARTICLES = [
  {
    slug: "welcome-to-sovereign-ai",
    category: "getting_started",
    title: "Welcome to Sovereign AI",
    order: 1,
    content:
      "# Welcome to Sovereign AI\n\nSovereign AI is your all-in-one AI-powered marketing platform designed specifically for local service businesses.",
  },
  {
    slug: "setting-up-your-dashboard",
    category: "getting_started",
    title: "Setting Up Your Dashboard",
    order: 2,
    content:
      "# Setting Up Your Dashboard\n\nYour Sovereign AI dashboard is the command center for all your marketing activities.",
  },
  {
    slug: "connecting-your-business-profile",
    category: "getting_started",
    title: "Connecting Your Business Profile",
    order: 3,
    content:
      "# Connecting Your Business Profile\n\nA complete business profile is the foundation for all AI-generated content.",
  },
  {
    slug: "understanding-your-kpis",
    category: "getting_started",
    title: "Understanding Your KPIs",
    order: 4,
    content:
      "# Understanding Your KPIs\n\nKey Performance Indicators (KPIs) are the metrics that matter most to your business growth.",
  },
  {
    slug: "onboarding-checklist-guide",
    category: "getting_started",
    title: "Onboarding Checklist Guide",
    order: 5,
    content:
      "# Onboarding Checklist Guide\n\nThe onboarding checklist walks you through the essential steps to get your AI marketing running at full speed.",
  },
  {
    slug: "ai-chatbot-setup-guide",
    category: "services",
    title: "AI Chatbot Setup Guide",
    order: 1,
    content:
      "# AI Chatbot Setup Guide\n\nYour AI chatbot is one of the most powerful lead generation tools in the Sovereign AI platform.",
  },
  {
    slug: "review-management",
    category: "services",
    title: "Review Management",
    order: 2,
    content:
      "# Review Management\n\nOnline reviews are the lifeblood of local service businesses.",
  },
  {
    slug: "content-engine",
    category: "services",
    title: "Content Engine",
    order: 3,
    content:
      "# Content Engine\n\nThe Content Engine is your AI-powered content marketing machine.",
  },
  {
    slug: "email-marketing",
    category: "services",
    title: "Email Marketing",
    order: 4,
    content:
      "# Email Marketing\n\nSovereign AI's email marketing service automates customer communication through intelligent drip campaigns.",
  },
  {
    slug: "voice-agent",
    category: "services",
    title: "Voice Agent",
    order: 5,
    content:
      "# Voice Agent\n\nThe Voice Agent is an AI-powered phone system that handles both inbound and outbound calls.",
  },
  {
    slug: "ad-management",
    category: "services",
    title: "Ad Management",
    order: 6,
    content:
      "# Ad Management\n\nSovereign AI manages your paid advertising across Google Ads and Meta platforms.",
  },
  {
    slug: "social-media",
    category: "services",
    title: "Social Media",
    order: 7,
    content:
      "# Social Media\n\nKeep your social media presence active and engaging without spending hours creating content.",
  },
  {
    slug: "understanding-your-subscription",
    category: "billing",
    title: "Understanding Your Subscription",
    order: 1,
    content:
      "# Understanding Your Subscription\n\nSovereign AI offers flexible subscription plans designed to scale with your business.",
  },
  {
    slug: "upgrading-or-downgrading",
    category: "billing",
    title: "Upgrading or Downgrading",
    order: 2,
    content:
      "# Upgrading or Downgrading Your Plan\n\nChanging your subscription plan is simple and takes effect immediately.",
  },
  {
    slug: "invoices-and-payments",
    category: "billing",
    title: "Invoices and Payments",
    order: 3,
    content:
      "# Invoices and Payments\n\nManaging your billing and payments is straightforward with Sovereign AI.",
  },
  {
    slug: "webhook-setup",
    category: "integrations",
    title: "Webhook Setup",
    order: 1,
    content:
      "# Webhook Setup\n\nWebhooks allow you to connect Sovereign AI with other tools and services in real-time.",
  },
  {
    slug: "embedding-widgets",
    category: "integrations",
    title: "Embedding Widgets",
    order: 2,
    content:
      "# Embedding Widgets\n\nSovereign AI provides several embeddable widgets for your website.",
  },
  {
    slug: "api-documentation",
    category: "integrations",
    title: "API Documentation",
    order: 3,
    content:
      "# API Documentation\n\nSovereign AI provides a RESTful API for developers who want to integrate with custom applications.",
  },
  {
    slug: "common-issues",
    category: "troubleshooting",
    title: "Common Issues",
    order: 1,
    content:
      "# Common Issues & FAQ\n\nHere are solutions to the most frequently encountered issues on the Sovereign AI platform.",
  },
  {
    slug: "contacting-support",
    category: "troubleshooting",
    title: "Contacting Support",
    order: 2,
    content:
      "# Contacting Support\n\nOur support team is here to help you get the most out of Sovereign AI.",
  },
];

// ---------------------------------------------------------------------------
// Digital Products Marketplace seed data (inline to avoid tsx path-alias issues)
// ---------------------------------------------------------------------------

const DIGITAL_PRODUCTS_SEED: Array<{
  slug: string; name: string; tagline: string; description: string;
  tier: string; category: string; price: number; comparePrice?: number;
  imageUrl?: string; previewUrl?: string; deliveryType: string;
  deliveryUrl?: string; deliveryNotes?: string; features: string[];
  techStack: string[]; includes: string[]; isPublished: boolean; isFeatured: boolean;
}> = [
  {
    slug: "home-services-mcp-bridge-server",
    name: "Home Services MCP Bridge Server",
    tagline: "Connect Claude & GPT directly to ServiceTitan, Jobber, and Housecall Pro",
    description: "The Home Services MCP Bridge Server is a production-grade Model Context Protocol server purpose-built for the home services industry. It creates a seamless, bidirectional data bridge between large language models like Claude and GPT and the field service management platforms your business already runs on — ServiceTitan, Jobber, and Housecall Pro. Instead of copying and pasting between tabs or building fragile Zapier chains, your AI assistant can pull up customer history, create invoices, dispatch technicians, and sync job statuses in real time, all through natural language. This is the same infrastructure layer that powers our internal AI dispatch system, now available as a standalone product. Includes full TypeScript source, Docker deployment configs, and 90 days of priority support.",
    tier: "infrastructure",
    category: "mcp_server",
    price: 499700,
    comparePrice: 749700,
    deliveryType: "github",
    deliveryUrl: "https://github.com/sovereign-ai/mcp-bridge-server",
    deliveryNotes: "You will receive a GitHub invite to the private repository within 1 hour of purchase. Includes Docker Compose setup for one-command deployment.",
    features: ["Real-time bidirectional job sync with ServiceTitan, Jobber, and Housecall Pro", "Natural-language customer lookup, invoice generation, and payment tracking", "AI-powered smart dispatch that considers technician skills, location, and availability", "Automatic follow-up scheduling and customer communication triggers", "Built-in rate limiting, retry logic, and error recovery for production reliability", "Webhook-based event system for real-time notifications and workflow automation"],
    techStack: ["TypeScript", "MCP SDK v1.x", "REST & GraphQL adapters", "Docker", "PostgreSQL", "Redis"],
    includes: ["Full TypeScript source code with comprehensive JSDoc documentation", "Docker Compose deployment configuration", "Pre-built adapters for ServiceTitan, Jobber, and Housecall Pro APIs", "Integration test suite with mock service responses", "Setup guide and architecture documentation", "90 days of priority email support"],
    isPublished: true,
    isFeatured: true,
  },
  {
    slug: "local-business-rag-knowledge-base",
    name: "Local Business RAG Knowledge Base",
    tagline: "50,000+ entries of industry-specific knowledge for AI-powered customer service",
    description: "Stop your AI chatbot from hallucinating about your industry. The Local Business RAG Knowledge Base is a pre-indexed, vector-ready knowledge corpus covering everything a home services business needs to deliver intelligent, accurate AI responses. With over 50,000 curated entries spanning local SEO best practices, review management strategies, lead generation tactics, and detailed service business operations across HVAC, plumbing, roofing, and electrical verticals, this is the training data your AI has been missing. Each entry is chunked, embedded, and optimized for retrieval-augmented generation with any major LLM. Monthly update packages keep the knowledge current with evolving industry standards and Google algorithm changes.",
    tier: "infrastructure",
    category: "rag_kit",
    price: 249700,
    comparePrice: 399700,
    deliveryType: "download",
    deliveryNotes: "Instant download. Includes vector database exports for Pinecone, Weaviate, and ChromaDB formats.",
    features: ["50,000+ curated, industry-specific knowledge entries across 4 verticals", "Pre-chunked and embedded — works with any LLM (Claude, GPT-4, Llama, Mistral)", "Monthly update packages with new industry data and algorithm changes", "Vertical-specific knowledge: HVAC, plumbing, roofing, and electrical", "Local SEO, Google Business Profile optimization, and review management coverage", "Compliance-safe content vetted for accuracy by industry professionals"],
    techStack: ["Vector embeddings (OpenAI Ada-002 & open-source alternatives)", "Pinecone", "Weaviate", "ChromaDB", "JSON & Parquet formats"],
    includes: ["50,000+ pre-embedded knowledge entries in multiple vector DB formats", "RAG pipeline configuration templates for LangChain and LlamaIndex", "Industry taxonomy and category mapping documentation", "Sample chatbot implementation with RAG integration", "12 months of monthly knowledge base updates", "Setup guide for Pinecone, Weaviate, and ChromaDB"],
    isPublished: true,
    isFeatured: true,
  },
  {
    slug: "ai-agent-security-audit-kit",
    name: "AI Agent Security Audit Kit",
    tagline: "Enterprise-grade security testing for AI agents — 500+ attack vectors",
    description: "Before you deploy any AI agent to production, you need to know it cannot be weaponized against you. The AI Agent Security Audit Kit is a comprehensive security scanning framework that systematically tests your AI agents for prompt injection vulnerabilities, data exfiltration risks, jailbreak susceptibility, and PII leakage. Built by security researchers who have audited Fortune 500 AI deployments, this kit includes over 500 pre-built attack vectors across 12 vulnerability categories, generates detailed PDF compliance reports, and integrates directly into your CI/CD pipeline so every deployment is automatically tested. If you are building AI agents for clients or internal use, this is non-negotiable infrastructure.",
    tier: "infrastructure",
    category: "security",
    price: 199700,
    comparePrice: 299700,
    deliveryType: "github",
    deliveryUrl: "https://github.com/sovereign-ai/security-audit-kit",
    deliveryNotes: "GitHub repository access granted within 1 hour. Includes CLI tool and GitHub Actions workflow.",
    features: ["500+ pre-built attack vectors across 12 vulnerability categories", "Automated prompt injection, jailbreak, and data exfiltration testing", "PII leakage detection with configurable sensitivity thresholds", "Detailed PDF report generation with severity scoring and remediation steps", "CI/CD integration via GitHub Actions, GitLab CI, and Jenkins plugins", "SOC 2 and HIPAA compliance checking modules"],
    techStack: ["TypeScript", "Python", "GitHub Actions", "PDF generation (Puppeteer)", "Jest testing framework"],
    includes: ["Full source code for the security scanning CLI", "500+ categorized attack vector definitions", "CI/CD pipeline templates for GitHub Actions, GitLab CI, and Jenkins", "PDF report template with customizable branding", "Remediation playbook for each vulnerability category", "60 days of email support for integration questions"],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: "multi-agent-orchestration-framework",
    name: "Multi-Agent Orchestration Framework",
    tagline: "Production-ready framework for AI agent teams that collaborate on complex tasks",
    description: "Single AI agents hit a ceiling. The real power is in orchestrated teams of specialized agents working together. The Multi-Agent Orchestration Framework is a production-ready system built on LangGraph that lets you design, deploy, and monitor teams of AI agents that communicate, share memory, delegate tasks, and collaborate with human oversight. Whether you are building a customer service team where a triage agent routes to specialists, or a content pipeline where research, writing, and editing agents work in sequence, this framework handles the complexity of agent coordination so you can focus on the business logic. Includes a real-time monitoring dashboard, shared vector memory, a tool registry, and built-in human-in-the-loop approval gates.",
    tier: "infrastructure",
    category: "agent",
    price: 349700,
    comparePrice: 499700,
    deliveryType: "github",
    deliveryUrl: "https://github.com/sovereign-ai/multi-agent-framework",
    deliveryNotes: "GitHub invite within 1 hour. Includes Docker setup and monitoring dashboard.",
    features: ["Agent-to-agent communication with typed message protocols", "Shared vector memory with configurable scope (team, agent, task)", "Centralized tool registry with permission-based access control", "Real-time monitoring dashboard with agent activity visualization", "Human-in-the-loop approval gates for critical decisions", "Built-in retry, fallback, and escalation patterns"],
    techStack: ["TypeScript", "LangGraph", "LangChain", "React (monitoring dashboard)", "Redis", "PostgreSQL", "Docker"],
    includes: ["Full orchestration framework source code", "React-based real-time monitoring dashboard", "5 pre-built agent team templates (customer service, content pipeline, research, sales, support)", "Shared memory implementation with vector store integration", "Docker Compose for one-command deployment", "Architecture guide and API documentation", "90 days of priority support"],
    isPublished: true,
    isFeatured: true,
  },
  {
    slug: "custom-crm-to-ai-pipeline",
    name: "Custom CRM-to-AI Pipeline",
    tagline: "Sync your CRM with AI for intelligent lead scoring, follow-ups, and deal prediction",
    description: "Your CRM is sitting on a goldmine of data that your AI cannot touch. The Custom CRM-to-AI Pipeline bridges that gap with an end-to-end data synchronization system that connects HubSpot, Salesforce, or Pipedrive to your AI models in real time. Once connected, the pipeline powers intelligent lead scoring that learns from your actual close history, automated follow-up sequences triggered by behavioral signals, and deal outcome prediction that helps your team focus on the opportunities most likely to close. Every interaction, email open, page visit, and call log feeds into the AI scoring model, giving you a continuously improving system that gets smarter with every deal. This is not a Zapier hack — it is a proper ETL pipeline with data validation, deduplication, and real-time sync.",
    tier: "infrastructure",
    category: "pipeline",
    price: 299700,
    comparePrice: 449700,
    deliveryType: "github",
    deliveryUrl: "https://github.com/sovereign-ai/crm-ai-pipeline",
    deliveryNotes: "GitHub access within 1 hour. Requires API keys for your CRM platform.",
    features: ["Real-time bidirectional sync with HubSpot, Salesforce, and Pipedrive", "AI-powered lead scoring trained on your actual conversion data", "Automated follow-up triggers based on behavioral signals and engagement", "Deal outcome prediction with confidence scoring", "Data validation, deduplication, and conflict resolution", "Customizable scoring weights and threshold configuration"],
    techStack: ["TypeScript", "Python (ML models)", "Apache Kafka / Redis Streams", "PostgreSQL", "Docker", "scikit-learn"],
    includes: ["Full pipeline source code with CRM adapters", "Pre-trained lead scoring model with transfer learning support", "ETL configuration for HubSpot, Salesforce, and Pipedrive", "Data validation and deduplication engine", "Monitoring dashboard with sync health metrics", "Deployment guide for AWS, GCP, and self-hosted environments", "60 days of setup support"],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: "lead-gen-hunter-agent",
    name: "The Lead-Gen Hunter Agent",
    tagline: "Autonomous AI agent that finds prospects, writes outreach, and books meetings — hands-free",
    description: "Imagine waking up every morning to a calendar full of qualified meetings that you did not have to book. The Lead-Gen Hunter Agent is a fully autonomous AI system that scans LinkedIn and Google for businesses matching your ideal customer profile, scores them based on buying signals and intent data, crafts hyper-personalized outreach emails that actually get replies, and books meetings directly on your calendar — all without you lifting a finger. It runs 24/7, learns from response patterns to improve its messaging over time, and syncs every interaction back to your CRM. This is not another email blast tool. It is a tireless digital sales rep that does the prospecting work of a 3-person SDR team.",
    tier: "revenue_engine",
    category: "agent",
    price: 99700,
    comparePrice: 149700,
    deliveryType: "access",
    deliveryNotes: "You will receive login credentials and a setup guide within 30 minutes of purchase.",
    features: ["Autonomous LinkedIn and Google prospecting with ICP matching", "Intent scoring based on hiring signals, tech stack, and growth indicators", "AI-generated personalized outreach emails with dynamic variables", "Automated multi-step follow-up sequences with smart timing", "Calendar integration for direct meeting booking (Google Cal, Calendly, Cal.com)", "CRM sync with HubSpot, Salesforce, and Pipedrive"],
    techStack: ["Claude AI", "Python", "Selenium/Playwright", "SendGrid", "Google Calendar API", "PostgreSQL"],
    includes: ["Hosted Lead-Gen Hunter Agent with web dashboard", "ICP configuration wizard for targeting setup", "Email template library with 25 proven outreach sequences", "Campaign analytics and performance tracking dashboard", "CRM integration setup (HubSpot, Salesforce, Pipedrive)", "Weekly performance reports delivered to your inbox"],
    isPublished: true,
    isFeatured: true,
  },
  {
    slug: "agentic-seo-pipeline",
    name: "Agentic SEO Pipeline",
    tagline: "AI that monitors rankings 24/7 and automatically rewrites content to regain position",
    description: "Rankings drop. It happens to everyone. But most businesses do not notice for weeks, and by then the damage is done. The Agentic SEO Pipeline connects directly to your Google Search Console, monitors every keyword you rank for around the clock, and the moment it detects a ranking drop, it automatically analyzes what changed, identifies the content that needs updating, and rewrites it to reclaim your position. It handles the entire cycle from detection to fix to deployment without manual intervention. Set it up once, point it at your Google Search Console, and let it protect your organic traffic on autopilot. Includes weekly email reports so you always know what the system is doing and why.",
    tier: "revenue_engine",
    category: "pipeline",
    price: 49700,
    comparePrice: 79700,
    deliveryType: "access",
    deliveryNotes: "Hosted dashboard access within 30 minutes. Requires Google Search Console API access.",
    features: ["24/7 Google Search Console monitoring with real-time rank tracking", "Automatic ranking drop detection with root cause analysis", "AI-powered content rewriting that preserves your brand voice", "Automated content deployment to WordPress, Webflow, and custom CMS", "Keyword cannibalization detection and resolution", "Weekly email reports with ranking changes, actions taken, and traffic impact"],
    techStack: ["Claude AI", "Google Search Console API", "Python", "WordPress REST API", "Webflow API", "PostgreSQL"],
    includes: ["Hosted Agentic SEO Pipeline with full web dashboard", "Google Search Console integration and keyword import", "Content rewriting engine configured to your brand voice", "CMS deployment connectors (WordPress, Webflow, custom)", "Weekly automated email reports", "30-day onboarding support"],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: "ai-voice-agent-blueprint",
    name: "AI Voice Agent Blueprint",
    tagline: "Build an AI phone agent with Twilio + Claude that qualifies leads and books appointments",
    description: "The phone is still the #1 channel for high-intent leads in home services, and every missed call is money lost. The AI Voice Agent Blueprint gives you the complete codebase and architecture to build a production-ready AI phone agent that answers inbound calls with a natural, conversational voice powered by Claude, qualifies callers against your service criteria, books appointments directly in your scheduling system, and follows up via SMS with confirmation and reminders. This is not a theoretical guide — it is battle-tested code running in production for multiple home services businesses, handling hundreds of calls per day. Fork the repo, configure your Twilio credentials, and deploy in under 2 hours.",
    tier: "revenue_engine",
    category: "agent",
    price: 69700,
    comparePrice: 99700,
    deliveryType: "github",
    deliveryUrl: "https://github.com/sovereign-ai/voice-agent-blueprint",
    deliveryNotes: "GitHub access within 1 hour. Requires a Twilio account with voice capabilities.",
    features: ["Natural conversational AI powered by Claude for inbound call handling", "Intelligent lead qualification with configurable service criteria", "Real-time appointment booking integrated with Google Calendar and Calendly", "Automated SMS follow-up with confirmation, reminders, and review requests", "Call recording with AI-generated transcription and sentiment analysis", "Missed call text-back with intelligent re-engagement sequences"],
    techStack: ["TypeScript", "Twilio Voice & SMS", "Claude AI (Anthropic API)", "Google Calendar API", "WebSocket (real-time voice)", "PostgreSQL"],
    includes: ["Complete voice agent source code (TypeScript)", "Twilio integration with Voice, SMS, and Recording", "Call flow configuration templates for 6 service verticals", "Appointment booking integration guide", "SMS follow-up sequence templates", "Deployment guide for Vercel, Railway, and AWS", "60 days of email support"],
    isPublished: true,
    isFeatured: true,
  },
  {
    slug: "review-response-ai-system",
    name: "Review Response AI System",
    tagline: "Autonomous system that monitors reviews and publishes on-brand responses on autopilot",
    description: "Your online reputation is your most valuable marketing asset, and letting reviews sit unanswered for days signals to potential customers that you do not care. The Review Response AI System monitors your reviews across Google, Yelp, and Facebook in real time, generates on-brand responses that match your company voice and values, and publishes them automatically — maintaining your 5-star reputation without you ever logging into a review platform. Positive reviews get warm, personalized thank-yous that reinforce your brand. Negative reviews get thoughtful, empathetic responses that show professionalism and often turn critics into advocates. The system learns your preferred tone and style from examples you approve during setup.",
    tier: "revenue_engine",
    category: "agent",
    price: 29700,
    comparePrice: 49700,
    deliveryType: "access",
    deliveryNotes: "Hosted platform access within 30 minutes. Connect your Google Business Profile and review platforms during setup.",
    features: ["Real-time review monitoring across Google, Yelp, and Facebook", "AI-generated responses trained on your brand voice and values", "Automatic publishing with optional approval workflow for negative reviews", "Sentiment analysis and trend tracking with weekly digest emails", "Escalation alerts for 1-2 star reviews requiring personal attention", "Review analytics dashboard with response time and sentiment metrics"],
    techStack: ["Claude AI", "Google Business Profile API", "Python", "PostgreSQL", "SendGrid"],
    includes: ["Hosted Review Response AI platform with web dashboard", "Google, Yelp, and Facebook review platform integrations", "Brand voice calibration wizard (provide examples, AI learns your tone)", "Configurable approval workflows and escalation rules", "Weekly email digest with review summary and response analytics", "30 days of onboarding support"],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: "ai-email-copywriter-engine",
    name: "AI Email Copywriter Engine",
    tagline: "Fine-tuned AI that writes high-converting email sequences for service businesses",
    description: "Generic AI writes generic emails. The AI Email Copywriter Engine is a fine-tuned writing system specifically trained on high-converting email copy for the home services industry. It knows that an HVAC company in Phoenix needs different messaging than a plumber in Chicago. It understands seasonal urgency, service-specific pain points, and the psychology of homeowners making $5,000+ purchasing decisions. Includes 50 proven email templates across welcome sequences, review requests, seasonal campaigns, reactivation series, referral programs, and appointment reminders — plus the AI engine that customizes each one for your specific business, vertical, and market. A/B testing built in so you can continuously improve performance.",
    tier: "revenue_engine",
    category: "toolkit",
    price: 39700,
    comparePrice: 59700,
    deliveryType: "download",
    deliveryNotes: "Instant download. Includes CSV templates for major email platforms (Mailchimp, ActiveCampaign, SendGrid).",
    features: ["50 proven email sequence templates for home service businesses", "AI customization engine that adapts templates to your vertical, market, and brand", "A/B testing variants pre-generated for every template", "Seasonal campaign templates with optimal send timing recommendations", "Subject line optimization using engagement prediction scoring", "Performance benchmarks from real campaigns across 10,000+ sends"],
    techStack: ["Claude AI (fine-tuned prompts)", "CSV & HTML templates", "Compatible with Mailchimp, ActiveCampaign, SendGrid, ConvertKit"],
    includes: ["50 email sequence templates in HTML and plain text", "AI customization prompts for each template", "A/B testing variant library (150+ subject lines, 100+ CTAs)", "Seasonal campaign calendar with recommended send schedule", "CSV import files for Mailchimp, ActiveCampaign, and SendGrid", "Email copywriting style guide for home services"],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: "ai-marketing-os-notion",
    name: "The AI Marketing OS (Notion)",
    tagline: "Complete AI marketing operating system — everything a $10K/month agency runs on, for $97",
    description: "This is the exact Notion workspace that agencies charging $10,000/month use to manage their clients. The AI Marketing OS gives you a fully built-out marketing command center with a content calendar that plans 90 days ahead, a campaign tracker that measures ROI across every channel, a lead pipeline with automated stage progression, detailed SOPs for every marketing task, and an AI prompt library with 200+ tested prompts for content creation, ad copy, email writing, and customer communication. Every template, every database, every automation is pre-configured and ready to use. Just duplicate the workspace, customize it for your business, and you have an agency-grade marketing operation running in 30 minutes.",
    tier: "saas_lite",
    category: "template",
    price: 9700,
    comparePrice: 19700,
    deliveryType: "download",
    deliveryNotes: "Instant access via Notion template link. Click 'Duplicate' to add it to your workspace.",
    features: ["90-day content calendar with AI-assisted topic generation", "Multi-channel campaign tracker with ROI calculation", "Lead pipeline database with stage automation and follow-up reminders", "200+ tested AI prompts for content, ads, email, and customer communication", "Complete SOP library for every marketing task (30+ documented processes)", "Weekly review and monthly planning templates"],
    techStack: ["Notion"],
    includes: ["Complete Notion workspace template (one-click duplicate)", "90-day content calendar pre-populated with topic ideas", "Campaign tracker with ROI formulas and benchmarks", "Lead pipeline with automated status tracking", "200+ AI prompt library organized by use case", "30+ marketing SOP documents", "Video walkthrough of the entire system (45 min)"],
    isPublished: true,
    isFeatured: true,
  },
  {
    slug: "90-day-social-media-content-pack",
    name: "90-Day Social Media Content Pack",
    tagline: "270 ready-to-post social media updates customized for service businesses",
    description: "Three months of social media content, done for you, in one download. The 90-Day Social Media Content Pack includes 270 AI-generated posts — 90 days of content across Facebook, Instagram, and LinkedIn — specifically written for home service businesses. Every post includes the caption text, image generation prompts for creating matching visuals, relevant hashtag sets optimized for local reach, and a scheduling guide with the best times to post for maximum engagement. Covers seasonal promotions, before-and-after project showcases, customer testimonial formats, educational tips, team spotlights, and community engagement posts. Stop staring at a blank screen wondering what to post.",
    tier: "saas_lite",
    category: "content_pack",
    price: 4700,
    comparePrice: 9700,
    deliveryType: "download",
    deliveryNotes: "Instant download. Includes Google Sheets with all 270 posts and a scheduling guide PDF.",
    features: ["270 unique social media posts (90 days x 3 platforms)", "Platform-specific formatting for Facebook, Instagram, and LinkedIn", "AI image generation prompts for creating matching visuals", "Curated hashtag sets optimized for local service business reach", "Seasonal and holiday content pre-planned throughout the 90 days", "Scheduling guide with optimal posting times by platform"],
    techStack: ["Google Sheets", "PDF", "Compatible with any social media scheduler"],
    includes: ["Google Sheets master file with all 270 posts organized by date", "Platform-specific versions (Facebook, Instagram, LinkedIn)", "Image prompt library for AI image generation (Midjourney, DALL-E)", "Hashtag research spreadsheet with reach estimates", "Scheduling guide PDF with best practices", "Customization guide for adapting posts to your specific vertical"],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: "email-sequence-mega-pack",
    name: "Email Sequence Mega-Pack",
    tagline: "50 proven email sequences for service businesses — copy, paste, and send",
    description: "Every email sequence a home service business will ever need, written by conversion-focused copywriters and tested across thousands of sends. The Email Sequence Mega-Pack includes 50 complete email sequences covering welcome series for new customers, review request campaigns that actually get 5-star responses, seasonal maintenance reminders that drive repeat business, reactivation sequences for dormant customers, referral campaigns that turn happy customers into ambassadors, and follow-up sequences for every stage of the sales pipeline. Each sequence includes subject lines (with A/B variants), preview text, body copy, and optimal send timing. Formatted for direct import into Mailchimp, ActiveCampaign, or any email platform.",
    tier: "saas_lite",
    category: "content_pack",
    price: 6700,
    comparePrice: 12700,
    deliveryType: "download",
    deliveryNotes: "Instant download. Includes both HTML and plain text versions with import-ready CSV files.",
    features: ["50 complete email sequences with 3-7 emails each (250+ individual emails)", "A/B tested subject lines with performance benchmarks", "Welcome, review request, seasonal, reactivation, and referral sequences", "Vertical-specific versions for HVAC, plumbing, roofing, and electrical", "Optimal send timing recommendations based on engagement data", "Import-ready CSV files for Mailchimp, ActiveCampaign, and SendGrid"],
    techStack: ["HTML email templates", "CSV", "Compatible with all major ESPs"],
    includes: ["50 email sequences in HTML and plain text formats", "Import-ready CSV files for Mailchimp, ActiveCampaign, and SendGrid", "Subject line A/B variant library (150+ options)", "Email sequence flowcharts showing trigger logic", "Send timing and frequency recommendations", "Customization guide with merge field documentation"],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: "ai-chatbot-script-library",
    name: "AI Chatbot Script Library",
    tagline: "100+ qualifying chatbot scripts for every home service vertical",
    description: "A chatbot is only as good as its conversation scripts. The AI Chatbot Script Library gives you 100+ professionally written chatbot conversation flows covering every scenario a home service business encounters — from initial greeting and service qualification to objection handling, emergency routing, appointment booking, and follow-up. Each script is designed as a decision tree with branching logic, so your chatbot asks the right questions in the right order to maximize lead qualification and booking rates. Includes scripts for HVAC, plumbing, roofing, electrical, landscaping, and general contracting. Copy these scripts into any chatbot platform (Drift, Intercom, Tidio, or our own Sovereign AI chatbot) and start converting more visitors into booked jobs immediately.",
    tier: "saas_lite",
    category: "template",
    price: 3700,
    comparePrice: 7700,
    deliveryType: "download",
    deliveryNotes: "Instant download. Scripts provided in JSON format (for chatbot imports) and PDF format (for reference).",
    features: ["100+ complete chatbot conversation scripts with branching logic", "Covers greeting, qualification, objection handling, and booking flows", "Vertical-specific scripts for 6 home service categories", "Emergency vs. non-emergency routing logic", "After-hours scripts with SMS follow-up triggers", "JSON format for direct import into chatbot platforms"],
    techStack: ["JSON (chatbot-importable)", "PDF reference docs"],
    includes: ["100+ chatbot scripts in JSON and PDF formats", "Decision tree flowcharts for each script category", "Vertical-specific script packs (HVAC, plumbing, roofing, electrical, landscaping, general)", "Objection handling scripts for pricing, timing, and trust concerns", "After-hours and emergency routing scripts", "Implementation guide for Drift, Intercom, Tidio, and Sovereign AI chatbot"],
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: "local-seo-domination-guide",
    name: "Local SEO Domination Guide",
    tagline: "Step-by-step guide to ranking #1 in your local market using AI tools",
    description: "Ranking #1 in local search is the single highest-ROI marketing activity for any service business, and with AI tools, it has never been more achievable. The Local SEO Domination Guide is a comprehensive, step-by-step playbook that walks you through every aspect of local search optimization — from claiming and fully optimizing your Google Business Profile, to building consistent citations across 50+ directories, to generating and responding to reviews at scale, to creating locally-relevant content that Google rewards with top rankings. What makes this guide different is that every chapter includes AI-powered shortcuts: specific prompts, tools, and workflows that cut the manual work by 80%. Written for home service business owners, not SEO nerds — no jargon, just clear actions that produce measurable ranking improvements within 30 days.",
    tier: "saas_lite",
    category: "course",
    price: 2700,
    comparePrice: 4700,
    deliveryType: "download",
    deliveryNotes: "Instant download. PDF guide with companion spreadsheet templates and AI prompt library.",
    features: ["Step-by-step Google Business Profile optimization checklist", "Citation building guide with 50+ directory submission templates", "Review generation strategy with AI-powered response templates", "Local content creation framework with AI writing prompts", "Link building playbook for local service businesses", "Monthly SEO maintenance checklist with AI automation shortcuts"],
    techStack: ["PDF guide", "Google Sheets templates", "AI prompt library"],
    includes: ["Comprehensive Local SEO Guide (120+ pages, PDF)", "Google Business Profile optimization checklist", "Citation building spreadsheet with 50+ directories", "AI prompt library for content creation and review responses", "Keyword research template with local modifiers", "Monthly SEO audit checklist", "Competitor analysis framework"],
    isPublished: true,
    isFeatured: false,
  },
];

// ---------------------------------------------------------------------------
// Template seeds (simplified inline version)
// ---------------------------------------------------------------------------

const TEMPLATE_VERTICALS = [
  "hvac",
  "plumbing",
  "roofing",
  "electrical",
  "landscaping",
  "pest_control",
] as const;

const VERTICAL_LABELS: Record<string, string> = {
  hvac: "HVAC",
  plumbing: "Plumbing",
  roofing: "Roofing",
  electrical: "Electrical",
  landscaping: "Landscaping",
  pest_control: "Pest Control",
};

function templateSeeds() {
  const seeds: {
    category: string;
    vertical: string;
    name: string;
    description: string;
    content: string;
    tags: string[];
  }[] = [];

  for (const v of TEMPLATE_VERTICALS) {
    const lbl = VERTICAL_LABELS[v] || v;

    seeds.push({
      category: "email_sequence",
      vertical: v,
      name: `${lbl} — Welcome + First Service Drip`,
      description: `A 3-email welcome sequence for new ${lbl.toLowerCase()} customers.`,
      content: JSON.stringify([
        { emailNumber: 1, delay: "immediate", subject: `Welcome to {{businessName}}` },
        { emailNumber: 2, delay: "3 days", subject: `5 ${lbl} Tips Every Homeowner Should Know` },
        { emailNumber: 3, delay: "7 days", subject: `Special Offer: 10% Off Your First ${lbl} Service` },
      ]),
      tags: ["email", "drip", "welcome", v],
    });

    seeds.push({
      category: "social_calendar",
      vertical: v,
      name: `${lbl} — Monthly Content Calendar`,
      description: `12 ready-to-post social media content ideas for ${lbl.toLowerCase()} businesses.`,
      content: JSON.stringify({ weeks: 12, vertical: v }),
      tags: ["social", "calendar", v],
    });

    seeds.push({
      category: "ad_campaign",
      vertical: v,
      name: `${lbl} — Local Lead Gen Campaign`,
      description: `Google Ads template optimized for local ${lbl.toLowerCase()} lead generation.`,
      content: JSON.stringify({
        platform: "google",
        headline: `{{city}} ${lbl} — Fast Same-Day Service`,
        dailyBudget: 5000,
      }),
      tags: ["ads", "google", "lead-gen", v],
    });

    seeds.push({
      category: "chatbot_script",
      vertical: v,
      name: `${lbl} — Lead Qualifier Script`,
      description: `AI chatbot script for ${lbl.toLowerCase()} businesses.`,
      content: JSON.stringify({
        greeting: `Hi! Need help with ${lbl.toLowerCase()} service? I can assist you.`,
      }),
      tags: ["chatbot", "lead-qualifier", v],
    });

    seeds.push({
      category: "landing_page",
      vertical: v,
      name: `${lbl} — Emergency Service Landing Page`,
      description: `High-converting landing page template for ${lbl.toLowerCase()} emergency services.`,
      content: JSON.stringify({
        headline: `Need Emergency ${lbl} Service in {{city}}?`,
        cta: "Get a Free Estimate Now",
      }),
      tags: ["landing-page", "emergency", v],
    });
  }

  return seeds;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function hoursAgo(n: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as never);

  console.log("  Seeding Sovereign AI database...\n");

  // ─── Clear all tables (reverse dependency order) ──────────────────────
  console.log("  Clearing existing data...");

  // New model deletions (children first, then parents)
  await prisma.mCPUsageLog.deleteMany();
  await prisma.mCPApiKey.deleteMany();
  await prisma.fSMSyncLog.deleteMany();
  await prisma.fSMConnection.deleteMany();
  await prisma.applicant.deleteMany();
  await prisma.jobPosting.deleteMany();
  await prisma.performanceEvent.deleteMany();
  await prisma.performancePlan.deleteMany();
  await prisma.callLog.deleteMany();
  await prisma.customerLifetimeValue.deleteMany();
  await prisma.financingApplication.deleteMany();
  await prisma.franchiseLocation.deleteMany();
  await prisma.photoEstimate.deleteMany();
  await prisma.receptionistConfig.deleteMany();
  await prisma.seasonalCampaign.deleteMany();
  await prisma.serviceArea.deleteMany();
  await prisma.serviceReminder.deleteMany();
  await prisma.aEOStrategy.deleteMany();
  await prisma.aEOQuery.deleteMany();

  await prisma.agentStep.deleteMany();
  await prisma.approvalRequest.deleteMany();
  await prisma.agentExecution.deleteMany();
  await prisma.orchestrationEvent.deleteMany();
  await prisma.eventSubscription.deleteMany();
  await prisma.governanceRule.deleteMany();
  await prisma.budgetTracker.deleteMany();
  await prisma.anomalyLog.deleteMany();
  await prisma.clientBenchmarkScore.deleteMany();
  await prisma.industryBenchmark.deleteMany();
  await prisma.predictiveInsight.deleteMany();
  await prisma.communityComment.deleteMany();
  await prisma.communityPost.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.snapshotReport.deleteMany();
  await prisma.qBRReport.deleteMany();
  await prisma.customerReferral.deleteMany();
  await prisma.aEOContent.deleteMany();
  await prisma.reviewResponse.deleteMany();
  await prisma.knowledgeArticle.deleteMany();
  await prisma.template.deleteMany();
  await prisma.webhookLog.deleteMany();
  await prisma.webhookEndpoint.deleteMany();
  await prisma.unifiedMessage.deleteMany();
  await prisma.conversationThread.deleteMany();
  await prisma.missedCallTextback.deleteMany();
  await prisma.alertLog.deleteMany();
  await prisma.alertRule.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.emailEvent.deleteMany();
  await prisma.emailQueue.deleteMany();
  await prisma.revenueEvent.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.sEOKeyword.deleteMany();
  await prisma.adCampaign.deleteMany();
  await prisma.socialPost.deleteMany();
  await prisma.phoneCall.deleteMany();
  await prisma.nPSResponse.deleteMany();
  await prisma.referralCode.deleteMany();
  await prisma.onboardingStep.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.emailCampaign.deleteMany();
  await prisma.contentJob.deleteMany();
  await prisma.reviewCampaign.deleteMany();
  await prisma.chatbotConversation.deleteMany();
  await prisma.chatbotConfig.deleteMany();
  await prisma.activityEvent.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.clientService.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.location.deleteMany();
  await prisma.client.deleteMany();
  await prisma.session.deleteMany();
  await prisma.magicLink.deleteMany();
  await prisma.agency.deleteMany();
  await prisma.account.deleteMany();

  console.log("  All tables cleared.\n");

  // ═══════════════════════════════════════════════════════════════════════
  // 1. ADMIN ACCOUNT
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  1. Creating admin account...");
  const adminAccount = await prisma.account.create({
    data: {
      email: "admin@sovereignai.com",
      name: "Admin",
      role: "admin",
    },
  });

  await prisma.session.create({
    data: {
      token: "admin-dev-session",
      accountId: adminAccount.id,
      expiresAt: daysFromNow(365),
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 2. DEMO CLIENT — Smith Plumbing (Growth Bundle)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  2. Creating Smith Plumbing (Growth bundle) client...");
  const smithAccount = await prisma.account.create({
    data: {
      email: "demo@smithplumbing.com",
      name: "John Smith",
      role: "client",
    },
  });

  await prisma.session.create({
    data: {
      token: "demo-dev-session",
      accountId: smithAccount.id,
      expiresAt: daysFromNow(365),
    },
  });

  const smithClient = await prisma.client.create({
    data: {
      accountId: smithAccount.id,
      businessName: "Smith Plumbing & Heating",
      ownerName: "John Smith",
      phone: "(512) 555-0147",
      city: "Austin",
      state: "TX",
      vertical: "plumbing",
      website: "https://smithplumbing.com",
      serviceAreaRadius: "25 miles",
    },
  });

  await prisma.subscription.create({
    data: {
      clientId: smithClient.id,
      bundleId: "growth",
      status: "active",
      monthlyAmount: 699700, // $6,997 in cents
      currentPeriodEnd: daysFromNow(30),
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 3. SECOND DEMO CLIENT — ACME HVAC (Starter Bundle)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  3. Creating ACME HVAC (Starter bundle) client...");
  const acmeAccount = await prisma.account.create({
    data: {
      email: "demo2@acmehvac.com",
      name: "Sarah Johnson",
      role: "client",
    },
  });

  await prisma.session.create({
    data: {
      token: "demo2-dev-session",
      accountId: acmeAccount.id,
      expiresAt: daysFromNow(365),
    },
  });

  const acmeClient = await prisma.client.create({
    data: {
      accountId: acmeAccount.id,
      businessName: "ACME HVAC Solutions",
      ownerName: "Sarah Johnson",
      phone: "(720) 555-0293",
      city: "Denver",
      state: "CO",
      vertical: "hvac",
      website: "https://acmehvac.com",
      serviceAreaRadius: "30 miles",
    },
  });

  await prisma.subscription.create({
    data: {
      clientId: acmeClient.id,
      bundleId: "starter",
      status: "active",
      monthlyAmount: 349700, // $3,497 in cents
      currentPeriodEnd: daysFromNow(30),
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 4. CLIENT SERVICES (Growth bundle for Smith Plumbing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  4. Creating client services...");
  const growthServices = [
    "chatbot",
    "reviews",
    "content",
    "email",
    "booking",
    "voice-agent",
    "ads",
    "social",
    "seo",
    "lead-gen",
  ];

  for (const svc of growthServices) {
    await prisma.clientService.create({
      data: {
        clientId: smithClient.id,
        serviceId: svc,
        status: "active",
        activatedAt: daysAgo(Math.floor(Math.random() * 30) + 5),
      },
    });
  }

  // Starter services for ACME
  const starterServices = ["lead-gen", "reviews", "booking"];
  for (const svc of starterServices) {
    await prisma.clientService.create({
      data: {
        clientId: acmeClient.id,
        serviceId: svc,
        status: "active",
        activatedAt: daysAgo(Math.floor(Math.random() * 20) + 3),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. CHATBOT CONFIG
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  5. Creating chatbot config...");
  const chatbotConfig = await prisma.chatbotConfig.create({
    data: {
      clientId: smithClient.id,
      greeting:
        "Hi! Welcome to Smith Plumbing & Heating. How can we help you today? Whether it's a leaky faucet or a full remodel, we've got you covered.",
      systemPrompt:
        "You are the AI assistant for Smith Plumbing & Heating, a trusted plumbing and heating company in Austin, TX. You help website visitors by answering questions about services (drain cleaning, water heater installation, leak repair, bathroom remodels, emergency plumbing), providing estimates, and scheduling appointments. Always be friendly, professional, and try to capture the visitor's name, phone number, and email. If it's an emergency, recommend calling (512) 555-0147 directly.",
      primaryColor: "#2563eb",
      isActive: true,
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 6. LEADS (20 for Smith Plumbing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  6. Creating 20 leads...");
  const leadData = [
    { name: "Robert Martinez", email: "rmartinez@gmail.com", phone: "(512) 555-1001", source: "chatbot", status: "new", score: 85, stage: "hot", value: 450000, notes: "Needs emergency pipe repair in kitchen", assignedTo: "John Smith", lastContactedAt: hoursAgo(4), nextFollowUpAt: daysFromNow(1) },
    { name: "Jennifer Lopez", email: "jlopez@yahoo.com", phone: "(512) 555-1002", source: "google_ads", status: "contacted", score: 72, stage: "nurturing", value: 250000, notes: "Interested in water heater replacement", assignedTo: "John Smith", lastContactedAt: daysAgo(2), nextFollowUpAt: daysFromNow(3) },
    { name: "Michael Chen", email: "mchen@outlook.com", phone: "(512) 555-1003", source: "website", status: "qualified", score: 90, stage: "hot", value: 800000, notes: "Full bathroom remodel — upstairs master bath", assignedTo: null, lastContactedAt: daysAgo(1), nextFollowUpAt: daysFromNow(2) },
    { name: "Amanda Wilson", email: "awilson@gmail.com", phone: "(512) 555-1004", source: "referral", status: "appointment", score: 95, stage: "hot", value: 1200000, notes: "Referred by James Thompson. Whole-house repipe.", assignedTo: "John Smith", lastContactedAt: daysAgo(1), nextFollowUpAt: daysFromNow(5) },
    { name: "David Brown", email: "dbrown@gmail.com", phone: "(512) 555-1005", source: "voice", status: "won", score: 88, stage: "converted", value: 350000, notes: "Completed. Drain cleaning + camera inspection.", assignedTo: null, lastContactedAt: daysAgo(5), nextFollowUpAt: null },
    { name: "Lisa Taylor", email: "ltaylor@icloud.com", phone: "(512) 555-1006", source: "chatbot", status: "new", score: 45, stage: "new", value: null, notes: null, assignedTo: null, lastContactedAt: null, nextFollowUpAt: daysFromNow(1) },
    { name: "James Anderson", email: "janderson@gmail.com", phone: "(512) 555-1007", source: "website", status: "contacted", score: 60, stage: "nurturing", value: 150000, notes: "Leaky faucet in kitchen", assignedTo: null, lastContactedAt: daysAgo(3), nextFollowUpAt: daysAgo(1) },
    { name: "Patricia Garcia", email: "pgarcia@yahoo.com", phone: "(512) 555-1008", source: "google_ads", status: "qualified", score: 78, stage: "hot", value: 500000, notes: "Water softener installation", assignedTo: "John Smith", lastContactedAt: daysAgo(2), nextFollowUpAt: daysFromNow(4) },
    { name: "Thomas Johnson", email: "tjohnson@gmail.com", phone: "(512) 555-1009", source: "referral", status: "new", score: 55, stage: "new", value: null, notes: "Called about sump pump", assignedTo: null, lastContactedAt: null, nextFollowUpAt: daysFromNow(2) },
    { name: "Susan Williams", email: "swilliams@outlook.com", phone: "(512) 555-1010", source: "chatbot", status: "appointment", score: 82, stage: "hot", value: 700000, notes: "Booked for tankless water heater install", assignedTo: "John Smith", lastContactedAt: daysAgo(1), nextFollowUpAt: daysFromNow(5) },
    { name: "Christopher Davis", email: "cdavis@gmail.com", phone: "(512) 555-1011", source: "voice", status: "contacted", score: 38, stage: "nurturing", value: 100000, notes: "Toilet running — simple fix", assignedTo: null, lastContactedAt: daysAgo(2), nextFollowUpAt: daysAgo(2) },
    { name: "Margaret Miller", email: "mmiller@gmail.com", phone: "(512) 555-1012", source: "website", status: "won", score: 91, stage: "converted", value: 1500000, notes: "Completed whole-house repipe. Very happy.", assignedTo: null, lastContactedAt: daysAgo(7), nextFollowUpAt: null },
    { name: "Daniel Moore", email: "dmoore@yahoo.com", phone: "(512) 555-1013", source: "google_ads", status: "new", score: 25, stage: "new", value: null, notes: null, assignedTo: null, lastContactedAt: null, nextFollowUpAt: null },
    { name: "Nancy Jackson", email: "njackson@gmail.com", phone: "(512) 555-1014", source: "chatbot", status: "qualified", score: 70, stage: "nurturing", value: 300000, notes: "Garbage disposal replacement", assignedTo: null, lastContactedAt: daysAgo(4), nextFollowUpAt: null },
    { name: "Mark White", email: "mwhite@outlook.com", phone: "(512) 555-1015", source: "referral", status: "new", score: 65, stage: "new", value: 200000, notes: "Gas line installation for new stove", assignedTo: null, lastContactedAt: null, nextFollowUpAt: null },
    { name: "Karen Harris", email: "kharris@gmail.com", phone: "(512) 555-1016", source: "website", status: "contacted", score: 50, stage: "nurturing", value: null, notes: "General inquiry about plumbing services", assignedTo: null, lastContactedAt: daysAgo(5), nextFollowUpAt: null },
    { name: "Steven Clark", email: "sclark@icloud.com", phone: "(512) 555-1017", source: "voice", status: "appointment", score: 80, stage: "hot", value: 600000, notes: "Sewer line inspection and repair", assignedTo: null, lastContactedAt: daysAgo(1), nextFollowUpAt: null },
    { name: "Betty Lewis", email: "blewis@gmail.com", phone: "(512) 555-1018", source: "google_ads", status: "new", score: 15, stage: "new", value: null, notes: null, assignedTo: null, lastContactedAt: null, nextFollowUpAt: null },
    { name: "George Walker", email: "gwalker@yahoo.com", phone: "(512) 555-1019", source: "chatbot", status: "won", score: 93, stage: "converted", value: 450000, notes: "Completed water heater replacement. Left 5-star review.", assignedTo: null, lastContactedAt: daysAgo(10), nextFollowUpAt: null },
    { name: "Dorothy Hall", email: "dhall@gmail.com", phone: "(512) 555-1020", source: "referral", status: "qualified", score: 75, stage: "hot", value: 900000, notes: "Bathroom renovation — wants full quote", assignedTo: null, lastContactedAt: daysAgo(3), nextFollowUpAt: daysAgo(3) },
  ];

  const createdLeads: { id: string; name: string }[] = [];
  for (let i = 0; i < leadData.length; i++) {
    const ld = leadData[i];
    const lead = await prisma.lead.create({
      data: {
        clientId: smithClient.id,
        name: ld.name,
        email: ld.email,
        phone: ld.phone,
        source: ld.source,
        status: ld.status,
        score: ld.score,
        stage: ld.stage,
        value: ld.value,
        notes: ld.notes,
        assignedTo: ld.assignedTo,
        lastContactedAt: ld.lastContactedAt,
        nextFollowUpAt: ld.nextFollowUpAt,
        createdAt: daysAgo(Math.floor(Math.random() * 30)),
      },
    });
    createdLeads.push({ id: lead.id, name: lead.name });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 7. ACTIVITY EVENTS (15 for Smith Plumbing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  7. Creating 15 activity events...");
  const activities = [
    { type: "lead_captured", title: "New lead from chatbot", description: "Robert Martinez submitted a quote request via the AI chatbot.", createdAt: hoursAgo(2) },
    { type: "seo_update", title: "Keyword ranking improved", description: "'plumber near me' moved from position 8 to position 3 in Google search results.", createdAt: hoursAgo(6) },
    { type: "review_received", title: "New 5-star Google review", description: "George Walker left a 5-star review: 'Excellent service! Fast, professional, and fair pricing.'", createdAt: hoursAgo(12) },
    { type: "content_published", title: "Blog post published", description: "'5 Signs You Need Emergency Plumbing Service' was published to your website.", createdAt: daysAgo(1) },
    { type: "lead_captured", title: "New lead from Google Ads", description: "Jennifer Lopez clicked a Google ad and submitted her contact info.", createdAt: daysAgo(1) },
    { type: "review_received", title: "New 4-star Google review", description: "Margaret Miller left a 4-star review praising the repipe work.", createdAt: daysAgo(2) },
    { type: "lead_captured", title: "New lead from voice agent", description: "Christopher Davis called and the AI voice agent captured lead details.", createdAt: daysAgo(2) },
    { type: "content_published", title: "Social post published", description: "New Facebook post about spring plumbing maintenance tips was published.", createdAt: daysAgo(3) },
    { type: "lead_captured", title: "New lead from referral", description: "Amanda Wilson was referred by James Thompson.", createdAt: daysAgo(4) },
    { type: "seo_update", title: "New page indexed", description: "Service page 'Emergency Plumber Austin TX' was indexed by Google.", createdAt: daysAgo(5) },
    { type: "review_received", title: "New review request sent", description: "Review request campaign sent to 5 recent customers.", createdAt: daysAgo(6) },
    { type: "lead_captured", title: "New lead from website", description: "Michael Chen filled out the contact form on the website.", createdAt: daysAgo(7) },
    { type: "content_published", title: "Email campaign sent", description: "'Spring Plumbing Checklist' email sent to 247 subscribers.", createdAt: daysAgo(8) },
    { type: "lead_captured", title: "New lead from chatbot", description: "Lisa Taylor engaged with the chatbot and provided contact info.", createdAt: daysAgo(10) },
    { type: "seo_update", title: "Monthly SEO report ready", description: "Your February SEO report shows 23% increase in organic traffic.", createdAt: daysAgo(12) },
  ];

  for (const act of activities) {
    await prisma.activityEvent.create({
      data: {
        clientId: smithClient.id,
        type: act.type,
        title: act.title,
        description: act.description,
        createdAt: act.createdAt,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 8. BOOKINGS (5 for Smith Plumbing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  8. Creating 5 bookings...");
  const bookings = [
    { customerName: "Amanda Wilson", customerEmail: "awilson@gmail.com", customerPhone: "(512) 555-1004", serviceType: "Whole-house repipe consultation", startsAt: daysFromNow(3), endsAt: daysFromNow(3), status: "confirmed", notes: "Confirmed via AI voice agent" },
    { customerName: "Susan Williams", customerEmail: "swilliams@outlook.com", customerPhone: "(512) 555-1010", serviceType: "Tankless water heater installation", startsAt: daysFromNow(5), endsAt: daysFromNow(5), status: "confirmed", notes: "Customer prefers morning appointment" },
    { customerName: "Steven Clark", customerEmail: "sclark@icloud.com", customerPhone: "(512) 555-1017", serviceType: "Sewer line camera inspection", startsAt: daysFromNow(7), endsAt: daysFromNow(7), status: "pending", notes: "Waiting for confirmation" },
    { customerName: "David Brown", customerEmail: "dbrown@gmail.com", customerPhone: "(512) 555-1005", serviceType: "Drain cleaning", startsAt: daysAgo(5), endsAt: daysAgo(5), status: "completed", notes: "Completed successfully. Camera inspection add-on." },
    { customerName: "George Walker", customerEmail: "gwalker@yahoo.com", customerPhone: "(512) 555-1019", serviceType: "Water heater replacement", startsAt: daysAgo(10), endsAt: daysAgo(10), status: "completed", notes: "Installed Rheem 50-gallon tank. Customer very satisfied." },
  ];

  for (const bk of bookings) {
    // Set realistic times for start/end (2 hour appointment windows)
    const start = new Date(bk.startsAt);
    start.setHours(9 + Math.floor(Math.random() * 6), 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 2);

    await prisma.booking.create({
      data: {
        clientId: smithClient.id,
        customerName: bk.customerName,
        customerEmail: bk.customerEmail,
        customerPhone: bk.customerPhone,
        serviceType: bk.serviceType,
        startsAt: start,
        endsAt: end,
        status: bk.status,
        notes: bk.notes,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 9. BLOG POSTS (5)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  9. Creating 5 blog posts...");
  const blogPosts = [
    {
      slug: "ai-marketing-local-businesses-2026",
      title: "How AI Marketing Is Transforming Local Service Businesses in 2026",
      excerpt: "Discover how artificial intelligence is revolutionizing marketing for plumbers, HVAC companies, and other local service businesses.",
      category: "ai-marketing",
      tags: "ai,marketing,local business,2026 trends",
      publishedAt: daysAgo(5),
      content: `# How AI Marketing Is Transforming Local Service Businesses in 2026

The local service industry is experiencing a seismic shift. Artificial intelligence, once the domain of tech giants and Fortune 500 companies, is now accessible to every plumber, HVAC technician, and roofer in America. And it's changing everything about how these businesses find and serve customers.

## The Old Way vs. The AI Way

Traditional marketing for local businesses meant Yellow Pages ads, door hangers, and maybe a basic website. Even digital marketing often meant hiring an agency that charged $2,000-5,000 per month for basic SEO and a few social media posts. The results were unpredictable, reporting was opaque, and scaling was expensive.

AI marketing flips this model entirely. Instead of generic campaigns managed by junior account managers, AI systems work 24/7 to optimize every aspect of your marketing. They analyze which keywords drive the most calls, which ad copy converts best, and which times of day your customers are most likely to book.

## Real Results from Real Businesses

The numbers speak for themselves. Local service businesses using AI-powered marketing platforms are seeing average lead increases of 3-5x within the first 90 days. Cost per lead has dropped by 40-60% compared to traditional agency models. And because AI never sleeps, these businesses are capturing leads at 2 AM that they would have missed entirely before.

## What This Means for Your Business

If you're running a local service business and haven't explored AI marketing yet, you're leaving money on the table. The businesses that adopt AI marketing now will have a significant competitive advantage over those that wait. The technology is mature, affordable, and proven.

The question isn't whether AI marketing works for local businesses. It's whether you can afford to ignore it while your competitors embrace it.`,
    },
    {
      slug: "5-ways-ai-chatbots-capture-leads",
      title: "5 Ways AI Chatbots Capture More Leads Than Contact Forms",
      excerpt: "AI chatbots convert website visitors at 3-5x the rate of traditional contact forms. Here's why and how to set one up.",
      category: "chatbots",
      tags: "chatbots,lead generation,conversion,ai",
      publishedAt: daysAgo(15),
      content: `# 5 Ways AI Chatbots Capture More Leads Than Contact Forms

Your website contact form is losing you money. Studies show that traditional contact forms have a conversion rate of just 2-3%. Meanwhile, AI chatbots on service business websites convert at 8-15%. Here's why the difference is so dramatic.

## 1. Instant Engagement

When a homeowner has a plumbing emergency at 10 PM, they don't want to fill out a form and wait. An AI chatbot engages them instantly, asks the right questions, and can even book an appointment on the spot. This immediacy captures leads that would otherwise bounce to a competitor.

## 2. Conversational Qualification

Forms ask static questions. Chatbots have conversations. They can adapt their questions based on the visitor's responses, drilling down into specifics that help you prioritize and prepare. "I have a leak" becomes "There's water coming from under my kitchen sink, it started this morning, and I can see water damage on the cabinet floor."

## 3. Lower Friction

Typing in a chat feels natural and low-commitment. Filling out a form feels like paperwork. This psychological difference means more people complete the interaction. The chatbot captures name, phone, and email through natural conversation rather than a boring form.

## 4. 24/7 Availability

Your AI chatbot never sleeps, never takes a lunch break, and never has a bad day. It provides the same excellent experience to every visitor, whether they visit at noon on Tuesday or 3 AM on Sunday. For emergency service businesses, this alone can double lead capture.

## 5. Smart Follow-Up

When a chatbot captures a lead, it can immediately trigger follow-up actions: send a confirmation text, create a CRM record, alert your team, and even start a nurture email sequence. This speed-to-lead dramatically improves conversion rates from inquiry to booked job.`,
    },
    {
      slug: "google-reviews-dominate-local-search",
      title: "Why Google Reviews Are the #1 Factor in Local Search Rankings",
      excerpt: "Learn how review quantity, quality, and recency directly impact your visibility in Google local search results.",
      category: "reviews",
      tags: "reviews,seo,google,local search,reputation",
      publishedAt: daysAgo(25),
      content: `# Why Google Reviews Are the #1 Factor in Local Search Rankings

If you want to show up when someone searches "plumber near me" or "HVAC repair in [your city]," your Google reviews matter more than almost any other factor. Here's the data behind this claim and what you can do about it.

## The Data Is Clear

Multiple studies of Google's local search algorithm consistently show that review signals (quantity, velocity, diversity, and ratings) are the single most important factor in local pack rankings. Businesses with 50+ reviews and a 4.5+ average rating appear in the local 3-pack 2.7x more often than businesses with fewer than 20 reviews.

## Quality Over Quantity (But Quantity Matters Too)

A business with 200 five-star reviews will outrank a business with 50 five-star reviews, all else being equal. But a business with 100 reviews averaging 4.8 stars will also outrank a business with 200 reviews averaging 4.2 stars. You need both volume and quality.

## Recency Is Critical

Google heavily weighs recent reviews. A business that received 30 reviews in the last 90 days will rank better than a business with 100 total reviews but none in the last 3 months. This is why automated review request campaigns are so valuable — they create a steady stream of fresh reviews.

## How to Build Your Review Engine

The most effective approach is systematic: after every completed job, automatically send a review request via text message. The timing matters — within 2-4 hours of job completion gets the highest response rate. Make it easy with a direct link to your Google review page. And always respond to every review, positive or negative, to show Google (and potential customers) that you're engaged.

## The Compound Effect

Reviews create a virtuous cycle. More reviews lead to higher rankings, which lead to more clicks, which lead to more customers, which lead to more reviews. Businesses that invest in review generation early create a competitive moat that's incredibly difficult for competitors to overcome.`,
    },
    {
      slug: "roi-ai-marketing-home-services",
      title: "Calculating the ROI of AI Marketing for Home Service Businesses",
      excerpt: "A practical guide to measuring your return on investment from AI-powered marketing with real-world benchmarks.",
      category: "roi",
      tags: "roi,analytics,home services,marketing spend",
      publishedAt: daysAgo(40),
      content: `# Calculating the ROI of AI Marketing for Home Service Businesses

Every dollar you spend on marketing should earn you more dollars back. But how do you actually measure the return on investment of an AI marketing platform? Let's break it down with real numbers.

## The Simple ROI Formula

ROI = (Revenue Generated - Marketing Cost) / Marketing Cost x 100

For a plumbing company spending $6,997/month on a Growth Bundle that generates $45,000 in new revenue, the ROI is: ($45,000 - $6,997) / $6,997 = 543%. For every dollar spent, the business earns $5.43 back.

## Tracking Revenue Attribution

The key challenge is connecting marketing activities to actual revenue. Modern AI marketing platforms solve this by tracking the entire customer journey: from the first ad click or website visit, through chatbot conversation, to booked appointment, completed job, and payment received. This end-to-end tracking gives you accurate attribution.

## Average Benchmarks

Based on data from hundreds of local service businesses using AI marketing, here are typical benchmarks after 90 days:
- Average cost per lead: $28-45 (compared to $85-150 for traditional agencies)
- Lead-to-appointment rate: 35-45%
- Average job value: $800-2,500 depending on trade
- Monthly leads generated: 40-80 for a single location
- Estimated monthly revenue: $25,000-75,000 in attributed revenue

## The Compounding Effect

AI marketing ROI improves over time. SEO takes 3-6 months to fully compound. Review momentum builds month over month. Content libraries grow and attract more organic traffic. The businesses that see the highest ROI are those that commit to at least 6-12 months, allowing the AI systems to fully optimize.

## Beyond Direct ROI

Don't forget the indirect benefits: time saved on marketing management (10-20 hours per week), improved brand perception from consistent professional content, and the competitive advantage of being the most visible business in your local market.`,
    },
    {
      slug: "voice-ai-never-miss-call-again",
      title: "AI Voice Agents: Never Miss a Customer Call Again",
      excerpt: "Learn how AI voice agents are helping service businesses capture every inbound call and convert more leads.",
      category: "ai-marketing",
      tags: "voice ai,phone calls,lead capture,automation",
      publishedAt: daysAgo(55),
      content: `# AI Voice Agents: Never Miss a Customer Call Again

For local service businesses, the phone is still king. Despite the rise of digital marketing, 60% of home service customers prefer to call rather than fill out a form. The problem? Most businesses miss 40-60% of inbound calls. Every missed call is a lost customer — and lost revenue.

## The Missed Call Problem

When a homeowner has a burst pipe, they call the first plumber they find on Google. If nobody answers, they call the next one. Studies show that 85% of callers who don't get an answer on the first try will not call back. They've already hired your competitor.

For a business averaging 20 inbound calls per day, missing just 30% means losing 6 potential customers daily. At an average job value of $500, that's $3,000 per day in lost revenue — $90,000 per month.

## How AI Voice Agents Work

AI voice agents use natural language processing to handle calls with human-like conversation. When a customer calls, the AI agent greets them using your business name, asks qualifying questions about their needs, captures their contact information, checks your calendar for availability, and can book an appointment on the spot.

The experience is seamless. Most callers can't tell they're talking to an AI. The agent is patient, professional, and available 24/7/365. It never has a bad day, never puts callers on hold, and never forgets to ask for their phone number.

## Beyond Answering Calls

Modern AI voice agents do more than just answer phones. They can make outbound calls for appointment confirmations, follow up with leads who haven't been reached, conduct satisfaction surveys after completed jobs, and send automatic text messages when calls are missed.

## Real-World Impact

Service businesses using AI voice agents report capturing 40-60% more leads from phone calls, a 25% reduction in no-shows (thanks to automated confirmations), and significantly improved customer satisfaction scores. The ROI is typically immediate — within the first month, the agent pays for itself multiple times over.

## Getting Started

Setting up an AI voice agent takes minutes, not months. You provide your business information, customize the greeting and qualifying questions, connect your calendar, and the agent is ready to take calls. As it handles more calls, it continuously improves through machine learning, getting better at understanding your specific customer base over time.`,
    },
  ];

  for (const post of blogPosts) {
    await prisma.blogPost.create({
      data: {
        slug: post.slug,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        category: post.category,
        tags: post.tags,
        metaTitle: post.title,
        metaDescription: post.excerpt,
        publishedAt: post.publishedAt,
        createdAt: post.publishedAt,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 10. NOTIFICATIONS (8 for Smith Plumbing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  10. Creating 8 notifications...");
  const notifications = [
    { type: "lead", title: "New Lead", message: "Robert Martinez submitted a quote request via chatbot.", read: false, createdAt: hoursAgo(2) },
    { type: "review", title: "New 5-Star Review", message: "George Walker left a 5-star review on Google.", read: false, createdAt: hoursAgo(12) },
    { type: "booking", title: "Booking Confirmed", message: "Amanda Wilson confirmed her appointment for Mar 21.", read: false, createdAt: daysAgo(1) },
    { type: "system", title: "Monthly Report Ready", message: "Your February performance report is ready to view.", read: true, createdAt: daysAgo(3) },
    { type: "lead", title: "New Lead from Google Ads", message: "Jennifer Lopez clicked your ad and submitted contact info.", read: true, createdAt: daysAgo(4) },
    { type: "review", title: "Review Request Sent", message: "5 review requests were sent to recent customers.", read: true, createdAt: daysAgo(6) },
    { type: "system", title: "SEO Rankings Updated", message: "'plumber near me' moved to position 3 on Google.", read: false, createdAt: daysAgo(7) },
    { type: "booking", title: "Booking Completed", message: "David Brown's drain cleaning appointment was completed.", read: true, createdAt: daysAgo(8) },
  ];

  for (const notif of notifications) {
    await prisma.notification.create({
      data: {
        accountId: smithAccount.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        read: notif.read,
        createdAt: notif.createdAt,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 11. SUPPORT TICKETS (3 for Smith Plumbing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  11. Creating 3 support tickets...");

  const ticket1 = await prisma.supportTicket.create({
    data: {
      clientId: smithClient.id,
      subject: "Chatbot not showing on mobile",
      description: "The AI chatbot widget doesn't appear on my website when viewed from a mobile phone. It works fine on desktop.",
      status: "resolved",
      priority: "medium",
      createdAt: daysAgo(14),
    },
  });
  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket1.id,
      senderRole: "client",
      message: "The chatbot works perfectly on desktop but I can't see it on my iPhone or my wife's Android phone. Is there a setting I need to change?",
      createdAt: daysAgo(14),
    },
  });
  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket1.id,
      senderRole: "admin",
      message: "Hi John! Thanks for reporting this. We identified a CSS conflict with your website's mobile theme. We've pushed a fix — please clear your browser cache and try again. Let us know if it works!",
      createdAt: daysAgo(13),
    },
  });
  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket1.id,
      senderRole: "client",
      message: "That fixed it! Works great on both phones now. Thanks for the quick turnaround!",
      createdAt: daysAgo(13),
    },
  });

  const ticket2 = await prisma.supportTicket.create({
    data: {
      clientId: smithClient.id,
      subject: "Can I add a second phone number for the voice agent?",
      description: "We have a second business line and want the AI voice agent to answer both numbers.",
      status: "in_progress",
      priority: "low",
      createdAt: daysAgo(5),
    },
  });
  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket2.id,
      senderRole: "client",
      message: "We just got a second phone line for our new satellite office. Can the voice agent handle calls on both numbers?",
      createdAt: daysAgo(5),
    },
  });
  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket2.id,
      senderRole: "admin",
      message: "Absolutely! Multi-line support is included with your Growth plan. I'm setting this up now. Could you share the new phone number and any specific greeting you'd like for that line?",
      createdAt: daysAgo(4),
    },
  });

  const ticket3 = await prisma.supportTicket.create({
    data: {
      clientId: smithClient.id,
      subject: "Request for custom report",
      description: "I'd like a monthly report that shows lead source breakdown with cost-per-lead by channel.",
      status: "open",
      priority: "low",
      createdAt: daysAgo(2),
    },
  });
  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket3.id,
      senderRole: "client",
      message: "Is it possible to get a report that breaks down my cost per lead by marketing channel? I want to see Google Ads vs organic vs referrals side by side.",
      createdAt: daysAgo(2),
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 12. ONBOARDING STEPS (5 for Smith Plumbing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  12. Creating 5 onboarding steps...");
  const steps = [
    { stepKey: "google_business", completed: true, completedAt: daysAgo(28) },
    { stepKey: "chatbot_greeting", completed: true, completedAt: daysAgo(27) },
    { stepKey: "business_hours", completed: true, completedAt: daysAgo(27) },
    { stepKey: "first_blog", completed: true, completedAt: daysAgo(25) },
    { stepKey: "upload_logo", completed: false, completedAt: null },
  ];

  for (const step of steps) {
    await prisma.onboardingStep.create({
      data: {
        clientId: smithClient.id,
        stepKey: step.stepKey,
        completed: step.completed,
        completedAt: step.completedAt,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 13. REFERRAL CODE (for Smith Plumbing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  13. Creating referral code...");
  await prisma.referralCode.create({
    data: {
      clientId: smithClient.id,
      code: "SMITH2026",
      referredClientId: acmeClient.id,
      creditCents: 50000, // $500 credit
      status: "credited",
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 14. NPS RESPONSE (1 for Smith Plumbing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  14. Creating NPS response...");
  await prisma.nPSResponse.create({
    data: {
      clientId: smithClient.id,
      score: 9,
      feedback: "Sovereign AI has completely transformed our marketing. We went from struggling to find leads to having more work than we can handle. The AI chatbot alone has booked dozens of appointments. Highly recommend!",
      surveyType: "90day",
      sentAt: daysAgo(10),
      respondedAt: daysAgo(9),
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 15. REVIEW CAMPAIGNS (2 for Smith Plumbing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  15. Creating 2 review campaigns...");
  await prisma.reviewCampaign.create({
    data: {
      clientId: smithClient.id,
      name: "Post-Service Review — George Walker",
      customerName: "George Walker",
      customerEmail: "gwalker@yahoo.com",
      customerPhone: "(512) 555-1019",
      status: "completed",
      reviewUrl: "https://g.page/r/smith-plumbing-austin/review",
      sentAt: daysAgo(12),
      remindedAt: daysAgo(10),
      completedAt: daysAgo(9),
      rating: 5,
    },
  });

  await prisma.reviewCampaign.create({
    data: {
      clientId: smithClient.id,
      name: "Post-Service Review — David Brown",
      customerName: "David Brown",
      customerEmail: "dbrown@gmail.com",
      customerPhone: "(512) 555-1005",
      status: "sent",
      reviewUrl: "https://g.page/r/smith-plumbing-austin/review",
      sentAt: daysAgo(3),
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 16. CONTENT JOBS (3 for Smith Plumbing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  16. Creating 3 content jobs...");
  await prisma.contentJob.create({
    data: {
      clientId: smithClient.id,
      type: "blog",
      title: "5 Signs You Need Emergency Plumbing Service",
      content: "# 5 Signs You Need Emergency Plumbing Service\n\nWhen plumbing problems strike, knowing when to call for emergency service can save you thousands in water damage...",
      keywords: "emergency plumber austin, plumbing emergency signs, when to call a plumber",
      status: "published",
      publishAt: daysAgo(5),
    },
  });

  await prisma.contentJob.create({
    data: {
      clientId: smithClient.id,
      type: "blog",
      title: "Water Heater Maintenance Guide for Austin Homeowners",
      content: "# Water Heater Maintenance Guide\n\nYour water heater works hard every day. Regular maintenance extends its life and improves efficiency...",
      keywords: "water heater maintenance, austin plumber, water heater tips",
      status: "published",
      publishAt: daysAgo(12),
    },
  });

  await prisma.contentJob.create({
    data: {
      clientId: smithClient.id,
      type: "blog",
      title: "How to Prevent Frozen Pipes This Winter",
      content: `# How to Prevent Frozen Pipes This Winter

When temperatures drop below freezing, the water inside your pipes can freeze, expand, and cause pipes to burst — leading to thousands of dollars in water damage. Here's how Austin homeowners can protect their plumbing this winter.

## 1. Insulate Exposed Pipes

Pipes in unheated areas like garages, crawl spaces, and exterior walls are most vulnerable. Foam pipe insulation is inexpensive and easy to install. Pay special attention to pipes near exterior walls and in the attic.

## 2. Keep a Slow Drip Running

During extreme cold snaps, let faucets connected to exposed pipes drip slowly overnight. Moving water is much harder to freeze than standing water. Even a trickle can prevent a frozen pipe.

## 3. Open Cabinet Doors

For pipes under kitchen and bathroom sinks on exterior walls, open the cabinet doors to let warm air circulate around the pipes. This simple step can make a big difference during a cold snap.

## 4. Maintain Your Thermostat

Keep your home heated to at least 55°F, even when you're away. If you're traveling during winter, don't turn off the heat completely. The cost of keeping the heat on is far less than repairing a burst pipe.

## 5. Disconnect Outdoor Hoses

Before the first freeze, disconnect and drain all outdoor hoses. Shut off the water supply to outdoor faucets if possible, and install insulated faucet covers on all outdoor spigots.

## When to Call a Professional

If you notice reduced water flow, frost on exposed pipes, or unusual sounds from your plumbing, call a professional immediately. Smith Plumbing & Heating offers 24/7 emergency service for frozen and burst pipes across the Austin area. Call us at (512) 555-0147 — we'll get your water flowing again fast.`,
      keywords: "frozen pipes, winter plumbing, pipe insulation austin",
      status: "queued",
      publishAt: daysFromNow(7),
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 17. EMAIL CAMPAIGNS (2 for Smith Plumbing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  17. Creating 2 email campaigns...");
  await prisma.emailCampaign.create({
    data: {
      clientId: smithClient.id,
      name: "Spring Plumbing Checklist",
      subject: "Is Your Home Ready for Spring? Free Plumbing Checklist Inside",
      body: "<h1>Spring Plumbing Checklist</h1><p>Winter can be tough on your plumbing. Here are 5 things every homeowner should check as temperatures rise...</p>",
      type: "broadcast",
      status: "completed",
      recipients: 247,
      opens: 89,
      clicks: 34,
      sentAt: daysAgo(8),
    },
  });

  await prisma.emailCampaign.create({
    data: {
      clientId: smithClient.id,
      name: "New Customer Welcome Drip",
      subject: "Welcome to Smith Plumbing & Heating!",
      body: "<h1>Welcome!</h1><p>Thanks for choosing Smith Plumbing & Heating. We're thrilled to have you as a customer...</p>",
      type: "drip",
      status: "active",
      recipients: 42,
      opens: 31,
      clicks: 12,
      sentAt: daysAgo(30),
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 18. AD CAMPAIGNS (2 for Smith Plumbing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  18. Creating 2 ad campaigns...");
  await prisma.adCampaign.create({
    data: {
      clientId: smithClient.id,
      platform: "google",
      externalId: "gads-camp-12345",
      name: "Austin Plumber — Emergency Service",
      status: "active",
      budget: 5000, // $50/day
      spent: 87500, // $875 total
      impressions: 24500,
      clicks: 890,
      conversions: 47,
      costPerLead: 1862, // $18.62
      startDate: daysAgo(30),
      targeting: JSON.stringify({
        location: "Austin, TX",
        radius: "25 miles",
        keywords: ["emergency plumber austin", "plumber near me", "24 hour plumber"],
      }),
      adCopy: JSON.stringify({
        headline: "Austin Emergency Plumber — Fast Same-Day Service",
        description: "Licensed plumbers ready now. Drain cleaning, leak repair, water heaters. Upfront pricing. Call today!",
        callToAction: "Get Free Estimate",
      }),
    },
  });

  await prisma.adCampaign.create({
    data: {
      clientId: smithClient.id,
      platform: "meta",
      externalId: "meta-camp-67890",
      name: "Smith Plumbing — Homeowner Awareness",
      status: "active",
      budget: 3000, // $30/day
      spent: 52500, // $525 total
      impressions: 45000,
      clicks: 620,
      conversions: 28,
      costPerLead: 1875, // $18.75
      startDate: daysAgo(21),
      targeting: JSON.stringify({
        location: "Austin, TX",
        radius: "30 miles",
        demographics: "Homeowners 30-65",
        interests: ["Home improvement", "Home maintenance"],
      }),
      adCopy: JSON.stringify({
        headline: "Your Austin Plumbing Experts",
        description: "Trusted by 500+ Austin homeowners. From simple repairs to full remodels. Book your free estimate today.",
        callToAction: "Book Now",
      }),
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 19. SOCIAL POSTS (4 for Smith Plumbing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  19. Creating 4 social posts...");
  await prisma.socialPost.create({
    data: {
      clientId: smithClient.id,
      platform: "facebook",
      content: "Spring is here and so are plumbing problems! Check out our free Spring Plumbing Checklist to make sure your home is ready. Link in bio! #PlumbingTips #AustinTX #SmithPlumbing",
      status: "published",
      publishedAt: daysAgo(3),
      engagement: JSON.stringify({ likes: 47, comments: 8, shares: 12, impressions: 1850, reach: 1200 }),
    },
  });

  await prisma.socialPost.create({
    data: {
      clientId: smithClient.id,
      platform: "instagram",
      content: "Before & After: Complete bathroom remodel for one of our amazing Austin clients. Swipe to see the transformation! What do you think? #BathroomRemodel #Austin #PlumbingPros",
      mediaUrls: JSON.stringify(["https://example.com/before.jpg", "https://example.com/after.jpg"]),
      status: "published",
      publishedAt: daysAgo(7),
      engagement: JSON.stringify({ likes: 123, comments: 15, shares: 8, impressions: 3200, reach: 2100 }),
    },
  });

  await prisma.socialPost.create({
    data: {
      clientId: smithClient.id,
      platform: "google",
      content: "Did you know a running toilet can waste up to 200 gallons of water per day? If you hear your toilet running, give us a call for a quick and affordable fix. (512) 555-0147",
      status: "scheduled",
      scheduledAt: daysFromNow(2),
    },
  });

  await prisma.socialPost.create({
    data: {
      clientId: smithClient.id,
      platform: "linkedin",
      content: "Proud to announce that Smith Plumbing & Heating has been serving the Austin community for 15 years! Thank you to all our loyal customers and our incredible team. Here's to the next 15! #Anniversary #SmallBusiness #Austin",
      status: "scheduled",
      scheduledAt: daysFromNow(5),
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 20. SEO KEYWORDS (5 for Smith Plumbing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  20. Creating 5 SEO keywords...");
  const seoKeywords = [
    { keyword: "plumber near me", position: 3, prevPosition: 8, searchVolume: 14800, difficulty: 65, url: "https://smithplumbing.com" },
    { keyword: "emergency plumber austin", position: 2, prevPosition: 5, searchVolume: 2400, difficulty: 45, url: "https://smithplumbing.com/emergency" },
    { keyword: "water heater repair austin tx", position: 4, prevPosition: 7, searchVolume: 880, difficulty: 38, url: "https://smithplumbing.com/water-heaters" },
    { keyword: "drain cleaning austin", position: 6, prevPosition: 12, searchVolume: 1200, difficulty: 42, url: "https://smithplumbing.com/drain-cleaning" },
    { keyword: "austin plumbing company", position: 5, prevPosition: 9, searchVolume: 1600, difficulty: 55, url: "https://smithplumbing.com" },
  ];

  for (const kw of seoKeywords) {
    await prisma.sEOKeyword.create({
      data: {
        clientId: smithClient.id,
        keyword: kw.keyword,
        position: kw.position,
        prevPosition: kw.prevPosition,
        searchVolume: kw.searchVolume,
        difficulty: kw.difficulty,
        url: kw.url,
        trackedAt: daysAgo(1),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 21. PHONE CALLS (5 for Smith Plumbing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  21. Creating 5 phone calls...");
  // Link first 3 calls to createdLeads: Robert Martinez (0), Amanda Wilson (3), Christopher Davis (10)
  const phoneCalls = [
    {
      callSid: "CA00000000000000000000000000000001",
      from: "(512) 555-1001",
      to: "(512) 555-0147",
      direction: "inbound",
      status: "completed",
      duration: 187,
      sentiment: "positive",
      summary: "Customer Robert Martinez called about a kitchen pipe leak. AI agent gathered details: leak is under the sink, started this morning, visible water damage. Appointment offered for tomorrow morning. Customer accepted.",
      createdAt: hoursAgo(3),
      leadId: createdLeads[0]?.id ?? null, // Robert Martinez
      recordingUrl: "https://recordings.sovereignai.com/placeholder/CA00000000000000000000000000000001.wav",
      transcription: JSON.stringify([
        { role: "assistant", content: "Thank you for calling Smith Plumbing & Heating. How can I help you today?" },
        { role: "user", content: "Hi, I've got a pretty bad leak under my kitchen sink. Water is pooling on the cabinet floor." },
        { role: "assistant", content: "I'm sorry to hear that, I can definitely help. Can I get your name?" },
        { role: "user", content: "Robert Martinez." },
        { role: "assistant", content: "Thank you Robert. How long has the leak been going on?" },
        { role: "user", content: "I noticed it this morning. There's already some water damage on the wood inside the cabinet." },
        { role: "assistant", content: "Got it — it sounds like we should get someone out quickly. I have a slot open tomorrow morning at 9 AM. Would that work for you?" },
        { role: "user", content: "Yes, that would be great." },
        { role: "assistant", content: "Perfect. I've booked you for tomorrow at 9 AM. A technician will call you 30 minutes before arrival. Is there anything else I can help with?" },
        { role: "user", content: "No, that's all. Thanks!" },
        { role: "assistant", content: "You're welcome, Robert. We'll see you tomorrow morning. Have a good day!" },
      ]),
    },
    {
      callSid: "CA00000000000000000000000000000002",
      from: "(512) 555-0147",
      to: "(512) 555-1004",
      direction: "outbound",
      status: "completed",
      duration: 95,
      sentiment: "positive",
      summary: "Follow-up call to Amanda Wilson to confirm her whole-house repipe consultation appointment. Customer confirmed and asked about estimated project timeline.",
      createdAt: daysAgo(1),
      leadId: createdLeads[3]?.id ?? null, // Amanda Wilson
      recordingUrl: "https://recordings.sovereignai.com/placeholder/CA00000000000000000000000000000002.wav",
      transcription: JSON.stringify([
        { role: "assistant", content: "Hi, this is Smith Plumbing & Heating calling. Am I speaking with Amanda Wilson?" },
        { role: "user", content: "Yes, this is Amanda." },
        { role: "assistant", content: "Great, Amanda! I'm calling to confirm your consultation appointment for the whole-house repipe. We have you down for this Thursday at 10 AM. Does that still work?" },
        { role: "user", content: "Yes, that works perfectly. How long do you think the actual project would take if we move forward?" },
        { role: "assistant", content: "For a full repipe of a home your size, it's typically a 3-day project. The technician will go over all the details during the consultation." },
        { role: "user", content: "Sounds good. Thanks for the call." },
        { role: "assistant", content: "You're welcome! See you Thursday at 10 AM. Have a great day, Amanda." },
      ]),
    },
    {
      callSid: "CA00000000000000000000000000000003",
      from: "(512) 555-1011",
      to: "(512) 555-0147",
      direction: "inbound",
      status: "completed",
      duration: 62,
      sentiment: "neutral",
      summary: "Christopher Davis called about a running toilet. AI agent qualified it as a non-emergency repair. Appointment scheduled for later this week.",
      createdAt: daysAgo(2),
      leadId: createdLeads[10]?.id ?? null, // Christopher Davis
      recordingUrl: "https://recordings.sovereignai.com/placeholder/CA00000000000000000000000000000003.wav",
      transcription: JSON.stringify([
        { role: "assistant", content: "Thank you for calling Smith Plumbing & Heating. How can I help you today?" },
        { role: "user", content: "Hey, my toilet has been running nonstop for the past couple days. It's driving me crazy." },
        { role: "assistant", content: "I understand — a running toilet can be really annoying, and it wastes a lot of water too. Can I get your name?" },
        { role: "user", content: "Christopher Davis." },
        { role: "assistant", content: "Thanks, Christopher. This is usually a straightforward fix. I have an opening this Friday afternoon at 2 PM. Would that work for you?" },
        { role: "user", content: "Yeah, Friday works. What does something like this usually cost?" },
        { role: "assistant", content: "A running toilet repair typically runs between $75 and $150 depending on the parts needed. The technician will give you an exact quote before starting any work." },
        { role: "user", content: "OK, let's do it." },
        { role: "assistant", content: "Great, you're all set for Friday at 2 PM. We'll see you then!" },
      ]),
    },
    {
      callSid: "CA00000000000000000000000000000004",
      from: "(512) 555-9999",
      to: "(512) 555-0147",
      direction: "inbound",
      status: "no-answer",
      duration: null,
      sentiment: null,
      summary: null,
      createdAt: daysAgo(3),
      leadId: null,
      recordingUrl: null,
      transcription: null,
    },
    {
      callSid: "CA00000000000000000000000000000005",
      from: "(512) 555-0147",
      to: "(512) 555-1017",
      direction: "outbound",
      status: "completed",
      duration: 142,
      sentiment: "positive",
      summary: "Called Steven Clark to follow up on sewer line inspection inquiry. Customer wants to schedule a camera inspection. Booked for next week.",
      createdAt: daysAgo(4),
      leadId: null,
      recordingUrl: null,
      transcription: null,
    },
  ];

  for (const call of phoneCalls) {
    await prisma.phoneCall.create({
      data: {
        clientId: smithClient.id,
        callSid: call.callSid,
        from: call.from,
        to: call.to,
        direction: call.direction,
        status: call.status,
        duration: call.duration,
        sentiment: call.sentiment,
        summary: call.summary,
        recordingUrl: call.recordingUrl,
        transcription: call.transcription,
        leadId: call.leadId,
        createdAt: call.createdAt,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 22. KNOWLEDGE ARTICLES
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  22. Creating knowledge articles...");
  for (const article of KB_ARTICLES) {
    await prisma.knowledgeArticle.create({
      data: {
        slug: article.slug,
        category: article.category,
        title: article.title,
        content: article.content,
        order: article.order,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 23. TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  23. Creating templates...");
  const templates = templateSeeds();
  for (const tpl of templates) {
    await prisma.template.create({
      data: {
        category: tpl.category,
        vertical: tpl.vertical,
        name: tpl.name,
        description: tpl.description,
        content: tpl.content,
        tags: Array.isArray(tpl.tags) ? JSON.stringify(tpl.tags) : tpl.tags,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 24. INVOICES (3 for Smith Plumbing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  24. Creating 3 invoices...");
  await prisma.invoice.create({
    data: {
      clientId: smithClient.id,
      customerName: "David Brown",
      customerPhone: "(512) 555-1005",
      customerEmail: "dbrown@gmail.com",
      description: "Drain cleaning + camera inspection",
      amount: 35000, // $350
      status: "paid",
      paidAt: daysAgo(4),
      sentAt: daysAgo(5),
    },
  });

  await prisma.invoice.create({
    data: {
      clientId: smithClient.id,
      customerName: "George Walker",
      customerPhone: "(512) 555-1019",
      customerEmail: "gwalker@yahoo.com",
      description: "50-gallon Rheem water heater replacement — parts and labor",
      amount: 185000, // $1,850
      status: "sent",
      sentAt: daysAgo(2),
    },
  });

  await prisma.invoice.create({
    data: {
      clientId: smithClient.id,
      customerName: "Amanda Wilson",
      customerPhone: "(512) 555-1004",
      customerEmail: "awilson@gmail.com",
      description: "Whole-house copper repipe — deposit",
      amount: 350000, // $3,500
      status: "pending",
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 25. QUOTES (2 for Smith Plumbing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  25. Creating 2 quotes...");
  await prisma.quote.create({
    data: {
      clientId: smithClient.id,
      customerName: "Amanda Wilson",
      customerPhone: "(512) 555-1004",
      customerEmail: "awilson@gmail.com",
      title: "Whole-House Copper Repipe",
      description: "Complete repipe of 2,400 sq ft home from galvanized to copper. Includes all fixtures, drywall patching, and final inspection.",
      lineItems: JSON.stringify([
        { description: "Copper piping and fittings", quantity: 1, unitPrice: 450000, total: 450000 },
        { description: "Labor — 3-day project (2 plumbers)", quantity: 1, unitPrice: 480000, total: 480000 },
        { description: "Drywall patching and paint touch-up", quantity: 1, unitPrice: 120000, total: 120000 },
        { description: "Permits and inspection", quantity: 1, unitPrice: 35000, total: 35000 },
      ]),
      subtotal: 1085000,
      tax: 89513, // 8.25% TX sales tax
      total: 1174513,
      status: "accepted",
      sentAt: daysAgo(8),
      expiresAt: daysFromNow(22),
      acceptedAt: daysAgo(6),
    },
  });

  await prisma.quote.create({
    data: {
      clientId: smithClient.id,
      customerName: "Dorothy Hall",
      customerPhone: "(512) 555-1020",
      customerEmail: "dhall@gmail.com",
      title: "Master Bathroom Renovation — Plumbing",
      description: "Plumbing work for master bathroom renovation including new fixtures, shower valve, and toilet relocation.",
      lineItems: JSON.stringify([
        { description: "New shower valve and trim kit", quantity: 1, unitPrice: 85000, total: 85000 },
        { description: "Toilet relocation", quantity: 1, unitPrice: 65000, total: 65000 },
        { description: "Double vanity plumbing", quantity: 1, unitPrice: 45000, total: 45000 },
        { description: "Labor", quantity: 1, unitPrice: 120000, total: 120000 },
      ]),
      subtotal: 315000,
      tax: 25988, // 8.25%
      total: 340988,
      status: "sent",
      sentAt: daysAgo(2),
      expiresAt: daysFromNow(28),
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 26. REVENUE EVENTS (10 for Smith Plumbing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  26. Creating 10 revenue events...");
  const revenueEvents = [
    { channel: "google_ads", eventType: "ad_click", amount: null, createdAt: daysAgo(20), metadata: JSON.stringify({ utm_source: "google", utm_campaign: "emergency-plumber", keyword: "emergency plumber austin" }) },
    { channel: "google_ads", eventType: "lead_captured", amount: null, createdAt: daysAgo(20), metadata: JSON.stringify({ leadName: "David Brown", source: "google_ads" }) },
    { channel: "google_ads", eventType: "appointment_booked", amount: null, createdAt: daysAgo(18), metadata: JSON.stringify({ serviceType: "Drain cleaning", appointmentDate: daysAgo(10).toISOString() }) },
    { channel: "google_ads", eventType: "job_completed", amount: null, createdAt: daysAgo(10), metadata: JSON.stringify({ serviceType: "Drain cleaning + camera inspection" }) },
    { channel: "google_ads", eventType: "payment_received", amount: 35000, createdAt: daysAgo(4), metadata: JSON.stringify({ invoiceAmount: 35000 }) },
    { channel: "referral", eventType: "lead_captured", amount: null, createdAt: daysAgo(15), metadata: JSON.stringify({ leadName: "Amanda Wilson", referredBy: "James Thompson" }) },
    { channel: "referral", eventType: "appointment_booked", amount: null, createdAt: daysAgo(12), metadata: JSON.stringify({ serviceType: "Whole-house repipe consultation" }) },
    { channel: "chatbot", eventType: "lead_captured", amount: null, createdAt: daysAgo(14), metadata: JSON.stringify({ leadName: "George Walker", source: "chatbot" }) },
    { channel: "chatbot", eventType: "payment_received", amount: 185000, createdAt: daysAgo(2), metadata: JSON.stringify({ service: "Water heater replacement" }) },
    { channel: "organic", eventType: "lead_captured", amount: null, createdAt: daysAgo(8), metadata: JSON.stringify({ leadName: "Michael Chen", landingPage: "/services/bathroom-remodel" }) },
  ];

  for (const rev of revenueEvents) {
    await prisma.revenueEvent.create({
      data: {
        clientId: smithClient.id,
        channel: rev.channel,
        eventType: rev.eventType,
        amount: rev.amount,
        metadata: rev.metadata,
        createdAt: rev.createdAt,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 27. COMMUNITY POSTS (3)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  27. Creating 3 community posts...");
  const post1 = await prisma.communityPost.create({
    data: {
      authorId: smithAccount.id,
      category: "wins",
      title: "Just hit 50 leads this month!",
      content: "When I started with Sovereign AI 3 months ago, I was getting maybe 10-15 leads a month from my old marketing setup. This month we crossed 50 for the first time. The AI chatbot alone is responsible for about 20 of those. Game changer.",
      createdAt: daysAgo(3),
    },
  });

  await prisma.communityComment.create({
    data: {
      postId: post1.id,
      authorId: acmeAccount.id,
      content: "That's awesome, John! We're seeing similar results with our HVAC company. The chatbot is a lead machine.",
      createdAt: daysAgo(2),
    },
  });

  await prisma.communityComment.create({
    data: {
      postId: post1.id,
      authorId: adminAccount.id,
      content: "Congrats John! Love seeing these results. If you want to push even further, consider adding the AI Voice Agent — it pairs perfectly with the chatbot for capturing phone leads too.",
      createdAt: daysAgo(2),
    },
  });

  const post2 = await prisma.communityPost.create({
    data: {
      authorId: acmeAccount.id,
      category: "questions",
      title: "Best time to send review requests?",
      content: "I've been sending review requests the day after service but wondering if there's a better timing strategy. When do you all send yours?",
      createdAt: daysAgo(5),
    },
  });

  await prisma.communityComment.create({
    data: {
      postId: post2.id,
      authorId: smithAccount.id,
      content: "We send ours 2-4 hours after job completion. Catch them while the experience is fresh. Our response rate jumped from 15% to 35% when we switched to same-day requests.",
      createdAt: daysAgo(4),
    },
  });

  await prisma.communityPost.create({
    data: {
      authorId: adminAccount.id,
      category: "tips",
      title: "Pro tip: Use the AI Content Engine for seasonal campaigns",
      content: "Quick tip for all our users — the Content Engine can generate seasonal content automatically. Just set your target keywords to seasonal terms (e.g., 'AC tune-up spring', 'frozen pipe prevention winter') and the AI will create timely, relevant content that ranks for those searches right when homeowners need your services most.",
      isPinned: true,
      createdAt: daysAgo(10),
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 28. LOCATIONS (2 for Smith Plumbing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  28. Creating 2 locations...");
  await prisma.location.create({
    data: {
      clientId: smithClient.id,
      name: "Main Office",
      address: "4521 Congress Ave",
      city: "Austin",
      state: "TX",
      zip: "78745",
      phone: "(512) 555-0147",
      isPrimary: true,
    },
  });

  await prisma.location.create({
    data: {
      clientId: smithClient.id,
      name: "North Austin Satellite",
      address: "12300 Research Blvd, Suite 200",
      city: "Austin",
      state: "TX",
      zip: "78759",
      phone: "(512) 555-0289",
      isPrimary: false,
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // DIGITAL PRODUCTS MARKETPLACE
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  Seeding digital products...");

  // Clear existing digital products
  await prisma.productReview.deleteMany();
  await prisma.productPurchase.deleteMany();
  await prisma.digitalProduct.deleteMany();

  const digitalProducts = await Promise.all(
    DIGITAL_PRODUCTS_SEED.map((p) =>
      prisma.digitalProduct.create({
        data: {
          slug: p.slug,
          name: p.name,
          tagline: p.tagline,
          description: p.description,
          tier: p.tier,
          category: p.category,
          price: p.price,
          comparePrice: p.comparePrice ?? null,
          imageUrl: p.imageUrl ?? null,
          previewUrl: p.previewUrl ?? null,
          deliveryType: p.deliveryType,
          deliveryUrl: p.deliveryUrl ?? null,
          deliveryNotes: p.deliveryNotes ?? null,
          features: Array.isArray(p.features) ? JSON.stringify(p.features) : p.features,
          techStack: Array.isArray(p.techStack) ? JSON.stringify(p.techStack) : p.techStack,
          includes: Array.isArray(p.includes) ? JSON.stringify(p.includes) : p.includes,
          isPublished: p.isPublished,
          isFeatured: p.isFeatured,
          salesCount: Math.floor(Math.random() * 150) + 10,
          rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
          reviewCount: Math.floor(Math.random() * 30) + 2,
        },
      })
    )
  );

  console.log(`  ✓ ${digitalProducts.length} digital products seeded`);

  // ═══════════════════════════════════════════════════════════════════════
  // 29. AGENCY ACCOUNT — Peak Performance Marketing
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  29. Creating agency account (Peak Performance Marketing)...");
  const agencyAccount = await prisma.account.create({
    data: {
      email: "agency@peakperformance.marketing",
      name: "Rachel Torres",
      role: "client",
    },
  });

  await prisma.session.create({
    data: {
      token: "agency-dev-session",
      accountId: agencyAccount.id,
      expiresAt: daysFromNow(365),
    },
  });

  const peakAgency = await prisma.agency.create({
    data: {
      name: "Peak Performance Marketing",
      slug: "peak-performance",
      ownerAccountId: agencyAccount.id,
      primaryColor: "#4c85ff",
      accentColor: "#22d3a1",
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 30. ROOFING CLIENT — Summit Roofing & Restoration (linked to agency)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  30. Creating Summit Roofing (Growth, agency-linked) client...");
  const summitAccount = await prisma.account.create({
    data: {
      email: "demo3@summitroofing.com",
      name: "Marcus Rodriguez",
      role: "client",
    },
  });

  await prisma.session.create({
    data: {
      token: "summit-dev-session",
      accountId: summitAccount.id,
      expiresAt: daysFromNow(365),
    },
  });

  const summitClient = await prisma.client.create({
    data: {
      accountId: summitAccount.id,
      businessName: "Summit Roofing & Restoration",
      ownerName: "Marcus Rodriguez",
      phone: "(404) 555-0312",
      city: "Atlanta",
      state: "GA",
      vertical: "roofing",
      website: "https://summitroofing.com",
      serviceAreaRadius: "35 miles",
      agencyId: peakAgency.id,
    },
  });

  await prisma.subscription.create({
    data: {
      clientId: summitClient.id,
      bundleId: "growth",
      status: "active",
      monthlyAmount: 699700,
      currentPeriodEnd: daysFromNow(30),
    },
  });

  // Growth services for Summit Roofing
  for (const svc of growthServices) {
    await prisma.clientService.create({
      data: {
        clientId: summitClient.id,
        serviceId: svc,
        status: "active",
        activatedAt: daysAgo(Math.floor(Math.random() * 25) + 5),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 31. TRIAL CLIENT — GreenLeaf Landscaping
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  31. Creating GreenLeaf Landscaping (trial) client...");
  const greenleafAccount = await prisma.account.create({
    data: {
      email: "trial@greenleaflandscaping.com",
      name: "Jason Park",
      role: "client",
    },
  });

  await prisma.session.create({
    data: {
      token: "trial-dev-session",
      accountId: greenleafAccount.id,
      expiresAt: daysFromNow(365),
    },
  });

  const greenleafClient = await prisma.client.create({
    data: {
      accountId: greenleafAccount.id,
      businessName: "GreenLeaf Landscaping",
      ownerName: "Jason Park",
      phone: "(503) 555-0478",
      city: "Portland",
      state: "OR",
      vertical: "landscaping",
      website: "https://greenleaflandscaping.com",
      serviceAreaRadius: "20 miles",
    },
  });

  await prisma.subscription.create({
    data: {
      clientId: greenleafClient.id,
      isTrial: true,
      trialEndsAt: daysFromNow(7),
      status: "active",
      monthlyAmount: 0,
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 32. BULK LEADS (30 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  32. Creating bulk leads (30 per paying client)...");

  const firstNames = [
    "Alejandro", "Brianna", "Carlos", "Diana", "Eduardo", "Felicia", "Greg",
    "Hannah", "Ivan", "Julia", "Kevin", "Laura", "Miguel", "Nina", "Oscar",
    "Priya", "Quinn", "Rosa", "Samuel", "Tanya", "Ulysses", "Vanessa",
    "Wesley", "Xena", "Yusuf", "Zoe", "Andre", "Camille", "Derek", "Elena",
  ];
  const lastNames = [
    "Adams", "Baker", "Carter", "Diaz", "Evans", "Foster", "Gomez",
    "Hayes", "Ingram", "Jenkins", "Kim", "Larson", "Mitchell", "Nguyen",
    "Owens", "Palmer", "Quinn", "Rivera", "Stone", "Turner", "Upton",
    "Vargas", "Walsh", "Xiong", "Young", "Zamora", "Barrett", "Cruz",
    "Dawson", "Ellis",
  ];
  const leadSources = ["chatbot", "google_ads", "website", "referral", "voice_agent", "find_a_pro"];
  const leadStatuses = [
    { status: "new", weight: 30 }, { status: "contacted", weight: 25 },
    { status: "qualified", weight: 20 }, { status: "appointment", weight: 10 },
    { status: "won", weight: 10 }, { status: "lost", weight: 5 },
  ];

  function pickWeighted(items: { status: string; weight: number }[]): string {
    const total = items.reduce((sum, i) => sum + i.weight, 0);
    let r = Math.random() * total;
    for (const item of items) {
      r -= item.weight;
      if (r <= 0) return item.status;
    }
    return items[items.length - 1].status;
  }

  function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const verticalValues: Record<string, [number, number]> = {
    plumbing: [20000, 1500000],
    hvac: [30000, 1200000],
    roofing: [50000, 1500000],
  };

  const payingClients = [
    { client: smithClient, account: smithAccount, vertical: "plumbing" },
    { client: acmeClient, account: acmeAccount, vertical: "hvac" },
    { client: summitClient, account: summitAccount, vertical: "roofing" },
  ];

  for (const { client: pc, vertical: vert } of payingClients) {
    const [vMin, vMax] = verticalValues[vert] ?? [20000, 1000000];
    const bulkLeads: {
      clientId: string; name: string; email: string | undefined; phone: string | undefined;
      source: string; status: string; score: number; stage: string;
      value: number | undefined; createdAt: Date;
    }[] = [];
    for (let i = 0; i < 30; i++) {
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[(i * 7 + 3) % lastNames.length];
      const status = pickWeighted(leadStatuses);
      const score = randomInt(10, 95);
      const hasEmail = Math.random() > 0.25;
      const hasPhone = Math.random() > 0.3;
      const stage = status === "won" ? "converted" : status === "lost" ? "dead" : score > 70 ? "hot" : score > 40 ? "nurturing" : "new";
      const hasValue = Math.random() > 0.35;
      bulkLeads.push({
        clientId: pc.id,
        name: `${fn} ${ln}`,
        email: hasEmail ? `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com` : undefined,
        phone: hasPhone ? `(${randomInt(200, 999)}) ${randomInt(100, 999)}-${randomInt(1000, 9999)}` : undefined,
        source: leadSources[randomInt(0, leadSources.length - 1)],
        status,
        score,
        stage,
        value: hasValue ? randomInt(vMin, vMax) : undefined,
        createdAt: daysAgo(randomInt(0, 60)),
      });
    }
    await prisma.lead.createMany({
      data: bulkLeads.map((l) => ({
        clientId: l.clientId,
        name: l.name,
        email: l.email,
        phone: l.phone,
        source: l.source,
        status: l.status,
        score: l.score,
        stage: l.stage,
        value: l.value,
        createdAt: l.createdAt,
      })),
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 33. REVIEW RESPONSES (15 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  33. Creating review responses (15 per paying client)...");

  const reviewerFirstNames = [
    "Alice", "Bob", "Charlie", "Danielle", "Ethan", "Fiona", "George",
    "Helen", "Ian", "Jessica", "Ken", "Linda", "Martin", "Natalie", "Oliver",
  ];
  const reviewerLastNames = [
    "Thompson", "Green", "Wright", "Martinez", "Clark", "Lee", "Walker",
    "Robinson", "Hall", "Young", "King", "Scott", "Adams", "Nelson", "Hill",
  ];

  const reviewTexts5 = [
    "Absolutely outstanding service! The team was professional, punctual, and did an incredible job. Highly recommend!",
    "Best experience I've had with a service company. Fair pricing, great communication, and quality work.",
    "Five stars isn't enough! They went above and beyond to fix the issue and even cleaned up after themselves.",
    "Called for an emergency and they were here within the hour. Saved us from a much bigger problem. Thank you!",
    "We've used them three times now and every experience has been perfect. They're our go-to from now on.",
    "Incredible attention to detail. The technician explained everything clearly and didn't try to upsell unnecessary work.",
    "Fast, friendly, and affordable. Everything you want in a service company. Will definitely use again.",
  ];
  const reviewTexts4 = [
    "Great service overall. Only reason for 4 stars is the scheduling took a bit longer than expected.",
    "Very professional and the work was excellent. Pricing was a bit higher than quoted but still fair.",
    "Good experience. The technician was knowledgeable and efficient. Would recommend to friends.",
  ];
  const reviewTexts3 = [
    "Decent work but communication could be better. Had to follow up multiple times for scheduling.",
    "The job got done but it took longer than expected. Average experience overall.",
  ];
  const reviewTexts2 = [
    "Disappointing experience. The technician was late and seemed rushed. Work quality was acceptable but not great.",
  ];
  const reviewTexts1 = [
    "Very poor experience. Multiple missed appointments and the issue wasn't fully resolved. Would not recommend.",
  ];

  const responseTexts = [
    "Thank you so much for your kind words! We truly appreciate your business and are thrilled to hear you had a great experience. We look forward to serving you again!",
    "We're so grateful for your wonderful review! Our team works hard to deliver exceptional service, and it's great to know we hit the mark. Thank you for choosing us!",
    "What a fantastic review! We're delighted that you're happy with our work. Your recommendation means the world to our small business. See you next time!",
    "Thank you for taking the time to share your experience! We're glad everything went smoothly and that our team took great care of you.",
    "We appreciate your honest feedback! We're glad you had a positive experience overall. We're always working to improve our scheduling process and will take your comments to heart.",
    "Thank you for your review. We're sorry to hear your experience didn't meet expectations. We'd love the opportunity to make things right — please reach out to us directly so we can address your concerns.",
    "We sincerely apologize for falling short of your expectations. Your feedback is important to us, and we're taking steps to ensure this doesn't happen again. Please contact us so we can resolve this.",
    "Thank you for your candid feedback. We take all reviews seriously and are working to improve our communication and scheduling processes.",
    "We're thrilled you chose us and had a wonderful experience! Reviews like yours motivate our entire team. Thank you!",
    "Your satisfaction is our top priority, and we're glad we delivered. Thank you for the stellar review!",
    "We appreciate the kind words! It's always our goal to provide fast, reliable service at a fair price.",
    "Thank you for being a loyal customer! We're glad we continue to earn your trust with every visit.",
    "We apologize for any inconvenience. We value your business and would like to discuss how we can make this right.",
    "Thanks for the great review! Our team prides themselves on attention to detail, and we're happy it showed.",
    "We're so happy you're satisfied with our work! Don't hesitate to call us anytime you need help again.",
  ];

  const platforms = ["google", "google", "google", "google", "google", "google", "yelp", "yelp", "yelp", "facebook", "facebook"];
  const ratingWeights = [
    { rating: 5, weight: 50 }, { rating: 4, weight: 25 },
    { rating: 3, weight: 15 }, { rating: 2, weight: 5 }, { rating: 1, weight: 5 },
  ];
  const responseStatuses = ["published", "published", "published", "published", "published", "published", "approved", "approved", "draft", "draft"];

  for (const { client: pc } of payingClients) {
    for (let i = 0; i < 15; i++) {
      const ratingTotal = ratingWeights.reduce((s, r) => s + r.weight, 0);
      let rr = Math.random() * ratingTotal;
      let rating = 5;
      for (const rw of ratingWeights) {
        rr -= rw.weight;
        if (rr <= 0) { rating = rw.rating; break; }
      }

      let reviewText: string;
      if (rating === 5) reviewText = reviewTexts5[randomInt(0, reviewTexts5.length - 1)];
      else if (rating === 4) reviewText = reviewTexts4[randomInt(0, reviewTexts4.length - 1)];
      else if (rating === 3) reviewText = reviewTexts3[randomInt(0, reviewTexts3.length - 1)];
      else if (rating === 2) reviewText = reviewTexts2[0];
      else reviewText = reviewTexts1[0];

      await prisma.reviewResponse.create({
        data: {
          clientId: pc.id,
          platform: platforms[randomInt(0, platforms.length - 1)],
          reviewerName: `${reviewerFirstNames[i]} ${reviewerLastNames[i]}`,
          rating,
          reviewText,
          responseText: responseTexts[i],
          status: responseStatuses[randomInt(0, responseStatuses.length - 1)],
          publishedAt: rating >= 4 ? daysAgo(randomInt(1, 30)) : undefined,
          createdAt: daysAgo(randomInt(1, 45)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 34. CHATBOT CONVERSATIONS (8 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  34. Creating chatbot conversations (8 per paying client)...");

  // Create chatbot configs for ACME and Summit (Smith already has one)
  const acmeChatbotConfig = await prisma.chatbotConfig.create({
    data: {
      clientId: acmeClient.id,
      greeting: "Welcome to ACME HVAC Solutions! How can we help keep your home comfortable today?",
      systemPrompt: "You are the AI assistant for ACME HVAC Solutions, a trusted heating and cooling company in Denver, CO. Help visitors with AC repair, furnace installation, duct cleaning, and maintenance scheduling.",
      primaryColor: "#e53e3e",
      isActive: true,
    },
  });

  const summitChatbotConfig = await prisma.chatbotConfig.create({
    data: {
      clientId: summitClient.id,
      greeting: "Hi! Welcome to Summit Roofing & Restoration. Need a roof inspection or repair? We're here to help!",
      systemPrompt: "You are the AI assistant for Summit Roofing & Restoration in Atlanta, GA. Help visitors with roof inspections, storm damage repair, new roof installations, and gutter services.",
      primaryColor: "#2d7d46",
      isActive: true,
    },
  });

  const chatbotConfigs: { clientId: string; configId: string }[] = [
    { clientId: smithClient.id, configId: chatbotConfig.id },
    { clientId: acmeClient.id, configId: acmeChatbotConfig.id },
    { clientId: summitClient.id, configId: summitChatbotConfig.id },
  ];

  const chatConversations = [
    {
      visitorName: "Mike Thompson",
      visitorEmail: "mike.t@gmail.com",
      leadCaptured: true,
      messages: JSON.stringify([
        { role: "assistant", content: "Hi there! How can I help you today?", timestamp: hoursAgo(5).toISOString() },
        { role: "user", content: "I need a quote for service at my home", timestamp: hoursAgo(5).toISOString() },
        { role: "assistant", content: "I'd be happy to help you get a quote! Could you tell me a bit more about what you need?", timestamp: hoursAgo(5).toISOString() },
        { role: "user", content: "It's for a standard maintenance check on my system", timestamp: hoursAgo(5).toISOString() },
        { role: "assistant", content: "Great! I can get a technician out for a maintenance inspection. Can I get your name and phone number to schedule?", timestamp: hoursAgo(5).toISOString() },
        { role: "user", content: "Mike Thompson, 555-0201", timestamp: hoursAgo(5).toISOString() },
        { role: "assistant", content: "Thanks Mike! I've got you down. A team member will call you within the hour to confirm a time. Is there anything else?", timestamp: hoursAgo(5).toISOString() },
        { role: "user", content: "No that's it, thanks!", timestamp: hoursAgo(5).toISOString() },
      ]),
    },
    {
      visitorName: "Sarah K.",
      visitorEmail: "sarah.k@yahoo.com",
      leadCaptured: true,
      messages: JSON.stringify([
        { role: "assistant", content: "Welcome! How can we assist you today?", timestamp: hoursAgo(18).toISOString() },
        { role: "user", content: "I'm dealing with an emergency situation right now", timestamp: hoursAgo(18).toISOString() },
        { role: "assistant", content: "I'm sorry to hear that! Can you describe what's happening so I can help?", timestamp: hoursAgo(18).toISOString() },
        { role: "user", content: "There's water everywhere and I can't find the shutoff valve", timestamp: hoursAgo(18).toISOString() },
        { role: "assistant", content: "That sounds urgent. I recommend calling our emergency line right away. In the meantime, try to locate your main water shutoff, usually near the water meter. Can I get your name and address?", timestamp: hoursAgo(18).toISOString() },
        { role: "user", content: "Sarah K, 1250 Elm Street", timestamp: hoursAgo(18).toISOString() },
        { role: "assistant", content: "Thank you Sarah. I'm dispatching an emergency technician to your location now. They should arrive within 30-45 minutes.", timestamp: hoursAgo(18).toISOString() },
      ]),
    },
    {
      visitorName: null,
      visitorEmail: null,
      leadCaptured: false,
      messages: JSON.stringify([
        { role: "assistant", content: "Hello! How can I help you?", timestamp: daysAgo(2).toISOString() },
        { role: "user", content: "What are your business hours?", timestamp: daysAgo(2).toISOString() },
        { role: "assistant", content: "We're open Monday through Friday, 7 AM to 6 PM, and Saturday 8 AM to 2 PM. We also offer 24/7 emergency service!", timestamp: daysAgo(2).toISOString() },
        { role: "user", content: "OK thanks", timestamp: daysAgo(2).toISOString() },
      ]),
    },
    {
      visitorName: "Dave R.",
      visitorEmail: "dave.r@outlook.com",
      leadCaptured: true,
      messages: JSON.stringify([
        { role: "assistant", content: "Hi! How can we help you today?", timestamp: daysAgo(3).toISOString() },
        { role: "user", content: "I need to schedule a routine service appointment", timestamp: daysAgo(3).toISOString() },
        { role: "assistant", content: "Absolutely! We have availability this week. Do you have a preferred day?", timestamp: daysAgo(3).toISOString() },
        { role: "user", content: "Thursday morning would be ideal", timestamp: daysAgo(3).toISOString() },
        { role: "assistant", content: "I can book you for Thursday at 9 AM. Could I get your name and contact info?", timestamp: daysAgo(3).toISOString() },
        { role: "user", content: "Dave R, email is dave.r@outlook.com, phone 555-0345", timestamp: daysAgo(3).toISOString() },
        { role: "assistant", content: "You're all set for Thursday at 9 AM! You'll receive a confirmation text shortly.", timestamp: daysAgo(3).toISOString() },
      ]),
    },
    {
      visitorName: "Jenny Liu",
      visitorEmail: "jenny.liu@gmail.com",
      leadCaptured: true,
      messages: JSON.stringify([
        { role: "assistant", content: "Welcome! What can I help you with?", timestamp: daysAgo(5).toISOString() },
        { role: "user", content: "How much does a typical service call cost?", timestamp: daysAgo(5).toISOString() },
        { role: "assistant", content: "Our service call fee is $89, which includes a full inspection and diagnosis. Any repair work is quoted upfront before we begin. Would you like to schedule a visit?", timestamp: daysAgo(5).toISOString() },
        { role: "user", content: "That sounds reasonable. Yes please schedule me", timestamp: daysAgo(5).toISOString() },
        { role: "assistant", content: "Great! Can I get your name and the best way to reach you?", timestamp: daysAgo(5).toISOString() },
        { role: "user", content: "Jenny Liu, jenny.liu@gmail.com", timestamp: daysAgo(5).toISOString() },
        { role: "assistant", content: "Thanks Jenny! A team member will reach out within the next hour to find a time that works. Anything else I can help with?", timestamp: daysAgo(5).toISOString() },
        { role: "user", content: "Nope, that's all. Thanks!", timestamp: daysAgo(5).toISOString() },
      ]),
    },
    {
      visitorName: null,
      visitorEmail: null,
      leadCaptured: false,
      messages: JSON.stringify([
        { role: "assistant", content: "Hi there! How can I assist you today?", timestamp: daysAgo(7).toISOString() },
        { role: "user", content: "Do you serve the Northside area?", timestamp: daysAgo(7).toISOString() },
        { role: "assistant", content: "Yes, we serve the entire metro area including Northside! Our service radius covers about 25-35 miles from our main location.", timestamp: daysAgo(7).toISOString() },
        { role: "user", content: "Perfect, I'll call back when I'm ready to schedule", timestamp: daysAgo(7).toISOString() },
      ]),
    },
    {
      visitorName: "Tom Garcia",
      visitorEmail: null,
      leadCaptured: true,
      messages: JSON.stringify([
        { role: "assistant", content: "Hello! What can we do for you?", timestamp: daysAgo(10).toISOString() },
        { role: "user", content: "I just moved into a new house and want everything inspected", timestamp: daysAgo(10).toISOString() },
        { role: "assistant", content: "Congratulations on the new home! A full system inspection is a smart move. We can check everything and give you a detailed report.", timestamp: daysAgo(10).toISOString() },
        { role: "user", content: "How long does that take?", timestamp: daysAgo(10).toISOString() },
        { role: "assistant", content: "A thorough inspection typically takes about 2 hours. Would you like to schedule one?", timestamp: daysAgo(10).toISOString() },
        { role: "user", content: "Yes. Tom Garcia. I'm available next week", timestamp: daysAgo(10).toISOString() },
        { role: "assistant", content: "Great Tom! I have openings on Monday and Wednesday. Which works better?", timestamp: daysAgo(10).toISOString() },
        { role: "user", content: "Wednesday", timestamp: daysAgo(10).toISOString() },
        { role: "assistant", content: "Perfect, I'll book you for Wednesday morning. Can I get a phone number in case we need to reach you?", timestamp: daysAgo(10).toISOString() },
        { role: "user", content: "555-0789", timestamp: daysAgo(10).toISOString() },
        { role: "assistant", content: "You're all set! See you Wednesday.", timestamp: daysAgo(10).toISOString() },
      ]),
    },
    {
      visitorName: null,
      visitorEmail: null,
      leadCaptured: false,
      messages: JSON.stringify([
        { role: "assistant", content: "Hi! Need any help?", timestamp: daysAgo(14).toISOString() },
        { role: "user", content: "Just browsing your services page", timestamp: daysAgo(14).toISOString() },
        { role: "assistant", content: "No problem! Feel free to ask if you have any questions. We offer a full range of services.", timestamp: daysAgo(14).toISOString() },
      ]),
    },
  ];

  for (const { configId } of chatbotConfigs) {
    for (const conv of chatConversations) {
      await prisma.chatbotConversation.create({
        data: {
          chatbotId: configId,
          visitorName: conv.visitorName,
          visitorEmail: conv.visitorEmail,
          messages: conv.messages,
          leadCaptured: conv.leadCaptured,
          createdAt: daysAgo(randomInt(0, 20)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 35. ORCHESTRATION EVENTS (15 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  35. Creating orchestration events (15 per paying client)...");

  const orchEventTypes = [
    { type: "lead.created", source: "api", payload: { leadId: "lead_placeholder", source: "chatbot" } },
    { type: "lead.created", source: "webhook", payload: { leadId: "lead_placeholder", source: "google_ads" } },
    { type: "review.received", source: "cron", payload: { platform: "google", rating: 5, reviewerName: "Happy Customer" } },
    { type: "review.received", source: "webhook", payload: { platform: "yelp", rating: 4, reviewerName: "Satisfied User" } },
    { type: "content.published", source: "cron", payload: { contentType: "blog", title: "Seasonal maintenance tips" } },
    { type: "content.published", source: "api", payload: { contentType: "social", platform: "facebook" } },
    { type: "ads.synced", source: "cron", payload: { platform: "google", campaignCount: 2, spend: 15000 } },
    { type: "ads.synced", source: "cron", payload: { platform: "meta", campaignCount: 1, spend: 8500 } },
    { type: "service.activated", source: "api", payload: { serviceId: "chatbot", status: "active" } },
    { type: "service.activated", source: "api", payload: { serviceId: "reviews", status: "active" } },
    { type: "booking.confirmed", source: "webhook", payload: { bookingId: "booking_placeholder", customerName: "John Doe" } },
    { type: "lead.created", source: "api", payload: { leadId: "lead_placeholder", source: "referral" } },
    { type: "review.received", source: "cron", payload: { platform: "facebook", rating: 5, reviewerName: "Local Fan" } },
    { type: "content.published", source: "cron", payload: { contentType: "email", campaignName: "Spring newsletter" } },
    { type: "booking.confirmed", source: "api", payload: { bookingId: "booking_placeholder", customerName: "Jane Smith" } },
  ];
  const orchStatuses = [
    "completed", "completed", "completed", "completed", "completed", "completed", "completed",
    "pending", "pending", "pending",
    "failed",
  ];

  for (const { client: pc } of payingClients) {
    for (let i = 0; i < 15; i++) {
      const evt = orchEventTypes[i];
      await prisma.orchestrationEvent.create({
        data: {
          clientId: pc.id,
          type: evt.type,
          source: evt.source,
          payload: JSON.stringify(evt.payload),
          status: orchStatuses[randomInt(0, orchStatuses.length - 1)],
          processedAt: Math.random() > 0.3 ? daysAgo(randomInt(0, 15)) : undefined,
          createdAt: daysAgo(randomInt(0, 30)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 36. EVENT SUBSCRIPTIONS (6 total, system-wide)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  36. Creating 6 event subscriptions...");
  const eventSubs = [
    { eventType: "lead.created", handlerKey: "lead-performance-tracker", priority: 10 },
    { eventType: "lead.created", handlerKey: "lead-notification", priority: 5 },
    { eventType: "review.received", handlerKey: "review-response-trigger", priority: 10 },
    { eventType: "content.published", handlerKey: "content-publish-notify", priority: 5 },
    { eventType: "lead.created", handlerKey: "benchmark-update", priority: 1 },
    { eventType: "service.activated", handlerKey: "service-activated-handler", priority: 5 },
  ];
  for (const sub of eventSubs) {
    await prisma.eventSubscription.create({
      data: {
        eventType: sub.eventType,
        handlerKey: sub.handlerKey,
        isActive: true,
        priority: sub.priority,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 37. AGENT EXECUTIONS + STEPS (5 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  37. Creating agent executions + steps (5 per paying client)...");

  const agentTypes = [
    "campaign-optimizer",
    "content-strategist",
    "review-responder",
    "lead-nurture-optimizer",
    "campaign-optimizer",
  ];
  const agentStatusWeights = [
    { status: "completed", weight: 80 }, { status: "running", weight: 10 }, { status: "failed", weight: 10 },
  ];
  const stepActions = ["fetch-data", "analyze", "generate", "apply", "report"];

  for (const { client: pc } of payingClients) {
    for (let i = 0; i < 5; i++) {
      const statusTotal = agentStatusWeights.reduce((s, a) => s + a.weight, 0);
      let sr = Math.random() * statusTotal;
      let execStatus = "completed";
      for (const sw of agentStatusWeights) {
        sr -= sw.weight;
        if (sr <= 0) { execStatus = sw.status; break; }
      }

      const numSteps = randomInt(3, 5);
      let totalTokens = 0;
      const stepData: {
        stepNumber: number; action: string; status: string;
        tokensUsed: number; startedAt: Date; completedAt: Date | undefined;
      }[] = [];

      for (let s = 0; s < numSteps; s++) {
        const stepTokens = randomInt(500, 5000);
        let stepStatus: string;
        if (execStatus === "completed") {
          stepStatus = "completed";
        } else if (execStatus === "running") {
          stepStatus = s < numSteps - 1 ? "completed" : "running";
        } else {
          stepStatus = s < numSteps - 1 ? "completed" : "failed";
        }
        if (stepStatus === "completed" || stepStatus === "running") {
          totalTokens += stepTokens;
        }
        stepData.push({
          stepNumber: s + 1,
          action: stepActions[s % stepActions.length],
          status: stepStatus,
          tokensUsed: stepTokens,
          startedAt: daysAgo(randomInt(0, 10)),
          completedAt: stepStatus === "completed" ? daysAgo(randomInt(0, 10)) : undefined,
        });
      }

      const totalCostCents = Math.round((totalTokens / 1000) * 0.3);

      const execution = await prisma.agentExecution.create({
        data: {
          clientId: pc.id,
          agentType: agentTypes[i],
          status: execStatus,
          input: JSON.stringify({ trigger: i < 2 ? "cron:weekly" : "event:lead.created", clientId: pc.id }),
          output: execStatus === "completed" ? JSON.stringify({ summary: "Execution completed successfully", recommendations: ["Increase ad spend by 10%", "Focus on high-intent keywords"] }) : undefined,
          startedAt: daysAgo(randomInt(1, 14)),
          completedAt: execStatus === "completed" ? daysAgo(randomInt(0, 7)) : undefined,
          error: execStatus === "failed" ? "Rate limit exceeded on upstream API" : undefined,
          totalTokens,
          totalCostCents,
          triggeredBy: i < 2 ? "cron:weekly" : "event:lead.created",
          createdAt: daysAgo(randomInt(1, 14)),
        },
      });

      for (const step of stepData) {
        await prisma.agentStep.create({
          data: {
            executionId: execution.id,
            stepNumber: step.stepNumber,
            action: step.action,
            input: JSON.stringify({ step: step.action, config: {} }),
            output: step.status === "completed" ? JSON.stringify({ result: `${step.action} completed`, metrics: { processed: randomInt(10, 100) } }) : undefined,
            status: step.status,
            startedAt: step.startedAt,
            completedAt: step.completedAt,
            tokensUsed: step.tokensUsed,
            error: step.status === "failed" ? "Upstream API error" : undefined,
          },
        });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 38. GOVERNANCE RULES (3 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  38. Creating governance rules (3 per paying client)...");

  for (const { client: pc } of payingClients) {
    await prisma.governanceRule.create({
      data: {
        clientId: pc.id,
        ruleType: "budget_limit",
        scope: "all",
        config: JSON.stringify({ dailyLimitCents: 5000, monthlyLimitCents: 100000 }),
        isActive: true,
      },
    });
    await prisma.governanceRule.create({
      data: {
        clientId: pc.id,
        ruleType: "approval_required",
        scope: "all",
        config: JSON.stringify({ actions: ["ad_budget_change", "content_publish"] }),
        isActive: true,
      },
    });
    await prisma.governanceRule.create({
      data: {
        clientId: pc.id,
        ruleType: "content_filter",
        scope: "all",
        config: JSON.stringify({ blockedTopics: ["politics", "religion"], maxLength: 5000 }),
        isActive: true,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 39. BUDGET TRACKERS (2 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  39. Creating budget trackers (2 per paying client)...");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);

  for (const { client: pc } of payingClients) {
    await prisma.budgetTracker.create({
      data: {
        clientId: pc.id,
        period: "daily",
        periodStart: todayStart,
        periodEnd: todayEnd,
        limitCents: 5000,
        spentCents: randomInt(2000, 4000),
        alertThreshold: 80,
      },
    });
    await prisma.budgetTracker.create({
      data: {
        clientId: pc.id,
        period: "monthly",
        periodStart: monthStart,
        periodEnd: monthEnd,
        limitCents: 100000,
        spentCents: randomInt(40000, 75000),
        alertThreshold: 80,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 40. INDUSTRY BENCHMARKS (5 per vertical — plumbing, hvac, roofing)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  40. Creating industry benchmarks (5 per vertical)...");

  const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const benchmarkVerticals = ["plumbing", "hvac", "roofing"];
  const benchmarkMetrics = [
    { metric: "leads_per_month", p25: 12, p50: 28, p75: 52, p90: 85, sampleSize: 340 },
    { metric: "avg_review_rating", p25: 3.8, p50: 4.3, p75: 4.7, p90: 4.9, sampleSize: 280 },
    { metric: "response_time_hours", p25: 24, p50: 8, p75: 2, p90: 0.5, sampleSize: 220 },
    { metric: "conversion_rate", p25: 0.08, p50: 0.15, p75: 0.25, p90: 0.35, sampleSize: 310 },
    { metric: "revenue_per_lead", p25: 150, p50: 380, p75: 650, p90: 1100, sampleSize: 290 },
  ];

  const benchmarkRecords: { id: string; vertical: string; metric: string }[] = [];

  for (const vert of benchmarkVerticals) {
    for (const bm of benchmarkMetrics) {
      const record = await prisma.industryBenchmark.create({
        data: {
          vertical: vert,
          metric: bm.metric,
          period: currentPeriod,
          p25: bm.p25,
          p50: bm.p50,
          p75: bm.p75,
          p90: bm.p90,
          sampleSize: bm.sampleSize + randomInt(-30, 30),
        },
      });
      benchmarkRecords.push({ id: record.id, vertical: vert, metric: bm.metric });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 41. CLIENT BENCHMARK SCORES (5 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  41. Creating client benchmark scores (5 per paying client)...");

  for (const { client: pc, vertical: vert } of payingClients) {
    const vertBenchmarks = benchmarkRecords.filter((b) => b.vertical === vert);
    for (const bm of vertBenchmarks) {
      const percentile = randomInt(25, 90);
      let score: number;
      const metricBm = benchmarkMetrics.find((m) => m.metric === bm.metric);
      if (metricBm) {
        if (percentile < 25) score = metricBm.p25 * 0.8;
        else if (percentile < 50) score = metricBm.p25 + (metricBm.p50 - metricBm.p25) * ((percentile - 25) / 25);
        else if (percentile < 75) score = metricBm.p50 + (metricBm.p75 - metricBm.p50) * ((percentile - 50) / 25);
        else score = metricBm.p75 + (metricBm.p90 - metricBm.p75) * ((percentile - 75) / 15);
      } else {
        score = percentile;
      }
      await prisma.clientBenchmarkScore.create({
        data: {
          clientId: pc.id,
          benchmarkId: bm.id,
          score: Math.round(score * 100) / 100,
          percentile,
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 42. PREDICTIVE INSIGHTS (4 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  42. Creating predictive insights (4 per paying client)...");

  const insightTemplates = [
    {
      type: "service_recommendation",
      title: "Add Voice Agent for 35% More Lead Capture",
      description: "Based on your call volume patterns, enabling the AI Voice Agent could capture an estimated 12-18 additional leads per month from missed calls.",
      confidence: 0.87,
      impact: "high",
      recommendation: "Activate the Voice Agent service to capture after-hours and missed phone calls automatically.",
      actionUrl: "/dashboard/services",
    },
    {
      type: "budget_optimization",
      title: "Reallocate Ad Spend for Better ROI",
      description: "Your Google Ads campaigns are outperforming Meta by 2.3x on cost-per-lead. Shifting 30% of Meta budget to Google could yield 8-12 more leads.",
      confidence: 0.78,
      impact: "medium",
      recommendation: "Consider shifting $500/month from Meta Ads to Google Ads to optimize your cost per acquisition.",
      actionUrl: "/dashboard/billing",
    },
    {
      type: "performance_gap",
      title: "Review Response Time Needs Improvement",
      description: "Your average review response time is 18 hours, while top performers in your vertical respond within 2 hours. Faster responses improve reputation scores.",
      confidence: 0.92,
      impact: "high",
      recommendation: "Enable auto-publish for positive reviews (4-5 stars) to reduce average response time below 1 hour.",
      actionUrl: "/dashboard/autopilot",
    },
    {
      type: "seasonal_opportunity",
      title: "Spring Maintenance Campaign Window Opening",
      description: "Historical data shows a 40% increase in service requests during March-April. Running a targeted campaign now could capture early-season demand.",
      confidence: 0.71,
      impact: "medium",
      recommendation: "Launch a spring maintenance campaign with a 10% early-bird discount to drive bookings before peak season.",
      actionUrl: "/dashboard",
    },
  ];

  for (const { client: pc } of payingClients) {
    for (const insight of insightTemplates) {
      await prisma.predictiveInsight.create({
        data: {
          clientId: pc.id,
          type: insight.type,
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          impact: insight.impact,
          recommendation: insight.recommendation,
          actionUrl: insight.actionUrl,
          dismissed: false,
          expiresAt: daysFromNow(30),
          createdAt: daysAgo(randomInt(1, 7)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 43. ANOMALY LOGS (3 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  43. Creating anomaly logs (3 per paying client)...");

  const anomalyTemplates = [
    {
      type: "lead_volume_spike",
      severity: "info",
      title: "Lead Volume Spike Detected",
      description: "Lead volume increased 150% compared to the 7-day average. This may be due to a viral social post or seasonal demand increase.",
      acknowledged: true,
    },
    {
      type: "review_rating_drop",
      severity: "warning",
      title: "Average Review Rating Declining",
      description: "Your 30-day average review rating has dropped from 4.7 to 4.3. Two recent 2-star reviews are the primary contributors.",
      acknowledged: true,
    },
    {
      type: "spend_anomaly",
      severity: "critical",
      title: "Unusual Ad Spend Detected",
      description: "Daily ad spend exceeded the $50 budget cap by 40%. This may indicate click fraud or a misconfigured campaign. Automated pause has been triggered.",
      acknowledged: false,
    },
  ];

  for (const { client: pc } of payingClients) {
    for (const anomaly of anomalyTemplates) {
      await prisma.anomalyLog.create({
        data: {
          clientId: pc.id,
          type: anomaly.type,
          severity: anomaly.severity,
          title: anomaly.title,
          description: anomaly.description,
          metadata: JSON.stringify({ detectedAt: daysAgo(randomInt(1, 5)).toISOString(), metric: anomaly.type }),
          acknowledged: anomaly.acknowledged,
          createdAt: daysAgo(randomInt(1, 10)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 44. AUDIT LOGS (5 total)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  44. Creating 5 audit logs...");

  const auditLogs = [
    { accountId: smithAccount.id, action: "login", resource: "session", metadata: JSON.stringify({ ip: "192.168.1.100", userAgent: "Mozilla/5.0" }) },
    { accountId: smithAccount.id, action: "service.activated", resource: "service", resourceId: "voice-agent", metadata: JSON.stringify({ serviceId: "voice-agent", status: "active" }) },
    { accountId: adminAccount.id, action: "settings.updated", resource: "client", resourceId: smithClient.id, metadata: JSON.stringify({ changes: { serviceAreaRadius: "30 miles" } }) },
    { accountId: acmeAccount.id, action: "subscription.changed", resource: "subscription", metadata: JSON.stringify({ from: "starter", to: "growth", monthlyAmount: 699700 }) },
    { accountId: smithAccount.id, action: "lead.exported", resource: "lead", metadata: JSON.stringify({ format: "csv", count: 20, filters: { status: "all" } }) },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({
      data: {
        accountId: log.accountId,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId ?? undefined,
        metadata: log.metadata,
        createdAt: daysAgo(randomInt(0, 14)),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 45. CONVERSATION THREADS + UNIFIED MESSAGES (5 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  45. Creating conversation threads + unified messages (5 per paying client)...");

  const threadTemplates = [
    {
      channel: "sms",
      status: "open",
      contactName: "Robert Martinez",
      contactPhone: "(512) 555-1001",
      messages: [
        { direction: "inbound", senderName: "Robert Martinez", content: "Hi, I got a leak under my kitchen sink. Can someone come out today?" },
        { direction: "outbound", senderName: "Smith Plumbing AI", content: "Hi Robert! We can have a technician to you by 2 PM today. Does that work?" },
        { direction: "inbound", senderName: "Robert Martinez", content: "Yes that would be great, thanks!" },
        { direction: "outbound", senderName: "Smith Plumbing AI", content: "You're all set! Your technician, Mike, will arrive between 1:30-2:00 PM. He'll call when he's on his way." },
      ],
    },
    {
      channel: "email",
      status: "open",
      contactName: "Jennifer Lopez",
      contactEmail: "jlopez@yahoo.com",
      messages: [
        { direction: "inbound", senderName: "Jennifer Lopez", content: "I'm interested in getting a quote for a new water heater. Can you provide pricing?" },
        { direction: "outbound", senderName: "Smith Plumbing Team", content: "Hi Jennifer! We'd be happy to provide a quote. Our standard 50-gallon tank water heaters start at $1,200 installed. We also offer tankless options. Would you like to schedule a free in-home estimate?" },
      ],
    },
    {
      channel: "chatbot",
      status: "closed",
      contactName: "Lisa Taylor",
      messages: [
        { direction: "inbound", senderName: "Lisa Taylor", content: "What areas do you service?" },
        { direction: "outbound", senderName: "AI Chatbot", content: "We serve the entire Austin metro area within a 25-mile radius. This includes Round Rock, Cedar Park, Georgetown, Pflugerville, and surrounding communities!" },
        { direction: "inbound", senderName: "Lisa Taylor", content: "Great, I'm in Round Rock. Can I book online?" },
        { direction: "outbound", senderName: "AI Chatbot", content: "Absolutely! I can help you book right here. What service do you need?" },
      ],
    },
    {
      channel: "voice",
      status: "closed",
      contactName: "David Brown",
      contactPhone: "(512) 555-1005",
      messages: [
        { direction: "inbound", senderName: "David Brown", content: "[Call transcript] Called about drain cleaning appointment confirmation" },
        { direction: "outbound", senderName: "AI Voice Agent", content: "[Call transcript] Confirmed appointment for Thursday at 10 AM. Estimated duration: 1.5 hours." },
      ],
    },
    {
      channel: "sms",
      status: "open",
      contactName: "Amanda Wilson",
      contactPhone: "(512) 555-1004",
      messages: [
        { direction: "outbound", senderName: "Smith Plumbing AI", content: "Hi Amanda! This is a reminder about your repipe consultation scheduled for Thursday at 10 AM. Reply YES to confirm or call us to reschedule." },
        { direction: "inbound", senderName: "Amanda Wilson", content: "YES confirmed! Looking forward to it." },
        { direction: "outbound", senderName: "Smith Plumbing AI", content: "Great, see you Thursday! Our technician John will be there at 10 AM sharp." },
      ],
    },
  ];

  for (const { client: pc, account: acct } of payingClients) {
    for (const tpl of threadTemplates) {
      const thread = await prisma.conversationThread.create({
        data: {
          clientId: pc.id,
          contactName: tpl.contactName,
          contactPhone: "contactPhone" in tpl ? (tpl as { contactPhone?: string }).contactPhone : undefined,
          contactEmail: "contactEmail" in tpl ? (tpl as { contactEmail?: string }).contactEmail : undefined,
          channel: tpl.channel,
          status: tpl.status,
          lastMessageAt: daysAgo(randomInt(0, 5)),
          createdAt: daysAgo(randomInt(5, 15)),
        },
      });

      for (let mi = 0; mi < tpl.messages.length; mi++) {
        const msg = tpl.messages[mi];
        await prisma.unifiedMessage.create({
          data: {
            clientId: pc.id,
            threadId: thread.id,
            channel: tpl.channel,
            direction: msg.direction,
            senderName: msg.senderName,
            senderContact: msg.direction === "inbound" ? ("contactPhone" in tpl ? (tpl as { contactPhone?: string }).contactPhone : ("contactEmail" in tpl ? (tpl as { contactEmail?: string }).contactEmail : undefined)) : undefined,
            content: msg.content,
            createdAt: daysAgo(randomInt(0, 5)),
          },
        });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 46. ADDITIONAL NOTIFICATIONS (5 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  46. Creating additional notifications (5 per paying client)...");

  const notifTemplates = [
    { type: "lead_captured", title: "New Lead from Chatbot", message: "A new lead was captured via the AI chatbot. Score: 82.", actionUrl: "/dashboard/leads" },
    { type: "review_received", title: "New 5-Star Google Review", message: "A customer just left a 5-star review on Google. AI response has been drafted.", actionUrl: "/dashboard/reviews" },
    { type: "billing", title: "Monthly Invoice Generated", message: "Your monthly subscription invoice for $6,997 has been generated.", actionUrl: "/dashboard/billing" },
    { type: "agent", title: "Campaign Optimizer Completed", message: "The AI campaign optimizer has finished its weekly analysis. 3 recommendations are ready.", actionUrl: "/dashboard/autopilot" },
    { type: "approval_required", title: "Content Approval Needed", message: "A new blog post draft requires your approval before publishing.", actionUrl: "/dashboard/content" },
  ];

  for (const { account: acct } of payingClients) {
    for (let i = 0; i < notifTemplates.length; i++) {
      const tpl = notifTemplates[i];
      await prisma.notification.create({
        data: {
          accountId: acct.id,
          type: tpl.type,
          title: tpl.title,
          message: tpl.message,
          actionUrl: tpl.actionUrl,
          read: i >= 3,
          createdAt: daysAgo(randomInt(0, 7)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 47. EMAIL EVENTS (for existing email campaigns)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  47. Creating email events for email campaigns...");

  // Fetch existing email campaigns for Smith Plumbing to attach events
  const smithCampaigns = await prisma.emailCampaign.findMany({
    where: { clientId: smithClient.id },
  });

  for (const campaign of smithCampaigns) {
    for (let i = 0; i < 20; i++) {
      const recipientEmail = `subscriber${i + 1}@example.com`;
      const msgId = `msg-${campaign.id}-${i}`;

      // All get delivered
      await prisma.emailEvent.create({
        data: {
          campaignId: campaign.id,
          messageId: msgId,
          type: "delivered",
          metadata: JSON.stringify({ recipientEmail, timestamp: daysAgo(randomInt(1, 8)).toISOString() }),
          createdAt: daysAgo(randomInt(1, 8)),
        },
      });

      // 35% get opened
      if (Math.random() < 0.35) {
        await prisma.emailEvent.create({
          data: {
            campaignId: campaign.id,
            messageId: `${msgId}-open`,
            type: "open",
            metadata: JSON.stringify({ recipientEmail, ip: "192.168.1." + randomInt(1, 254) }),
            createdAt: daysAgo(randomInt(0, 7)),
          },
        });
      }

      // 15% get clicked
      if (Math.random() < 0.15) {
        await prisma.emailEvent.create({
          data: {
            campaignId: campaign.id,
            messageId: `${msgId}-click`,
            type: "click",
            metadata: JSON.stringify({ recipientEmail, url: "https://smithplumbing.com/spring-checklist" }),
            createdAt: daysAgo(randomInt(0, 6)),
          },
        });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 48. ALERT RULES (4 global rules)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  48. Creating alert rules...");

  const alertRules = [
    { name: "High Spend Alert", type: "budget_overspend", config: JSON.stringify({ threshold: 120, metric: "daily_spend" }), enabled: true },
    { name: "Lead Volume Drop", type: "lead_anomaly", config: JSON.stringify({ threshold: -50, lookbackDays: 7 }), enabled: true },
    { name: "Review Rating Alert", type: "review_rating", config: JSON.stringify({ minRating: 3, triggerBelow: true }), enabled: true },
    { name: "Uptime Monitor", type: "uptime", config: JSON.stringify({ url: "https://api.sovereignai.com/health", intervalMs: 60000 }), enabled: false },
  ];

  for (const rule of alertRules) {
    await prisma.alertRule.create({ data: { ...rule, createdAt: daysAgo(randomInt(10, 60)) } });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 49. APPROVAL REQUESTS (2 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  49. Creating approval requests (2 per paying client)...");

  const approvalTemplates = [
    { actionType: "publish_content", description: "AI-generated blog post 'Spring Maintenance Tips' ready for review", status: "pending", payload: JSON.stringify({ contentType: "blog", wordCount: 850 }) },
    { actionType: "send_campaign", description: "Seasonal email campaign targeting 340 subscribers", status: "approved", payload: JSON.stringify({ recipients: 340, subject: "Spring Special Offer" }), reviewedBy: "admin" },
  ];

  for (const { client: pc } of payingClients) {
    for (const tpl of approvalTemplates) {
      await prisma.approvalRequest.create({
        data: {
          clientId: pc.id,
          actionType: tpl.actionType,
          description: tpl.description,
          payload: tpl.payload,
          status: tpl.status,
          reviewedBy: tpl.reviewedBy ?? null,
          reviewedAt: tpl.status === "approved" ? daysAgo(randomInt(1, 5)) : null,
          expiresAt: daysFromNow(7),
          createdAt: daysAgo(randomInt(1, 14)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 50. CALL LOGS (3 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  50. Creating call logs (3 per paying client)...");

  const callLogTemplates = [
    { callerPhone: "(512) 555-2001", callerName: "Frank Torres", status: "completed", duration: 185, sentiment: "positive", summary: "Called to schedule annual furnace maintenance. Booked for next Tuesday.", bookingCreated: true, isEmergency: false },
    { callerPhone: "(512) 555-2002", callerName: "Nina Patel", status: "missed", duration: 0, sentiment: null, summary: null, bookingCreated: false, isEmergency: false },
    { callerPhone: "(512) 555-2003", callerName: null, status: "voicemail", duration: 42, sentiment: "neutral", summary: "Voicemail left requesting a callback about a pipe leak.", bookingCreated: false, isEmergency: true },
  ];

  for (const { client: pc } of payingClients) {
    for (const tpl of callLogTemplates) {
      await prisma.callLog.create({
        data: {
          clientId: pc.id,
          callerPhone: tpl.callerPhone,
          callerName: tpl.callerName,
          status: tpl.status,
          duration: tpl.duration,
          sentiment: tpl.sentiment,
          summary: tpl.summary,
          bookingCreated: tpl.bookingCreated,
          isEmergency: tpl.isEmergency,
          transcript: tpl.status === "completed" ? JSON.stringify([{ role: "agent", text: "Hello, thanks for calling." }, { role: "caller", text: "Hi, I need to schedule maintenance." }]) : null,
          createdAt: daysAgo(randomInt(0, 14)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 51. CUSTOMER LIFETIME VALUE (4 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  51. Creating customer lifetime value records (4 per paying client)...");

  const clvTemplates = [
    { customerEmail: "vip.customer@example.com", customerName: "Harold Winston", totalJobs: 8, totalRevenue: 2450000, avgJobValue: 306250, predictedLTV: 4800000, churnRisk: "low", segment: "vip" },
    { customerEmail: "regular.joe@example.com", customerName: "Joe Ramirez", totalJobs: 3, totalRevenue: 650000, avgJobValue: 216667, predictedLTV: 1200000, churnRisk: "low", segment: "regular" },
    { customerEmail: "at.risk@example.com", customerName: "Diane Keller", totalJobs: 1, totalRevenue: 180000, avgJobValue: 180000, predictedLTV: 350000, churnRisk: "high", segment: "at-risk" },
    { customerEmail: "new.customer@example.com", customerName: "Tanya Brooks", totalJobs: 1, totalRevenue: 120000, avgJobValue: 120000, predictedLTV: 500000, churnRisk: "medium", segment: "new" },
  ];

  for (const { client: pc } of payingClients) {
    for (const tpl of clvTemplates) {
      await prisma.customerLifetimeValue.create({
        data: {
          clientId: pc.id,
          customerEmail: tpl.customerEmail,
          customerName: tpl.customerName,
          totalJobs: tpl.totalJobs,
          totalRevenue: tpl.totalRevenue,
          avgJobValue: tpl.avgJobValue,
          firstJobDate: daysAgo(randomInt(90, 365)),
          lastJobDate: daysAgo(randomInt(1, 30)),
          predictedLTV: tpl.predictedLTV,
          churnRisk: tpl.churnRisk,
          segment: tpl.segment,
          createdAt: daysAgo(randomInt(1, 30)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 52. CUSTOMER REFERRALS (2 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  52. Creating customer referrals (2 per paying client)...");

  const referralTemplates = [
    { referrerName: "Harold Winston", referrerPhone: "(512) 555-3001", referrerEmail: "harold.w@example.com", referredName: "Beth Sanchez", referredPhone: "(512) 555-3002", referredEmail: "beth.s@example.com", code: "HAROLD10", reward: "$50 credit", status: "converted" },
    { referrerName: "Joe Ramirez", referrerPhone: "(512) 555-3003", referrerEmail: "joe.r@example.com", referredName: "Sam Turner", referredPhone: "(512) 555-3004", referredEmail: "sam.t@example.com", code: "JOE25", reward: "$25 credit", status: "pending" },
  ];

  for (const { client: pc } of payingClients) {
    for (const tpl of referralTemplates) {
      await prisma.customerReferral.create({
        data: {
          clientId: pc.id,
          referrerName: tpl.referrerName,
          referrerPhone: tpl.referrerPhone,
          referrerEmail: tpl.referrerEmail,
          referredName: tpl.referredName,
          referredPhone: tpl.referredPhone,
          referredEmail: tpl.referredEmail,
          code: `${tpl.code}-${pc.id.slice(-4)}`,
          reward: tpl.reward,
          status: tpl.status,
          createdAt: daysAgo(randomInt(5, 45)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 53. EMAIL QUEUE (5 entries)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  53. Creating email queue entries...");

  const emailQueueEntries = [
    { to: "rmartinez@gmail.com", subject: "Your Appointment Confirmation", html: "<h1>Appointment Confirmed</h1><p>Your service visit is scheduled for Thursday at 2 PM.</p>", status: "sent", sentAt: daysAgo(1) },
    { to: "jlopez@yahoo.com", subject: "Quote for Water Heater Replacement", html: "<h1>Your Quote</h1><p>Thank you for your interest. Here is your customized quote...</p>", status: "sent", sentAt: daysAgo(2) },
    { to: "mchen@outlook.com", subject: "Spring Maintenance Reminder", html: "<h1>Time for Spring Maintenance!</h1><p>Schedule your annual checkup today and save 10%.</p>", status: "pending", sentAt: null },
    { to: "awilson@gmail.com", subject: "Review Request — How Did We Do?", html: "<h1>We'd Love Your Feedback</h1><p>Please take a moment to review your recent service.</p>", status: "pending", sentAt: null },
    { to: "bounced@invalid-domain.xyz", subject: "Welcome to Our Newsletter", html: "<h1>Welcome!</h1><p>Thanks for subscribing.</p>", status: "failed", lastError: "550 Mailbox not found", attempts: 3, sentAt: null },
  ];

  for (const entry of emailQueueEntries) {
    await prisma.emailQueue.create({
      data: {
        to: entry.to,
        subject: entry.subject,
        html: entry.html,
        status: entry.status,
        sentAt: entry.sentAt,
        lastError: (entry as { lastError?: string }).lastError ?? null,
        attempts: (entry as { attempts?: number }).attempts ?? (entry.status === "sent" ? 1 : 0),
        scheduledAt: daysAgo(randomInt(0, 3)),
        createdAt: daysAgo(randomInt(0, 5)),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 54. FINANCING APPLICATIONS (2 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  54. Creating financing applications (2 per paying client)...");

  const financingTemplates = [
    { customerName: "Michael Chen", customerEmail: "mchen@outlook.com", customerPhone: "(512) 555-1003", amount: 800000, term: 24, apr: 7.99, monthlyPayment: 36200, status: "approved", prequalAmount: 1000000 },
    { customerName: "Dorothy Hall", customerEmail: "dhall@gmail.com", customerPhone: "(512) 555-1020", amount: 1500000, term: 36, apr: 9.99, monthlyPayment: 48400, status: "pending", prequalAmount: null },
  ];

  for (const { client: pc } of payingClients) {
    for (const tpl of financingTemplates) {
      await prisma.financingApplication.create({
        data: {
          clientId: pc.id,
          customerName: tpl.customerName,
          customerEmail: tpl.customerEmail,
          customerPhone: tpl.customerPhone,
          amount: tpl.amount,
          term: tpl.term,
          apr: tpl.apr,
          monthlyPayment: tpl.monthlyPayment,
          status: tpl.status,
          prequalAmount: tpl.prequalAmount,
          createdAt: daysAgo(randomInt(5, 30)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 55. FSM CONNECTIONS + SYNC LOGS (1 connection + 2 logs per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  55. Creating FSM connections and sync logs...");

  const fsmPlatforms = ["servicetitan", "jobber", "housecall_pro"];

  for (let i = 0; i < payingClients.length; i++) {
    const pc = payingClients[i].client;
    const platform = fsmPlatforms[i % fsmPlatforms.length];
    const conn = await prisma.fSMConnection.create({
      data: {
        clientId: pc.id,
        platform,
        accessToken: `fsm_tok_${pc.id.slice(-8)}_${platform}`,
        refreshToken: `fsm_ref_${pc.id.slice(-8)}_${platform}`,
        externalAccountId: `ext-${randomInt(10000, 99999)}`,
        isActive: true,
        syncStatus: "synced",
        lastSyncAt: daysAgo(0),
        config: JSON.stringify({ autoSync: true, syncInterval: "hourly" }),
        createdAt: daysAgo(randomInt(30, 60)),
      },
    });

    // Two sync log entries per connection
    await prisma.fSMSyncLog.create({
      data: {
        connectionId: conn.id,
        direction: "inbound",
        entityType: "job",
        entityId: `job-${randomInt(1000, 9999)}`,
        externalId: `ext-job-${randomInt(1000, 9999)}`,
        action: "create",
        status: "success",
        details: "Synced new job from FSM platform",
        createdAt: daysAgo(randomInt(0, 3)),
      },
    });

    await prisma.fSMSyncLog.create({
      data: {
        connectionId: conn.id,
        direction: "outbound",
        entityType: "customer",
        entityId: `cust-${randomInt(1000, 9999)}`,
        externalId: `ext-cust-${randomInt(1000, 9999)}`,
        action: "update",
        status: "success",
        details: "Pushed updated customer info to FSM platform",
        createdAt: daysAgo(randomInt(0, 2)),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 56. JOB POSTINGS + APPLICANTS (1 posting with 3 applicants per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  56. Creating job postings and applicants...");

  const jobPostingTemplates = [
    { title: "Licensed Plumbing Technician", description: "Seeking an experienced licensed plumber for residential and commercial service calls. Must have 3+ years experience.", requirements: JSON.stringify(["Valid plumbing license", "3+ years experience", "Clean driving record", "Customer service skills"]), compensation: "$55,000 - $75,000/year + benefits", location: "Austin, TX", type: "full-time" },
    { title: "HVAC Installation Specialist", description: "Join our growing HVAC team. Responsible for installing and maintaining heating and cooling systems.", requirements: JSON.stringify(["EPA 608 certification", "2+ years HVAC experience", "Ability to lift 50+ lbs"]), compensation: "$50,000 - $70,000/year", location: "Denver, CO", type: "full-time" },
    { title: "Roofing Crew Lead", description: "Experienced roofing professional to lead a crew of 4-6 workers on residential re-roofing projects.", requirements: JSON.stringify(["5+ years roofing experience", "Leadership experience", "OSHA 10 certification"]), compensation: "$60,000 - $80,000/year", location: "Atlanta, GA", type: "full-time" },
  ];

  const applicantTemplates = [
    { name: "Carlos Rivera", email: "carlos.r@example.com", phone: "(555) 100-2001", experience: "5 years residential plumbing", certifications: JSON.stringify(["Master Plumber License", "Backflow Prevention"]), aiScore: 88, aiSummary: "Strong candidate with relevant certifications and solid experience.", status: "screening" },
    { name: "Jenna Kowalski", email: "jenna.k@example.com", phone: "(555) 100-2002", experience: "2 years apprentice", certifications: JSON.stringify(["Journeyman License"]), aiScore: 65, aiSummary: "Promising candidate, less experience but good references.", status: "new" },
    { name: "Derek Washington", email: "derek.w@example.com", phone: "(555) 100-2003", experience: "8 years commercial and residential", certifications: JSON.stringify(["Master License", "Gas Fitting", "Backflow"]), aiScore: 95, aiSummary: "Excellent candidate. Highly experienced with multiple certifications.", status: "interviewed" },
  ];

  for (let i = 0; i < payingClients.length; i++) {
    const pc = payingClients[i].client;
    const jobTpl = jobPostingTemplates[i % jobPostingTemplates.length];
    const posting = await prisma.jobPosting.create({
      data: {
        clientId: pc.id,
        title: jobTpl.title,
        description: jobTpl.description,
        requirements: jobTpl.requirements,
        compensation: jobTpl.compensation,
        location: jobTpl.location,
        type: jobTpl.type,
        status: "active",
        applicantCount: 3,
        viewCount: randomInt(40, 200),
        createdAt: daysAgo(randomInt(10, 30)),
      },
    });

    for (const appTpl of applicantTemplates) {
      await prisma.applicant.create({
        data: {
          jobId: posting.id,
          name: appTpl.name,
          email: appTpl.email,
          phone: appTpl.phone,
          experience: appTpl.experience,
          certifications: appTpl.certifications,
          aiScore: appTpl.aiScore,
          aiSummary: appTpl.aiSummary,
          status: appTpl.status,
          createdAt: daysAgo(randomInt(1, 15)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 57. MCP API KEYS + USAGE LOGS (1 key + 3 usage logs per account)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  57. Creating MCP API keys and usage logs...");

  const mcpAccounts = [
    { account: smithAccount, name: "Smith Plumbing Production Key" },
    { account: acmeAccount, name: "ACME HVAC Integration Key" },
  ];

  for (const { account: acct, name } of mcpAccounts) {
    const apiKey = await prisma.mCPApiKey.create({
      data: {
        name,
        keyHash: `sha256_${acct.id.slice(-12)}_${Date.now()}`,
        accountId: acct.id,
        scopes: JSON.stringify(["leads:read", "leads:write", "campaigns:read", "analytics:read"]),
        expiresAt: daysFromNow(90),
        lastUsedAt: daysAgo(0),
        createdAt: daysAgo(randomInt(15, 45)),
      },
    });

    const mcpTools = ["get_leads", "create_lead", "get_analytics"];
    for (const tool of mcpTools) {
      await prisma.mCPUsageLog.create({
        data: {
          apiKeyId: apiKey.id,
          tool,
          input: JSON.stringify({ clientId: tool === "get_leads" ? smithClient.id : undefined }),
          output: JSON.stringify({ success: true, recordCount: randomInt(1, 50) }),
          durationMs: randomInt(50, 800),
          createdAt: daysAgo(randomInt(0, 7)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 58. MISSED CALL TEXTBACKS (3 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  58. Creating missed call textbacks (3 per paying client)...");

  const textbackTemplates = [
    { callerPhone: "(512) 555-4001", textSent: true, textMessage: "Hi! We noticed we missed your call. How can we help? Reply or call us back at your convenience." },
    { callerPhone: "(512) 555-4002", textSent: true, textMessage: "Sorry we missed you! We're available Mon-Fri 8AM-6PM. Would you like to schedule a callback?" },
    { callerPhone: "(512) 555-4003", textSent: false, textMessage: null },
  ];

  for (const { client: pc } of payingClients) {
    for (const tpl of textbackTemplates) {
      await prisma.missedCallTextback.create({
        data: {
          clientId: pc.id,
          callerPhone: tpl.callerPhone,
          textSent: tpl.textSent,
          textMessage: tpl.textMessage,
          callSid: `CA${pc.id.slice(-6)}${randomInt(100000, 999999)}`,
          createdAt: daysAgo(randomInt(0, 14)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 59. PERFORMANCE PLANS + EVENTS (1 plan + 3 events per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  59. Creating performance plans and events...");

  for (const { client: pc } of payingClients) {
    const plan = await prisma.performancePlan.create({
      data: {
        clientId: pc.id,
        isActive: true,
        pricePerLead: 7500, // $75
        pricePerBooking: 15000, // $150
        monthlyMinimum: 50000, // $500
        monthlyCap: 500000, // $5,000
        servicesIncluded: JSON.stringify(["lead-gen", "booking", "reviews"]),
        billingCycleStart: daysAgo(15),
        currentLeadCount: randomInt(5, 20),
        currentBookingCount: randomInt(2, 10),
        currentCharges: randomInt(50000, 300000),
        createdAt: daysAgo(randomInt(30, 60)),
      },
    });

    const perfEventTypes = [
      { type: "lead", amount: 7500, description: "New lead captured via chatbot" },
      { type: "booking", amount: 15000, description: "Service appointment booked online" },
      { type: "lead", amount: 7500, description: "New lead from Google Ads campaign" },
    ];

    for (const evt of perfEventTypes) {
      await prisma.performanceEvent.create({
        data: {
          clientId: pc.id,
          planId: plan.id,
          type: evt.type,
          amount: evt.amount,
          description: evt.description,
          invoiced: Math.random() > 0.5,
          createdAt: daysAgo(randomInt(0, 14)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 60. PHOTO ESTIMATES (2 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  60. Creating photo estimates (2 per paying client)...");

  const photoEstimateTemplates = [
    { customerName: "Greg Patterson", customerEmail: "greg.p@example.com", customerPhone: "(512) 555-5001", imageUrl: "https://storage.example.com/estimates/leak-under-sink.jpg", vertical: "plumbing", issueCategory: "leak_repair", issueDescription: "Water pooling under kitchen sink, appears to be a P-trap leak", estimateLow: 15000, estimateHigh: 35000, confidence: 0.85, status: "estimated" },
    { customerName: "Maria Gonzalez", customerEmail: "maria.g@example.com", customerPhone: "(512) 555-5002", imageUrl: "https://storage.example.com/estimates/water-heater-rust.jpg", vertical: "plumbing", issueCategory: "replacement", issueDescription: "Rust and corrosion visible on water heater tank, potential replacement needed", estimateLow: 80000, estimateHigh: 250000, confidence: 0.72, status: "pending" },
  ];

  for (const { client: pc } of payingClients) {
    for (const tpl of photoEstimateTemplates) {
      await prisma.photoEstimate.create({
        data: {
          clientId: pc.id,
          customerName: tpl.customerName,
          customerEmail: tpl.customerEmail,
          customerPhone: tpl.customerPhone,
          imageUrl: tpl.imageUrl,
          vertical: tpl.vertical,
          issueCategory: tpl.issueCategory,
          issueDescription: tpl.issueDescription,
          estimateLow: tpl.estimateLow,
          estimateHigh: tpl.estimateHigh,
          confidence: tpl.confidence,
          status: tpl.status,
          createdAt: daysAgo(randomInt(1, 20)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 61. PUSH SUBSCRIPTIONS (1 per paying client account)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  61. Creating push subscriptions...");

  for (const { account: acct } of payingClients) {
    await prisma.pushSubscription.create({
      data: {
        accountId: acct.id,
        endpoint: `https://fcm.googleapis.com/fcm/send/${acct.id.slice(-12)}`,
        p256dh: `BP${acct.id}${"A".repeat(60)}`,
        auth: `auth_${acct.id.slice(-8)}`,
        createdAt: daysAgo(randomInt(10, 30)),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 62. QBR REPORTS (1 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  62. Creating QBR reports (1 per paying client)...");

  for (const { client: pc } of payingClients) {
    await prisma.qBRReport.create({
      data: {
        clientId: pc.id,
        quarter: "2026-Q1",
        summary: "Strong quarter with 23% lead growth and improved conversion rates. Ad spend ROI exceeded targets.",
        metrics: JSON.stringify({ leads: 87, conversions: 34, revenue: 4250000, adSpend: 120000, roi: 3.5 }),
        highlights: JSON.stringify(["23% increase in qualified leads", "4.8 average review rating maintained", "New chatbot captured 15 leads"]),
        recommendations: JSON.stringify(["Increase Google Ads budget by 15%", "Launch seasonal email campaign", "Add video testimonials to website"]),
        sentAt: daysAgo(5),
        createdAt: daysAgo(10),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 63. RECEPTIONIST CONFIGS (1 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  63. Creating AI receptionist configs...");

  const receptionistTemplates = [
    { businessName: "Smith Plumbing & Heating", greeting: "Thank you for calling Smith Plumbing. How can I help you today?", businessHours: "Mon-Fri 8AM-6PM, Sat 9AM-1PM", afterHoursMsg: "We're currently closed. I can take a message or schedule a callback for the next business day." },
    { businessName: "ACME HVAC Solutions", greeting: "Welcome to ACME HVAC. How may I assist you?", businessHours: "Mon-Fri 7AM-7PM", afterHoursMsg: "Our office is closed. For emergencies, press 1." },
    { businessName: "Summit Roofing & Restoration", greeting: "Thanks for calling Summit Roofing. How can we help?", businessHours: "Mon-Fri 8AM-5PM", afterHoursMsg: "We're closed for the day. Leave a message and we'll call back first thing tomorrow." },
  ];

  for (let i = 0; i < payingClients.length; i++) {
    const pc = payingClients[i].client;
    const tpl = receptionistTemplates[i];
    await prisma.receptionistConfig.create({
      data: {
        clientId: pc.id,
        isActive: true,
        greeting: tpl.greeting,
        businessName: tpl.businessName,
        businessHours: tpl.businessHours,
        afterHoursMsg: tpl.afterHoursMsg,
        emergencyKeywords: JSON.stringify(["flood", "gas leak", "burst pipe", "no heat", "emergency"]),
        emergencyAction: "transfer",
        emergencyPhone: "(512) 555-9911",
        voiceId: "alloy",
        maxCallMinutes: 10,
        collectInfo: JSON.stringify(["name", "phone", "address", "issue_description"]),
        canBookJobs: true,
        systemPrompt: `You are the AI receptionist for ${tpl.businessName}. Be professional, helpful, and try to either book an appointment or capture lead information.`,
        createdAt: daysAgo(randomInt(20, 45)),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 64. SEASONAL CAMPAIGNS (2 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  64. Creating seasonal campaigns (2 per paying client)...");

  const seasonalTemplates = [
    { name: "Spring Maintenance Blitz", season: "spring", triggerMonth: 3, subject: "Spring Is Here — Time for Your Annual Checkup!", body: "Don't wait until something breaks! Schedule your spring maintenance visit and get 15% off.", discount: "15% off", isActive: true, totalSent: 340, totalBooked: 28, totalRevenue: 840000 },
    { name: "Winter Prep Campaign", season: "fall", triggerMonth: 10, subject: "Get Your Home Ready for Winter", body: "Avoid costly winter emergencies. Book your pre-winter inspection today.", discount: "10% off", isActive: false, totalSent: 280, totalBooked: 19, totalRevenue: 570000 },
  ];

  for (const { client: pc, vertical: vert } of payingClients) {
    for (const tpl of seasonalTemplates) {
      await prisma.seasonalCampaign.create({
        data: {
          clientId: pc.id,
          name: tpl.name,
          vertical: vert,
          season: tpl.season,
          triggerMonth: tpl.triggerMonth,
          subject: tpl.subject,
          body: tpl.body,
          discount: tpl.discount,
          isActive: tpl.isActive,
          lastRunAt: tpl.isActive ? daysAgo(randomInt(1, 10)) : daysAgo(randomInt(90, 180)),
          totalSent: tpl.totalSent,
          totalBooked: tpl.totalBooked,
          totalRevenue: tpl.totalRevenue,
          createdAt: daysAgo(randomInt(30, 90)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 65. SERVICE AREAS (4 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  65. Creating service areas (4 per paying client)...");

  const serviceAreaSets: Record<string, { zip: string; city: string; state: string }[]> = {
    plumbing: [
      { zip: "78701", city: "Austin", state: "TX" },
      { zip: "78660", city: "Pflugerville", state: "TX" },
      { zip: "78681", city: "Round Rock", state: "TX" },
      { zip: "78613", city: "Cedar Park", state: "TX" },
    ],
    hvac: [
      { zip: "80202", city: "Denver", state: "CO" },
      { zip: "80014", city: "Aurora", state: "CO" },
      { zip: "80120", city: "Littleton", state: "CO" },
      { zip: "80031", city: "Westminster", state: "CO" },
    ],
    roofing: [
      { zip: "30301", city: "Atlanta", state: "GA" },
      { zip: "30030", city: "Decatur", state: "GA" },
      { zip: "30060", city: "Marietta", state: "GA" },
      { zip: "30071", city: "Norcross", state: "GA" },
    ],
  };

  for (const { client: pc, vertical: vert } of payingClients) {
    const areas = serviceAreaSets[vert] ?? serviceAreaSets["plumbing"];
    for (const area of areas) {
      await prisma.serviceArea.create({
        data: {
          clientId: pc.id,
          zip: area.zip,
          city: area.city,
          state: area.state,
          isActive: true,
          createdAt: daysAgo(randomInt(30, 60)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 66. SERVICE REMINDERS (3 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  66. Creating service reminders (3 per paying client)...");

  const reminderTemplates = [
    { customerName: "Harold Winston", customerEmail: "harold.w@example.com", customerPhone: "(512) 555-6001", serviceType: "Annual Maintenance", frequency: "annual", status: "sent", revenue: 25000 },
    { customerName: "Joe Ramirez", customerEmail: "joe.r@example.com", customerPhone: "(512) 555-6002", serviceType: "Filter Replacement", frequency: "quarterly", status: "booked", revenue: 15000 },
    { customerName: "Diane Keller", customerEmail: "diane.k@example.com", customerPhone: "(512) 555-6003", serviceType: "Safety Inspection", frequency: "biannual", status: "pending", revenue: null },
  ];

  for (const { client: pc } of payingClients) {
    for (const tpl of reminderTemplates) {
      await prisma.serviceReminder.create({
        data: {
          clientId: pc.id,
          customerName: tpl.customerName,
          customerEmail: tpl.customerEmail,
          customerPhone: tpl.customerPhone,
          serviceType: tpl.serviceType,
          lastServiceDate: daysAgo(randomInt(60, 180)),
          nextDueDate: daysFromNow(randomInt(5, 60)),
          frequency: tpl.frequency,
          status: tpl.status,
          sentAt: tpl.status !== "pending" ? daysAgo(randomInt(1, 10)) : null,
          bookedAt: tpl.status === "booked" ? daysAgo(randomInt(0, 3)) : null,
          revenue: tpl.revenue,
          createdAt: daysAgo(randomInt(5, 30)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 67. SNAPSHOT REPORTS (2 total — used for prospect reports)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  67. Creating snapshot reports...");

  const snapshotReports = [
    {
      createdBy: adminAccount.id,
      businessName: "Downtown Plumbing Co",
      website: "https://downtownplumbing.com",
      phone: "(512) 555-7001",
      email: "info@downtownplumbing.com",
      vertical: "plumbing",
      city: "Austin",
      state: "TX",
      seoScore: 42,
      reviewScore: 65,
      socialScore: 28,
      websiteScore: 55,
      overallScore: 48,
      findings: JSON.stringify(["No Google Business Profile claimed", "Only 12 Google reviews (avg 3.8)", "No blog or content marketing", "Website not mobile-optimized"]),
      recommendations: JSON.stringify(["Claim and optimize Google Business Profile", "Launch review generation campaign", "Start weekly blog content", "Redesign website for mobile"]),
      estimatedRevenue: 3500000,
      viewCount: 3,
    },
    {
      createdBy: adminAccount.id,
      businessName: "Reliable HVAC Services",
      website: "https://reliablehvac.net",
      phone: "(720) 555-7002",
      email: "contact@reliablehvac.net",
      vertical: "hvac",
      city: "Denver",
      state: "CO",
      seoScore: 58,
      reviewScore: 72,
      socialScore: 35,
      websiteScore: 61,
      overallScore: 57,
      findings: JSON.stringify(["Decent Google presence but not optimized", "38 reviews with 4.2 average", "Inactive social media accounts", "Slow page load times"]),
      recommendations: JSON.stringify(["Optimize GBP listing with posts", "Respond to all reviews within 24 hours", "Post weekly on Facebook and Instagram", "Optimize images and enable caching"]),
      estimatedRevenue: 2800000,
      viewCount: 1,
    },
  ];

  for (const report of snapshotReports) {
    await prisma.snapshotReport.create({ data: { ...report, createdAt: daysAgo(randomInt(5, 30)) } });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 68. WEBHOOK ENDPOINTS + LOGS (1 endpoint + 2 logs per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  68. Creating webhook endpoints and logs...");

  for (const { client: pc } of payingClients) {
    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        clientId: pc.id,
        url: `https://hooks.example.com/${pc.id.slice(-8)}/events`,
        secret: `whsec_${pc.id.slice(-12)}${randomInt(100000, 999999)}`,
        events: JSON.stringify(["lead.created", "booking.created", "review.received", "call.completed"]),
        isActive: true,
        createdAt: daysAgo(randomInt(15, 45)),
      },
    });

    await prisma.webhookLog.create({
      data: {
        endpointId: endpoint.id,
        event: "lead.created",
        payload: JSON.stringify({ leadId: "lead_123", name: "Test Lead", source: "chatbot" }),
        statusCode: 200,
        response: JSON.stringify({ received: true }),
        success: true,
        createdAt: daysAgo(randomInt(0, 5)),
      },
    });

    await prisma.webhookLog.create({
      data: {
        endpointId: endpoint.id,
        event: "booking.created",
        payload: JSON.stringify({ bookingId: "bk_456", customerName: "Jane Doe", serviceType: "inspection" }),
        statusCode: 500,
        response: "Internal Server Error",
        success: false,
        createdAt: daysAgo(randomInt(0, 3)),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 69. AEO CONTENT (3 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  69. Creating AEO content (3 per paying client)...");

  const aeoContentTemplates = [
    { type: "faq", title: "How much does a plumber charge per hour?", content: "The average plumber charges $75-$150 per hour depending on the type of work, with emergency rates typically 1.5x the standard rate.", targetQuery: "how much does a plumber charge per hour", status: "published" },
    { type: "how_to", title: "How to Unclog a Drain Without Chemicals", content: "Step 1: Try a plunger first. Step 2: Use a drain snake. Step 3: Try baking soda and vinegar. Step 4: Call a professional if needed.", targetQuery: "how to unclog a drain naturally", status: "published" },
    { type: "blog", title: "Signs Your Water Heater Needs Replacement", content: "Key signs include: age over 10 years, rusty water, rumbling noises, leaks around the base, and inconsistent water temperature.", targetQuery: "signs water heater needs replacing", status: "draft" },
  ];

  for (const { client: pc } of payingClients) {
    for (const tpl of aeoContentTemplates) {
      await prisma.aEOContent.create({
        data: {
          clientId: pc.id,
          type: tpl.type,
          title: tpl.title,
          content: tpl.content,
          targetQuery: tpl.targetQuery,
          status: tpl.status,
          createdAt: daysAgo(randomInt(5, 30)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 70. AEO QUERIES (4 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  70. Creating AEO queries (4 per paying client)...");

  const aeoQueryTemplates = [
    { query: "best plumber near me", platform: "chatgpt", isCited: true, position: 2 },
    { query: "emergency plumbing service Austin TX", platform: "perplexity", isCited: true, position: 1 },
    { query: "how much does drain cleaning cost", platform: "google_ai", isCited: false, position: null },
    { query: "water heater installation reviews", platform: "gemini", isCited: false, position: null },
  ];

  for (const { client: pc } of payingClients) {
    for (const tpl of aeoQueryTemplates) {
      await prisma.aEOQuery.create({
        data: {
          clientId: pc.id,
          query: tpl.query,
          platform: tpl.platform,
          isCited: tpl.isCited,
          position: tpl.position,
          checkedAt: daysAgo(randomInt(0, 7)),
          createdAt: daysAgo(randomInt(0, 14)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 71. AEO STRATEGIES (2 per paying client)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  71. Creating AEO strategies (2 per paying client)...");

  const aeoStrategyTemplates = [
    { title: "FAQ Schema Markup Implementation", description: "Add structured FAQ schema to top 10 service pages to improve AI search citations.", priority: "high", status: "in_progress", impact: "Expected 30% increase in AI search citations", contentType: "schema_markup" },
    { title: "GBP Post Optimization for AI", description: "Create weekly Google Business Profile posts optimized for answer engine visibility.", priority: "medium", status: "pending", impact: "Improved local AI search presence", contentType: "gbp_post" },
  ];

  for (const { client: pc } of payingClients) {
    for (const tpl of aeoStrategyTemplates) {
      await prisma.aEOStrategy.create({
        data: {
          clientId: pc.id,
          title: tpl.title,
          description: tpl.description,
          priority: tpl.priority,
          status: tpl.status,
          impact: tpl.impact,
          contentType: tpl.contentType,
          completedAt: tpl.status === "completed" ? daysAgo(randomInt(1, 10)) : null,
          createdAt: daysAgo(randomInt(5, 30)),
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 72. FRANCHISE LOCATIONS (2 for Smith Plumbing only — simulates a franchise)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("  72. Creating franchise locations...");

  const franchiseLocations = [
    { name: "Smith Plumbing — North Austin", address: "4521 N Lamar Blvd", city: "Austin", state: "TX", zip: "78751", phone: "(512) 555-8001", manager: "Mike Thompson", isActive: true, leadsThisMonth: 18, revenueThisMonth: 425000, bookingsThisMonth: 12, avgRating: 4.8 },
    { name: "Smith Plumbing — Round Rock", address: "1200 E Main St", city: "Round Rock", state: "TX", zip: "78664", phone: "(512) 555-8002", manager: "Sarah Miller", isActive: true, leadsThisMonth: 14, revenueThisMonth: 310000, bookingsThisMonth: 9, avgRating: 4.6 },
    { name: "Smith Plumbing — Cedar Park", address: "801 E Whitestone Blvd", city: "Cedar Park", state: "TX", zip: "78613", phone: "(512) 555-8003", manager: null, isActive: false, leadsThisMonth: 0, revenueThisMonth: 0, bookingsThisMonth: 0, avgRating: 0 },
  ];

  for (const loc of franchiseLocations) {
    await prisma.franchiseLocation.create({
      data: {
        clientId: smithClient.id,
        name: loc.name,
        address: loc.address,
        city: loc.city,
        state: loc.state,
        zip: loc.zip,
        phone: loc.phone,
        manager: loc.manager,
        isActive: loc.isActive,
        leadsThisMonth: loc.leadsThisMonth,
        revenueThisMonth: loc.revenueThisMonth,
        bookingsThisMonth: loc.bookingsThisMonth,
        avgRating: loc.avgRating,
        createdAt: daysAgo(randomInt(30, 90)),
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DONE
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n  Seed completed successfully!");
  console.log("  ─────────────────────────────────────────────");
  console.log("  Accounts:              6 (admin + agency + 4 clients)");
  console.log("  Sessions:              6 (dev tokens)");
  console.log("  Agencies:              1 (Peak Performance Marketing)");
  console.log("  Clients:               4");
  console.log("  Subscriptions:         4");
  console.log("  Client Services:       " + (growthServices.length * 2 + starterServices.length));
  console.log("  Chatbot Configs:       3");
  console.log("  Chatbot Conversations: " + (8 * 3));
  console.log("  Leads:                 " + (leadData.length + 30 * 3) + " (" + leadData.length + " original + " + (30 * 3) + " bulk)");
  console.log("  Activity Events:       " + activities.length);
  console.log("  Bookings:              " + bookings.length);
  console.log("  Blog Posts:            " + blogPosts.length);
  console.log("  Notifications:         " + (notifications.length + 5 * 3));
  console.log("  Support Tickets:       3 (with messages)");
  console.log("  Onboarding Steps:      " + steps.length);
  console.log("  Referral Codes:        1");
  console.log("  NPS Responses:         1");
  console.log("  Review Campaigns:      2");
  console.log("  Review Responses:      " + (15 * 3));
  console.log("  Content Jobs:          3");
  console.log("  Email Campaigns:       2");
  console.log("  Email Events:          ~" + (smithCampaigns.length * 20) + "+ (delivered/open/click)");
  console.log("  Ad Campaigns:          2");
  console.log("  Social Posts:          4");
  console.log("  SEO Keywords:          " + seoKeywords.length);
  console.log("  Phone Calls:           " + phoneCalls.length);
  console.log("  Knowledge Articles:    " + KB_ARTICLES.length);
  console.log("  Templates:             " + templates.length);
  console.log("  Invoices:              3");
  console.log("  Quotes:                2");
  console.log("  Revenue Events:        " + revenueEvents.length);
  console.log("  Community Posts:        3 (with comments)");
  console.log("  Locations:             2");
  console.log("  Digital Products:      " + digitalProducts.length);
  console.log("  Orchestration Events:  " + (15 * 3));
  console.log("  Event Subscriptions:   6");
  console.log("  Agent Executions:      " + (5 * 3) + " (with steps)");
  console.log("  Governance Rules:      " + (3 * 3));
  console.log("  Budget Trackers:       " + (2 * 3));
  console.log("  Industry Benchmarks:   " + (5 * 3));
  console.log("  Client Bench. Scores:  " + (5 * 3));
  console.log("  Predictive Insights:   " + (4 * 3));
  console.log("  Anomaly Logs:          " + (3 * 3));
  console.log("  Audit Logs:            5");
  console.log("  Conversation Threads:  " + (5 * 3) + " (with messages)");
  console.log("  Alert Rules:           " + alertRules.length);
  console.log("  Approval Requests:     " + (2 * 3));
  console.log("  Call Logs:             " + (3 * 3));
  console.log("  Customer LTV Records:  " + (4 * 3));
  console.log("  Customer Referrals:    " + (2 * 3));
  console.log("  Email Queue Entries:   " + emailQueueEntries.length);
  console.log("  Financing Apps:        " + (2 * 3));
  console.log("  FSM Connections:       " + payingClients.length + " (with sync logs)");
  console.log("  Job Postings:          " + payingClients.length + " (with " + (3 * 3) + " applicants)");
  console.log("  MCP API Keys:          " + mcpAccounts.length + " (with usage logs)");
  console.log("  Missed Call Textbacks: " + (3 * 3));
  console.log("  Performance Plans:     " + payingClients.length + " (with events)");
  console.log("  Photo Estimates:       " + (2 * 3));
  console.log("  Push Subscriptions:    " + payingClients.length);
  console.log("  QBR Reports:           " + payingClients.length);
  console.log("  Receptionist Configs:  " + payingClients.length);
  console.log("  Seasonal Campaigns:    " + (2 * 3));
  console.log("  Service Areas:         " + (4 * 3));
  console.log("  Service Reminders:     " + (3 * 3));
  console.log("  Snapshot Reports:      " + snapshotReports.length);
  console.log("  Webhook Endpoints:     " + payingClients.length + " (with logs)");
  console.log("  AEO Content:           " + (3 * 3));
  console.log("  AEO Queries:           " + (4 * 3));
  console.log("  AEO Strategies:        " + (2 * 3));
  console.log("  Franchise Locations:   " + franchiseLocations.length);
  console.log("  ─────────────────────────────────────────────\n");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("  Seed failed:", e);
  process.exit(1);
});
