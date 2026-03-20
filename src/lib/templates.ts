/**
 * Industry Template Library — Static seed data
 *
 * ~30 pre-built marketing playbooks across 6 verticals + 5 template categories.
 */

export interface TemplateSeed {
  category: string;
  vertical: string;
  name: string;
  description: string;
  content: string; // JSON string
  tags: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VERTICALS = [
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

function label(v: string) {
  return VERTICAL_LABELS[v] || v;
}

// ---------------------------------------------------------------------------
// Template Generators per Category
// ---------------------------------------------------------------------------

function emailSequence(v: string): TemplateSeed {
  return {
    category: "email_sequence",
    vertical: v,
    name: `${label(v)} — Welcome + First Service Drip`,
    description: `A 3-email welcome sequence for new ${label(v).toLowerCase()} customers. Introduces your business, builds trust, and offers a first-service discount.`,
    content: JSON.stringify([
      {
        emailNumber: 1,
        delay: "immediate",
        subject: `Welcome to {{businessName}} — Your Trusted ${label(v)} Partner`,
        body: `Hi {{firstName}},\n\nThank you for choosing {{businessName}}! We've been serving {{city}} for over {{years}} years, and we're excited to have you.\n\nHere's what to expect:\n- Fast, reliable service\n- Upfront pricing — no surprises\n- 100% satisfaction guarantee\n\nNeed help right away? Call us at {{phone}} or book online.\n\nBest,\n{{ownerName}}`,
      },
      {
        emailNumber: 2,
        delay: "3 days",
        subject: `5 ${label(v)} Tips Every Homeowner Should Know`,
        body: `Hi {{firstName}},\n\nHere are 5 quick tips to keep your ${v === "hvac" ? "HVAC system" : v === "plumbing" ? "plumbing" : v === "roofing" ? "roof" : v === "electrical" ? "electrical system" : v === "landscaping" ? "lawn" : "home"} in top shape:\n\n1. Schedule regular maintenance\n2. Address small issues before they become big ones\n3. Know when to call a professional\n4. Keep records of all service visits\n5. Ask about seasonal checkups\n\nWant a free inspection? Reply to this email or call {{phone}}.\n\nBest,\n{{ownerName}}`,
      },
      {
        emailNumber: 3,
        delay: "7 days",
        subject: `Special Offer: 10% Off Your First ${label(v)} Service`,
        body: `Hi {{firstName}},\n\nAs a welcome gift, we'd like to offer you 10% off your first service with {{businessName}}.\n\nUse code: WELCOME10 when you book.\n\nThis offer expires in 14 days, so don't wait!\n\nBook now: {{bookingUrl}}\n\nLooking forward to serving you,\n{{ownerName}}`,
      },
    ]),
    tags: ["email", "drip", "welcome", "onboarding", v],
  };
}

function socialCalendar(v: string): TemplateSeed {
  const topics = {
    hvac: [
      "Spring AC tune-up reminder",
      "How to change your air filter",
      "Signs your furnace needs repair",
      "Energy savings tips for summer",
      "Before & after duct cleaning",
      "Customer testimonial spotlight",
      "Why annual maintenance matters",
      "Common HVAC myths debunked",
      "Holiday comfort prep checklist",
      "Meet our technician team",
      "Smart thermostat benefits",
      "Emergency HVAC tips",
    ],
    plumbing: [
      "Prevent frozen pipes this winter",
      "DIY vs professional plumbing",
      "Signs of a hidden water leak",
      "Before & after bathroom remodel",
      "Water heater maintenance tips",
      "Customer review highlight",
      "How to unclog a drain safely",
      "Sump pump readiness checklist",
      "Meet the team Monday",
      "Kitchen plumbing upgrades",
      "Water conservation tips",
      "Emergency plumbing 101",
    ],
    roofing: [
      "Spring roof inspection checklist",
      "Signs you need a new roof",
      "Before & after roof replacement",
      "Storm damage — what to do first",
      "How to choose roofing materials",
      "Customer success story",
      "Gutter maintenance tips",
      "Roof lifespan by material type",
      "Meet our crew",
      "Insurance claim tips",
      "Fall prep for your roof",
      "Holiday lighting safety on roofs",
    ],
    electrical: [
      "Electrical safety tips for families",
      "Signs of outdated wiring",
      "Before & after panel upgrade",
      "Generator readiness guide",
      "LED lighting benefits",
      "Customer testimonial spotlight",
      "Surge protector 101",
      "Smart home wiring trends",
      "Meet our licensed electricians",
      "Outdoor lighting ideas",
      "Holiday decorating electrical safety",
      "EV charger installation FAQ",
    ],
    landscaping: [
      "Spring lawn care kickoff",
      "Mulching tips for healthy gardens",
      "Before & after landscape design",
      "Irrigation system prep",
      "Best plants for your region",
      "Customer yard transformation",
      "Lawn mowing height guide",
      "Patio & hardscape ideas",
      "Meet our landscape crew",
      "Fall cleanup checklist",
      "Winter lawn protection",
      "Curb appeal on a budget",
    ],
    pest_control: [
      "Spring pest prevention guide",
      "Common signs of termite damage",
      "Before & after treatment results",
      "Mosquito season prep",
      "Pet-safe pest control options",
      "Customer success story",
      "Ant control tips for kitchens",
      "Bed bug awareness",
      "Meet our technicians",
      "Fall rodent prevention",
      "Holiday pest-proofing",
      "Year-round pest schedule",
    ],
  };

  const postTopics = topics[v as keyof typeof topics] || topics.hvac;

  return {
    category: "social_calendar",
    vertical: v,
    name: `${label(v)} — Monthly Content Calendar`,
    description: `12 ready-to-post social media content ideas for ${label(v).toLowerCase()} businesses. One post per week with suggested captions and content types.`,
    content: JSON.stringify(
      postTopics.map((topic, i) => ({
        week: i + 1,
        topic,
        platform: i % 3 === 0 ? "facebook" : i % 3 === 1 ? "instagram" : "google",
        contentType: i % 4 === 0 ? "photo" : i % 4 === 1 ? "video" : i % 4 === 2 ? "carousel" : "text",
        caption: `${topic} — Contact {{businessName}} today for expert ${label(v).toLowerCase()} service in {{city}}! #${label(v).replace(/\s/g, "")} #LocalBusiness #{{city}}`,
      }))
    ),
    tags: ["social", "calendar", "content", v],
  };
}

function adCampaign(v: string): TemplateSeed {
  const adData: Record<string, { headline: string; description: string; keywords: string[] }> = {
    hvac: {
      headline: "{{city}} HVAC Repair — Fast Same-Day Service",
      description:
        "Licensed HVAC technicians near you. AC repair, furnace installation & maintenance. Free estimates. Call now!",
      keywords: [
        "hvac repair near me",
        "ac repair {{city}}",
        "furnace installation",
        "hvac service {{city}}",
        "air conditioning repair",
        "heating repair near me",
      ],
    },
    plumbing: {
      headline: "{{city}} Plumber — 24/7 Emergency Service",
      description:
        "Licensed plumbers ready now. Drain cleaning, water heaters, leak repair. Upfront pricing. Book today!",
      keywords: [
        "plumber near me",
        "emergency plumber {{city}}",
        "drain cleaning",
        "water heater repair",
        "plumbing service {{city}}",
        "leak repair near me",
      ],
    },
    roofing: {
      headline: "{{city}} Roofing — Free Inspection & Estimate",
      description:
        "Trusted roofing contractors. Roof repair, replacement & storm damage. Licensed & insured. Get your free quote!",
      keywords: [
        "roofing contractors near me",
        "roof repair {{city}}",
        "roof replacement",
        "storm damage roof",
        "roofing company {{city}}",
        "new roof estimate",
      ],
    },
    electrical: {
      headline: "{{city}} Electrician — Licensed & Insured",
      description:
        "Expert electrical services. Panel upgrades, rewiring, lighting & more. Same-day appointments available!",
      keywords: [
        "electrician near me",
        "electrical repair {{city}}",
        "panel upgrade",
        "licensed electrician",
        "electrical service {{city}}",
        "wiring repair near me",
      ],
    },
    landscaping: {
      headline: "{{city}} Landscaping — Transform Your Yard",
      description:
        "Professional landscaping design & maintenance. Lawn care, hardscaping, irrigation. Free consultations!",
      keywords: [
        "landscaping near me",
        "lawn care {{city}}",
        "landscape design",
        "yard maintenance",
        "landscaping company {{city}}",
        "hardscaping near me",
      ],
    },
    pest_control: {
      headline: "{{city}} Pest Control — Safe & Effective",
      description:
        "Licensed pest control experts. Termites, ants, rodents & more. Family & pet-safe treatments. Call today!",
      keywords: [
        "pest control near me",
        "exterminator {{city}}",
        "termite treatment",
        "rodent control",
        "pest control service {{city}}",
        "ant exterminator near me",
      ],
    },
  };

  const data = adData[v] || adData.hvac;

  return {
    category: "ad_campaign",
    vertical: v,
    name: `${label(v)} — Local Lead Gen Campaign`,
    description: `Google Ads campaign template optimized for local ${label(v).toLowerCase()} lead generation. Includes headline, description, and target keywords.`,
    content: JSON.stringify({
      platform: "google",
      headline: data.headline,
      description: data.description,
      keywords: data.keywords,
      callToAction: "Get Free Estimate",
      dailyBudget: 5000, // $50/day in cents
      targetRadius: "25 miles",
      adExtensions: [
        "Call extension: {{phone}}",
        "Location extension: {{address}}",
        "Sitelink: Emergency Service",
        "Sitelink: Free Estimates",
      ],
    }),
    tags: ["ads", "google", "lead-gen", "local", v],
  };
}

function chatbotScript(v: string): TemplateSeed {
  const greetings: Record<string, string> = {
    hvac: "Hi there! Need help with your heating or cooling system? I can help you schedule a service call or get a free estimate.",
    plumbing:
      "Hello! Having a plumbing issue? I can help you schedule a service call or get answers to common plumbing questions.",
    roofing:
      "Hi! Looking for roofing help? Whether it's a repair, inspection, or full replacement, I'm here to help.",
    electrical:
      "Hello! Need electrical work done? I can help you schedule an appointment with our licensed electricians.",
    landscaping:
      "Hi there! Ready to transform your outdoor space? I can help you schedule a free consultation.",
    pest_control:
      "Hello! Dealing with unwanted pests? I can help you schedule an inspection or treatment right away.",
  };

  return {
    category: "chatbot_script",
    vertical: v,
    name: `${label(v)} — Lead Qualifier Script`,
    description: `AI chatbot script that greets visitors, asks qualifying questions, and captures lead information for ${label(v).toLowerCase()} businesses.`,
    content: JSON.stringify({
      greeting: greetings[v] || greetings.hvac,
      qualifyingQuestions: [
        {
          question: "What type of service do you need?",
          options: v === "hvac"
            ? ["AC Repair", "Heating Repair", "Installation", "Maintenance", "Other"]
            : v === "plumbing"
            ? ["Drain Cleaning", "Leak Repair", "Water Heater", "Remodel", "Other"]
            : v === "roofing"
            ? ["Roof Repair", "Roof Replacement", "Inspection", "Storm Damage", "Other"]
            : v === "electrical"
            ? ["Repair", "Panel Upgrade", "Lighting", "Wiring", "Other"]
            : v === "landscaping"
            ? ["Lawn Care", "Design", "Hardscaping", "Irrigation", "Other"]
            : ["Termites", "Ants/Insects", "Rodents", "Mosquitoes", "Other"],
        },
        {
          question: "How urgent is this?",
          options: ["Emergency — need help today", "This week", "Just getting quotes", "Planning ahead"],
        },
        {
          question: "What's the best way to reach you?",
          options: ["Phone call", "Text message", "Email"],
        },
      ],
      leadCaptureFields: ["name", "phone", "email", "address"],
      closingMessage:
        "Thanks for the info! One of our team members will reach out to you shortly. If this is an emergency, please call us directly at {{phone}}.",
    }),
    tags: ["chatbot", "lead-qualifier", "conversational", v],
  };
}

function landingPage(v: string): TemplateSeed {
  const bulletPoints: Record<string, string[]> = {
    hvac: [
      "Same-day AC & heating repair",
      "Licensed, bonded & insured technicians",
      "Upfront pricing — no hidden fees",
      "24/7 emergency service available",
      "100% satisfaction guarantee",
    ],
    plumbing: [
      "24/7 emergency plumbing service",
      "Licensed master plumbers",
      "Upfront pricing before we start",
      "Same-day appointments available",
      "Lifetime warranty on select repairs",
    ],
    roofing: [
      "Free roof inspection & estimate",
      "Licensed, bonded & fully insured",
      "Storm damage specialists",
      "Financing options available",
      "25-year workmanship warranty",
    ],
    electrical: [
      "Same-day electrical service",
      "Licensed master electricians",
      "Upfront pricing — no surprises",
      "Code-compliant installations",
      "Safety inspection included",
    ],
    landscaping: [
      "Free landscape design consultation",
      "Licensed & insured team",
      "Custom designs for any budget",
      "Year-round maintenance plans",
      "Satisfaction guaranteed",
    ],
    pest_control: [
      "Same-day pest inspection",
      "Family & pet-safe treatments",
      "Licensed & certified technicians",
      "Guaranteed results or we come back free",
      "Year-round protection plans",
    ],
  };

  return {
    category: "landing_page",
    vertical: v,
    name: `${label(v)} — Emergency Service Landing Page`,
    description: `High-converting landing page template for ${label(v).toLowerCase()} emergency services. Includes headline, CTA, and trust-building bullet points.`,
    content: JSON.stringify({
      headline: `Need Emergency ${label(v)} Service in {{city}}?`,
      subheadline: `Trusted by hundreds of homeowners. Fast response. Fair prices.`,
      cta: "Get a Free Estimate Now",
      ctaSecondary: "Call {{phone}} — Available 24/7",
      bulletPoints: bulletPoints[v] || bulletPoints.hvac,
      socialProof: {
        reviewCount: "{{reviewCount}}",
        avgRating: "{{avgRating}}",
        text: "Rated {{avgRating}} stars by {{reviewCount}}+ customers on Google",
      },
      formFields: ["name", "phone", "email", "serviceNeeded", "preferredTime"],
      urgencyBanner: "Limited Time: $50 Off Any Service — Book Today!",
    }),
    tags: ["landing-page", "emergency", "conversion", v],
  };
}

// ---------------------------------------------------------------------------
// Full Seed Array (~30 templates)
// ---------------------------------------------------------------------------

export const TEMPLATE_SEEDS: TemplateSeed[] = VERTICALS.flatMap((v) => [
  emailSequence(v),
  socialCalendar(v),
  adCampaign(v),
  chatbotScript(v),
  landingPage(v),
]);

