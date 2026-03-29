// AI Prompt Template Library
// Reusable prompt templates for the platform's AI-powered features.
// No AI API calls — this module handles template management and rendering only.

// ── Type Definitions ────────────────────────────────────────

/** Category grouping for prompt templates. */
export type PromptCategory =
  | "content"
  | "reviews"
  | "sales"
  | "support"
  | "analysis";

/** A named variable placeholder used within a prompt template. */
export interface PromptVariable {
  /** Variable name matching the {{name}} placeholder in the template. */
  readonly name: string;
  /** Human-readable description of the variable. */
  readonly description: string;
  /** Whether this variable must be provided. */
  readonly required: boolean;
  /** Fallback value when the variable is not provided. */
  readonly defaultValue?: string;
}

/** Record mapping variable names to their string values. */
export type PromptVariables = Readonly<Record<string, string>>;

/** Configuration options for prompt rendering and token management. */
export interface PromptConfig {
  /** Maximum number of tokens the rendered prompt should consume. */
  readonly maxTokens?: number;
  /** Temperature hint for downstream AI calls (0-1). */
  readonly temperature?: number;
  /** Model identifier hint for downstream AI calls. */
  readonly model?: string;
  /** Whether to strip excessive whitespace from the rendered output. */
  readonly trimWhitespace?: boolean;
}

/** A reusable prompt template with metadata and variable definitions. */
export interface PromptTemplate {
  /** Unique identifier for the template. */
  readonly id: string;
  /** Human-readable name. */
  readonly name: string;
  /** Brief description of what this prompt generates. */
  readonly description: string;
  /** Category grouping. */
  readonly category: PromptCategory;
  /** The prompt text with {{variable}} placeholders. */
  readonly template: string;
  /** Variables used by this template. */
  readonly variables: readonly PromptVariable[];
  /** Default configuration for this template. */
  readonly config?: PromptConfig;
}

// ── Prompt Templates ────────────────────────────────────────

export const PROMPT_TEMPLATES: readonly PromptTemplate[] = [
  // ── Content ───────────────────────────────────────────────
  {
    id: "content-blog-post",
    name: "Blog Post Generator",
    description: "Generate a structured blog post on a given topic.",
    category: "content",
    template: [
      "Write a blog post about {{topic}} for {{audience}}.",
      "The tone should be {{tone}}.",
      "Include an engaging introduction, {{numSections}} main sections with subheadings,",
      "and a conclusion with a call to action.",
      "Target length: approximately {{wordCount}} words.",
      "{{additionalInstructions}}",
    ].join("\n"),
    variables: [
      { name: "topic", description: "The blog post topic", required: true },
      { name: "audience", description: "Target audience", required: true },
      {
        name: "tone",
        description: "Writing tone",
        required: false,
        defaultValue: "professional and informative",
      },
      {
        name: "numSections",
        description: "Number of main sections",
        required: false,
        defaultValue: "3",
      },
      {
        name: "wordCount",
        description: "Target word count",
        required: false,
        defaultValue: "800",
      },
      {
        name: "additionalInstructions",
        description: "Extra instructions for the post",
        required: false,
        defaultValue: "",
      },
    ],
    config: { temperature: 0.7, maxTokens: 2000 },
  },
  {
    id: "content-social-media",
    name: "Social Media Post",
    description: "Create a social media post for a specific platform.",
    category: "content",
    template: [
      "Write a {{platform}} post for {{businessName}}.",
      "Topic: {{topic}}.",
      "Tone: {{tone}}.",
      "Include relevant hashtags and a call to action.",
      "Keep the post within {{platform}} character best practices.",
      "{{additionalInstructions}}",
    ].join("\n"),
    variables: [
      {
        name: "platform",
        description: "Social media platform (e.g., Instagram, LinkedIn, X)",
        required: true,
      },
      { name: "businessName", description: "Business name", required: true },
      { name: "topic", description: "Post topic or promotion", required: true },
      {
        name: "tone",
        description: "Voice and tone",
        required: false,
        defaultValue: "engaging and on-brand",
      },
      {
        name: "additionalInstructions",
        description: "Extra instructions",
        required: false,
        defaultValue: "",
      },
    ],
    config: { temperature: 0.8, maxTokens: 500 },
  },
  {
    id: "content-email-newsletter",
    name: "Email Newsletter",
    description: "Draft an email newsletter with sections and a CTA.",
    category: "content",
    template: [
      "Write an email newsletter for {{businessName}} targeting {{audience}}.",
      "Subject line suggestion: {{subjectHint}}.",
      "Main topic: {{topic}}.",
      "Include a greeting, {{numSections}} content sections, and a closing",
      "with a clear call to action: {{cta}}.",
      "Tone: {{tone}}.",
    ].join("\n"),
    variables: [
      { name: "businessName", description: "Business name", required: true },
      { name: "audience", description: "Newsletter audience", required: true },
      { name: "topic", description: "Main newsletter topic", required: true },
      {
        name: "subjectHint",
        description: "Hint for the subject line",
        required: false,
        defaultValue: "generate an engaging subject line",
      },
      {
        name: "numSections",
        description: "Number of content sections",
        required: false,
        defaultValue: "3",
      },
      {
        name: "cta",
        description: "Call to action",
        required: false,
        defaultValue: "Visit our website to learn more",
      },
      {
        name: "tone",
        description: "Writing tone",
        required: false,
        defaultValue: "friendly and professional",
      },
    ],
    config: { temperature: 0.7, maxTokens: 1500 },
  },
  {
    id: "content-seo-meta",
    name: "SEO Meta Description",
    description: "Generate an SEO-optimized meta description.",
    category: "content",
    template: [
      "Write an SEO meta description for a web page about {{topic}}.",
      "Target keyword: {{keyword}}.",
      "Business: {{businessName}}.",
      "The description must be between 150 and 160 characters.",
      "Make it compelling and include a call to action.",
    ].join("\n"),
    variables: [
      { name: "topic", description: "Page topic", required: true },
      { name: "keyword", description: "Target SEO keyword", required: true },
      { name: "businessName", description: "Business name", required: true },
    ],
    config: { temperature: 0.5, maxTokens: 200 },
  },

  // ── Reviews ───────────────────────────────────────────────
  {
    id: "reviews-positive-response",
    name: "Positive Review Response",
    description: "Respond to a positive customer review.",
    category: "reviews",
    template: [
      "Write a warm, professional response to a positive review.",
      "Business: {{businessName}}.",
      "Reviewer: {{reviewerName}}.",
      "Review text: {{reviewText}}.",
      "Rating: {{rating}} out of 5 stars.",
      "Thank the reviewer by name, reference specific details from their review,",
      "and invite them to return. Keep it concise (2-4 sentences).",
    ].join("\n"),
    variables: [
      { name: "businessName", description: "Business name", required: true },
      { name: "reviewerName", description: "Name of the reviewer", required: true },
      { name: "reviewText", description: "Full review text", required: true },
      { name: "rating", description: "Star rating (1-5)", required: true },
    ],
    config: { temperature: 0.6, maxTokens: 300 },
  },
  {
    id: "reviews-negative-response",
    name: "Negative Review Response",
    description: "Respond to a negative customer review with empathy.",
    category: "reviews",
    template: [
      "Write a professional, empathetic response to a negative review.",
      "Business: {{businessName}}.",
      "Reviewer: {{reviewerName}}.",
      "Review text: {{reviewText}}.",
      "Rating: {{rating}} out of 5 stars.",
      "Acknowledge their concerns, apologize sincerely, offer a resolution,",
      "and provide a way to continue the conversation offline.",
      "Contact: {{contactInfo}}.",
      "Keep it concise (3-5 sentences). Do not be defensive.",
    ].join("\n"),
    variables: [
      { name: "businessName", description: "Business name", required: true },
      { name: "reviewerName", description: "Name of the reviewer", required: true },
      { name: "reviewText", description: "Full review text", required: true },
      { name: "rating", description: "Star rating (1-5)", required: true },
      {
        name: "contactInfo",
        description: "Contact info for offline resolution",
        required: false,
        defaultValue: "our support team",
      },
    ],
    config: { temperature: 0.5, maxTokens: 400 },
  },
  {
    id: "reviews-summary",
    name: "Review Summary",
    description: "Summarize a batch of customer reviews into key themes.",
    category: "reviews",
    template: [
      "Summarize the following customer reviews for {{businessName}}.",
      "Total reviews: {{totalReviews}}. Average rating: {{averageRating}}.",
      "Reviews:\n{{reviewsText}}",
      "Provide: top 3 positive themes, top 3 areas for improvement,",
      "and an overall sentiment assessment.",
    ].join("\n"),
    variables: [
      { name: "businessName", description: "Business name", required: true },
      { name: "totalReviews", description: "Number of reviews", required: true },
      { name: "averageRating", description: "Average star rating", required: true },
      { name: "reviewsText", description: "Concatenated review texts", required: true },
    ],
    config: { temperature: 0.3, maxTokens: 800 },
  },

  // ── Sales ─────────────────────────────────────────────────
  {
    id: "sales-proposal",
    name: "Proposal Generator",
    description: "Generate a sales proposal for a prospective client.",
    category: "sales",
    template: [
      "Write a sales proposal from {{businessName}} to {{prospectName}}.",
      "Service/Product: {{offering}}.",
      "Prospect pain points: {{painPoints}}.",
      "Proposed solution: {{solution}}.",
      "Pricing: {{pricing}}.",
      "Include an executive summary, problem statement, proposed solution,",
      "deliverables, timeline, and next steps.",
    ].join("\n"),
    variables: [
      { name: "businessName", description: "Your business name", required: true },
      { name: "prospectName", description: "Prospect company name", required: true },
      { name: "offering", description: "Product or service offered", required: true },
      { name: "painPoints", description: "Prospect challenges", required: true },
      { name: "solution", description: "Proposed solution details", required: true },
      {
        name: "pricing",
        description: "Pricing information",
        required: false,
        defaultValue: "to be discussed",
      },
    ],
    config: { temperature: 0.6, maxTokens: 2000 },
  },
  {
    id: "sales-cold-email",
    name: "Cold Email",
    description: "Draft a cold outreach email to a prospect.",
    category: "sales",
    template: [
      "Write a cold outreach email from {{senderName}} at {{businessName}}",
      "to {{recipientName}} at {{recipientCompany}}.",
      "Value proposition: {{valueProposition}}.",
      "Keep it under 150 words, personalized, and include a clear CTA.",
      "Tone: {{tone}}.",
    ].join("\n"),
    variables: [
      { name: "senderName", description: "Sender name", required: true },
      { name: "businessName", description: "Your business name", required: true },
      { name: "recipientName", description: "Recipient name", required: true },
      { name: "recipientCompany", description: "Recipient company", required: true },
      { name: "valueProposition", description: "Core value proposition", required: true },
      {
        name: "tone",
        description: "Email tone",
        required: false,
        defaultValue: "professional and concise",
      },
    ],
    config: { temperature: 0.7, maxTokens: 500 },
  },
  {
    id: "sales-follow-up",
    name: "Follow-Up Email",
    description: "Draft a follow-up email after initial outreach.",
    category: "sales",
    template: [
      "Write a follow-up email from {{senderName}} at {{businessName}}",
      "to {{recipientName}}.",
      "Context of previous interaction: {{previousContext}}.",
      "Days since last contact: {{daysSinceContact}}.",
      "Add new value or information: {{newValue}}.",
      "Keep it brief and include a specific CTA.",
    ].join("\n"),
    variables: [
      { name: "senderName", description: "Sender name", required: true },
      { name: "businessName", description: "Your business name", required: true },
      { name: "recipientName", description: "Recipient name", required: true },
      { name: "previousContext", description: "Summary of previous interaction", required: true },
      {
        name: "daysSinceContact",
        description: "Days since last contact",
        required: false,
        defaultValue: "3",
      },
      {
        name: "newValue",
        description: "New value or info to share",
        required: false,
        defaultValue: "",
      },
    ],
    config: { temperature: 0.6, maxTokens: 400 },
  },
  {
    id: "sales-objection-handler",
    name: "Objection Handler",
    description: "Generate a response to a common sales objection.",
    category: "sales",
    template: [
      "A prospect for {{businessName}} raised this objection: \"{{objection}}\".",
      "Product/Service: {{offering}}.",
      "Provide a professional response that:",
      "1. Acknowledges the concern",
      "2. Reframes the objection",
      "3. Provides evidence or social proof",
      "4. Transitions to next steps",
      "Keep the response conversational and under 100 words.",
    ].join("\n"),
    variables: [
      { name: "businessName", description: "Your business name", required: true },
      { name: "objection", description: "The objection text", required: true },
      { name: "offering", description: "Product or service", required: true },
    ],
    config: { temperature: 0.5, maxTokens: 400 },
  },

  // ── Support ───────────────────────────────────────────────
  {
    id: "support-ticket-response",
    name: "Ticket Response",
    description: "Generate a support ticket response.",
    category: "support",
    template: [
      "Write a support response for {{businessName}}.",
      "Customer: {{customerName}}.",
      "Issue: {{issueDescription}}.",
      "Priority: {{priority}}.",
      "Known resolution: {{resolution}}.",
      "Be empathetic, clear, and provide step-by-step instructions if applicable.",
      "Close with an offer for further help.",
    ].join("\n"),
    variables: [
      { name: "businessName", description: "Business name", required: true },
      { name: "customerName", description: "Customer name", required: true },
      { name: "issueDescription", description: "Description of the issue", required: true },
      {
        name: "priority",
        description: "Ticket priority (low, medium, high, urgent)",
        required: false,
        defaultValue: "medium",
      },
      {
        name: "resolution",
        description: "Known resolution steps",
        required: false,
        defaultValue: "investigate and advise",
      },
    ],
    config: { temperature: 0.4, maxTokens: 600 },
  },
  {
    id: "support-faq-answer",
    name: "FAQ Answer",
    description: "Generate a clear answer for a frequently asked question.",
    category: "support",
    template: [
      "Write a clear, helpful answer to the following FAQ for {{businessName}}.",
      "Question: {{question}}",
      "Context: {{context}}.",
      "Keep the answer concise (2-4 paragraphs) and easy to understand.",
      "If relevant, include a link or next step: {{nextStep}}.",
    ].join("\n"),
    variables: [
      { name: "businessName", description: "Business name", required: true },
      { name: "question", description: "The FAQ question", required: true },
      {
        name: "context",
        description: "Background context for the answer",
        required: false,
        defaultValue: "general product information",
      },
      {
        name: "nextStep",
        description: "Suggested next step or link",
        required: false,
        defaultValue: "contact support for more help",
      },
    ],
    config: { temperature: 0.3, maxTokens: 500 },
  },
  {
    id: "support-troubleshooting-guide",
    name: "Troubleshooting Guide",
    description: "Create a step-by-step troubleshooting guide.",
    category: "support",
    template: [
      "Create a troubleshooting guide for {{businessName}} customers.",
      "Issue: {{issue}}.",
      "Product/Feature: {{product}}.",
      "Symptoms: {{symptoms}}.",
      "Provide numbered steps to diagnose and resolve the issue.",
      "Include common causes, expected outcomes for each step,",
      "and an escalation path if the issue persists.",
    ].join("\n"),
    variables: [
      { name: "businessName", description: "Business name", required: true },
      { name: "issue", description: "The issue to troubleshoot", required: true },
      { name: "product", description: "Product or feature name", required: true },
      {
        name: "symptoms",
        description: "Observed symptoms",
        required: false,
        defaultValue: "as described by the customer",
      },
    ],
    config: { temperature: 0.3, maxTokens: 1000 },
  },

  // ── Analysis ──────────────────────────────────────────────
  {
    id: "analysis-competitor",
    name: "Competitor Analysis",
    description: "Analyze a competitor based on provided information.",
    category: "analysis",
    template: [
      "Perform a competitor analysis for {{businessName}}.",
      "Competitor: {{competitorName}}.",
      "Industry: {{industry}}.",
      "Known competitor strengths: {{strengths}}.",
      "Known competitor weaknesses: {{weaknesses}}.",
      "Provide: competitive positioning summary, key differentiators,",
      "threats, opportunities, and recommended strategic actions.",
    ].join("\n"),
    variables: [
      { name: "businessName", description: "Your business name", required: true },
      { name: "competitorName", description: "Competitor name", required: true },
      { name: "industry", description: "Industry or market", required: true },
      {
        name: "strengths",
        description: "Known competitor strengths",
        required: false,
        defaultValue: "to be determined from available data",
      },
      {
        name: "weaknesses",
        description: "Known competitor weaknesses",
        required: false,
        defaultValue: "to be determined from available data",
      },
    ],
    config: { temperature: 0.4, maxTokens: 1500 },
  },
  {
    id: "analysis-market-research",
    name: "Market Research Summary",
    description: "Summarize market research data into actionable insights.",
    category: "analysis",
    template: [
      "Summarize market research for {{businessName}} in the {{industry}} industry.",
      "Market data:\n{{marketData}}",
      "Target segment: {{targetSegment}}.",
      "Provide: market size overview, key trends, customer demographics,",
      "competitive landscape summary, and 3-5 actionable recommendations.",
    ].join("\n"),
    variables: [
      { name: "businessName", description: "Your business name", required: true },
      { name: "industry", description: "Industry or market", required: true },
      { name: "marketData", description: "Raw market research data", required: true },
      {
        name: "targetSegment",
        description: "Target customer segment",
        required: false,
        defaultValue: "primary customer base",
      },
    ],
    config: { temperature: 0.3, maxTokens: 1500 },
  },
] as const;

// ── Utility Functions ───────────────────────────────────────

/**
 * Replace {{variable}} placeholders in a prompt template with provided values.
 * Falls back to defaultValue for optional variables not provided.
 * Strips unresolved optional placeholders from the output.
 */
export function renderPrompt(
  template: PromptTemplate,
  variables: PromptVariables,
  config?: PromptConfig
): string {
  const resolvedVars: Record<string, string> = {};

  for (const v of template.variables) {
    if (variables[v.name] !== undefined) {
      resolvedVars[v.name] = variables[v.name];
    } else if (v.defaultValue !== undefined) {
      resolvedVars[v.name] = v.defaultValue;
    }
  }

  let rendered = template.template.replace(
    /\{\{(\w+)\}\}/g,
    (_match, name: string) => {
      if (resolvedVars[name] !== undefined) {
        return resolvedVars[name];
      }
      // Remove unresolved optional placeholders
      return "";
    }
  );

  const shouldTrim = config?.trimWhitespace ?? template.config?.trimWhitespace ?? false;
  if (shouldTrim) {
    rendered = rendered
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  return rendered;
}

/**
 * Filter prompt templates by category.
 */
export function getPromptsForCategory(
  category: PromptCategory,
  templates: readonly PromptTemplate[] = PROMPT_TEMPLATES
): readonly PromptTemplate[] {
  return templates.filter((t) => t.category === category);
}

/** Validation result indicating missing or extra variables. */
export interface ValidationResult {
  readonly valid: boolean;
  readonly missingRequired: readonly string[];
  readonly missingOptional: readonly string[];
  readonly extraVariables: readonly string[];
}

/**
 * Validate that all required variables for a template are provided.
 * Returns details about missing required, missing optional, and extra variables.
 */
export function validatePromptVariables(
  template: PromptTemplate,
  variables: PromptVariables
): ValidationResult {
  const providedKeys = new Set(Object.keys(variables));
  const templateVarNames = new Set(template.variables.map((v) => v.name));

  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  for (const v of template.variables) {
    if (!providedKeys.has(v.name)) {
      if (v.required) {
        missingRequired.push(v.name);
      } else {
        missingOptional.push(v.name);
      }
    }
  }

  const extraVariables: string[] = Array.from(providedKeys).filter(
    (key) => !templateVarNames.has(key)
  );

  return {
    valid: missingRequired.length === 0,
    missingRequired,
    missingOptional,
    extraVariables,
  };
}

/**
 * Estimate the token count for a given text.
 * Uses the rough heuristic: tokens ~ words * 1.3.
 */
export function estimateTokenCount(text: string): number {
  if (!text || text.length === 0) {
    return 0;
  }
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
  return Math.ceil(wordCount * 1.3);
}

/**
 * Truncate text to fit within a token limit.
 * Removes words from the end until the estimated token count is within the limit.
 * Appends an ellipsis indicator when truncation occurs.
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
  if (!text || maxTokens <= 0) {
    return "";
  }

  if (estimateTokenCount(text) <= maxTokens) {
    return text;
  }

  const words = text.split(/\s+/).filter((w) => w.length > 0);
  // Approximate the maximum number of words that fit within the token budget.
  // Reserve a small margin for the truncation indicator.
  const maxWords = Math.floor((maxTokens - 1) / 1.3);

  if (maxWords <= 0) {
    return "...";
  }

  const truncated = words.slice(0, maxWords).join(" ");
  return truncated + "...";
}

/** Context fields for building a system prompt. */
export interface BusinessContext {
  readonly businessName: string;
  readonly industry?: string;
  readonly brandVoice?: string;
  readonly targetAudience?: string;
  readonly additionalContext?: string;
}

/**
 * Build a system prompt that establishes business context for the AI.
 * This is intended to be used as the system message alongside a user prompt
 * rendered from a template.
 */
export function buildSystemPrompt(context: BusinessContext): string {
  const parts: string[] = [
    `You are an AI assistant for ${context.businessName}.`,
  ];

  if (context.industry) {
    parts.push(`Industry: ${context.industry}.`);
  }

  if (context.brandVoice) {
    parts.push(`Brand voice: ${context.brandVoice}.`);
  }

  if (context.targetAudience) {
    parts.push(`Target audience: ${context.targetAudience}.`);
  }

  parts.push(
    "Always be professional, accurate, and on-brand.",
    "Do not fabricate facts or statistics.",
    "If you are unsure about something, say so."
  );

  if (context.additionalContext) {
    parts.push(context.additionalContext);
  }

  return parts.join("\n");
}
