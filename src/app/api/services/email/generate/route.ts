import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = session.account.client;

  let body: { campaignType?: string; topic?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const campaignType = body.campaignType || "broadcast";
  const topic = body.topic || "Monthly Newsletter";
  const vertical = client.vertical || "home service";
  const businessName = client.businessName;
  const location =
    client.city && client.state
      ? `${client.city}, ${client.state}`
      : "your area";

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: `You are an email marketing expert. Write compelling email copy for a ${vertical} business called ${businessName}.`,
      messages: [
        {
          role: "user",
          content: `Write a ${campaignType} email about "${topic}" for ${businessName}, a ${vertical} business in ${location}.

Return ONLY a JSON object with two fields:
- "subject": a compelling email subject line
- "body": the full email body as HTML (use <h2>, <p>, <ul>, <li> tags for structure)

The email should be professional, engaging, and include a call-to-action. Do not include any text outside the JSON object.`,
        },
      ],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse the JSON response from Claude
    let subject: string;
    let emailBody: string;

    try {
      const parsed = JSON.parse(rawText);
      subject = parsed.subject;
      emailBody = parsed.body;
    } catch {
      // Fallback: if Claude didn't return valid JSON, use the raw text
      subject = `${topic} - ${businessName}`;
      emailBody = rawText;
    }

    return NextResponse.json({ subject, body: emailBody });
  } catch (error) {
    console.error("Email generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate email content" },
      { status: 500 }
    );
  }
}
