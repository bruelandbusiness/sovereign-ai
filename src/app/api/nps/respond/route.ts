import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

/** Escape HTML special characters to prevent XSS in rendered HTML. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "nps-respond", 20);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const scoreStr = searchParams.get("score");
    const feedback = searchParams.get("feedback");

    if (!id || !scoreStr) {
      return NextResponse.json({ error: "id and score required" }, { status: 400 });
    }

    const score = parseInt(scoreStr, 10);
    if (isNaN(score) || score < 1 || score > 10) {
      return NextResponse.json({ error: "Score must be 1-10" }, { status: 400 });
    }

    // Truncate feedback to prevent abuse via oversized query params
    const sanitizedFeedback = feedback ? feedback.slice(0, 1000) : null;

    const nps = await prisma.nPSResponse.findUnique({ where: { id } });
    if (!nps) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    await prisma.nPSResponse.update({
      where: { id },
      data: {
        score,
        feedback: sanitizedFeedback,
        respondedAt: new Date(),
      },
    });

    // If score is low (< 7), flag it in admin activity
    if (score < 7) {
      await prisma.activityEvent.create({
        data: {
          clientId: nps.clientId,
          type: "seo_update", // Using existing type for system alerts
          title: `Low NPS score: ${score}/10`,
          description: `Client submitted a low NPS score (${score}/10). ${
            sanitizedFeedback ? `Feedback provided.` : "No feedback provided."
          } Follow up recommended.`,
        },
      });
    }

    // Return a simple thank you page (score is validated as int 1-10)
    const html = `
      <!DOCTYPE html>
      <html><head><title>Thank You | Sovereign AI</title>
      <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0a0f;color:#fff;margin:0}
      .card{text-align:center;padding:40px;max-width:400px}.score{font-size:48px;font-weight:700;background:linear-gradient(135deg,#4c85ff,#22d3a1);-webkit-background-clip:text;-webkit-text-fill-color:transparent}</style></head>
      <body><div class="card">
      <p class="score">${escapeHtml(String(score))}/10</p>
      <h1>Thank you for your feedback!</h1>
      <p style="color:#999">Your response has been recorded. We use this feedback to improve our service for businesses like yours.</p>
      <a href="https://www.trysovereignai.com/dashboard" style="display:inline-block;margin-top:24px;padding:12px 24px;background:linear-gradient(135deg,#4c85ff,#22d3a1);color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Go to Dashboard</a>
      </div></body></html>
    `;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process NPS response" },
      { status: 500 }
    );
  }
}
