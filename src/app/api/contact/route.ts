import { NextRequest } from "next/server";
import { z } from "zod";
import { rateLimitByIP, setRateLimitHeaders } from "@/lib/rate-limit";
import { apiSuccess, apiError } from "@/lib/api-response";
import { logAudit } from "@/lib/audit";
import { sendEmail, emailLayout, escapeHtml } from "@/lib/email";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const SUBJECTS = [
  "General",
  "Sales",
  "Support",
  "Partnerships",
  "Billing",
] as const;

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(30).optional().default(""),
  subject: z.enum(SUBJECTS, {
    error: "Please select a valid subject",
  }),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message must be under 5000 characters"),
});

const TEAM_EMAIL =
  process.env.CONTACT_FORM_RECIPIENT || "support@trysovereignai.com";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const rl = await rateLimitByIP(ip, "contact-form", 5);
  if (!rl.allowed) {
    return setRateLimitHeaders(
      apiError("Too many requests. Please try again later.", 429, rl),
      rl
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400, rl);
  }

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return apiError("Validation failed", 400, rl);
  }

  const { name, email, phone, subject, message } = parsed.data;

  // Send notification email to the team
  try {
    const body = `
      <h2 style="color:#0a0a0f;margin:0 0 16px;">New Contact Form Submission</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#666;width:100px;vertical-align:top;"><strong>Name:</strong></td>
          <td style="padding:8px 0;">${escapeHtml(name)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666;vertical-align:top;"><strong>Email:</strong></td>
          <td style="padding:8px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
        </tr>
        ${
          phone
            ? `<tr>
          <td style="padding:8px 0;color:#666;vertical-align:top;"><strong>Phone:</strong></td>
          <td style="padding:8px 0;">${escapeHtml(phone)}</td>
        </tr>`
            : ""
        }
        <tr>
          <td style="padding:8px 0;color:#666;vertical-align:top;"><strong>Subject:</strong></td>
          <td style="padding:8px 0;">${escapeHtml(subject)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666;vertical-align:top;"><strong>Message:</strong></td>
          <td style="padding:8px 0;white-space:pre-wrap;">${escapeHtml(message)}</td>
        </tr>
      </table>
    `;

    const html = emailLayout({ body, isTransactional: true });

    await sendEmail(
      TEAM_EMAIL,
      `[Contact Form] ${subject} — ${name}`,
      html
    );
  } catch (err: unknown) {
    logger.warnWithCause("[contact] Failed to send notification email", err);
    // Do not block the user response — the audit log still captures the submission.
  }

  // Store in audit log
  try {
    await logAudit({
      accountId: null,
      action: "contact_form_submit",
      resource: "contact",
      metadata: { name, email, phone, subject, message, ip },
    });
  } catch (err: unknown) {
    logger.warnWithCause("[contact] Failed to write audit log", err);
  }

  return apiSuccess(
    { message: "Your message has been sent. We'll respond within 4 hours." },
    200,
    rl
  );
}
