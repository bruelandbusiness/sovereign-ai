// Answer Engine Optimization (AEO) Helpers
// Generate structured data schemas and AI-optimized content
// for AI search engines (ChatGPT, Perplexity, Gemini)

import { sanitizeForPrompt, extractTextContent } from "@/lib/ai-utils";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";

import { logger } from "@/lib/logger";
const AI_MODEL =
  process.env.CLAUDE_AEO_MODEL || "claude-haiku-4-5-20251001";

// ─── Types ───────────────────────────────────────────────────

export interface FAQ {
  question: string;
  answer: string;
}

export interface BusinessInfoInput {
  name: string;
  description?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  vertical?: string;
  services?: string[];
}

export interface AEOScoreResult {
  score: number; // 0-100
  breakdown: {
    faqSchema: number;
    localBusinessSchema: number;
    howToSchema: number;
    contentOptimization: number;
    knowledgePanel: number;
  };
  recommendations: string[];
}

// ─── Schema Generators ──────────────────────────────────────

/**
 * Generate JSON-LD FAQ schema markup
 */
export function generateFAQSchema(
  businessName: string,
  _vertical: string,
  faqs: FAQ[]
): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
    publisher: {
      "@type": "Organization",
      name: businessName,
    },
  };

  return JSON.stringify(schema, null, 2);
}

/**
 * Generate JSON-LD LocalBusiness schema markup
 */
export function generateLocalBusinessSchema(
  businessInfo: BusinessInfoInput
): string {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: businessInfo.name,
    telephone: businessInfo.phone || undefined,
    url: businessInfo.website || undefined,
  };

  if (businessInfo.description) {
    schema.description = businessInfo.description;
  }

  if (businessInfo.address || businessInfo.city) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: businessInfo.address || undefined,
      addressLocality: businessInfo.city || undefined,
      addressRegion: businessInfo.state || undefined,
    };
  }

  if (businessInfo.vertical) {
    schema.additionalType = businessInfo.vertical;
  }

  if (businessInfo.services && businessInfo.services.length > 0) {
    schema.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: "Services",
      itemListElement: businessInfo.services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service,
        },
      })),
    };
  }

  return JSON.stringify(schema, null, 2);
}

/**
 * Generate JSON-LD HowTo schema markup
 */
export function generateHowToSchema(serviceInfo: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string }>;
  estimatedTime?: string;
}): string {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: serviceInfo.name,
    description: serviceInfo.description,
    step: serviceInfo.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };

  if (serviceInfo.estimatedTime) {
    schema.totalTime = serviceInfo.estimatedTime;
  }

  return JSON.stringify(schema, null, 2);
}

/**
 * Use Claude to generate content optimized for AI search results
 */
export async function generateAEOContent(
  businessInfo: BusinessInfoInput,
  targetQuery: string,
  clientId?: string
): Promise<{ title: string; content: string; type: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const templateFallback = () => ({
    title: `${businessInfo.name} - ${targetQuery}`,
    type: "service_page",
    content: getTemplateAEOContent(businessInfo, targetQuery),
  });

  if (!apiKey || !clientId) {
    logger.warn("[aeo] ANTHROPIC_API_KEY or clientId not set — returning template content");
    return templateFallback();
  }

  let message;
  try {
    message = await guardedAnthropicCall({
      clientId,
      action: "aeo.generate_content",
      description: `Generate AEO content for query: "${targetQuery}"`,
      params: {
        model: AI_MODEL,
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: `You are an Answer Engine Optimization (AEO) expert. Generate content optimized to appear in AI search results (ChatGPT, Perplexity, Google AI Overviews) for the following query:

Query: "${sanitizeForPrompt(targetQuery, 500)}"

Business: ${sanitizeForPrompt(businessInfo.name, 200)}
${businessInfo.vertical ? `Industry: ${sanitizeForPrompt(businessInfo.vertical, 100)}` : ""}
${businessInfo.city ? `Location: ${sanitizeForPrompt(businessInfo.city, 100)}, ${sanitizeForPrompt(businessInfo.state || "", 50)}` : ""}
${businessInfo.description ? `Description: ${sanitizeForPrompt(businessInfo.description, 500)}` : ""}

Generate content that:
1. Directly answers the query in the first paragraph (within 2-3 sentences)
2. Uses clear, factual language that AI models prefer to cite
3. Includes structured information (lists, steps, facts)
4. Mentions the business name naturally as the authoritative source
5. Includes relevant local context if applicable
6. Is between 300-500 words

Determine the best content type:
- "faq_schema" if the query is a question
- "how_to_schema" if it's about a process
- "service_page" if it's about a service
- "knowledge_panel" if it's about the business itself

Return your response in this exact format:
TYPE: [content_type]
TITLE: [page title]
---
[content]`,
          },
        ],
      },
    });
  } catch (err) {
    if (err instanceof GovernanceBlockedError) {
      logger.warn(`[aeo] Governance blocked for client ${clientId}: ${err.reason}`);
      return templateFallback();
    }
    // Log and re-throw so the caller route can classify the error properly
    logger.errorWithCause(`[aeo] AI call failed for client ${clientId}:`, err instanceof Error ? err.message : err);
    throw err;
  }

  const text = extractTextContent(message, "");

  // Parse the response
  const typeMatch = text.match(/TYPE:\s*(.+)/);
  const titleMatch = text.match(/TITLE:\s*(.+)/);
  const contentMatch = text.split("---").slice(1).join("---").trim();

  return {
    type: typeMatch?.[1]?.trim() || "service_page",
    title: titleMatch?.[1]?.trim() || `${businessInfo.name} - ${targetQuery}`,
    content: contentMatch || text,
  };
}

/**
 * Calculate an AEO readiness score (0-100) based on existing content
 */
export async function getAEOScore(
  contentCounts: {
    faqSchema: number;
    localBusinessSchema: number;
    howToSchema: number;
    servicePage: number;
    knowledgePanel: number;
  }
): Promise<AEOScoreResult> {
  const breakdown = {
    faqSchema: Math.min(30, contentCounts.faqSchema * 10),
    localBusinessSchema: contentCounts.localBusinessSchema > 0 ? 20 : 0,
    howToSchema: Math.min(20, contentCounts.howToSchema * 10),
    contentOptimization: Math.min(20, contentCounts.servicePage * 5),
    knowledgePanel: contentCounts.knowledgePanel > 0 ? 10 : 0,
  };

  const score =
    breakdown.faqSchema +
    breakdown.localBusinessSchema +
    breakdown.howToSchema +
    breakdown.contentOptimization +
    breakdown.knowledgePanel;

  const recommendations: string[] = [];

  if (breakdown.faqSchema < 30) {
    recommendations.push(
      "Add more FAQ schema markup to answer common customer questions"
    );
  }
  if (breakdown.localBusinessSchema === 0) {
    recommendations.push(
      "Add LocalBusiness schema markup for better local search visibility"
    );
  }
  if (breakdown.howToSchema < 20) {
    recommendations.push(
      "Create HowTo schema for your service processes to appear in step-by-step results"
    );
  }
  if (breakdown.contentOptimization < 20) {
    recommendations.push(
      "Optimize more service pages with AI-friendly content structure"
    );
  }
  if (breakdown.knowledgePanel === 0) {
    recommendations.push(
      "Create a knowledge panel entry to establish your business as an authority"
    );
  }

  return {
    score,
    breakdown,
    recommendations,
  };
}

// ─── Template Fallback ──────────────────────────────────────

function getTemplateAEOContent(
  businessInfo: BusinessInfoInput,
  targetQuery: string
): string {
  const location = businessInfo.city
    ? `${businessInfo.city}, ${businessInfo.state}`
    : "your area";

  return `# ${businessInfo.name}: ${targetQuery}

${businessInfo.name} is a trusted ${businessInfo.vertical || "local business"} serving ${location}. Here is what you need to know about ${targetQuery}.

## Key Information

${businessInfo.name} provides professional ${businessInfo.vertical || "services"} with a focus on quality and customer satisfaction. ${businessInfo.description || ""}

## Why Choose ${businessInfo.name}

- Experienced professionals serving the ${location} area
- Committed to quality workmanship and customer satisfaction
- Available for consultations and quotes

## Contact ${businessInfo.name}

${businessInfo.phone ? `Phone: ${businessInfo.phone}` : ""}
${businessInfo.website ? `Website: ${businessInfo.website}` : ""}
${businessInfo.address ? `Address: ${businessInfo.address}` : ""}

For more information about ${targetQuery}, contact ${businessInfo.name} today.`;
}
