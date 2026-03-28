export interface ComparisonFAQ {
  question: string;
  answer: string;
}

export interface SwitchingTestimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  tradeType: string;
  metric: string;
}

export interface Competitor {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  priceRange: string;
  sovereignPrice: string;
  features: {
    name: string;
    sovereign: boolean | string;
    competitor: boolean | string;
  }[];
  advantages: string[];
  faqs: ComparisonFAQ[];
  switchingTestimonials: SwitchingTestimonial[];
  priceSavingNote: string;
}

export const COMPETITORS: Competitor[] = [
  {
    slug: "scorpion",
    name: "Scorpion",
    tagline: "16 AI systems vs. manual marketing. No contracts vs. 12-month lock-ins. 48-hour setup vs. weeks of onboarding.",
    description:
      "Scorpion charges $2,000-$10,000/month with 12-month contracts and relies on manual processes managed by junior account reps. Sovereign AI delivers 16 autonomous AI systems that run 24/7, deploys in 48 hours, and offers a 60-day money-back guarantee with zero lock-in.",
    priceRange: "$2,000 – $10,000/mo",
    sovereignPrice: "From $3,497/mo",
    features: [
      { name: "AI-Powered Lead Generation", sovereign: true, competitor: false },
      { name: "AI Voice Agents (24/7)", sovereign: true, competitor: false },
      { name: "AI Chatbot", sovereign: true, competitor: "Basic" },
      { name: "SEO Management", sovereign: "AI-Optimized", competitor: "Manual" },
      { name: "Google Ads Management", sovereign: "AI-Optimized", competitor: true },
      { name: "Review Management", sovereign: "Automated", competitor: "Manual" },
      { name: "Email Marketing", sovereign: "AI-Written", competitor: true },
      { name: "Social Media", sovereign: "AI-Generated", competitor: "Extra Cost" },
      { name: "Content Creation", sovereign: "8 Posts/Mo AI", competitor: "2-4 Manual" },
      { name: "CRM Included", sovereign: true, competitor: "Extra Cost" },
      { name: "Booking System", sovereign: true, competitor: false },
      { name: "No Long-Term Contract", sovereign: true, competitor: false },
      { name: "48-Hour Setup", sovereign: true, competitor: false },
      { name: "Real-Time Dashboard", sovereign: true, competitor: "Monthly Reports" },
      { name: "Money-Back Guarantee", sovereign: "60 Days", competitor: false },
    ],
    advantages: [
      "16 AI systems vs. traditional manual marketing",
      "No long-term contracts — cancel anytime",
      "48-hour deployment vs. 2-4 week onboarding",
      "AI generates 3-5x more content at higher quality",
      "Real-time dashboard vs. monthly PDF reports",
      "60-day money-back guarantee included",
    ],
    faqs: [
      {
        question: "What is the best Scorpion alternative for home service businesses?",
        answer: "Sovereign AI is the top Scorpion alternative for contractors, HVAC companies, plumbers, and roofers. Unlike Scorpion's manual processes and 12-month lock-in contracts, Sovereign AI deploys 16 AI marketing systems in 48 hours with no long-term commitment and a 60-day money-back guarantee.",
      },
      {
        question: "How does Scorpion pricing compare to Sovereign AI?",
        answer: "Scorpion charges $2,000 to $10,000 per month with mandatory 12-month contracts. Sovereign AI starts at $3,497 per month with no contract lock-in. While the starting price is comparable, Sovereign AI includes 16 AI-powered services versus Scorpion's manual marketing approach, delivering significantly more value per dollar.",
      },
      {
        question: "Can I switch from Scorpion to Sovereign AI easily?",
        answer: "Yes. Sovereign AI deploys in 48 hours with zero downtime. Our team handles the full migration, including transferring your SEO rankings, ad campaigns, and review management. Most businesses switching from Scorpion see improved lead volume within the first two weeks.",
      },
      {
        question: "Why are contractors leaving Scorpion for Sovereign AI?",
        answer: "Contractors leave Scorpion because of 12-month contracts, manual processes handled by junior reps, monthly PDF reports instead of real-time data, and limited AI capabilities. Sovereign AI offers 16 autonomous AI systems, real-time dashboards, no contracts, and a dedicated support team.",
      },
    ],
    switchingTestimonials: [
      {
        quote: "We were paying Scorpion $6,500/month and getting maybe 30 leads. Sovereign AI got us 112 leads in the first month for almost half the price. I wish I had switched sooner.",
        name: "Mike R.",
        role: "Owner",
        company: "ProFlow Plumbing",
        tradeType: "Plumbing",
        metric: "3.7x more leads at lower cost",
      },
      {
        quote: "Scorpion locked us into a 12-month contract and assigned us a kid fresh out of college. Sovereign AI's AI systems outperformed their entire team from day one.",
        name: "Jennifer T.",
        role: "Marketing Director",
        company: "Summit HVAC",
        tradeType: "HVAC",
        metric: "Eliminated 12-month lock-in",
      },
    ],
    priceSavingNote: "Sovereign AI delivers 16 AI-powered services for a comparable price to Scorpion's manual marketing — with no 12-month lock-in and a 60-day money-back guarantee.",
  },
  {
    slug: "thryv",
    name: "Thryv",
    tagline: "Done-for-you AI marketing vs. DIY templates. 16 AI systems vs. basic tools you have to run yourself.",
    description:
      "Thryv gives you software and expects you to figure out marketing yourself. Sovereign AI does everything for you: 16 AI systems generate leads, manage reviews, create content, and optimize campaigns 24/7 while you focus on running your business.",
    priceRange: "$199 – $499/mo + add-ons",
    sovereignPrice: "From $3,497/mo (all-inclusive)",
    features: [
      { name: "AI Lead Generation", sovereign: true, competitor: false },
      { name: "AI Voice Agents", sovereign: true, competitor: false },
      { name: "AI Chatbot", sovereign: "Custom-Trained", competitor: "Template" },
      { name: "SEO", sovereign: "Full AI Service", competitor: "Basic Listings" },
      { name: "Google/Facebook Ads", sovereign: "AI-Managed", competitor: "Self-Serve" },
      { name: "Review Management", sovereign: "AI Automated", competitor: "Basic" },
      { name: "Email Marketing", sovereign: "AI-Written Campaigns", competitor: "Templates" },
      { name: "Social Media", sovereign: "AI-Generated", competitor: "Scheduling Only" },
      { name: "Content Creation", sovereign: "8 AI Posts/Month", competitor: false },
      { name: "CRM", sovereign: "AI-Powered", competitor: "Basic CRM" },
      { name: "Retargeting", sovereign: true, competitor: false },
      { name: "Reputation Shield", sovereign: "24/7 AI", competitor: false },
      { name: "Analytics", sovereign: "AI Insights", competitor: "Basic" },
      { name: "Dedicated Support", sovereign: true, competitor: "Email Only" },
    ],
    advantages: [
      "Full-service AI marketing agency vs. DIY software",
      "We do everything for you — Thryv requires you to do it yourself",
      "16 AI systems working 24/7 vs. basic templates",
      "Custom AI chatbot trained on your business",
      "AI generates all content, ads, and emails automatically",
      "Proven 5-11x ROI for home service businesses",
    ],
    faqs: [
      {
        question: "What is the best Thryv alternative for contractors?",
        answer: "Sovereign AI is the best Thryv alternative for home service businesses. While Thryv gives you DIY software tools and templates, Sovereign AI is a full done-for-you AI marketing service with 16 systems that generate leads, manage reviews, create content, and optimize campaigns 24/7.",
      },
      {
        question: "How does Thryv pricing compare to Sovereign AI?",
        answer: "Thryv costs $199 to $499 per month plus add-ons for additional features. Sovereign AI starts at $3,497 per month but is all-inclusive with 16 AI services. Thryv requires you to run marketing yourself; Sovereign AI does everything for you, which typically delivers 5-11x ROI.",
      },
      {
        question: "Is Sovereign AI better than Thryv for home service marketing?",
        answer: "Yes, for businesses that want done-for-you marketing. Thryv is a software platform that requires you to manage your own marketing. Sovereign AI is a full-service AI marketing engine that handles lead generation, SEO, ads, content, reviews, and more automatically.",
      },
      {
        question: "Can I switch from Thryv to Sovereign AI?",
        answer: "Absolutely. Sovereign AI deploys in 48 hours. Our team migrates your contacts, review profiles, and campaign data. Most businesses switching from Thryv see a significant increase in leads because our AI systems actively generate business instead of providing passive tools.",
      },
    ],
    switchingTestimonials: [
      {
        quote: "Thryv gave us the tools but we had no time to use them. With Sovereign AI, everything runs on autopilot. Our leads tripled in 60 days without lifting a finger.",
        name: "Carlos M.",
        role: "Owner",
        company: "Titan Roofing Co.",
        tradeType: "Roofing",
        metric: "3x leads in 60 days",
      },
      {
        quote: "We spent hours every week trying to figure out Thryv's templates. Sovereign AI just handles everything. Best marketing decision we ever made.",
        name: "Sarah K.",
        role: "Office Manager",
        company: "ComfortZone HVAC",
        tradeType: "HVAC",
        metric: "Saved 15+ hrs/week on marketing",
      },
    ],
    priceSavingNote: "Thryv's lower price requires you to do all the work yourself. Sovereign AI's all-inclusive service eliminates the need for a marketing hire ($4,000-$6,000/mo) while delivering AI-powered results 24/7.",
  },
  {
    slug: "vendasta",
    name: "Vendasta",
    tagline: "Direct relationship vs. reseller markup. Home-service AI vs. generic white-label tools.",
    description:
      "Vendasta sells white-label tools to agencies who mark them up and resell to you. Sovereign AI works with you directly: no middleman, no markup, no generic templates. Every AI system is purpose-built for home service businesses.",
    priceRange: "$500 – $5,000/mo (via resellers)",
    sovereignPrice: "From $3,497/mo (direct)",
    features: [
      { name: "AI Lead Generation", sovereign: true, competitor: false },
      { name: "AI Voice Agents", sovereign: true, competitor: false },
      { name: "AI Chatbot", sovereign: "Custom-Trained", competitor: "White-Label" },
      { name: "SEO", sovereign: "AI-Powered", competitor: "Resold Tools" },
      { name: "Ad Management", sovereign: "AI-Optimized", competitor: "Varies by Reseller" },
      { name: "Review Management", sovereign: "AI Automated", competitor: true },
      { name: "Email Marketing", sovereign: "AI-Written", competitor: "White-Label" },
      { name: "Social Media", sovereign: "AI-Generated", competitor: "Scheduling" },
      { name: "Content Creation", sovereign: "8 Posts/Mo", competitor: "Via Add-On" },
      { name: "Direct Relationship", sovereign: true, competitor: "Through Reseller" },
      { name: "Home Service Specialized", sovereign: true, competitor: "Generic" },
      { name: "Transparent Pricing", sovereign: true, competitor: "Reseller Markup" },
      { name: "48-Hour Setup", sovereign: true, competitor: "Weeks" },
      { name: "Money-Back Guarantee", sovereign: "60 Days", competitor: false },
    ],
    advantages: [
      "Direct relationship — no middleman reseller markups",
      "Purpose-built for home services, not a generic platform",
      "16 AI systems included vs. à la carte add-ons",
      "Transparent pricing — no hidden fees or markup",
      "48-hour setup vs. weeks of onboarding",
      "60-day money-back guarantee included",
    ],
    faqs: [
      {
        question: "What is the best Vendasta alternative for home service businesses?",
        answer: "Sovereign AI is the best Vendasta alternative for contractors and home service companies. Unlike Vendasta's white-label reseller model with middleman markups, Sovereign AI works with you directly — no reseller, no markup, and every AI system is purpose-built for home services.",
      },
      {
        question: "How does Vendasta pricing compare to Sovereign AI?",
        answer: "Vendasta costs $500 to $5,000 per month through resellers who add their own markup. Sovereign AI starts at $3,497 per month with transparent, direct pricing. You get 16 AI systems included versus Vendasta's à la carte add-on model.",
      },
      {
        question: "Why choose Sovereign AI over Vendasta?",
        answer: "Vendasta sells generic white-label tools to agencies who resell them to you. Sovereign AI gives you a direct relationship, home-service-specialized AI, transparent pricing, 48-hour deployment, and a 60-day money-back guarantee. No middleman, no markup.",
      },
      {
        question: "Can I switch from Vendasta to Sovereign AI?",
        answer: "Yes. Sovereign AI deploys in 48 hours versus the weeks-long onboarding typical of Vendasta resellers. Our team handles the transition, and you get direct access to your dedicated support team instead of going through a reseller.",
      },
    ],
    switchingTestimonials: [
      {
        quote: "Our Vendasta reseller was charging us $3,800/month for generic tools that barely worked. Sovereign AI gave us a direct relationship and custom AI that actually understands our business.",
        name: "David L.",
        role: "Owner",
        company: "Elite Electrical Services",
        tradeType: "Electrical",
        metric: "Eliminated reseller middleman",
      },
      {
        quote: "We never knew what we were actually paying for with Vendasta — everything was marked up through our agency. Sovereign AI is transparent and the results speak for themselves.",
        name: "Amanda P.",
        role: "Co-Owner",
        company: "GreenScape Landscaping",
        tradeType: "Landscaping",
        metric: "40% cost savings, better results",
      },
    ],
    priceSavingNote: "Vendasta's pricing is inflated by reseller markups — you never know the true cost. Sovereign AI offers transparent, direct pricing with no middleman fees and 16 AI-powered services included.",
  },
  {
    slug: "gohighlevel",
    name: "GoHighLevel",
    tagline: "Done-for-you AI marketing vs. building funnels yourself. Results in 48 hours vs. weeks of setup.",
    description:
      "GoHighLevel gives you a blank canvas and expects you to build funnels, write copy, and manage campaigns yourself. Most businesses abandon it within 90 days. Sovereign AI deploys 16 done-for-you AI systems in 48 hours with zero learning curve.",
    priceRange: "$97 – $497/mo (DIY)",
    sovereignPrice: "From $3,497/mo (done-for-you)",
    features: [
      { name: "Done-For-You Service", sovereign: true, competitor: false },
      { name: "AI Lead Generation", sovereign: true, competitor: false },
      { name: "AI Voice Agents", sovereign: true, competitor: false },
      { name: "AI Chatbot", sovereign: "Custom-Trained", competitor: "Template Builder" },
      { name: "SEO", sovereign: "Full AI Service", competitor: false },
      { name: "Ad Management", sovereign: "AI-Optimized", competitor: "Self-Build" },
      { name: "Review Management", sovereign: "AI Automated", competitor: "Basic" },
      { name: "Email Marketing", sovereign: "AI-Written", competitor: "Template Builder" },
      { name: "Social Media", sovereign: "AI-Generated", competitor: "Scheduler Only" },
      { name: "Content Creation", sovereign: "8 Posts/Mo", competitor: false },
      { name: "CRM", sovereign: "AI-Powered", competitor: true },
      { name: "Funnel Builder", sovereign: "Pre-Built", competitor: "DIY Builder" },
      { name: "Home Service Specialized", sovereign: true, competitor: "Generic" },
      { name: "No Learning Curve", sovereign: true, competitor: false },
      { name: "48-Hour Setup", sovereign: true, competitor: "Self-Build" },
    ],
    advantages: [
      "Done-for-you vs. do-it-yourself — no learning curve needed",
      "AI generates all content, ads, and campaigns automatically",
      "Purpose-built for home services, not a generic platform",
      "16 AI systems included vs. building everything yourself",
      "48-hour deployment vs. weeks of self-setup",
      "Dedicated support team vs. community forums",
    ],
    faqs: [
      {
        question: "What is the best GoHighLevel alternative for contractors?",
        answer: "Sovereign AI is the best GoHighLevel alternative for home service businesses that want done-for-you marketing. GoHighLevel gives you a blank canvas and expects you to build funnels, write copy, and manage campaigns yourself. Most businesses abandon GoHighLevel within 90 days. Sovereign AI deploys 16 done-for-you AI systems in 48 hours.",
      },
      {
        question: "How does GoHighLevel pricing compare to Sovereign AI?",
        answer: "GoHighLevel costs $97 to $497 per month but is entirely DIY — you build everything yourself. Sovereign AI starts at $3,497 per month but is fully done-for-you. When you factor in the time, hiring, and learning curve GoHighLevel requires, Sovereign AI delivers significantly better ROI.",
      },
      {
        question: "Is GoHighLevel or Sovereign AI better for home service marketing?",
        answer: "Sovereign AI is better for home service businesses that want results without managing marketing themselves. GoHighLevel is a generic DIY platform with a steep learning curve. Sovereign AI is purpose-built for contractors with pre-built, industry-specific AI systems that deploy in 48 hours.",
      },
      {
        question: "Can I switch from GoHighLevel to Sovereign AI?",
        answer: "Yes. Most GoHighLevel users switch because they don't have time to build and manage funnels themselves. Sovereign AI deploys in 48 hours with zero learning curve. Our team handles everything including migrating your contacts and campaign data.",
      },
    ],
    switchingTestimonials: [
      {
        quote: "I spent 3 months trying to set up GoHighLevel and got zero leads from it. Sovereign AI was live in 2 days and we booked 47 jobs in the first month.",
        name: "Brian H.",
        role: "Owner",
        company: "PrecisionAir HVAC",
        tradeType: "HVAC",
        metric: "47 jobs in first month",
      },
      {
        quote: "GoHighLevel is powerful if you have 20 hours a week to learn it. I don't. Sovereign AI runs everything for me and the results are incredible.",
        name: "Tony V.",
        role: "Owner",
        company: "Valor Plumbing & Drain",
        tradeType: "Plumbing",
        metric: "Zero learning curve",
      },
    ],
    priceSavingNote: "GoHighLevel's $97-$497/mo price tag is misleading — you still need to hire someone to build funnels and manage campaigns ($3,000-$5,000/mo). Sovereign AI's all-inclusive price replaces both the software and the marketer.",
  },
  {
    slug: "podium",
    name: "Podium",
    tagline: "Complete 16-service AI marketing suite vs. a messaging tool. Lead generation + SEO + ads + content included.",
    description:
      "Podium helps you text customers and collect reviews. That is 2 of the 16 things you need. Sovereign AI handles lead generation, SEO, ad management, content creation, voice agents, CRM, and more in addition to messaging and reviews.",
    priceRange: "$399 – $599/mo",
    sovereignPrice: "From $3,497/mo (all 16 services)",
    features: [
      { name: "AI Lead Generation", sovereign: true, competitor: false },
      { name: "AI Voice Agents", sovereign: true, competitor: false },
      { name: "AI Chatbot", sovereign: "Custom-Trained", competitor: "Basic Webchat" },
      { name: "SEO", sovereign: "Full AI Service", competitor: false },
      { name: "Ad Management", sovereign: "AI-Optimized", competitor: false },
      { name: "Review Management", sovereign: "AI Automated", competitor: true },
      { name: "Email Marketing", sovereign: "AI-Written Campaigns", competitor: "Basic" },
      { name: "SMS Marketing", sovereign: true, competitor: true },
      { name: "Social Media", sovereign: "AI-Generated", competitor: false },
      { name: "Content Creation", sovereign: "8 Posts/Mo", competitor: false },
      { name: "CRM", sovereign: "AI-Powered", competitor: "Basic" },
      { name: "Payment Processing", sovereign: "Via Stripe", competitor: true },
      { name: "Home Service Specialized", sovereign: true, competitor: "Multi-Industry" },
      { name: "Money-Back Guarantee", sovereign: "60 Days", competitor: false },
    ],
    advantages: [
      "Complete 16-service AI marketing suite vs. messaging-only tool",
      "AI generates leads, content, and campaigns — Podium only manages conversations",
      "Full SEO and ad management included at no extra cost",
      "AI content engine produces 8 blog posts + social media monthly",
      "Purpose-built for home services with industry-specific AI",
      "60-day money-back guarantee — no long-term commitment",
    ],
    faqs: [
      {
        question: "What is the best Podium alternative for home service businesses?",
        answer: "Sovereign AI is the best Podium alternative for contractors. Podium only handles messaging and reviews — 2 of the 16 services you need. Sovereign AI includes lead generation, SEO, ad management, content creation, AI voice agents, CRM, and more in a single all-inclusive platform.",
      },
      {
        question: "How does Podium pricing compare to Sovereign AI?",
        answer: "Podium costs $399 to $599 per month for messaging and review management. Sovereign AI starts at $3,497 per month but includes all 16 marketing services. Dollar-for-dollar, Sovereign AI delivers far more value since Podium only covers a fraction of your marketing needs.",
      },
      {
        question: "Does Sovereign AI include everything Podium offers plus more?",
        answer: "Yes. Sovereign AI includes SMS marketing and AI-automated review management (Podium's core features) plus 14 additional services: AI lead generation, voice agents, SEO, ad management, content creation, email marketing, social media, CRM, retargeting, and more.",
      },
      {
        question: "Can I switch from Podium to Sovereign AI?",
        answer: "Yes. Sovereign AI deploys in 48 hours and includes all of Podium's capabilities plus 14 additional marketing services. Our team migrates your review profiles and contact data. You get a 60-day money-back guarantee so there is zero risk in trying.",
      },
    ],
    switchingTestimonials: [
      {
        quote: "Podium was great for texting customers but did nothing to actually bring in new leads. Sovereign AI handles everything — reviews, SEO, ads, content — and our revenue grew 62% in 90 days.",
        name: "Rachel F.",
        role: "Operations Manager",
        company: "ClearView Windows",
        tradeType: "Window Cleaning",
        metric: "62% revenue growth in 90 days",
      },
      {
        quote: "We were using Podium plus two other tools to cover what Sovereign AI does in one platform. Simpler, cheaper, and way more effective.",
        name: "James W.",
        role: "Owner",
        company: "Patriot Pest Control",
        tradeType: "Pest Control",
        metric: "Consolidated 3 tools into 1",
      },
    ],
    priceSavingNote: "Podium covers messaging and reviews — 2 of the 16 services you need. To match Sovereign AI's capabilities with Podium, you would need 5+ additional tools costing $2,000-$4,000/mo on top of Podium's fees.",
  },
  {
    slug: "birdeye",
    name: "Birdeye",
    tagline: "Full AI marketing engine vs. reviews-only platform. Proactive lead generation vs. managing existing reputation.",
    description:
      "Birdeye helps you manage reviews and listings. Sovereign AI includes all of that plus AI lead generation, voice agents, SEO, ad management, content creation, CRM, and 10 more services that actively bring in new business instead of just managing what you already have.",
    priceRange: "$350 – $500/mo (custom quotes)",
    sovereignPrice: "From $3,497/mo (all-inclusive)",
    features: [
      { name: "AI Lead Generation", sovereign: true, competitor: false },
      { name: "AI Voice Agents", sovereign: true, competitor: false },
      { name: "AI Chatbot", sovereign: "Custom-Trained", competitor: "Basic Webchat" },
      { name: "SEO", sovereign: "Full AI Service", competitor: "Listings Only" },
      { name: "Ad Management", sovereign: "AI-Optimized", competitor: false },
      { name: "Review Management", sovereign: "AI Automated", competitor: true },
      { name: "Review Responses", sovereign: "AI-Generated", competitor: "Templates" },
      { name: "Email Marketing", sovereign: "AI-Written", competitor: "Basic" },
      { name: "Social Media", sovereign: "AI-Generated", competitor: "Basic" },
      { name: "Content Creation", sovereign: "8 Posts/Mo", competitor: false },
      { name: "CRM", sovereign: "AI-Powered", competitor: "Basic" },
      { name: "Surveys & NPS", sovereign: true, competitor: true },
      { name: "Home Service Specialized", sovereign: true, competitor: "Multi-Industry" },
      { name: "48-Hour Setup", sovereign: true, competitor: "1-2 Weeks" },
    ],
    advantages: [
      "Complete AI marketing suite vs. reviews-focused platform",
      "AI generates leads proactively — Birdeye only manages existing reputation",
      "Full SEO service included, not just listing management",
      "AI content engine and ad management at no extra cost",
      "Purpose-built for home services with trade-specific AI",
      "48-hour deployment vs. multi-week onboarding",
    ],
    faqs: [
      {
        question: "What is the best Birdeye alternative for contractors?",
        answer: "Sovereign AI is the best Birdeye alternative for home service businesses. While Birdeye focuses on review and reputation management, Sovereign AI includes all of that plus AI lead generation, voice agents, SEO, ad management, content creation, CRM, and 10 more proactive marketing services.",
      },
      {
        question: "How does Birdeye pricing compare to Sovereign AI?",
        answer: "Birdeye charges $350 to $500 per month with custom quotes for reputation management and listings. Sovereign AI starts at $3,497 per month but is all-inclusive with 16 AI marketing services. Birdeye manages your existing reputation; Sovereign AI actively generates new business.",
      },
      {
        question: "Is Sovereign AI better than Birdeye for lead generation?",
        answer: "Yes. Birdeye helps manage reviews and listings but does not generate leads, run ad campaigns, create content, or manage SEO. Sovereign AI proactively brings in new business through AI lead generation, voice agents, SEO, ads, and content creation in addition to review management.",
      },
      {
        question: "Can I switch from Birdeye to Sovereign AI?",
        answer: "Yes. Sovereign AI deploys in 48 hours versus Birdeye's 1-2 week onboarding. Our team migrates your review profiles and listing data. You keep all of Birdeye's review management capabilities and gain 14 additional AI marketing services.",
      },
    ],
    switchingTestimonials: [
      {
        quote: "Birdeye helped us manage reviews but did nothing to generate new business. Sovereign AI's AI lead generation brought in 83 new leads in the first 30 days on top of handling all our reviews.",
        name: "Kevin M.",
        role: "Owner",
        company: "AllStar Garage Doors",
        tradeType: "Garage Doors",
        metric: "83 new leads in 30 days",
      },
      {
        quote: "We were paying Birdeye $450/month just for reviews and listings. For the same budget as adding SEO and ads separately, Sovereign AI gives us everything in one place.",
        name: "Lisa C.",
        role: "Owner",
        company: "BrightHome Cleaning",
        tradeType: "Cleaning Services",
        metric: "All-in-one vs. 4 separate tools",
      },
    ],
    priceSavingNote: "Birdeye manages your existing reputation but does not generate new business. To match Sovereign AI, you would need Birdeye plus an SEO agency, ad manager, content writer, and more — easily $5,000-$8,000/mo total.",
  },
  {
    slug: "servicetitan",
    name: "ServiceTitan",
    tagline: "AI-powered lead generation vs. field-service software. 16 marketing systems vs. dispatching and invoicing tools.",
    description:
      "ServiceTitan is a field-service management platform built for dispatching, invoicing, and job tracking — not marketing. Sovereign AI is an AI marketing engine purpose-built for lead generation, SEO, ad management, content creation, and 12 more services that actually bring in new customers.",
    priceRange: "$2,500 – $8,000+/mo",
    sovereignPrice: "From $3,497/mo (all 16 services)",
    features: [
      { name: "AI Lead Generation", sovereign: true, competitor: false },
      { name: "AI Voice Agents", sovereign: true, competitor: false },
      { name: "AI Chatbot", sovereign: "Custom-Trained", competitor: false },
      { name: "SEO", sovereign: "Full AI Service", competitor: false },
      { name: "Google/Facebook Ads", sovereign: "AI-Managed", competitor: false },
      { name: "Review Management", sovereign: "AI Automated", competitor: "Basic" },
      { name: "Email Marketing", sovereign: "AI-Written Campaigns", competitor: "Basic Drips" },
      { name: "Social Media", sovereign: "AI-Generated", competitor: false },
      { name: "Content Creation", sovereign: "8 Posts/Mo", competitor: false },
      { name: "CRM", sovereign: "AI-Powered", competitor: true },
      { name: "Dispatching & Scheduling", sovereign: false, competitor: true },
      { name: "Invoicing & Payments", sovereign: false, competitor: true },
      { name: "Done-For-You Service", sovereign: true, competitor: false },
      { name: "No Long-Term Contract", sovereign: true, competitor: false },
      { name: "48-Hour Setup", sovereign: true, competitor: false },
      { name: "Money-Back Guarantee", sovereign: "60 Days", competitor: false },
    ],
    advantages: [
      "16 AI marketing systems vs. zero marketing capabilities",
      "AI generates leads proactively — ServiceTitan only manages jobs after you get them",
      "Full SEO, ad management, and content creation included",
      "No long-term contracts — ServiceTitan requires annual commitments",
      "48-hour deployment vs. 4-8 week onboarding",
      "Complements ServiceTitan — use both together for full coverage",
    ],
    faqs: [
      {
        question: "What is the best ServiceTitan alternative for marketing?",
        answer: "Sovereign AI is the best marketing complement or alternative for ServiceTitan users. ServiceTitan is a field-service management tool for dispatching, invoicing, and job tracking — it does not generate leads, run ads, manage SEO, or create content. Sovereign AI fills the marketing gap with 16 AI-powered services.",
      },
      {
        question: "How does ServiceTitan pricing compare to Sovereign AI?",
        answer: "ServiceTitan costs $2,500 to $8,000+ per month with annual contracts for field-service management. Sovereign AI starts at $3,497 per month with no long-term commitment for 16 AI marketing services. Many contractors use both: ServiceTitan for operations and Sovereign AI for lead generation.",
      },
      {
        question: "Can I use Sovereign AI and ServiceTitan together?",
        answer: "Yes. Sovereign AI and ServiceTitan complement each other perfectly. Sovereign AI handles lead generation, SEO, ads, content, and reputation management. ServiceTitan handles dispatching, invoicing, and job tracking. Together they cover both marketing and operations.",
      },
      {
        question: "Why do ServiceTitan users add Sovereign AI?",
        answer: "ServiceTitan users add Sovereign AI because ServiceTitan does not generate leads or manage marketing. Contractors using ServiceTitan still need a marketing solution for SEO, ads, content creation, review management, and AI-powered lead generation — all of which Sovereign AI provides.",
      },
    ],
    switchingTestimonials: [
      {
        quote: "ServiceTitan is great for dispatching but does nothing for marketing. We added Sovereign AI and our lead volume went from 25 to 94 per month. Now we actually have jobs to dispatch.",
        name: "Marcus D.",
        role: "Owner",
        company: "Apex Plumbing & Drain",
        tradeType: "Plumbing",
        metric: "3.8x more leads per month",
      },
      {
        quote: "We were paying ServiceTitan $5,200/month and still had to hire a separate marketing agency for $4,000/month. Sovereign AI replaced the agency and outperformed them from week one.",
        name: "Diane S.",
        role: "Operations Manager",
        company: "TrueComfort HVAC",
        tradeType: "HVAC",
        metric: "Replaced $4K/mo marketing agency",
      },
    ],
    priceSavingNote: "ServiceTitan is a field-service management tool, not a marketing platform. Most ServiceTitan users spend $3,000-$6,000/mo extra on marketing agencies. Sovereign AI replaces outside agencies with 16 AI marketing systems at a lower total cost.",
  },
  {
    slug: "jobber",
    name: "Jobber",
    tagline: "Full AI marketing engine vs. quoting and scheduling software. Lead generation vs. job management.",
    description:
      "Jobber helps you schedule jobs, send quotes, and invoice customers — but it does not generate new leads. Sovereign AI is a complete AI marketing platform that brings in new customers through SEO, ads, content creation, AI voice agents, and 12 more services while Jobber manages the work after you book it.",
    priceRange: "$39 – $349/mo",
    sovereignPrice: "From $3,497/mo (all 16 services)",
    features: [
      { name: "AI Lead Generation", sovereign: true, competitor: false },
      { name: "AI Voice Agents", sovereign: true, competitor: false },
      { name: "AI Chatbot", sovereign: "Custom-Trained", competitor: false },
      { name: "SEO", sovereign: "Full AI Service", competitor: false },
      { name: "Google/Facebook Ads", sovereign: "AI-Managed", competitor: false },
      { name: "Review Management", sovereign: "AI Automated", competitor: "Basic Requests" },
      { name: "Email Marketing", sovereign: "AI-Written Campaigns", competitor: "Basic" },
      { name: "Social Media", sovereign: "AI-Generated", competitor: false },
      { name: "Content Creation", sovereign: "8 Posts/Mo", competitor: false },
      { name: "CRM", sovereign: "AI-Powered", competitor: "Basic" },
      { name: "Quoting & Invoicing", sovereign: false, competitor: true },
      { name: "Job Scheduling", sovereign: false, competitor: true },
      { name: "Done-For-You Service", sovereign: true, competitor: false },
      { name: "No Long-Term Contract", sovereign: true, competitor: true },
      { name: "48-Hour Setup", sovereign: true, competitor: true },
      { name: "Money-Back Guarantee", sovereign: "60 Days", competitor: "14-Day Trial" },
    ],
    advantages: [
      "16 AI marketing systems vs. zero marketing capabilities",
      "AI generates new customers — Jobber only manages existing ones",
      "Full SEO, ad management, and content creation included",
      "AI voice agents answer calls 24/7 and book appointments",
      "Complements Jobber — use both for marketing + operations",
      "60-day money-back guarantee vs. Jobber's 14-day trial",
    ],
    faqs: [
      {
        question: "What is the best Jobber alternative for lead generation?",
        answer: "Sovereign AI is the best lead generation solution for Jobber users. Jobber is a job management tool for quoting, scheduling, and invoicing — it does not generate leads, run ad campaigns, or manage SEO. Sovereign AI fills the marketing gap with 16 AI-powered services that bring in new customers.",
      },
      {
        question: "How does Jobber pricing compare to Sovereign AI?",
        answer: "Jobber costs $39 to $349 per month for job management software. Sovereign AI starts at $3,497 per month for 16 AI marketing services. They serve completely different purposes: Jobber manages jobs you already have, Sovereign AI generates new ones. Most contractors use both together.",
      },
      {
        question: "Can I use Sovereign AI and Jobber together?",
        answer: "Absolutely. Sovereign AI and Jobber are complementary tools. Sovereign AI handles lead generation, SEO, ads, content, reviews, and AI voice agents to bring in new customers. Jobber handles quoting, scheduling, dispatching, and invoicing after you book the job.",
      },
      {
        question: "Do I need Sovereign AI if I already use Jobber?",
        answer: "Yes, if you want to grow. Jobber helps you manage the jobs you have, but does nothing to generate new leads. Sovereign AI's 16 AI marketing systems actively bring in new customers through SEO, ad campaigns, content creation, review management, and AI-powered lead generation.",
      },
    ],
    switchingTestimonials: [
      {
        quote: "Jobber is perfect for managing our schedule but we had no way to fill it. Sovereign AI filled our calendar within 3 weeks. Now we use both and our revenue is up 74%.",
        name: "Chris P.",
        role: "Owner",
        company: "GreenEdge Landscaping",
        tradeType: "Landscaping",
        metric: "74% revenue increase",
      },
      {
        quote: "We thought Jobber would grow our business but it only organizes existing work. Adding Sovereign AI was the best decision — 68 new leads in our first month.",
        name: "Patricia N.",
        role: "Co-Owner",
        company: "CleanStar Cleaning Co.",
        tradeType: "Cleaning Services",
        metric: "68 new leads in first month",
      },
    ],
    priceSavingNote: "Jobber's $39-$349/mo manages jobs you already have. To actually generate new leads, Jobber users typically spend $2,000-$5,000/mo on separate marketing. Sovereign AI replaces outside marketing spend with 16 AI systems that cost less than a part-time marketer.",
  },
  {
    slug: "housecall-pro",
    name: "Housecall Pro",
    tagline: "AI marketing engine vs. field-service management app. 16 lead-generation systems vs. dispatching and invoicing.",
    description:
      "Housecall Pro helps you dispatch technicians, send invoices, and manage your schedule. Sovereign AI is a full AI marketing platform that generates new leads through SEO, ads, AI voice agents, content creation, and 12 more services. They solve different problems — and work great together.",
    priceRange: "$79 – $399/mo",
    sovereignPrice: "From $3,497/mo (all 16 services)",
    features: [
      { name: "AI Lead Generation", sovereign: true, competitor: false },
      { name: "AI Voice Agents", sovereign: true, competitor: false },
      { name: "AI Chatbot", sovereign: "Custom-Trained", competitor: "Basic" },
      { name: "SEO", sovereign: "Full AI Service", competitor: false },
      { name: "Google/Facebook Ads", sovereign: "AI-Managed", competitor: false },
      { name: "Review Management", sovereign: "AI Automated", competitor: "Review Requests" },
      { name: "Email Marketing", sovereign: "AI-Written Campaigns", competitor: "Postcards" },
      { name: "Social Media", sovereign: "AI-Generated", competitor: false },
      { name: "Content Creation", sovereign: "8 Posts/Mo", competitor: false },
      { name: "CRM", sovereign: "AI-Powered", competitor: "Basic" },
      { name: "Dispatching & GPS", sovereign: false, competitor: true },
      { name: "Invoicing & Payments", sovereign: false, competitor: true },
      { name: "Done-For-You Service", sovereign: true, competitor: false },
      { name: "No Long-Term Contract", sovereign: true, competitor: true },
      { name: "48-Hour Setup", sovereign: true, competitor: true },
      { name: "Money-Back Guarantee", sovereign: "60 Days", competitor: "14-Day Trial" },
    ],
    advantages: [
      "16 AI marketing systems vs. limited marketing add-ons",
      "AI generates new leads — Housecall Pro only manages existing jobs",
      "Full SEO, ad management, and AI content creation included",
      "AI voice agents answer every call 24/7 and book appointments",
      "Complements Housecall Pro — use both for marketing + operations",
      "60-day money-back guarantee with zero contracts",
    ],
    faqs: [
      {
        question: "What is the best Housecall Pro alternative for marketing?",
        answer: "Sovereign AI is the best marketing solution for Housecall Pro users. Housecall Pro is a field-service management app for dispatching, invoicing, and scheduling — its marketing features are limited to basic review requests and postcards. Sovereign AI provides 16 AI-powered marketing services that actively generate new leads.",
      },
      {
        question: "How does Housecall Pro pricing compare to Sovereign AI?",
        answer: "Housecall Pro costs $79 to $399 per month for field-service management. Sovereign AI starts at $3,497 per month for 16 AI marketing services. They serve different purposes: Housecall Pro manages operations, Sovereign AI generates new business. Many contractors use both together for complete coverage.",
      },
      {
        question: "Can I use Sovereign AI with Housecall Pro?",
        answer: "Yes. Sovereign AI and Housecall Pro work together seamlessly. Sovereign AI handles lead generation, SEO, ads, content, reviews, and AI voice agents to fill your pipeline. Housecall Pro handles dispatching, scheduling, invoicing, and payments after you book the job.",
      },
      {
        question: "Does Housecall Pro do marketing like Sovereign AI?",
        answer: "No. Housecall Pro offers basic marketing add-ons like postcard mailers and review request texts, but it does not provide SEO, ad management, AI content creation, AI voice agents, or proactive lead generation. Sovereign AI is a full AI marketing platform with 16 services purpose-built to bring in new customers.",
      },
    ],
    switchingTestimonials: [
      {
        quote: "Housecall Pro runs our operations perfectly, but we had no marketing. We added Sovereign AI and went from 15 leads a month to 71. Our techs are finally fully booked.",
        name: "Ryan G.",
        role: "Owner",
        company: "AirRight HVAC",
        tradeType: "HVAC",
        metric: "4.7x more leads per month",
      },
      {
        quote: "We tried Housecall Pro's postcard mailers and got almost nothing. Sovereign AI's AI-powered ads and SEO brought in 53 new customers in 6 weeks. Totally different league.",
        name: "Michelle T.",
        role: "Office Manager",
        company: "Shield Pest Solutions",
        tradeType: "Pest Control",
        metric: "53 new customers in 6 weeks",
      },
    ],
    priceSavingNote: "Housecall Pro's $79-$399/mo covers operations, not marketing. Most Housecall Pro users spend $2,000-$5,000/mo on separate marketing agencies. Sovereign AI replaces outside marketing with 16 AI systems that deliver more leads at lower cost.",
  },
];

export function getCompetitorBySlug(slug: string): Competitor | undefined {
  return COMPETITORS.find((c) => c.slug === slug);
}
