// NOTE: lucide-react icon imports have been moved to @/lib/service-icons.ts
// to prevent icon components from being bundled into server-side API routes
// that import this module only for data lookups (getServiceById, getBundleById).
// Client components that need service icons should use getServiceIcon() from
// @/lib/service-icons.ts.
import type { Service, Bundle, Vertical, Testimonial } from "@/types/services";

export const SERVICES: Service[] = [
  {
    id: "lead-gen",
    name: "AI Lead Generation",
    tagline: "Never run out of leads again",
    description:
      "AI-powered outbound prospecting that finds, qualifies, and nurtures leads for your business 24/7. Cold email, SMS, and multi-channel sequences that book appointments while you sleep.",
    price: 2500,
    priceSuffix: "/mo",

    color: "bg-blue-500/10",
    category: "generation",
    popular: true,
    features: [
      "Multi-channel outbound sequences",
      "AI-personalized messaging",
      "Lead scoring & qualification",
      "Automated follow-up cadences",
      "CRM integration",
      "Monthly lead reports",
    ],
  },
  {
    id: "voice-agent",
    name: "AI Voice Agents",
    tagline: "Never miss a call again",
    description:
      "Intelligent AI phone agents that answer calls, qualify leads, book appointments, and handle customer inquiries with human-like conversation.",
    price: 1800,
    priceSuffix: "/mo",

    color: "bg-purple-500/10",
    category: "engagement",
    popular: true,
    features: [
      "24/7 call answering",
      "Lead qualification scripts",
      "Appointment booking",
      "Call recording & transcription",
      "Custom voice & personality",
      "Overflow & after-hours handling",
    ],
  },
  {
    id: "chatbot",
    name: "AI Chat Assistant",
    tagline: "Convert visitors into leads",
    description:
      "Custom-trained AI chatbot that knows your services, pricing, and service area. Converts 3-5x more website visitors into booked appointments by answering questions instantly, 24/7.",
    price: 997,
    priceSuffix: "/mo",

    color: "bg-cyan-500/10",
    category: "engagement",
    features: [
      "Custom-trained on your business",
      "Lead capture & qualification",
      "Appointment scheduling",
      "FAQ handling",
      "Multi-language support",
      "Website widget integration",
    ],
  },
  {
    id: "seo",
    name: "AI SEO Domination",
    tagline: "Rank #1 in your market",
    description:
      "AI-powered SEO that targets high-intent local keywords, optimizes your Google Business Profile, and builds authority through strategic content.",
    price: 2000,
    priceSuffix: "/mo",

    color: "bg-green-500/10",
    category: "generation",
    popular: true,
    features: [
      "Local keyword research & targeting",
      "Google Business Profile optimization",
      "On-page SEO improvements",
      "Technical SEO audit & fixes",
      "Monthly content strategy",
      "Rank tracking dashboard",
    ],
  },
  {
    id: "ads",
    name: "AI Ad Management",
    tagline: "Maximize every ad dollar",
    description:
      "AI-optimized Google and Facebook ad campaigns that continuously learn and improve to lower your cost per lead.",
    price: 1500,
    priceSuffix: "/mo + ad spend",

    color: "bg-orange-500/10",
    category: "generation",
    features: [
      "Google Ads management",
      "Facebook/Instagram ads",
      "AI bid optimization",
      "A/B testing automation",
      "Landing page creation",
      "Weekly performance reports",
    ],
  },
  {
    id: "email",
    name: "AI Email Marketing",
    tagline: "Nurture leads on autopilot",
    description:
      "Automated email sequences that nurture leads, re-engage past customers, and drive repeat business with AI-written content.",
    price: 1200,
    priceSuffix: "/mo",

    color: "bg-indigo-500/10",
    category: "engagement",
    features: [
      "Automated drip campaigns",
      "AI-written email content",
      "Segmentation & personalization",
      "Re-engagement sequences",
      "Newsletter management",
      "Open & click tracking",
    ],
  },
  {
    id: "social",
    name: "AI Social Media",
    tagline: "Stay active without the effort",
    description:
      "AI creates and posts engaging before/after project photos, tips, and promotions across Facebook, Instagram, and Google. Builds local authority without you lifting a finger.",
    price: 1500,
    priceSuffix: "/mo",

    color: "bg-pink-500/10",
    category: "engagement",
    features: [
      "AI content generation",
      "Multi-platform scheduling",
      "Community management",
      "Hashtag & trend analysis",
      "Before/after project posts",
      "Monthly content calendar",
    ],
  },
  {
    id: "reviews",
    name: "AI Review Management",
    tagline: "Build a 5-star reputation",
    description:
      "Automated review request campaigns that boost your Google rating and respond intelligently to all reviews.",
    price: 797,
    priceSuffix: "/mo",

    color: "bg-amber-500/10",
    category: "management",
    features: [
      "Automated review requests",
      "AI review responses",
      "Negative review alerts",
      "Review monitoring dashboard",
      "Multi-platform tracking",
      "Review generation campaigns",
    ],
  },
  {
    id: "booking",
    name: "AI Scheduling System",
    tagline: "Fill your calendar automatically",
    description:
      "Smart scheduling that lets leads book appointments directly from your website, Google listing, or AI chatbot. Automated reminders cut no-shows by 40%.",
    price: 497,
    priceSuffix: "/mo",

    color: "bg-teal-500/10",
    category: "management",
    features: [
      "Online booking widget",
      "Automated reminders",
      "Calendar sync",
      "No-show reduction",
      "Service type scheduling",
      "Team calendar management",
    ],
  },
  {
    id: "crm",
    name: "AI CRM Automation",
    tagline: "Never lose track of a lead",
    description:
      "AI-powered CRM that automatically tracks, scores, and manages your entire customer pipeline from lead to close.",
    price: 1200,
    priceSuffix: "/mo",

    color: "bg-violet-500/10",
    category: "management",
    features: [
      "Automated lead tracking",
      "AI lead scoring",
      "Pipeline management",
      "Task automation",
      "Customer communication history",
      "Revenue forecasting",
    ],
  },
  {
    id: "website",
    name: "AI Website Builder",
    tagline: "High-converting websites, fast",
    description:
      "High-converting website built with AI, designed for speed, SEO, and lead capture. Includes A/B testing and heatmaps.",
    price: 500,
    priceSuffix: "/mo",
    setupFee: 3500,

    color: "bg-emerald-500/10",
    category: "intelligence",
    features: [
      "Custom AI-designed website",
      "Mobile-first responsive design",
      "SEO-optimized structure",
      "Lead capture forms",
      "A/B testing",
      "Heatmap analytics",
    ],
  },
  {
    id: "analytics",
    name: "AI Analytics",
    tagline: "Data-driven decisions",
    description:
      "See exactly which marketing channels drive revenue, not just clicks. AI identifies your top-performing campaigns and recommends where to double down for maximum ROI.",
    price: 997,
    priceSuffix: "/mo",

    color: "bg-sky-500/10",
    category: "intelligence",
    features: [
      "Multi-channel attribution",
      "AI-powered insights",
      "Custom report builder",
      "Real-time dashboards",
      "Competitor benchmarking",
      "ROI tracking",
    ],
  },
  {
    id: "content",
    name: "AI Content Engine",
    tagline: "Content that ranks and converts",
    description:
      "AI-generated blog posts, service pages, and marketing content optimized for SEO and conversion. 8 published articles per month.",
    price: 1800,
    priceSuffix: "/mo",

    color: "bg-rose-500/10",
    category: "intelligence",
    features: [
      "8 SEO blog posts/month",
      "Service page creation",
      "AI content optimization",
      "Keyword-targeted writing",
      "Image generation",
      "Content calendar",
    ],
  },
  {
    id: "reputation",
    name: "AI Reputation Shield",
    tagline: "Protect your brand 24/7",
    description:
      "24/7 brand monitoring and reputation management. Detects negative mentions and responds before they escalate.",
    price: 1200,
    priceSuffix: "/mo",

    color: "bg-red-500/10",
    category: "management",
    features: [
      "24/7 brand monitoring",
      "Negative mention alerts",
      "AI crisis response",
      "Sentiment analysis",
      "Competitor monitoring",
      "Monthly reputation reports",
    ],
  },
  {
    id: "retargeting",
    name: "AI Retargeting",
    tagline: "Bring back lost visitors",
    description:
      "71% of website visitors leave without contacting you. AI retargeting brings them back with personalized ads across Google, Facebook, and Instagram until they book.",
    price: 1000,
    priceSuffix: "/mo + ad spend",

    color: "bg-lime-500/10",
    category: "generation",
    features: [
      "Website visitor retargeting",
      "Dynamic ad creation",
      "Cross-platform campaigns",
      "Audience segmentation",
      "Conversion optimization",
      "Performance reporting",
    ],
  },
  {
    id: "custom",
    name: "Custom AI Build",
    tagline: "If it can be automated, we build it",
    description:
      "Custom AI automation solutions tailored to your specific business needs. From workflow automation to custom integrations.",
    price: 5000,
    priceSuffix: "/mo",

    color: "bg-muted",
    category: "intelligence",
    features: [
      "Custom workflow automation",
      "API integrations",
      "Data pipeline automation",
      "Custom AI model training",
      "Dedicated support",
      "Quarterly strategy reviews",
    ],
  },
];

export const BUNDLES: Bundle[] = [
  {
    id: "diy",
    name: "DIY",
    price: 497,
    annualPrice: 414,
    services: ["chatbot", "reviews", "booking"],
    description:
      "3 core AI tools you control. Perfect for owner-operators who want to start capturing more leads and reviews without a big commitment.",
    savings: "Save ~$800/mo vs individual",
  },
  {
    id: "starter",
    name: "Starter",
    price: 3497,
    annualPrice: 2914,
    services: ["lead-gen", "reviews", "booking"],
    description: "AI lead generation + review automation + scheduling. Ideal for businesses doing $250K-$750K that need a steady pipeline of qualified leads.",
    savings: "Save ~$1,300/mo",
  },
  {
    id: "growth",
    name: "Growth",
    price: 6997,
    annualPrice: 5831,
    services: ["lead-gen", "voice-agent", "seo", "email", "reviews", "crm"],
    description:
      "6 AI systems that turn your business into a lead-generating machine. Chosen by 94% of clients doing $750K-$3M who want to dominate their local market.",
    popular: true,
    savings: "Save ~$2,500/mo",
  },
  {
    id: "empire",
    name: "Empire",
    price: 12997,
    annualPrice: 10831,
    services: SERVICES.map((s) => s.id),
    description:
      "All 16 AI systems + dedicated account manager. Built for multi-truck operations doing $3M+ that want to own every lead in their service area.",
    savings: "Save ~$5,500/mo",
  },
];

export const VERTICALS: Vertical[] = [
  { id: "hvac", label: "HVAC" },
  { id: "plumbing", label: "Plumbing" },
  { id: "roofing", label: "Roofing" },
  { id: "electrical", label: "Electrical" },
  { id: "landscaping", label: "Landscaping" },
  { id: "general-contractor", label: "General Contractor" },
  { id: "other", label: "Other Home Service" },
];

// Testimonials are populated from real client feedback.
// Do not add fabricated testimonials — only verified, permission-granted quotes.
export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Mike Richardson",
    business: "Richardson HVAC",
    location: "Dallas, TX",
    quote:
      "We went from 12 leads a month to over 60 in the first 90 days. The AI voice agent alone paid for the entire subscription by catching calls we used to miss.",
    rating: 5,
    vertical: "hvac",
    result: "5x more leads in 90 days",
  },
  {
    name: "Sarah Chen",
    business: "PipePro Plumbing",
    location: "Phoenix, AZ",
    quote:
      "I was skeptical about AI handling our reputation, but our Google rating went from 3.8 to 4.7 stars in two months. The review management system is incredible.",
    rating: 5,
    vertical: "plumbing",
    result: "3.8 to 4.7 star rating",
  },
  {
    name: "James Okafor",
    business: "TopShield Roofing",
    location: "Atlanta, GA",
    quote:
      "The Growth plan is the best marketing investment we have ever made. Period. Our cost per lead dropped from $180 to under $25, and the quality is better.",
    rating: 5,
    vertical: "roofing",
    result: "$180 to $25 cost per lead",
  },
];

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Pick Your Services",
    time: "5 min",
    description:
      "Tell us your goals in a 15-minute call. We'll recommend the perfect AI stack for your business and budget.",
  },
  {
    step: "02",
    title: "48-Hour Deployment",
    time: "48 hrs",
    description:
      "Our team configures, tests, and launches your AI systems. You'll receive a live dashboard within 48 hours.",
  },
  {
    step: "03",
    title: "AI Works 24/7",
    time: "Ongoing",
    description:
      "Your AI systems generate leads, answer calls, send emails, manage reviews, and optimize campaigns around the clock.",
  },
  {
    step: "04",
    title: "Scale What Works",
    time: "Monthly",
    description:
      "Track every metric in your dashboard. Double down on what's working. Add services as you grow. Cancel anytime.",
  },
];

export const SERVICE_CATEGORIES = [
  { id: "all", label: "All Services" },
  { id: "generation", label: "Lead Generation" },
  { id: "engagement", label: "Engagement" },
  { id: "management", label: "Management" },
  { id: "intelligence", label: "Intelligence" },
] as const;

export function getServiceById(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}

export function getBundleById(id: string): Bundle | undefined {
  return BUNDLES.find((b) => b.id === id);
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
