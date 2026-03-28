import { prisma } from "@/lib/db";
import { createNotificationForClient } from "@/lib/notifications";
import { logger } from "@/lib/logger";
import {
  guardedAnthropicCall,
  GovernanceBlockedError,
} from "@/lib/governance/ai-guard";
import {
  extractTextContent,
  extractJSONContent,
  sanitizeForPrompt,
} from "@/lib/ai-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LandingPageResult {
  html: string;
  title: string;
  metaDescription: string;
  contentJobId: string;
}

export interface HomepageCopyResult {
  hero: {
    headline: string;
    subheadline: string;
    ctaText: string;
  };
  about: {
    heading: string;
    body: string;
  };
  services: Array<{
    name: string;
    description: string;
  }>;
  testimonials: {
    heading: string;
    placeholder: string;
  };
  cta: {
    heading: string;
    subheading: string;
    buttonText: string;
  };
}

// ---------------------------------------------------------------------------
// Provisioning (existing)
// ---------------------------------------------------------------------------

/**
 * Provision the website service for a client.
 * Sets up the website project config with defaults based on the client's
 * business info and creates initial content/blog post draft.
 */
export async function provisionWebsite(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const vertical = client.vertical ?? "home service";
  const city = client.city ?? "";
  const state = client.state ?? "";
  const location =
    city && state ? `${city}, ${state}` : city || state || "your area";

  const websiteConfig = {
    projectStatus: "queued",
    template: "modern-service-pro",
    pages: ["home", "about", "services", "contact", "reviews", "blog"],
    features: [
      "mobile-responsive",
      "seo-optimized",
      "chatbot-widget",
      "lead-capture-forms",
      "google-analytics",
      "ssl-certificate",
    ],
    branding: {
      businessName: client.businessName,
      vertical,
      location,
    },
    estimatedDelivery: "5-7 business days",
  };

  const clientService = await prisma.clientService.findUnique({
    where: { clientId_serviceId: { clientId, serviceId: "website" } },
  });

  if (clientService) {
    await prisma.clientService.update({
      where: { id: clientService.id },
      data: { config: JSON.stringify(websiteConfig) },
    });
  }

  const existingContent = await prisma.contentJob.findFirst({
    where: { clientId },
  });

  if (!existingContent) {
    await prisma.contentJob.create({
      data: {
        clientId,
        type: "blog",
        title: `Why ${client.businessName} Is the Top Choice for ${vertical.charAt(0).toUpperCase() + vertical.slice(1)} in ${location}`,
        status: "queued",
        content: `When it comes to reliable ${vertical} services in ${location}, ${client.businessName} stands apart. With a commitment to quality workmanship, transparent pricing, and exceptional customer service, we've built a reputation that speaks for itself.\n\nOur team of experienced professionals is available to handle any project, big or small. Whether you need routine maintenance or emergency service, we're here to help.\n\nContact us today for a free estimate!`,
      },
    });
  }

  await createNotificationForClient(clientId, {
    type: "service",
    title: "Website Build Queued",
    message: `Your professional website build has been queued. Design begins within 48 hours. We'll notify you when the first draft is ready for review.`,
    actionUrl: "/dashboard",
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "content_published",
      title: "Website service activated",
      description: `Your professional website build has been queued for ${client.businessName}. A starter blog post has been drafted. Design will begin within 48 hours.`,
    },
  });
}

// ---------------------------------------------------------------------------
// generateLandingPage — service + location specific landing page
// ---------------------------------------------------------------------------

/**
 * Generate a landing page with HTML content for a specific service
 * and location combination.
 *
 * Creates a ContentJob record and returns ready-to-use HTML content
 * optimized for conversions and local SEO.
 *
 * @param clientId - The client to generate for
 * @param service  - The specific service (e.g., "AC Repair", "Drain Cleaning")
 * @param city     - The target city/location
 */
export async function generateLandingPage(
  clientId: string,
  service: string,
  city: string
): Promise<LandingPageResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const safeOwnerName = sanitizeForPrompt(client.ownerName, 100);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const safeService = sanitizeForPrompt(service, 200);
  const safeCity = sanitizeForPrompt(city, 200);
  const state = client.state || "";

  const job = await prisma.contentJob.create({
    data: {
      clientId,
      type: "service_page",
      title: `${service} in ${city} | ${client.businessName}`,
      keywords: `${service} ${city}, ${service} near me, best ${service} ${city}`,
      status: "generating",
    },
  });

  const systemPrompt = `You are a landing page copywriter and HTML developer specializing in high-converting pages for local ${safeVertical} businesses. You write persuasive, SEO-optimized content that drives leads.`;

  const userPrompt = `Create a complete landing page for ${safeBusinessName} targeting "${safeService} in ${safeCity}${state ? `, ${state}` : ""}".

The page should include these sections as clean, semantic HTML:
1. HERO: Compelling headline with service + location, subheadline, and CTA button
2. TRUST BAR: Licensed, insured, years of experience, rating badges
3. SERVICES: 3-4 specific ${safeService} services offered with descriptions
4. WHY CHOOSE US: 3-4 differentiators specific to ${safeBusinessName}
5. PROCESS: Simple 3-step "How It Works" section
6. FAQ: 3-4 common questions about ${safeService} in ${safeCity}
7. CTA: Final call-to-action section with phone number and form prompt

HTML requirements:
- Use clean semantic HTML with Tailwind-style class names (for styling reference)
- Use section tags with clear IDs for each section
- Include schema.org LocalBusiness and FAQ structured data as JSON-LD script tags
- Do NOT include <html>, <head>, or <body> tags — just the inner content sections
- Use placeholder href="#" for links and "tel:${client.phone || '5551234567'}" for phone CTAs
- Include alt text on any image placeholders

Return a JSON object with:
- "html": the complete landing page HTML content
- "title": SEO title tag (60 chars max)
- "metaDescription": meta description (155 chars max)`;

  let html: string;
  let title: string;
  let metaDescription: string;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "website.landingpage",
      description: `Generate landing page: ${safeService} in ${safeCity}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<{
      html?: string;
      title?: string;
      metaDescription?: string;
    }>(response, {});

    html = parsed.html || extractTextContent(response, "");
    title = parsed.title || `${service} in ${city} | ${client.businessName}`;
    metaDescription =
      parsed.metaDescription ||
      `Professional ${service} in ${city} by ${client.businessName}. Licensed & insured. Call for a free estimate today.`;
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      await prisma.contentJob.update({ where: { id: job.id }, data: { status: "failed" } });
      throw error;
    }
    logger.errorWithCause("[website] Landing page generation failed:", error);
    html = generateFallbackLandingPage(client.businessName, client.ownerName, service, city, client.vertical || "home service", client.phone || "");
    title = `${service} in ${city} | ${client.businessName}`;
    metaDescription = `Professional ${service} in ${city} by ${client.businessName}. Call for a free estimate.`;
  }

  if (!html) {
    html = generateFallbackLandingPage(client.businessName, client.ownerName, service, city, client.vertical || "home service", client.phone || "");
  }

  await prisma.contentJob.update({
    where: { id: job.id },
    data: {
      title,
      content: html,
      status: "published",
      publishAt: new Date(),
    },
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "content_published",
      title: `Landing page created: ${service} in ${city}`,
      description: `SEO-optimized landing page generated for "${service} in ${city}" with FAQ schema and conversion-focused layout.`,
    },
  });

  return {
    html,
    title,
    metaDescription,
    contentJobId: job.id,
  };
}

// ---------------------------------------------------------------------------
// generateHomepageCopy — homepage section content
// ---------------------------------------------------------------------------

/**
 * Generate copy for all major homepage sections: hero, about, services,
 * testimonials placeholder, and final CTA.
 *
 * @param clientId - The client to generate homepage copy for
 */
export async function generateHomepageCopy(
  clientId: string
): Promise<HomepageCopyResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeOwnerName = sanitizeForPrompt(client.ownerName, 100);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const location = [client.city, client.state].filter(Boolean).join(", ");
  const safeLocation = location ? sanitizeForPrompt(location, 200) : "";

  const systemPrompt = `You are a website copywriter for local ${safeVertical} businesses. Write conversion-focused homepage copy that builds trust and drives leads. Sound professional but approachable — like a trusted local business, not a corporation.`;

  const userPrompt = `Write homepage copy for ${safeBusinessName}${safeLocation ? ` in ${safeLocation}` : ""} (owner: ${safeOwnerName}).

Generate copy for these sections:

1. HERO: Headline (10 words max), subheadline (20 words max), CTA button text
2. ABOUT: Section heading, 2-3 paragraph body about the business (150-200 words)
3. SERVICES: 4-6 services with name and 1-sentence description
4. TESTIMONIALS: Section heading and a placeholder note
5. CTA: Final section heading, subheading, and button text

Return a JSON object with:
- "hero": { "headline", "subheadline", "ctaText" }
- "about": { "heading", "body" }
- "services": array of { "name", "description" }
- "testimonials": { "heading", "placeholder" }
- "cta": { "heading", "subheading", "buttonText" }`;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "website.homepage",
      description: `Generate homepage copy for ${safeBusinessName}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<Partial<HomepageCopyResult>>(response, {});

    const result: HomepageCopyResult = {
      hero: parsed.hero || {
        headline: `Your Trusted ${safeVertical} Pros${safeLocation ? ` in ${safeLocation}` : ""}`,
        subheadline: `${safeBusinessName} delivers reliable, professional ${safeVertical} services. Licensed, insured, and committed to your satisfaction.`,
        ctaText: "Get Your Free Estimate",
      },
      about: parsed.about || {
        heading: `About ${safeBusinessName}`,
        body: `${safeBusinessName} has been proudly serving ${safeLocation || "the local community"} with professional ${safeVertical} services. Founded by ${safeOwnerName}, our mission is simple: deliver exceptional work at fair prices, every time.\n\nWe're fully licensed and insured, and our team treats every home like our own. From routine maintenance to complex projects, we're here to help.`,
      },
      services: Array.isArray(parsed.services) && parsed.services.length > 0
        ? parsed.services
        : [
            { name: "Residential Services", description: `Complete ${safeVertical} solutions for homeowners.` },
            { name: "Commercial Services", description: `Professional ${safeVertical} for businesses and commercial properties.` },
            { name: "Emergency Service", description: `24/7 emergency ${safeVertical} when you need it most.` },
            { name: "Maintenance Plans", description: `Preventive maintenance to keep everything running smoothly.` },
          ],
      testimonials: parsed.testimonials || {
        heading: "What Our Customers Say",
        placeholder: "Customer testimonials will appear here once reviews are collected.",
      },
      cta: parsed.cta || {
        heading: "Ready to Get Started?",
        subheading: `Contact ${safeBusinessName} today for a free, no-obligation estimate.`,
        buttonText: "Schedule Your Free Estimate",
      },
    };

    await prisma.activityEvent.create({
      data: {
        clientId,
        type: "content_published",
        title: "Homepage copy generated",
        description: `AI-generated homepage copy created for ${client.businessName} with hero, about, services, and CTA sections.`,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[website] Homepage copy generation failed:", error);

    return {
      hero: {
        headline: `Your Trusted ${safeVertical} Pros${safeLocation ? ` in ${safeLocation}` : ""}`,
        subheadline: `${safeBusinessName} delivers reliable, professional ${safeVertical} services.`,
        ctaText: "Get Your Free Estimate",
      },
      about: {
        heading: `About ${safeBusinessName}`,
        body: `${safeBusinessName} has been serving ${safeLocation || "the community"} with professional ${safeVertical} services. Our team is fully licensed, insured, and dedicated to quality.`,
      },
      services: [
        { name: "Residential Services", description: `Complete ${safeVertical} solutions for homeowners.` },
        { name: "Commercial Services", description: `Professional ${safeVertical} for businesses.` },
        { name: "Emergency Service", description: `24/7 emergency service when you need it most.` },
      ],
      testimonials: {
        heading: "What Our Customers Say",
        placeholder: "Customer testimonials will appear here.",
      },
      cta: {
        heading: "Ready to Get Started?",
        subheading: `Contact ${safeBusinessName} today for a free estimate.`,
        buttonText: "Schedule Your Free Estimate",
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Fallback generators
// ---------------------------------------------------------------------------

function generateFallbackLandingPage(
  businessName: string,
  ownerName: string,
  service: string,
  city: string,
  vertical: string,
  phone: string
): string {
  const phoneLink = phone ? `tel:${phone.replace(/\D/g, "")}` : "#";
  return `<section id="hero">
  <h1>Professional ${service} in ${city}</h1>
  <p>${businessName} provides reliable, professional ${service} services to homeowners and businesses in ${city} and surrounding areas.</p>
  <a href="${phoneLink}">Call for a Free Estimate</a>
</section>

<section id="trust">
  <p>Licensed & Insured | 5-Star Rated | Serving ${city}</p>
</section>

<section id="services">
  <h2>Our ${service} Services</h2>
  <ul>
    <li><strong>Residential ${service}</strong> — Complete solutions for homeowners in ${city}.</li>
    <li><strong>Commercial ${service}</strong> — Professional service for businesses and properties.</li>
    <li><strong>Emergency ${service}</strong> — 24/7 emergency service when you need it most.</li>
  </ul>
</section>

<section id="why-us">
  <h2>Why ${city} Homeowners Choose ${businessName}</h2>
  <ul>
    <li>Locally owned and operated</li>
    <li>Transparent pricing with no hidden fees</li>
    <li>Licensed, insured, and background-checked technicians</li>
    <li>100% satisfaction guarantee</li>
  </ul>
</section>

<section id="faq">
  <h2>Frequently Asked Questions</h2>
  <div>
    <h3>How much does ${service} cost in ${city}?</h3>
    <p>Pricing varies based on the scope of work. Contact ${businessName} for a free, no-obligation estimate.</p>
  </div>
  <div>
    <h3>Is ${businessName} licensed and insured?</h3>
    <p>Yes, we are fully licensed and insured to provide ${service} services in ${city} and surrounding areas.</p>
  </div>
  <div>
    <h3>How quickly can you start?</h3>
    <p>We typically respond within 24 hours and can schedule work within the week.</p>
  </div>
</section>

<section id="cta">
  <h2>Ready for Professional ${service} in ${city}?</h2>
  <p>Contact ${businessName} today for your free estimate.</p>
  <a href="${phoneLink}">${phone || "Call Us Today"}</a>
</section>`;
}
