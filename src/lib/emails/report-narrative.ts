import { guardedAnthropicCall } from "@/lib/governance/ai-guard";
import { extractTextContent } from "@/lib/ai-utils";
import { logger } from "@/lib/logger";

const AI_MODEL =
  process.env.CLAUDE_REPORT_MODEL || "claude-haiku-4-5-20251001";

/**
 * AGENTS.md: operations.reporting.client_weekly system prompt.
 * Generates a Claude-powered narrative for weekly client reports.
 */

const REPORT_NARRATIVE_PROMPT = `You are writing the narrative section of a weekly lead generation report for a home services contractor. The data is provided below.

Write 3-4 sentences summarizing:
1. How many leads were delivered and their quality
2. The most notable trend (improving, stable, or declining — and why)
3. One specific recommendation for next week

Tone: professional, confident, data-driven. Like a trusted marketing partner, not a vendor trying to impress. If numbers are down, acknowledge it honestly and explain the plan.

Never use: "excited to report", "great news", "impressive results" unless the numbers genuinely warrant it. Honesty builds trust faster than spin.`;

export interface ReportData {
  contractorName: string;
  leads: number;
  reviews: number;
  bookings: number;
  estimatedRevenue: number;
  chatbotConversations: number;
  contentPublished: number;
  previousWeekLeads?: number;
  previousWeekBookings?: number;
}

/**
 * Generate a narrative summary for a weekly report using Claude.
 * Returns null on failure — the report will just skip the narrative section.
 */
export async function generateReportNarrative(
  clientId: string,
  data: ReportData
): Promise<string | null> {
  const weekOverWeekLeads =
    data.previousWeekLeads != null && data.previousWeekLeads > 0
      ? Math.round(
          ((data.leads - data.previousWeekLeads) / data.previousWeekLeads) * 100
        )
      : null;

  const userPrompt = `Report for ${data.contractorName}:
- Leads this week: ${data.leads}${weekOverWeekLeads != null ? ` (${weekOverWeekLeads >= 0 ? "+" : ""}${weekOverWeekLeads}% vs last week)` : ""}
- Bookings: ${data.bookings}
- Reviews received: ${data.reviews}
- Chatbot conversations: ${data.chatbotConversations}
- Content published: ${data.contentPublished}
- Estimated revenue impact: $${data.estimatedRevenue.toLocaleString()}
${data.previousWeekLeads != null ? `- Last week's leads: ${data.previousWeekLeads}` : ""}
${data.previousWeekBookings != null ? `- Last week's bookings: ${data.previousWeekBookings}` : ""}`;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "operations.report_narrative",
      description: `Generate weekly report narrative for ${data.contractorName}`,
      params: {
        model: AI_MODEL,
        max_tokens: 300,
        system: REPORT_NARRATIVE_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const text = extractTextContent(response, "");
    return text.trim() || null;
  } catch (err) {
    logger.errorWithCause(
      "[report-narrative] Failed to generate narrative",
      err,
      { clientId }
    );
    return null;
  }
}
