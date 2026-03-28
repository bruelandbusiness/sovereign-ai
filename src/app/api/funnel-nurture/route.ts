import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret, withCronErrorHandler } from "@/lib/cron";
import { sendEmail } from "@/lib/email";
import { NURTURE_SEQUENCE, renderNurtureEmail } from "@/lib/funnel-emails";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/funnel-nurture
 *
 * Cron endpoint that checks for pending nurture emails and sends them.
 * Runs daily via Vercel Cron.
 *
 * Security: Requires CRON_SECRET via verifyCronSecret.
 */
export const GET = withCronErrorHandler("funnel-nurture", async (request) => {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    // Find all funnel leads that haven't completed the sequence (limit to 200)
    const leads = await prisma.lead.findMany({
      where: {
        source: { startsWith: "funnel-" },
        status: { in: ["new", "contacted"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        source: true,
        notes: true,
        createdAt: true,
      },
      take: 200,
    });

    let sent = 0;

    for (const lead of leads) {
      if (!lead.email) continue;

      // Parse trade from source (e.g., "funnel-free-audit-plumber" -> "plumber")
      const sourceParts = lead.source?.split("-") || [];
      const trade = sourceParts.length >= 4 ? sourceParts[3] : undefined;

      // Calculate which email should be sent based on days since signup
      const daysSinceSignup = Math.floor(
        (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Parse which emails have already been sent from notes
      const sentIds = parseSentEmailIds(lead.notes || "");

      // Find the next email to send
      const nextEmail = NURTURE_SEQUENCE.find(
        (email) =>
          !sentIds.has(email.id) && daysSinceSignup >= email.dayOffset
      );

      if (!nextEmail) continue;

      // Render and send
      const html = renderNurtureEmail(nextEmail, {
        name: lead.name || "there",
        trade,
      });

      try {
        await sendEmail(lead.email, nextEmail.subject, html);

        // Record sent email in notes
        const newSentIds = [...sentIds, nextEmail.id].join(",");
        const existingNotes = lead.notes || "";
        const notesPrefix = existingNotes
          ? existingNotes.replace(/\| Nurture sent: [\d,]+/, "").trim()
          : "";

        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            status: "contacted",
            notes: `${notesPrefix} | Nurture sent: ${newSentIds}`.trim(),
          },
        });

        sent++;
      } catch (err) {
        logger.errorWithCause("[funnel-nurture] Failed to send nurture email", err, {
          leadId: lead.id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      leadsProcessed: leads.length,
      emailsSent: sent,
    });
  } catch (error) {
    logger.errorWithCause("[funnel-nurture] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

function parseSentEmailIds(notes: string): Set<number> {
  const match = notes.match(/Nurture sent: ([\d,]+)/);
  if (!match) return new Set();
  return new Set(match[1].split(",").map(Number).filter(Boolean));
}
