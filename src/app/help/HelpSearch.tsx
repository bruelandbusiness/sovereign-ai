"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

interface SearchableArticle {
  title: string;
  summary: string;
  category: string;
  categorySlug: string;
}

const ARTICLES: SearchableArticle[] = [
  // Getting Started
  { title: "How to complete onboarding", summary: "Walk through the 20-minute onboarding process step by step, from business details to service area configuration.", category: "Getting Started", categorySlug: "getting-started" },
  { title: "Connecting your Google Business Profile", summary: "Link your GBP to Sovereign AI so our systems can manage reviews, optimize your listing, and track local rankings.", category: "Getting Started", categorySlug: "getting-started" },
  { title: "Understanding your dashboard", summary: "A tour of the main dashboard sections including KPIs, lead pipeline, service status, and performance charts.", category: "Getting Started", categorySlug: "getting-started" },
  { title: "Setting up your first campaign", summary: "Choose your target services, set your budget, and let the AI build and launch your first marketing campaign.", category: "Getting Started", categorySlug: "getting-started" },
  { title: "Adding your service areas", summary: "Define the zip codes, cities, and radius where you want to generate leads for maximum local coverage.", category: "Getting Started", categorySlug: "getting-started" },
  { title: "Inviting team members to your account", summary: "Add technicians, office staff, or partners to your dashboard with role-based permissions.", category: "Getting Started", categorySlug: "getting-started" },
  { title: "Setting up notifications", summary: "Configure email, SMS, and push notifications so you never miss a new lead or important alert.", category: "Getting Started", categorySlug: "getting-started" },
  { title: "Mobile app quick-start guide", summary: "Install the Sovereign AI progressive web app on your phone for on-the-go lead management.", category: "Getting Started", categorySlug: "getting-started" },
  // Billing
  { title: "How billing works", summary: "Understand the billing cycle, when charges occur, and how prorated charges work when changing plans.", category: "Billing", categorySlug: "billing" },
  { title: "Updating your payment method", summary: "Add or change your credit card, debit card, or ACH payment method from your account settings.", category: "Billing", categorySlug: "billing" },
  { title: "Downloading invoices", summary: "Access and download PDF invoices for any billing period from your billing dashboard.", category: "Billing", categorySlug: "billing" },
  { title: "Changing your plan", summary: "Upgrade, downgrade, or switch between bundles. Learn how prorated credits and charges work.", category: "Billing", categorySlug: "billing" },
  { title: "Cancellation and refund policy", summary: "How to cancel your subscription and details about our 60-day money-back guarantee.", category: "Billing", categorySlug: "billing" },
  { title: "Understanding your invoice line items", summary: "A breakdown of what each charge on your invoice represents, from base services to add-ons.", category: "Billing", categorySlug: "billing" },
  // Services & Features
  { title: "How AI Review Management works", summary: "Automated review solicitation, response generation, and sentiment analysis for your Google and Yelp profiles.", category: "Services", categorySlug: "services" },
  { title: "Setting up AI Voice Agent", summary: "Configure your AI receptionist to answer calls, qualify leads, and book appointments 24/7.", category: "Services", categorySlug: "services" },
  { title: "Configuring email campaigns", summary: "Set up automated drip campaigns, seasonal promotions, and re-engagement sequences for past customers.", category: "Services", categorySlug: "services" },
  { title: "Using the CRM and lead tracking", summary: "Manage your leads pipeline, track conversions, and see which marketing channels drive the most revenue.", category: "Services", categorySlug: "services" },
  { title: "Social media automation setup", summary: "Connect your Facebook, Instagram, and other social profiles for AI-generated posts and engagement.", category: "Services", categorySlug: "services" },
  { title: "SEO and local search optimization", summary: "How our AI optimizes your website content, meta tags, and local citations to rank higher in search.", category: "Services", categorySlug: "services" },
  { title: "AI content generation", summary: "Blog posts, service pages, and landing pages created automatically by AI trained on your industry.", category: "Services", categorySlug: "services" },
  { title: "Reputation monitoring", summary: "Track your online reputation across 50+ review sites with real-time alerts and trend analysis.", category: "Services", categorySlug: "services" },
  { title: "Ad campaign management", summary: "AI-managed Google Ads and Facebook Ads with automated bidding, creative testing, and budget optimization.", category: "Services", categorySlug: "services" },
  { title: "Referral program setup", summary: "Launch a customer referral program with automated tracking, rewards, and follow-up emails.", category: "Services", categorySlug: "services" },
  { title: "Chat widget and lead capture", summary: "Install our AI chat widget on your website to capture leads and answer customer questions 24/7.", category: "Services", categorySlug: "services" },
  { title: "Autopilot mode explained", summary: "Let the AI run your entire marketing operation with minimal input. Understand what autopilot does and does not do.", category: "Services", categorySlug: "services" },
  // API & Integrations
  { title: "API authentication and keys", summary: "Generate API keys, understand authentication methods, and set proper scopes for your integration.", category: "API", categorySlug: "api" },
  { title: "Webhook setup guide", summary: "Configure webhooks to receive real-time notifications when leads arrive, reviews post, or campaigns update.", category: "API", categorySlug: "api" },
  { title: "Connecting to Zapier", summary: "Use our Zapier integration to connect Sovereign AI with 5,000+ apps without writing code.", category: "API", categorySlug: "api" },
  { title: "CRM integration guide", summary: "Sync leads bidirectionally with ServiceTitan, Housecall Pro, Jobber, or other field service management tools.", category: "API", categorySlug: "api" },
  { title: "Custom reporting via API", summary: "Pull performance data, lead details, and campaign metrics into your own reporting tools.", category: "API", categorySlug: "api" },
  // Troubleshooting
  { title: "Leads not showing in dashboard", summary: "Diagnose why new leads may not be appearing, from tracking code issues to filter settings.", category: "Troubleshooting", categorySlug: "troubleshooting" },
  { title: "Google Business Profile sync issues", summary: "Fix connection problems between your GBP and Sovereign AI, including re-authentication steps.", category: "Troubleshooting", categorySlug: "troubleshooting" },
  { title: "Email deliverability problems", summary: "Troubleshoot emails landing in spam, low open rates, and domain authentication issues.", category: "Troubleshooting", categorySlug: "troubleshooting" },
  { title: "Dashboard loading slowly", summary: "Steps to improve dashboard performance including clearing cache, checking browser compatibility, and more.", category: "Troubleshooting", categorySlug: "troubleshooting" },
  { title: "Resetting your password", summary: "How to reset your password if you have forgotten it, or change it from your account settings.", category: "Troubleshooting", categorySlug: "troubleshooting" },
  { title: "Webhook delivery failures", summary: "Debug failed webhook deliveries including checking endpoints, reviewing error logs, and retry settings.", category: "Troubleshooting", categorySlug: "troubleshooting" },
  { title: "Phone number not connecting to AI Voice", summary: "Verify your phone forwarding setup and troubleshoot common call routing issues with the AI Voice Agent.", category: "Troubleshooting", categorySlug: "troubleshooting" },
];

export function HelpSearch() {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < 2) return [];
    return ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(trimmed) ||
        a.summary.toLowerCase().includes(trimmed) ||
        a.category.toLowerCase().includes(trimmed)
    ).slice(0, 8);
  }, [query]);

  const showResults = query.trim().length >= 2;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showResults || results.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        const link = listRef.current?.querySelector<HTMLAnchorElement>(
          `[data-index="${activeIndex}"]`
        );
        link?.click();
      } else if (e.key === "Escape") {
        setQuery("");
        setActiveIndex(-1);
      }
    },
    [showResults, results.length, activeIndex]
  );

  return (
    <div className="relative">
      <label htmlFor="help-search" className="sr-only">
        Search help articles
      </label>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          id="help-search"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search for articles, guides, or topics..."
          autoComplete="off"
          aria-controls="help-search-results"
          aria-expanded={showResults}
          role="combobox"
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `help-result-${activeIndex}` : undefined
          }
          className="h-13 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {showResults && (
        <div
          id="help-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-white/[0.08] bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden"
        >
          {results.length > 0 ? (
            <ul ref={listRef}>
              {results.map((article, index) => (
                <li key={article.title} role="option" aria-selected={index === activeIndex}>
                  <Link
                    href={`/help/${article.categorySlug}`}
                    data-index={index}
                    id={`help-result-${index}`}
                    className={`flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/[0.04] ${
                      index === activeIndex ? "bg-white/[0.04]" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-foreground">{article.title}</span>
                      <p className="mt-0.5 text-xs text-muted-foreground/60 line-clamp-1">
                        {article.summary}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground/60">
                      {article.category}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No articles found for &ldquo;{query}&rdquo;. Try a different
              search or{" "}
              <Link href="/contact" className="text-primary hover:underline">
                contact support
              </Link>
              .
            </div>
          )}
        </div>
      )}
    </div>
  );
}
