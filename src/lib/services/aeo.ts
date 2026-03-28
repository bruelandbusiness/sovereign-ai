import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  guardedAnthropicCall,
  GovernanceBlockedError,
} from "@/lib/governance/ai-guard";
import {
  extractJSONContent,
  sanitizeForPrompt,
} from "@/lib/ai-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FAQSchemaItem {
  question: string;
  answer: string;
}

export interface FAQSchemaResult {
  faqs: FAQSchemaItem[];
  schemaMarkup: string; // JSON-LD script tag
  contentId: string;
}

export interface StructuredAnswer {
  question: string;
  answer: string;
  sources: string[];
  format: "paragraph" | "list" | "steps";
}

export interface StructuredAnswersResult {
  answers: StructuredAnswer[];
  contentIds: string[];
}

// ---------------------------------------------------------------------------
// Provisioning (existing)
// ---------------------------------------------------------------------------

export async function provisionAEO(clientId: string): Promise<void> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
    select: { vertical: true, city: true, state: true, businessName: true },
  });

  // Idempotency: skip if an AEO strategy already exists for this client
  const existingStrategy = await prisma.aEOStrategy.findFirst({
    where: { clientId },
  });
  if (existingStrategy) return;

  const vertical = client.vertical || "home service";
  const location =
    client.city && client.state
      ? `${client.city}, ${client.state}`
      : "your area";

  await prisma.aEOStrategy.create({
    data: {
      clientId,
      title: `Create FAQ page for common ${vertical} questions`,
      description: `Build comprehensive FAQ content targeting AI search engines for ${client.businessName} in ${location}.`,
      priority: "high",
      status: "pending",
      contentType: "faq",
      impact: `High — targets top ${vertical} queries in ${location}`,
    },
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "seo_update",
      title: "AEO activated",
      description:
        "Answer Engine Optimization is now monitoring AI search engines for your business visibility.",
    },
  });
}

// ---------------------------------------------------------------------------
// generateFAQSchema — FAQ content for AI search engines
// ---------------------------------------------------------------------------

/**
 * Generate FAQ content optimized for AI search engines (ChatGPT, Perplexity,
 * Google AI Overview) with proper JSON-LD schema markup.
 *
 * Creates concise, authoritative answers that AI models are likely to cite.
 * Stores content as AEOContent records for tracking.
 *
 * @param clientId - The client to generate for
 * @param service  - The specific service to create FAQs about
 */
export async function generateFAQSchema(
  clientId: string,
  service: string
): Promise<FAQSchemaResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const safeService = sanitizeForPrompt(service, 200);
  const location = [client.city, client.state].filter(Boolean).join(", ");
  const safeLocation = location ? sanitizeForPrompt(location, 200) : "";

  const systemPrompt = `You are an Answer Engine Optimization (AEO) specialist. You write FAQ content specifically designed to be cited by AI assistants like ChatGPT, Perplexity, and Google AI Overview. Your answers are:
- Concise (2-3 sentences each)
- Factually structured (not marketing fluff)
- Written in an authoritative, expert tone
- Naturally incorporating the business name and location
- Following the question-and-answer format that AI models prefer to cite`;

  const userPrompt = `Create 8-10 FAQ items for ${safeBusinessName}${safeLocation ? ` in ${safeLocation}` : ""} about "${safeService}".

Target the types of questions people ask AI assistants:
- "How much does ${safeService} cost in ${safeLocation || "my area"}?"
- "Who is the best ${safeService} company in ${safeLocation || "near me"}?"
- "How do I know when I need ${safeService}?"
- "What should I look for in a ${safeService} provider?"
- "How long does ${safeService} take?"
- Industry-specific questions about ${safeService}

Requirements:
- Each answer should be 2-3 sentences — concise enough for AI to cite directly
- Include specific details (not vague generalities)
- Naturally mention ${safeBusinessName} and ${safeLocation || "the service area"} where appropriate
- Write as a knowledgeable expert, not a sales pitch
- Include factual information that AI models can verify and trust

Return a JSON object with:
- "faqs": Array of objects with "question" and "answer"`;

  let faqs: FAQSchemaItem[];

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "aeo.faq",
      description: `Generate AEO FAQ schema for ${safeService}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<{ faqs?: FAQSchemaItem[] }>(response, {});

    faqs = Array.isArray(parsed.faqs) && parsed.faqs.length > 0
      ? parsed.faqs
      : generateFallbackFAQs(service, client.businessName, location, client.vertical || "home service");
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[aeo] FAQ schema generation failed:", error);
    faqs = generateFallbackFAQs(service, client.businessName, location, client.vertical || "home service");
  }

  if (faqs.length === 0) {
    faqs = generateFallbackFAQs(service, client.businessName, location, client.vertical || "home service");
  }

  // Generate JSON-LD schema markup
  const schemaMarkup = JSON.stringify(
    {
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
    },
    null,
    2
  );

  // Store as AEOContent
  const content = await prisma.aEOContent.create({
    data: {
      clientId,
      type: "faq",
      title: `FAQ: ${service}`,
      content: JSON.stringify(faqs),
      targetQuery: `${service} ${location || client.businessName}`,
      status: "draft",
    },
  });

  // Track the queries we're targeting (batched)
  const targetQueries = faqs.slice(0, 5).map((f) => f.question);
  try {
    await prisma.aEOQuery.createMany({
      data: targetQueries.map((query) => ({
        clientId,
        query,
        platform: "chatgpt",
        isCited: false,
        checkedAt: new Date(),
      })),
      skipDuplicates: true,
    });
  } catch {
    // Non-critical — may have duplicates
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "seo_update",
      title: `AEO FAQ schema generated: ${service}`,
      description: `${faqs.length} FAQ items created with JSON-LD schema markup for "${service}". Content optimized for AI search engine citations.`,
    },
  });

  return {
    faqs,
    schemaMarkup: `<script type="application/ld+json">\n${schemaMarkup}\n</script>`,
    contentId: content.id,
  };
}

// ---------------------------------------------------------------------------
// generateStructuredAnswers — concise answers for featured snippets
// ---------------------------------------------------------------------------

/**
 * Generate concise, authoritative answers to specific questions, optimized
 * for featured snippets and AI search engine citations.
 *
 * Each answer is structured in the optimal format (paragraph, list, or steps)
 * based on the question type.
 *
 * @param clientId  - The client to generate for
 * @param questions - Array of questions to answer
 */
export async function generateStructuredAnswers(
  clientId: string,
  questions: string[]
): Promise<StructuredAnswersResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const location = [client.city, client.state].filter(Boolean).join(", ");
  const safeLocation = location ? sanitizeForPrompt(location, 200) : "";

  const sanitizedQuestions = questions
    .slice(0, 10) // Max 10 questions
    .map((q) => sanitizeForPrompt(q, 200));

  const systemPrompt = `You are an AEO (Answer Engine Optimization) content specialist for ${safeBusinessName}, a ${safeVertical} company${safeLocation ? ` in ${safeLocation}` : ""}. You create structured answers optimized for:
1. Google Featured Snippets (position 0)
2. AI search engine citations (ChatGPT, Perplexity, Google AI Overview)
3. Voice search results

Your answers are factual, concise, and authoritative. You choose the best format for each answer:
- "paragraph": 2-3 sentence direct answer (for "what is" and "how much" questions)
- "list": bulleted list of items (for "what are the best" and comparison questions)
- "steps": numbered steps (for "how to" questions)`;

  const userPrompt = `Generate structured answers for these questions about ${safeBusinessName} (${safeVertical}${safeLocation ? ` in ${safeLocation}` : ""}):

${sanitizedQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

For each question, return:
- The optimal answer format (paragraph, list, or steps)
- A concise, factual answer (max 100 words)
- Suggested source pages that should contain this answer on the website

Return a JSON object with:
- "answers": Array of objects with:
  - "question": the question
  - "answer": the structured answer text
  - "sources": array of suggested page URLs/types (e.g., ["/services/ac-repair", "/faq"])
  - "format": "paragraph" | "list" | "steps"`;

  let answers: StructuredAnswer[];

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "aeo.answers",
      description: `Generate structured answers for ${sanitizedQuestions.length} questions`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<{ answers?: StructuredAnswer[] }>(response, {});

    answers = Array.isArray(parsed.answers) ? parsed.answers : [];
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[aeo] Structured answers generation failed:", error);
    answers = [];
  }

  // Fill in any missing answers with defaults
  if (answers.length < sanitizedQuestions.length) {
    for (let i = answers.length; i < sanitizedQuestions.length; i++) {
      answers.push({
        question: sanitizedQuestions[i],
        answer: `For ${sanitizedQuestions[i].toLowerCase().replace("?", "")}, contact ${client.businessName}${location ? ` in ${location}` : ""} for expert guidance and a free estimate. As a professional ${client.vertical || "home service"} company, we have the experience to help with your specific situation.`,
        sources: ["/faq", "/contact"],
        format: "paragraph",
      });
    }
  }

  // Store each answer as AEOContent (batched via transaction)
  let contentIds: string[] = [];
  try {
    const created = await prisma.$transaction(
      answers.map((answer) =>
        prisma.aEOContent.create({
          data: {
            clientId,
            type: answer.format === "steps" ? "how_to" : "faq",
            title: answer.question,
            content: answer.answer,
            targetQuery: answer.question,
            status: "draft",
          },
        })
      )
    );
    contentIds = created.map((c) => c.id);

    // Track the queries in a single batch
    await prisma.aEOQuery.createMany({
      data: answers.map((answer) => ({
        clientId,
        query: answer.question,
        platform: "chatgpt",
        isCited: false,
        checkedAt: new Date(),
      })),
      skipDuplicates: true,
    });
  } catch {
    // Non-critical — continue with remaining processing
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "seo_update",
      title: `${answers.length} structured answers generated`,
      description: `AEO-optimized answers created for ${answers.length} questions targeting featured snippets and AI search citations.`,
    },
  });

  return {
    answers,
    contentIds,
  };
}

// ---------------------------------------------------------------------------
// Fallback generators
// ---------------------------------------------------------------------------

function generateFallbackFAQs(
  service: string,
  businessName: string,
  location: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  vertical: string
): FAQSchemaItem[] {
  const loc = location ? ` in ${location}` : "";
  return [
    {
      question: `How much does ${service} cost${loc}?`,
      answer: `The cost of ${service}${loc} varies depending on the scope of work, equipment needed, and specific conditions. ${businessName} offers free estimates so you can get an accurate price before any work begins. Contact us for a no-obligation quote.`,
    },
    {
      question: `How do I choose the best ${service} company${loc}?`,
      answer: `When choosing a ${service} provider${loc}, look for proper licensing, insurance, positive reviews, transparent pricing, and written estimates. ${businessName} is fully licensed and insured with a track record of satisfied customers${loc}.`,
    },
    {
      question: `How long does ${service} typically take?`,
      answer: `The duration of ${service} depends on the complexity of the job. Simple repairs may take 1-2 hours, while larger projects can take several days. ${businessName} will provide a timeline estimate before starting any work.`,
    },
    {
      question: `Do I need a permit for ${service}${loc}?`,
      answer: `Permit requirements for ${service}${loc} depend on the scope of work and local building codes. ${businessName} handles all necessary permits and inspections as part of our service, ensuring full compliance with local regulations.`,
    },
    {
      question: `What should I expect during a ${service} appointment?`,
      answer: `During a ${service} appointment with ${businessName}, a licensed technician will assess the situation, explain the issue and options, provide a clear estimate, and complete the work with minimal disruption. We always clean up after ourselves.`,
    },
    {
      question: `Does ${businessName} offer emergency ${service}?`,
      answer: `Yes, ${businessName} offers emergency ${service} services${loc}. For urgent situations, call us directly and we will prioritize your request. Our team aims to respond to emergencies as quickly as possible.`,
    },
  ];
}
