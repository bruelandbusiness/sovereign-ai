import {
  Zap,
  Phone,
  MessageSquare,
  Search,
  Megaphone,
  Mail,
  Share2,
  Star,
  Calendar,
  Users,
  Globe,
  BarChart3,
  FileText,
  Shield,
  Target,
  Wrench,
} from "lucide-react";
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
    icon: Zap,
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
    icon: Phone,
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
      "Custom-trained AI chatbot for your website, trained on your specific business knowledge to answer questions and capture leads.",
    price: 997,
    priceSuffix: "/mo",
    icon: MessageSquare,
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
    icon: Search,
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
    icon: Megaphone,
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
    icon: Mail,
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
      "AI-generated social media content, scheduling, and community management across all major platforms.",
    price: 1500,
    priceSuffix: "/mo",
    icon: Share2,
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
    icon: Star,
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
      "Smart scheduling system that lets leads book appointments directly, sends reminders, and reduces no-shows.",
    price: 497,
    priceSuffix: "/mo",
    icon: Calendar,
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
    icon: Users,
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
    icon: Globe,
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
      "AI-powered analytics dashboard that tracks every marketing channel, identifies trends, and recommends optimizations.",
    price: 997,
    priceSuffix: "/mo",
    icon: BarChart3,
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
    icon: FileText,
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
    icon: Shield,
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
      "AI-powered retargeting campaigns that bring back website visitors and past leads with personalized ads.",
    price: 1000,
    priceSuffix: "/mo + ad spend",
    icon: Target,
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
    icon: Wrench,
    color: "bg-gray-500/10",
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
    id: "starter",
    name: "Starter",
    price: 3497,
    services: ["lead-gen", "reviews", "booking"],
    description: "Essential AI marketing for businesses just getting started.",
    savings: "Save ~$1,300/mo",
  },
  {
    id: "growth",
    name: "Growth",
    price: 6997,
    services: ["lead-gen", "voice-agent", "seo", "email", "reviews", "crm"],
    description:
      "The most popular bundle for businesses ready to scale aggressively.",
    popular: true,
    savings: "Save ~$2,500/mo",
  },
  {
    id: "empire",
    name: "Empire",
    price: 12997,
    services: SERVICES.map((s) => s.id),
    description:
      "Every AI service we offer. Complete marketing domination for your market.",
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

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Mike Rodriguez",
    business: "Rodriguez HVAC",
    location: "Phoenix, AZ",
    quote:
      "We went from 15 leads a month to over 80. The AI voice agent alone paid for the entire Growth bundle in the first week.",
    rating: 5,
    vertical: "HVAC",
  },
  {
    name: "Sarah Chen",
    business: "Apex Roofing Solutions",
    location: "Dallas, TX",
    quote:
      "Our Google reviews went from 23 to 147 in 4 months. We're now the #1 rated roofer in our area and the leads just keep coming.",
    rating: 5,
    vertical: "Roofing",
  },
  {
    name: "James Thompson",
    business: "Thompson Plumbing",
    location: "Atlanta, GA",
    quote:
      "I was spending $8k/month on marketing with mediocre results. Sovereign AI cut my cost per lead by 60% while tripling my volume.",
    rating: 5,
    vertical: "Plumbing",
  },
];

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Pick Your Services",
    description:
      "Choose individual AI services or a bundle that fits your goals and budget.",
  },
  {
    step: "02",
    title: "48-Hour Deployment",
    description:
      "Our team configures and deploys your AI systems within 48 hours of onboarding.",
  },
  {
    step: "03",
    title: "AI Works 24/7",
    description:
      "Your AI marketing systems run around the clock, generating leads and growing your business.",
  },
  {
    step: "04",
    title: "Scale What Works",
    description:
      "Track results in your dashboard and add more services as you grow.",
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
