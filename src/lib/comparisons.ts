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
    tagline: "16 autonomous AI systems vs. junior account reps running manual campaigns. No contracts vs. 12-month lock-ins. 48-hour setup vs. weeks of onboarding — with a 60-day money-back guarantee.",
    description:
      "Scorpion is a digital marketing agency that charges $2,000-$10,000/month with mandatory 12-month contracts. Their model relies on junior account managers manually running SEO, PPC, and web design campaigns with limited automation. Reporting is typically monthly PDFs with 2-3 week data lag. Sovereign AI replaces that entire manual workflow with 16 autonomous AI systems that optimize campaigns in real time, deploy in 48 hours, and deliver transparent dashboards you can check any time — all with no lock-in and a 60-day money-back guarantee.",
    priceRange: "$2,000 – $10,000/mo",
    sovereignPrice: "From $3,497/mo",
    features: [
      { name: "AI-Powered Lead Generation", sovereign: true, competitor: false },
      { name: "AI Voice Agents (24/7)", sovereign: true, competitor: false },
      { name: "AI Chatbot", sovereign: "Custom-Trained", competitor: "Basic Widget" },
      { name: "SEO Management", sovereign: "AI-Optimized Daily", competitor: "Manual Monthly" },
      { name: "Google Ads Management", sovereign: "AI Bid Optimization", competitor: "Manual Management" },
      { name: "Facebook/Meta Ads", sovereign: "AI-Managed", competitor: "Extra Cost" },
      { name: "Review Management", sovereign: "AI Auto-Response", competitor: "Manual Monitoring" },
      { name: "Email Marketing", sovereign: "AI-Written Campaigns", competitor: "Template-Based" },
      { name: "Social Media Content", sovereign: "AI-Generated 8/Mo", competitor: "2-4 Manual Posts" },
      { name: "Blog Content Creation", sovereign: "AI SEO Articles", competitor: "Outsourced Writers" },
      { name: "CRM Included", sovereign: true, competitor: "Extra Cost" },
      { name: "Online Booking System", sovereign: true, competitor: false },
      { name: "Retargeting Campaigns", sovereign: "AI-Optimized", competitor: "Manual Setup" },
      { name: "Reputation Shield (24/7)", sovereign: true, competitor: false },
      { name: "No Long-Term Contract", sovereign: true, competitor: false },
      { name: "48-Hour Setup", sovereign: true, competitor: false },
      { name: "Real-Time Analytics Dashboard", sovereign: true, competitor: "Monthly PDF Reports" },
      { name: "Money-Back Guarantee", sovereign: "60 Days", competitor: false },
    ],
    advantages: [
      "16 AI systems optimize your campaigns around the clock vs. Scorpion's team of junior reps who work business hours only — meaning you never miss a lead at 2 AM on a Saturday",
      "No 12-month contract lock-in — Scorpion requires annual commitments with early termination fees that can cost thousands; Sovereign AI lets you cancel any time with a 60-day money-back guarantee",
      "48-hour deployment vs. Scorpion's 2-4 week onboarding process, so you start generating leads immediately instead of waiting a month for your first campaign to go live",
      "AI-generated content produces 8+ blog posts and social media updates monthly at consistent quality, vs. Scorpion's 2-4 manually written posts that often miss deadlines",
      "Real-time analytics dashboard with live lead tracking vs. Scorpion's monthly PDF reports that arrive 2-3 weeks after the reporting period ends, leaving you flying blind",
      "AI bid optimization adjusts your ad spend every hour based on conversion data vs. Scorpion's manual weekly or biweekly campaign reviews",
      "Dedicated senior support team vs. Scorpion's revolving door of junior account managers — the average Scorpion client reports being reassigned to a new rep every 6-9 months",
    ],
    faqs: [
      {
        question: "What is the best Scorpion alternative for home service businesses?",
        answer: "Sovereign AI is the top-rated Scorpion alternative for contractors, HVAC companies, plumbers, electricians, and roofers. Unlike Scorpion's manual processes run by junior account reps with 12-month lock-in contracts, Sovereign AI deploys 16 AI marketing systems in 48 hours — including AI voice agents, automated review management, AI-optimized SEO, and real-time analytics — with no long-term commitment and a 60-day money-back guarantee.",
      },
      {
        question: "How does Scorpion pricing compare to Sovereign AI?",
        answer: "Scorpion charges $2,000 to $10,000 per month with mandatory 12-month contracts and early termination fees. Sovereign AI starts at $3,497 per month with no contract lock-in. Scorpion's pricing often excludes add-ons like CRM access, social media management, and advanced reporting that are included in Sovereign AI's base price. When you factor in Scorpion's hidden fees and the value of 16 AI-powered services vs. manual marketing, Sovereign AI consistently delivers better ROI.",
      },
      {
        question: "Can I switch from Scorpion to Sovereign AI easily?",
        answer: "Yes. Sovereign AI deploys in 48 hours with zero downtime. Our migration team handles the full transition, including preserving your SEO rankings, transferring ad campaign data and conversion tracking, migrating review management, and setting up your real-time dashboard. Most businesses switching from Scorpion see improved lead volume within the first two weeks because AI optimization begins working immediately rather than requiring weeks of manual setup.",
      },
      {
        question: "Why are contractors leaving Scorpion for Sovereign AI?",
        answer: "The most common reasons contractors switch from Scorpion include: 12-month contracts with steep early termination fees, frequent account rep turnover with junior staff who lack industry knowledge, monthly PDF reports with 2-3 week data lag instead of real-time analytics, limited AI capabilities relying on manual processes, and add-on pricing for features like CRM and social media that Sovereign AI includes. Sovereign AI addresses every one of these pain points with 16 autonomous AI systems, real-time dashboards, no contracts, and a dedicated senior support team.",
      },
      {
        question: "Does Sovereign AI offer better reporting than Scorpion?",
        answer: "Yes. Scorpion typically provides monthly PDF reports that arrive weeks after the reporting period, making it difficult to react to trends or optimize campaigns in real time. Sovereign AI provides a live analytics dashboard that tracks leads, calls, form submissions, ad spend, SEO rankings, and review activity in real time. You can see exactly how many leads came in today, which campaigns are performing, and where your budget is being spent — all without waiting for a monthly report.",
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
    priceSavingNote: "Scorpion's $2,000-$10,000/mo pricing requires a 12-month contract and excludes add-ons like CRM and social media. Sovereign AI delivers all 16 AI-powered services at a comparable price with no lock-in, no hidden fees, and a 60-day money-back guarantee.",
  },
  {
    slug: "thryv",
    name: "Thryv",
    tagline: "Done-for-you AI marketing vs. DIY software you have to run yourself. 16 AI systems generating leads 24/7 vs. templates and basic tools that require hours of your time every week.",
    description:
      "Thryv is a small business management platform that bundles a basic CRM, email templates, social media scheduler, and online presence tools into a self-service package. The catch: you have to do all the marketing work yourself. Building campaigns, writing emails, posting to social media, managing ads — it all falls on you or your staff. Most home service business owners report spending 10-15 hours per week trying to use Thryv's tools effectively. Sovereign AI eliminates that burden entirely with 16 done-for-you AI systems that generate leads, write content, manage reviews, optimize ads, and run campaigns 24/7 while you focus on running jobs and growing your business.",
    priceRange: "$199 – $499/mo + add-ons",
    sovereignPrice: "From $3,497/mo (all-inclusive)",
    features: [
      { name: "AI Lead Generation", sovereign: true, competitor: false },
      { name: "AI Voice Agents (24/7)", sovereign: true, competitor: false },
      { name: "AI Chatbot", sovereign: "Custom-Trained", competitor: "Generic Template" },
      { name: "SEO", sovereign: "Full AI Service", competitor: "Basic Listings Only" },
      { name: "Google Ads", sovereign: "AI Bid Optimization", competitor: "Self-Serve Dashboard" },
      { name: "Facebook/Meta Ads", sovereign: "AI-Managed", competitor: "Self-Serve" },
      { name: "Review Management", sovereign: "AI Auto-Response", competitor: "Manual Requests" },
      { name: "Email Marketing", sovereign: "AI-Written Campaigns", competitor: "DIY Templates" },
      { name: "Social Media Content", sovereign: "AI-Generated 8/Mo", competitor: "Scheduling Only" },
      { name: "Blog Content Creation", sovereign: "AI SEO Articles", competitor: false },
      { name: "CRM", sovereign: "AI-Powered Pipeline", competitor: "Basic Contact List" },
      { name: "Retargeting Campaigns", sovereign: "AI-Optimized", competitor: false },
      { name: "Reputation Shield (24/7)", sovereign: true, competitor: false },
      { name: "Analytics & Reporting", sovereign: "Real-Time AI Insights", competitor: "Basic Dashboards" },
      { name: "Done-For-You Service", sovereign: true, competitor: false },
      { name: "Dedicated Support Team", sovereign: true, competitor: "Email & Chat" },
      { name: "Money-Back Guarantee", sovereign: "60 Days", competitor: false },
    ],
    advantages: [
      "Fully done-for-you AI marketing service vs. DIY software — Thryv gives you templates and tools, but you still need to write copy, build campaigns, schedule posts, and manage ads yourself, consuming 10-15 hours per week",
      "16 AI systems actively generate new leads around the clock vs. Thryv's passive tools that only work when you manually use them — most Thryv users report that leads do not increase because the tools sit unused",
      "Custom AI chatbot trained on your specific services, service area, and pricing vs. Thryv's generic chatbot template that gives the same responses regardless of your trade or location",
      "AI-generated content engine produces 8 optimized blog posts and social media updates monthly vs. Thryv's social scheduler that still requires you to create all the content from scratch",
      "AI-powered ad management with automated bid optimization and audience targeting vs. Thryv's self-serve ad dashboard where you set budgets and targeting manually with no optimization guidance",
      "Proven 5-11x ROI for home service businesses — Sovereign AI's done-for-you model means you do not need to hire a marketing employee ($4,000-$6,000/mo) or spend your own evenings learning marketing software",
    ],
    faqs: [
      {
        question: "What is the best Thryv alternative for contractors?",
        answer: "Sovereign AI is the best Thryv alternative for home service businesses that want results without doing the marketing work themselves. Thryv gives you DIY software tools — a basic CRM, email templates, and a social media scheduler — but expects you to create content, build campaigns, and manage everything. Sovereign AI is a full done-for-you AI marketing service with 16 systems that generate leads, manage reviews, create content, optimize ads, and run campaigns 24/7 without requiring any effort from you or your staff.",
      },
      {
        question: "How does Thryv pricing compare to Sovereign AI?",
        answer: "Thryv costs $199 to $499 per month plus add-ons for features like enhanced marketing tools, social media advertising, and advanced analytics. Sovereign AI starts at $3,497 per month but is fully all-inclusive with 16 AI services and zero add-on fees. The critical difference is that Thryv requires you to run marketing yourself, which either costs you 10-15 hours per week of your own time or requires hiring a marketing employee at $4,000-$6,000/month. Sovereign AI eliminates both costs while delivering 5-11x ROI through fully automated AI-powered marketing.",
      },
      {
        question: "Is Sovereign AI better than Thryv for home service marketing?",
        answer: "Yes, for businesses that want done-for-you marketing rather than DIY tools. Thryv is a software platform that provides templates, scheduling tools, and a basic CRM — but the marketing results depend entirely on how much time and expertise you put into it. Sovereign AI is a full-service AI marketing engine that handles lead generation, SEO, Google and Facebook ads, content creation, review management, email campaigns, and social media automatically. You get results without becoming a marketing expert.",
      },
      {
        question: "Can I switch from Thryv to Sovereign AI?",
        answer: "Absolutely. Sovereign AI deploys in 48 hours with a seamless migration process. Our team transfers your contacts, review profiles, business listings, and any existing campaign data. Most businesses switching from Thryv see a significant increase in lead volume within the first month because Sovereign AI's 16 AI systems actively generate new business around the clock instead of providing passive tools that require your manual input.",
      },
      {
        question: "Do I need marketing experience to use Sovereign AI vs. Thryv?",
        answer: "No. That is the core difference between the two platforms. Thryv requires you to have marketing knowledge to build campaigns, write compelling email copy, create social media content, set up ad targeting, and interpret analytics. Sovereign AI requires zero marketing experience — our 16 AI systems handle everything autonomously, from writing SEO-optimized blog posts to managing ad bids to responding to reviews. You focus on running your business while the AI handles the marketing.",
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
    priceSavingNote: "Thryv's $199-$499/mo price tag is deceptive — it requires you to do all marketing work yourself or hire someone at $4,000-$6,000/mo to run it. Sovereign AI's all-inclusive $3,497/mo replaces both the software and the marketer with 16 AI systems that deliver results 24/7.",
  },
  {
    slug: "vendasta",
    name: "Vendasta",
    tagline: "Direct relationship with a home-service-specialized AI team vs. generic white-label tools resold through a middleman agency at marked-up prices you cannot verify.",
    description:
      "Vendasta is a white-label platform that sells generic marketing tools to local agencies and resellers, who then mark them up and resell them to you. That means your contractor business gets a middleman between you and the technology, pricing that includes the reseller's profit margin on top of Vendasta's fees, and generic tools designed for every industry from dentists to restaurants — not specifically for home services. The quality of service depends entirely on which reseller you work with, and you have no direct relationship with the platform itself. Sovereign AI eliminates the middleman entirely: you work directly with our team, every AI system is purpose-built for home service lead generation, pricing is transparent with no hidden markups, and you get 16 AI services included in a single flat rate.",
    priceRange: "$500 – $5,000/mo (via resellers)",
    sovereignPrice: "From $3,497/mo (direct)",
    features: [
      { name: "AI Lead Generation", sovereign: true, competitor: false },
      { name: "AI Voice Agents (24/7)", sovereign: true, competitor: false },
      { name: "AI Chatbot", sovereign: "Custom-Trained for Trade", competitor: "Generic White-Label" },
      { name: "SEO", sovereign: "AI-Powered Daily Optimization", competitor: "Resold SEO Tools" },
      { name: "Google Ads", sovereign: "AI Bid Optimization", competitor: "Varies by Reseller" },
      { name: "Facebook/Meta Ads", sovereign: "AI-Managed", competitor: "Varies by Reseller" },
      { name: "Review Management", sovereign: "AI Auto-Response", competitor: "White-Label Dashboard" },
      { name: "Email Marketing", sovereign: "AI-Written Campaigns", competitor: "White-Label Templates" },
      { name: "Social Media Content", sovereign: "AI-Generated 8/Mo", competitor: "Scheduling Only" },
      { name: "Blog Content Creation", sovereign: "AI SEO Articles", competitor: "Via Add-On" },
      { name: "CRM", sovereign: "AI-Powered Pipeline", competitor: "White-Label CRM" },
      { name: "Direct Relationship", sovereign: "Your Dedicated Team", competitor: "Through Reseller" },
      { name: "Home Service Specialized", sovereign: "Trade-Specific AI", competitor: "Generic Multi-Industry" },
      { name: "Transparent Pricing", sovereign: "Flat Rate, No Markup", competitor: "Reseller Markup Unknown" },
      { name: "Retargeting Campaigns", sovereign: "AI-Optimized", competitor: "Via Add-On" },
      { name: "48-Hour Setup", sovereign: true, competitor: "1-4 Weeks via Reseller" },
      { name: "Money-Back Guarantee", sovereign: "60 Days", competitor: false },
    ],
    advantages: [
      "Direct relationship with your dedicated support team vs. going through a middleman reseller who may or may not prioritize your account — you always know exactly who is managing your marketing",
      "Purpose-built AI systems for home service businesses (HVAC, plumbing, electrical, roofing, landscaping) vs. Vendasta's generic white-label tools designed for every industry from dental offices to pet grooming",
      "Transparent flat-rate pricing with all 16 AI services included vs. Vendasta's reseller model where your agency marks up every tool and add-on, often doubling the actual platform cost",
      "Consistent, predictable service quality backed by Sovereign AI's own team vs. Vendasta's reseller model where your experience depends entirely on which local agency you happen to work with",
      "48-hour deployment directly by Sovereign AI vs. weeks of onboarding through a reseller who may be juggling dozens of other clients on the same white-label platform",
      "60-day money-back guarantee from Sovereign AI directly vs. Vendasta resellers who typically offer no guarantee and may lock you into their own separate contract",
      "AI optimization runs autonomously 24/7 vs. Vendasta tools that still require the reseller's team to manually configure, monitor, and adjust campaigns for your business",
    ],
    faqs: [
      {
        question: "What is the best Vendasta alternative for home service businesses?",
        answer: "Sovereign AI is the best Vendasta alternative for contractors and home service companies. Vendasta's white-label reseller model adds a middleman between you and the technology, inflates pricing with agency markups, and delivers generic tools that are not built for any specific industry. Sovereign AI works with you directly — no reseller, no markup — and every one of our 16 AI systems is purpose-built for home service lead generation, from trade-specific chatbots to AI voice agents that understand HVAC, plumbing, and electrical terminology.",
      },
      {
        question: "How does Vendasta pricing compare to Sovereign AI?",
        answer: "Vendasta's platform costs the reseller roughly $500 to $1,500 per month per client, but resellers typically mark this up 2-3x when selling to you, resulting in bills of $1,500 to $5,000 per month — and you rarely know the true cost breakdown. Sovereign AI starts at $3,497 per month with fully transparent pricing: all 16 AI services are included, there are no add-on fees, and there is no middleman markup. You pay one flat rate and get everything.",
      },
      {
        question: "Why choose Sovereign AI over Vendasta?",
        answer: "Five key reasons: (1) Direct relationship with your support team instead of going through a reseller, (2) AI systems purpose-built for home services instead of generic white-label tools, (3) Transparent pricing with no hidden markups, (4) 48-hour deployment instead of weeks of reseller onboarding, and (5) a 60-day money-back guarantee that comes directly from Sovereign AI rather than depending on your reseller's cancellation policies.",
      },
      {
        question: "Can I switch from Vendasta to Sovereign AI?",
        answer: "Yes. Sovereign AI deploys in 48 hours versus the weeks-long onboarding typical of Vendasta resellers. Our migration team handles the full transition — transferring your review profiles, business listings, contact data, and campaign history. You get direct access to your dedicated support team immediately, and most businesses see better results within the first month because our AI systems optimize from day one rather than requiring manual configuration by a reseller.",
      },
      {
        question: "How do I know my Vendasta reseller is not overcharging me?",
        answer: "This is one of the most common concerns with Vendasta's model — and it is difficult to verify. Because Vendasta sells white-label tools to agencies, you typically see the agency's branded invoice with their markup baked in, not Vendasta's actual platform cost. You have no way to audit the true cost of the tools you are using. Sovereign AI eliminates this concern entirely with transparent, direct pricing. Our $3,497/mo flat rate includes all 16 AI services with no hidden fees, no add-on charges, and no middleman margin.",
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
    priceSavingNote: "Vendasta resellers typically mark up platform costs 2-3x — a $500/mo tool becomes $1,500/mo on your invoice. Sovereign AI's transparent $3,497/mo includes all 16 AI services directly, with no middleman margin, no add-on fees, and a 60-day money-back guarantee.",
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
    tagline: "AI-powered lead generation filling your pipeline vs. field-service software managing jobs after you already have them. 16 marketing systems vs. dispatching and invoicing — and they work even better together.",
    description:
      "ServiceTitan is the industry-leading field-service management platform, excellent at dispatching, scheduling, invoicing, GPS tracking, and job costing. But it does not generate a single new lead. No SEO, no ad management, no content creation, no AI voice agents, no proactive lead generation. Most ServiceTitan customers spend $3,000-$6,000/month on a separate marketing agency to fill the pipeline that ServiceTitan then manages. Sovereign AI replaces that outside agency with 16 autonomous AI marketing systems — including AI-powered lead generation, SEO optimization, Google and Facebook ad management, content creation, review management, and AI voice agents — all for less than the cost of a typical marketing agency. The two platforms complement each other perfectly: Sovereign AI fills your pipeline, ServiceTitan manages the jobs.",
    priceRange: "$2,500 – $8,000+/mo",
    sovereignPrice: "From $3,497/mo (all 16 services)",
    features: [
      { name: "AI Lead Generation", sovereign: true, competitor: false },
      { name: "AI Voice Agents (24/7)", sovereign: true, competitor: false },
      { name: "AI Chatbot", sovereign: "Custom-Trained", competitor: false },
      { name: "SEO Management", sovereign: "AI-Optimized Daily", competitor: false },
      { name: "Google Ads", sovereign: "AI Bid Optimization", competitor: false },
      { name: "Facebook/Meta Ads", sovereign: "AI-Managed", competitor: false },
      { name: "Review Management", sovereign: "AI Auto-Response", competitor: "Basic Request System" },
      { name: "Email Marketing", sovereign: "AI-Written Campaigns", competitor: "Basic Drip Sequences" },
      { name: "Social Media Content", sovereign: "AI-Generated 8/Mo", competitor: false },
      { name: "Blog Content Creation", sovereign: "AI SEO Articles", competitor: false },
      { name: "Marketing CRM", sovereign: "AI-Powered Pipeline", competitor: "Job-Focused CRM" },
      { name: "Retargeting Campaigns", sovereign: "AI-Optimized", competitor: false },
      { name: "Reputation Shield (24/7)", sovereign: true, competitor: false },
      { name: "Dispatching & Scheduling", sovereign: false, competitor: true },
      { name: "Invoicing & Payments", sovereign: false, competitor: true },
      { name: "GPS Fleet Tracking", sovereign: false, competitor: true },
      { name: "Job Costing & Estimates", sovereign: false, competitor: true },
      { name: "Done-For-You Marketing", sovereign: true, competitor: false },
      { name: "No Long-Term Contract", sovereign: true, competitor: "Annual Contract Required" },
      { name: "48-Hour Setup", sovereign: true, competitor: "4-8 Week Onboarding" },
      { name: "Money-Back Guarantee", sovereign: "60 Days", competitor: false },
    ],
    advantages: [
      "16 AI marketing systems that proactively generate new leads vs. ServiceTitan's zero marketing capabilities — ServiceTitan is excellent at managing jobs after you book them, but it does nothing to bring new customers to your door",
      "Replaces the $3,000-$6,000/month outside marketing agency that most ServiceTitan users already pay for — Sovereign AI delivers better results through AI automation at a lower cost than hiring a traditional agency",
      "AI voice agents answer every call 24/7 and book appointments directly into your calendar vs. missed calls going to voicemail during off-hours — the average contractor misses 30-40% of inbound calls, each worth $500-$2,000 in potential revenue",
      "No annual contract requirement — ServiceTitan locks you into multi-year agreements with significant early termination costs; Sovereign AI offers month-to-month billing with a 60-day money-back guarantee",
      "48-hour deployment vs. ServiceTitan's 4-8 week onboarding process — your AI marketing systems start generating leads within days, not months",
      "Perfectly complements ServiceTitan — use Sovereign AI to fill your pipeline with qualified leads, then use ServiceTitan to dispatch technicians, track jobs, and process payments; together they cover the entire customer lifecycle",
      "Full SEO, ad management, and AI content creation included — ServiceTitan's Marketing Pro add-on provides basic call tracking and a few reports, but does not actively manage campaigns, create content, or optimize your online presence",
    ],
    faqs: [
      {
        question: "What is the best ServiceTitan alternative for marketing?",
        answer: "Sovereign AI is the best marketing solution for ServiceTitan users — and the two platforms work together, not against each other. ServiceTitan is a field-service management tool for dispatching, invoicing, GPS tracking, and job costing — it does not generate leads, run ad campaigns, manage SEO, create content, or provide AI voice agents. Sovereign AI fills the entire marketing gap with 16 AI-powered services that proactively bring in new customers while ServiceTitan manages the operational side.",
      },
      {
        question: "How does ServiceTitan pricing compare to Sovereign AI?",
        answer: "ServiceTitan costs $2,500 to $8,000+ per month with mandatory annual contracts for field-service management operations. Sovereign AI starts at $3,497 per month with no long-term commitment for 16 AI marketing services. They serve different purposes: ServiceTitan manages your operations after you get a job, while Sovereign AI generates the leads that become jobs. Most contractors use both — and Sovereign AI replaces the $3,000-$6,000/month marketing agency they were already paying on top of ServiceTitan.",
      },
      {
        question: "Can I use Sovereign AI and ServiceTitan together?",
        answer: "Yes — this is the recommended approach and the most common setup among our clients. Sovereign AI handles lead generation, SEO, Google and Facebook ads, AI content creation, review management, AI voice agents, and email campaigns to fill your pipeline with qualified leads. ServiceTitan handles dispatching, scheduling, invoicing, GPS tracking, and job costing to manage those jobs efficiently. Together they cover the entire customer lifecycle from first click to final invoice.",
      },
      {
        question: "Why do ServiceTitan users add Sovereign AI?",
        answer: "The number one complaint from ServiceTitan users is that the platform does not help them get more customers. ServiceTitan's Marketing Pro add-on offers basic call tracking and attribution reporting, but it does not run ad campaigns, optimize SEO, create content, manage social media, or provide AI voice agents. Sovereign AI fills every one of these gaps with 16 autonomous AI systems, and typically replaces the separate marketing agency that most ServiceTitan users are already paying $3,000-$6,000/month for.",
      },
      {
        question: "Does Sovereign AI integrate with ServiceTitan?",
        answer: "Sovereign AI is designed to work alongside ServiceTitan as complementary platforms. Leads generated by Sovereign AI's 16 AI systems — from AI voice agents to SEO to ad campaigns — flow into your pipeline where ServiceTitan takes over for dispatching and job management. Our team helps configure the handoff during the 48-hour setup process so new leads are routed seamlessly into your existing ServiceTitan workflow.",
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
    priceSavingNote: "ServiceTitan manages operations but generates zero leads. Most ServiceTitan users spend $3,000-$6,000/mo on a separate marketing agency. Sovereign AI replaces that agency with 16 AI marketing systems at a lower cost — and works alongside ServiceTitan for complete coverage.",
  },
  {
    slug: "jobber",
    name: "Jobber",
    tagline: "Full AI marketing engine generating new customers vs. quoting and scheduling software managing jobs you already have. 16 lead-generation systems filling your calendar vs. a tool that organizes an empty one.",
    description:
      "Jobber is a popular field-service management app designed for small to mid-size home service businesses. It excels at quoting, scheduling, invoicing, and client communication — making it easy to manage jobs once you have them. But Jobber does not generate a single new lead. No SEO, no ad management, no content creation, no AI voice agents, no proactive marketing of any kind. Jobber's own marketing features are limited to basic review request emails and simple email campaigns. For growing businesses, this creates a critical gap: a beautifully organized calendar with not enough jobs on it. Sovereign AI fills that gap with 16 AI marketing systems that actively bring in new customers through SEO, Google and Facebook ads, AI voice agents, content creation, review management, and more — all done for you. The two platforms work perfectly together: Sovereign AI fills the pipeline, Jobber manages the work.",
    priceRange: "$39 – $349/mo",
    sovereignPrice: "From $3,497/mo (all 16 services)",
    features: [
      { name: "AI Lead Generation", sovereign: true, competitor: false },
      { name: "AI Voice Agents (24/7)", sovereign: true, competitor: false },
      { name: "AI Chatbot", sovereign: "Custom-Trained", competitor: false },
      { name: "SEO Management", sovereign: "AI-Optimized Daily", competitor: false },
      { name: "Google Ads", sovereign: "AI Bid Optimization", competitor: false },
      { name: "Facebook/Meta Ads", sovereign: "AI-Managed", competitor: false },
      { name: "Review Management", sovereign: "AI Auto-Response", competitor: "Basic Email Requests" },
      { name: "Email Marketing", sovereign: "AI-Written Campaigns", competitor: "Simple Templates" },
      { name: "Social Media Content", sovereign: "AI-Generated 8/Mo", competitor: false },
      { name: "Blog Content Creation", sovereign: "AI SEO Articles", competitor: false },
      { name: "Marketing CRM", sovereign: "AI-Powered Pipeline", competitor: "Basic Client List" },
      { name: "Retargeting Campaigns", sovereign: "AI-Optimized", competitor: false },
      { name: "Reputation Shield (24/7)", sovereign: true, competitor: false },
      { name: "Quoting & Estimates", sovereign: false, competitor: true },
      { name: "Job Scheduling & Dispatch", sovereign: false, competitor: true },
      { name: "Invoicing & Payments", sovereign: false, competitor: true },
      { name: "Client Hub Portal", sovereign: false, competitor: true },
      { name: "Done-For-You Marketing", sovereign: true, competitor: false },
      { name: "No Long-Term Contract", sovereign: true, competitor: true },
      { name: "48-Hour Setup", sovereign: true, competitor: true },
      { name: "Money-Back Guarantee", sovereign: "60 Days", competitor: "14-Day Trial" },
    ],
    advantages: [
      "16 AI marketing systems that proactively generate new leads and customers vs. Jobber's zero marketing capabilities — Jobber is excellent at managing jobs you already have, but it will not bring a single new customer to your door",
      "AI voice agents answer every inbound call 24/7, qualify leads, and book appointments directly vs. missed calls going to voicemail when you are on a job site — contractors using Jobber alone miss 30-40% of calls that could be worth $500-$2,000 each",
      "Full SEO optimization, Google Ads management, and Facebook ad campaigns included — Jobber users typically spend $2,000-$5,000/month on a separate marketing agency or freelancer for these services, which Sovereign AI handles autonomously",
      "AI content engine produces 8 SEO-optimized blog posts and social media updates monthly to build your online presence vs. Jobber's zero content creation capabilities — consistent content is critical for ranking in local search results",
      "Complements Jobber perfectly — use Sovereign AI to fill your calendar with qualified leads through AI-powered marketing, then use Jobber to manage quotes, scheduling, invoicing, and client communication for those jobs",
      "60-day money-back guarantee with no contract vs. Jobber's 14-day free trial — if Sovereign AI does not deliver measurable results in two months, you pay nothing",
      "AI-automated review management responds to every Google and Facebook review within minutes and proactively requests reviews from happy customers vs. Jobber's basic review request emails that most customers ignore",
    ],
    faqs: [
      {
        question: "What is the best Jobber alternative for lead generation?",
        answer: "Sovereign AI is the best lead generation solution for Jobber users — and it is designed to work alongside Jobber, not replace it. Jobber is a job management tool for quoting, scheduling, and invoicing — it does not generate leads, run ad campaigns, manage SEO, create content, or provide AI voice agents. Sovereign AI fills the entire marketing gap with 16 AI-powered services that actively bring in new customers. Most of our clients use both platforms together: Sovereign AI fills the pipeline, Jobber manages the jobs.",
      },
      {
        question: "How does Jobber pricing compare to Sovereign AI?",
        answer: "Jobber costs $39 to $349 per month for job management software (quoting, scheduling, invoicing). Sovereign AI starts at $3,497 per month for 16 AI marketing services (lead generation, SEO, ads, content, reviews, AI voice agents). They serve completely different purposes and are not interchangeable. The real comparison is Sovereign AI vs. the $2,000-$5,000/month marketing agency or freelancers that most Jobber users already pay for — Sovereign AI replaces that spend with AI-powered automation that runs 24/7.",
      },
      {
        question: "Can I use Sovereign AI and Jobber together?",
        answer: "Absolutely — this is the recommended setup and how most of our contractor clients operate. Sovereign AI handles lead generation, SEO, Google and Facebook ads, AI content creation, review management, email campaigns, and AI voice agents to bring in new customers around the clock. Jobber handles quoting, scheduling, dispatching, invoicing, and client communication after you book the job. Together they cover the full customer lifecycle from first Google search to final payment.",
      },
      {
        question: "Do I need Sovereign AI if I already use Jobber?",
        answer: "Yes, if you want to grow your business and fill your calendar with more jobs. Jobber helps you efficiently manage the jobs you already have, but it does nothing to bring in new customers. Without a marketing system, you are relying on word of mouth and repeat business alone. Sovereign AI's 16 AI marketing systems actively generate new leads through SEO, ad campaigns, AI content creation, AI voice agents, and review management — filling your Jobber calendar with qualified jobs.",
      },
      {
        question: "How quickly will I see results after adding Sovereign AI to my Jobber setup?",
        answer: "Sovereign AI deploys in 48 hours, and most Jobber users see new leads within the first 1-2 weeks. AI voice agents start answering missed calls immediately, review management activates within 24 hours, and AI-optimized ad campaigns typically generate leads within the first 7 days. SEO and content marketing build momentum over 30-90 days for long-term organic lead generation. Our 60-day money-back guarantee means there is zero risk in trying it alongside your existing Jobber setup.",
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
    priceSavingNote: "Jobber's $39-$349/mo manages jobs you already have but generates zero new leads. Most Jobber users spend $2,000-$5,000/mo on separate marketing agencies or freelancers. Sovereign AI replaces that outside marketing spend with 16 AI systems that deliver more leads at a lower total cost — and works alongside Jobber for complete business coverage.",
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
