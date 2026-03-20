import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/templates/[id]/apply — Apply a template to the current client's account.
 *
 * - email_sequence  → creates EmailCampaign(s)
 * - social_calendar → creates SocialPost(s)
 * - ad_campaign     → creates AdCampaign draft
 * - chatbot_script  → updates ChatbotConfig greeting & prompt
 * - landing_page    → returns content (no DB write, client downloads it)
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const clientId = session.account.client.id;

  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  let result: Record<string, unknown> = {};

  try {
    const content = JSON.parse(template.content);

    switch (template.category) {
      case "email_sequence": {
        // content is an array of email objects
        const emails = Array.isArray(content) ? content : [];
        const campaigns = [];
        for (const email of emails) {
          const campaign = await prisma.emailCampaign.create({
            data: {
              clientId,
              name: `${template.name} — Email ${email.emailNumber || ""}`.trim(),
              subject: email.subject || "Welcome",
              body: email.body || "",
              type: "drip",
              status: "draft",
            },
          });
          campaigns.push(campaign.id);
        }
        result = { type: "email_sequence", campaignIds: campaigns, count: campaigns.length };
        break;
      }

      case "social_calendar": {
        // content is an array of post objects
        const posts = Array.isArray(content) ? content : [];
        const created = [];
        const now = new Date();
        for (let i = 0; i < posts.length; i++) {
          const post = posts[i];
          const scheduledAt = new Date(now.getTime() + (i * 7 * 24 * 60 * 60 * 1000)); // weekly
          const socialPost = await prisma.socialPost.create({
            data: {
              clientId,
              platform: post.platform || "facebook",
              content: post.caption || post.topic || "",
              status: "draft",
              scheduledAt,
            },
          });
          created.push(socialPost.id);
        }
        result = { type: "social_calendar", postIds: created, count: created.length };
        break;
      }

      case "ad_campaign": {
        const campaign = await prisma.adCampaign.create({
          data: {
            clientId,
            platform: content.platform || "google",
            name: template.name,
            status: "draft",
            budget: content.dailyBudget || 5000,
            targeting: JSON.stringify({ keywords: content.keywords, radius: content.targetRadius }),
            adCopy: JSON.stringify({
              headline: content.headline,
              description: content.description,
              callToAction: content.callToAction,
            }),
          },
        });
        result = { type: "ad_campaign", campaignId: campaign.id };
        break;
      }

      case "chatbot_script": {
        const chatbot = await prisma.chatbotConfig.findUnique({ where: { clientId } });
        if (chatbot) {
          await prisma.chatbotConfig.update({
            where: { clientId },
            data: {
              greeting: content.greeting || chatbot.greeting,
              systemPrompt: `${chatbot.systemPrompt}\n\nQualifying Questions:\n${JSON.stringify(content.qualifyingQuestions, null, 2)}`,
            },
          });
          result = { type: "chatbot_script", chatbotId: chatbot.id, updated: true };
        } else {
          result = { type: "chatbot_script", updated: false, reason: "No chatbot configured" };
        }
        break;
      }

      case "landing_page": {
        // Landing page templates are informational — return the content for download
        result = { type: "landing_page", content };
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown template category" }, { status: 400 });
    }

    // Increment usage count
    await prisma.template.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("Template apply error:", err);
    return NextResponse.json(
      { error: "Failed to apply template" },
      { status: 500 }
    );
  }
}
