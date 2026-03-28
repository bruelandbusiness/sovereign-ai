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

export interface EmailCampaignResult {
  subject: string;
  body: string; // HTML
  campaignId: string;
  campaignType: string;
}

export interface DripEmail {
  subject: string;
  body: string; // HTML
  delayDays: number; // days after trigger to send
  purpose: string;
}

export interface DripSequenceResult {
  trigger: string;
  emails: DripEmail[];
  campaignIds: string[];
}

// ---------------------------------------------------------------------------
// Provisioning (existing)
// ---------------------------------------------------------------------------

/**
 * Provision the email marketing service for a client.
 * Creates an initial "Welcome Series" drip campaign.
 */
export async function provisionEmail(clientId: string) {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const existing = await prisma.emailCampaign.findFirst({
    where: { clientId, name: "Welcome Series" },
  });

  if (!existing) {
    await prisma.emailCampaign.create({
      data: {
        clientId,
        name: "Welcome Series",
        subject: `Welcome to ${client.businessName}!`,
        body: `<p>Thank you for choosing ${client.businessName}! We're thrilled to have you as a customer.</p>
<p>As a leading ${client.vertical || "home service"} provider${client.city ? ` in ${client.city}, ${client.state}` : ""}, we're committed to delivering exceptional service every time.</p>
<p>Here's what you can expect from us:</p>
<ul>
  <li>Professional, reliable service</li>
  <li>Transparent pricing with no hidden fees</li>
  <li>A team that truly cares about your satisfaction</li>
</ul>
<p>If you ever need anything, don't hesitate to reach out. We're here to help!</p>
<p>Best regards,<br/>${client.ownerName}<br/>${client.businessName}</p>`,
        type: "drip",
        status: "draft",
      },
    });
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "email_sent",
      title: "Email automation activated",
      description: `Welcome Series drip campaign created for ${client.businessName}. Edit and activate it from your dashboard.`,
    },
  });
}

// ---------------------------------------------------------------------------
// generateEmailCampaign — single campaign email generation
// ---------------------------------------------------------------------------

/**
 * Generate a complete email campaign (subject line + HTML body) using Claude.
 *
 * Supports multiple campaign types:
 * - "seasonal_promo"       — seasonal/holiday promotions
 * - "maintenance_reminder" — scheduled maintenance reminders
 * - "referral_ask"         — referral program solicitation
 * - "reengagement"         — win-back past customers
 * - "newsletter"           — monthly newsletter / update
 * - "announcement"         — new service, team member, or business update
 *
 * Creates an EmailCampaign record in "draft" status.
 *
 * @param clientId     - The client to generate for
 * @param campaignType - Type of campaign (see above)
 * @param audience     - Description of the target audience (e.g., "past customers from Q4")
 */
export async function generateEmailCampaign(
  clientId: string,
  campaignType: string,
  audience?: string
): Promise<EmailCampaignResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const safeOwnerName = sanitizeForPrompt(client.ownerName, 100);
  const safeCampaignType = sanitizeForPrompt(campaignType, 100);
  const safeAudience = audience
    ? sanitizeForPrompt(audience, 300)
    : "all customers";
  const location = [client.city, client.state].filter(Boolean).join(", ");
  const safeLocation = location ? sanitizeForPrompt(location, 200) : "";

  const campaignGuidelines: Record<string, string> = {
    seasonal_promo: `This is a SEASONAL PROMOTION email.
- Reference the current season or upcoming holiday
- Include a specific offer, discount, or limited-time incentive
- Create urgency (limited time, limited availability)
- Focus on seasonal services relevant to ${safeVertical} (e.g., AC tune-up for summer, furnace check for winter)
- Include a clear CTA to book/call`,

    maintenance_reminder: `This is a MAINTENANCE REMINDER email.
- Remind the customer that regular maintenance saves money long-term
- Reference their previous service if possible (use [PREVIOUS_SERVICE] as placeholder)
- Suggest specific maintenance tasks relevant to the season
- Frame it as caring about their home, not just selling
- Include a "Schedule Now" CTA
- Keep it brief and helpful, not salesy`,

    referral_ask: `This is a REFERRAL REQUEST email.
- Thank them for being a valued customer
- Explain that referrals from happy customers are the highest compliment
- Make the ask simple and specific ("Know someone who needs [service]?")
- If there's a referral incentive, mention it clearly
- Include easy sharing options (forward this email, share a link)
- Keep the tone warm and appreciative, not transactional`,

    reengagement: `This is a RE-ENGAGEMENT email for past customers who haven't booked in a while.
- Acknowledge it's been a while since you've connected
- Mention what's new at the business (new services, team members, etc.)
- Include a "welcome back" offer or incentive
- Make it easy to re-engage (one-click booking, call number)
- Avoid guilt-tripping — focus on value`,

    newsletter: `This is a MONTHLY NEWSLETTER.
- Include 2-3 useful tips related to ${safeVertical}
- Share a brief company update or behind-the-scenes moment
- Include a seasonal tip or reminder
- Feature a customer success story or review (use placeholder text)
- End with a CTA for scheduling service
- Keep sections scannable with clear headings`,

    announcement: `This is a BUSINESS ANNOUNCEMENT email.
- Lead with the exciting news
- Explain what it means for the customer
- Include relevant details (dates, availability, etc.)
- End with how they can take advantage of the news
- Keep the energy positive and forward-looking`,
  };

  const guidelines =
    campaignGuidelines[safeCampaignType] ||
    `This is a ${safeCampaignType} email. Write compelling, professional email copy appropriate for this campaign type.`;

  const systemPrompt = `You are an email marketing expert for local ${safeVertical} businesses. You write emails that feel personal, get opened, and drive action — not generic marketing blasts.`;

  const userPrompt = `Write a complete email campaign for ${safeBusinessName}${safeLocation ? ` in ${safeLocation}` : ""}.

Campaign type: ${safeCampaignType}
Target audience: ${safeAudience}
Business owner: ${safeOwnerName}

${guidelines}

Email formatting requirements:
- Use clean, mobile-friendly HTML (simple tags: h2, p, ul, li, strong, a, br)
- Do NOT include <html>, <head>, <body>, or <style> tags — just the inner content
- Use short paragraphs (2-3 sentences max)
- Include a clear, prominent CTA button (use: <p style="text-align:center;margin:24px 0"><a href="#" style="background:#4c85ff;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold">[CTA TEXT]</a></p>)
- Sign off with ${safeOwnerName}, ${safeBusinessName}

Return a JSON object with:
- "subject": a compelling subject line (under 50 characters, avoid spam triggers)
- "body": the full email body in HTML`;

  let subject: string;
  let body: string;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "email.campaign",
      description: `Generate ${safeCampaignType} email campaign`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<{ subject?: string; body?: string }>(
      response,
      {}
    );

    subject = parsed.subject || `${formatCampaignType(campaignType)} - ${client.businessName}`;
    body =
      parsed.body ||
      generateFallbackEmailBody(
        campaignType,
        client.businessName,
        client.ownerName,
        client.vertical || "home service"
      );
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[email] Campaign generation failed:", error);
    subject = `${formatCampaignType(campaignType)} - ${client.businessName}`;
    body = generateFallbackEmailBody(
      campaignType,
      client.businessName,
      client.ownerName,
      client.vertical || "home service"
    );
  }

  // Create the campaign record
  const campaign = await prisma.emailCampaign.create({
    data: {
      clientId,
      name: `${formatCampaignType(campaignType)} - ${new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })}`,
      subject,
      body,
      type: campaignType === "reengagement" ? "reengagement" : "broadcast",
      status: "draft",
    },
  });

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "email_sent",
      title: `${formatCampaignType(campaignType)} email campaign drafted`,
      description: `AI-generated ${campaignType} email "${subject}" is ready for review and sending.`,
    },
  });

  return {
    subject,
    body,
    campaignId: campaign.id,
    campaignType,
  };
}

// ---------------------------------------------------------------------------
// generateDripSequence — multi-email nurture sequence
// ---------------------------------------------------------------------------

/**
 * Generate a 3-email nurture sequence triggered by a specific event.
 *
 * Common triggers:
 * - "new_lead"       — new lead captured from website/chatbot/form
 * - "estimate_sent"  — estimate/quote was sent but not yet accepted
 * - "job_completed"  — service was completed (post-service nurture)
 * - "no_show"        — customer missed their appointment
 *
 * Creates 3 EmailCampaign records (draft status) with staggered send times.
 *
 * @param clientId - The client to generate for
 * @param trigger  - The event that starts the sequence
 */
export async function generateDripSequence(
  clientId: string,
  trigger: string
): Promise<DripSequenceResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const safeOwnerName = sanitizeForPrompt(client.ownerName, 100);
  const safeTrigger = sanitizeForPrompt(trigger, 100);
  const location = [client.city, client.state].filter(Boolean).join(", ");
  const safeLocation = location ? sanitizeForPrompt(location, 200) : "";

  const triggerContextMap: Record<string, string> = {
    new_lead: `Trigger: A new lead has submitted their info (via website form, chatbot, or phone call) but hasn't booked a service yet.

Email 1 (send immediately): Welcome & introduce the business. Build trust, share what makes you different, and include a soft CTA to schedule a free consultation/estimate.
Email 2 (send after 2 days): Provide value — share a relevant tip, testimonial, or case study. Address common concerns/objections. Include a CTA.
Email 3 (send after 5 days): Create gentle urgency. Reference limited availability or a time-sensitive offer. Make the final ask to book with a clear CTA.`,

    estimate_sent: `Trigger: A quote/estimate was sent to the customer but they haven't responded yet.

Email 1 (send after 1 day): Friendly follow-up. Ask if they have any questions about the estimate. Offer to walk through it over the phone.
Email 2 (send after 3 days): Address common objections (price, timing, trust). Share a relevant testimonial or case study. Offer flexibility.
Email 3 (send after 7 days): Final follow-up. The estimate won't be valid forever. Offer a small incentive to book within the week. No pressure, but clear CTA.`,

    job_completed: `Trigger: A service job was completed for the customer.

Email 1 (send after 1 day): Thank them for choosing your business. Ask about their experience. Request a review with a direct link.
Email 2 (send after 7 days): Share a maintenance tip related to the service they received. Position you as the expert. Mention your referral program.
Email 3 (send after 30 days): Check-in email. Ask if everything is still working well. Remind them about preventive maintenance. Include a special "returning customer" offer.`,

    no_show: `Trigger: The customer missed their scheduled appointment.

Email 1 (send immediately): Friendly "we missed you" message. Offer to reschedule at their convenience. Make it easy with a one-click rebook link.
Email 2 (send after 2 days): Gentle follow-up. Acknowledge life gets busy. Reiterate the value of the service they had scheduled. Offer flexibility.
Email 3 (send after 5 days): Final attempt. Include a small incentive to rebook. Make the CTA unmissable.`,
  };

  const triggerContext =
    triggerContextMap[safeTrigger] ||
    `Trigger: ${safeTrigger}. Create a 3-email sequence appropriate for this trigger event, with increasing urgency and value.`;

  const systemPrompt = `You are an email automation expert for local ${safeVertical} businesses. You create drip sequences that nurture leads to conversion with empathy and value — never spam or high-pressure tactics.`;

  const userPrompt = `Create a 3-email nurture/drip sequence for ${safeBusinessName}${safeLocation ? ` in ${safeLocation}` : ""}.

${triggerContext}

For EACH of the 3 emails, provide:
- A compelling subject line (under 50 characters)
- Full email body in HTML (simple tags only: h2, p, ul, li, strong, a, br)
- Include a CTA button in each: <p style="text-align:center;margin:24px 0"><a href="#" style="background:#4c85ff;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold">[CTA]</a></p>
- Sign off as ${safeOwnerName}, ${safeBusinessName}
- The delay in days after the trigger event

Return a JSON object with:
- "emails": array of 3 objects, each with "subject", "body" (HTML), "delayDays" (number), "purpose" (brief description of this email's goal)`;

  let emails: DripEmail[];

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "email.drip",
      description: `Generate drip sequence for "${safeTrigger}" trigger`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<{ emails?: DripEmail[] }>(response, {});

    if (Array.isArray(parsed.emails) && parsed.emails.length >= 3) {
      emails = parsed.emails.slice(0, 3);
    } else {
      emails = generateFallbackDripSequence(
        trigger,
        client.businessName,
        client.ownerName,
        client.vertical || "home service"
      );
    }
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[email] Drip sequence generation failed:", error);
    emails = generateFallbackDripSequence(
      trigger,
      client.businessName,
      client.ownerName,
      client.vertical || "home service"
    );
  }

  // Ensure each email has required fields
  emails = emails.map((email, index) => ({
    subject: email.subject || `Follow-up ${index + 1} from ${client.businessName}`,
    body:
      email.body ||
      `<p>Follow-up message from ${client.businessName}.</p><p>Best regards,<br/>${client.ownerName}</p>`,
    delayDays: typeof email.delayDays === "number" ? email.delayDays : [0, 2, 5][index],
    purpose: email.purpose || `Email ${index + 1} in the ${trigger} sequence`,
  }));

  // Create EmailCampaign records for each email in the sequence (batched)
  const campaigns = await prisma.$transaction(
    emails.map((email, i) =>
      prisma.emailCampaign.create({
        data: {
          clientId,
          name: `${formatTriggerName(trigger)} Drip ${i + 1}/3 - ${email.purpose}`,
          subject: email.subject,
          body: email.body,
          type: "drip",
          status: "draft",
        },
      })
    )
  );
  const campaignIds = campaigns.map((c) => c.id);

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "email_sent",
      title: `Drip sequence created: ${formatTriggerName(trigger)}`,
      description: `3-email nurture sequence for "${trigger}" trigger is ready for review. Emails will send at day ${emails.map((e) => e.delayDays).join(", day ")}.`,
    },
  });

  return {
    trigger,
    emails,
    campaignIds,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCampaignType(type: string): string {
  const labels: Record<string, string> = {
    seasonal_promo: "Seasonal Promotion",
    maintenance_reminder: "Maintenance Reminder",
    referral_ask: "Referral Request",
    reengagement: "Re-engagement",
    newsletter: "Newsletter",
    announcement: "Announcement",
  };
  return labels[type] || type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTriggerName(trigger: string): string {
  const labels: Record<string, string> = {
    new_lead: "New Lead Nurture",
    estimate_sent: "Estimate Follow-Up",
    job_completed: "Post-Service",
    no_show: "No-Show Recovery",
  };
  return labels[trigger] || trigger.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function generateFallbackEmailBody(
  campaignType: string,
  businessName: string,
  ownerName: string,
  vertical: string
): string {
  const cta = `<p style="text-align:center;margin:24px 0"><a href="#" style="background:#4c85ff;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold">Schedule Service</a></p>`;

  if (campaignType === "seasonal_promo") {
    return `<h2>Seasonal Special from ${businessName}</h2>
<p>This season, we're offering exclusive savings on our most popular ${vertical} services. Whether you need routine maintenance or a full system check, now is the perfect time to schedule.</p>
<p><strong>Book this week and save on your next service!</strong></p>
${cta}
<p>Best regards,<br/>${ownerName}<br/>${businessName}</p>`;
  }

  if (campaignType === "maintenance_reminder") {
    return `<h2>Time for Your ${vertical} Check-Up</h2>
<p>Hi there! Just a friendly reminder that regular ${vertical} maintenance helps prevent costly repairs and keeps everything running smoothly.</p>
<p>It's been a while since your last service. Let's get you scheduled for a quick check-up.</p>
${cta}
<p>Best regards,<br/>${ownerName}<br/>${businessName}</p>`;
  }

  return `<h2>A Message from ${businessName}</h2>
<p>Thank you for being a valued customer. We wanted to reach out and let you know we're here whenever you need ${vertical} services.</p>
<p>Whether it's a quick question or a full project, our team is ready to help.</p>
${cta}
<p>Best regards,<br/>${ownerName}<br/>${businessName}</p>`;
}

function generateFallbackDripSequence(
  trigger: string,
  businessName: string,
  ownerName: string,
  vertical: string
): DripEmail[] {
  const cta = `<p style="text-align:center;margin:24px 0"><a href="#" style="background:#4c85ff;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold">Schedule Now</a></p>`;

  return [
    {
      subject: `Welcome from ${businessName}`,
      body: `<h2>Thanks for Reaching Out!</h2>
<p>We're glad you're considering ${businessName} for your ${vertical} needs. Our team is committed to delivering quality work at fair prices.</p>
<p>If you have any questions, just reply to this email or give us a call. We'd love to help!</p>
${cta}
<p>Best regards,<br/>${ownerName}<br/>${businessName}</p>`,
      delayDays: 0,
      purpose: "Welcome and introduction",
    },
    {
      subject: `A Quick Tip from ${ownerName}`,
      body: `<h2>Here to Help</h2>
<p>As a ${vertical} professional, I see common issues that homeowners can easily prevent with a little know-how.</p>
<p>My #1 tip: regular maintenance is always cheaper than emergency repairs. A small investment now saves big headaches later.</p>
<p>Ready to get started? We offer free estimates on all our services.</p>
${cta}
<p>Best regards,<br/>${ownerName}<br/>${businessName}</p>`,
      delayDays: 2,
      purpose: "Value and trust building",
    },
    {
      subject: `Last Chance: Special Offer Inside`,
      body: `<h2>We'd Love to Earn Your Business</h2>
<p>I know you're busy, so I'll keep this quick. We have availability this week and I'd love to get you on the schedule.</p>
<p><strong>Book in the next 48 hours and we'll include a complimentary system check.</strong></p>
<p>This offer won't last — our calendar fills up fast!</p>
${cta}
<p>Best regards,<br/>${ownerName}<br/>${businessName}</p>`,
      delayDays: 5,
      purpose: "Urgency and conversion",
    },
  ];
}
