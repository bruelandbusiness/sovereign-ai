const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@sovereignai.com";

// ─── Security Helpers ─────────────────────────────────────────

/**
 * Escape special HTML characters in a string to prevent HTML injection / XSS.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Basic email validation.
 */
function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  // Simple but effective check: one @, no spaces, dot in domain part
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;
  if (/\s/.test(email)) return false;
  if (!domain.includes(".")) return false;
  return true;
}

/**
 * Return the URL unchanged if it uses http/https, otherwise return "#".
 * Prevents javascript:, data:, vbscript: and other dangerous protocols in href attributes.
 */
function safeHttpUrl(url: string): string {
  if (!url) return "#";
  if (/^https?:\/\//i.test(url)) return url;
  return "#";
}

// ─── Email Layout Helpers ─────────────────────────────────────

/**
 * Standard email footer with optional unsubscribe link.
 */
function emailFooter(unsubscribeUrl?: string): string {
  return `
    <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
    <p style="color: #999; font-size: 12px; text-align: center;">
      Sovereign AI, Inc.
      ${unsubscribeUrl ? `<br /><a href="${safeHttpUrl(unsubscribeUrl)}" style="color:#999;text-decoration:underline;">Unsubscribe</a>` : ""}
    </p>
  `;
}

/**
 * Wrap email body in a standard layout with preheader text and footer.
 */
function emailLayout(opts: {
  preheader?: string;
  body: string;
  unsubscribeUrl?: string;
  isTransactional?: boolean;
}): string {
  const preheaderHtml = opts.preheader
    ? `<span style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(opts.preheader)}</span>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  ${preheaderHtml}
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#0a0a0f;font-size:24px;margin:0;">Sovereign AI</h1>
    </div>
    ${opts.body}
    ${emailFooter(opts.isTransactional ? undefined : opts.unsubscribeUrl)}
  </div>
</body></html>`;
}

/**
 * Render a styled CTA button for emails.
 */
function emailButton(
  text: string,
  url: string,
  variant?: "primary" | "danger"
): string {
  const bg = variant === "danger"
    ? "#ef4444"
    : "linear-gradient(135deg, #4c85ff, #22d3a1)";
  const bgFallback = variant === "danger" ? "#ef4444" : "#4c85ff";

  return `
    <div style="text-align:center;margin:32px 0;">
      <a href="${safeHttpUrl(url)}" style="display:inline-block;background:${bg};background-color:${bgFallback};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
        ${escapeHtml(text)}
      </a>
    </div>
  `;
}

// ─── Core Send Functions ──────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string) {
  if (!SENDGRID_API_KEY) {
    console.log(`[DEV EMAIL] To: ${to}`);
    console.log(`[DEV EMAIL] Subject: ${subject}`);
    console.log(`[DEV EMAIL] Body: ${html}`);
    return;
  }

  await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: FROM_EMAIL, name: "Sovereign AI" },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });
}

export async function sendMagicLinkEmail(email: string, magicLinkUrl: string) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #0a0a0f; font-size: 24px; margin: 0;">Sovereign AI</h1>
      </div>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Click the button below to sign in to your dashboard:</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${magicLinkUrl}" style="background: linear-gradient(135deg, #4c85ff, #22d3a1); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
          Sign In to Dashboard
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
      <p style="color: #999; font-size: 12px; text-align: center;">Sovereign AI — AI-Powered Marketing for Local Businesses</p>
    </div>
  `;

  await sendEmail(email, "Sign in to Sovereign AI", html);
}

export async function sendWelcomeEmail(
  email: string,
  ownerName: string,
  businessName: string,
  magicLinkUrl: string
) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #0a0a0f; font-size: 24px; margin: 0;">Welcome to Sovereign AI</h1>
      </div>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Hey ${escapeHtml(ownerName)},</p>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Welcome aboard! Your AI marketing services for <strong>${escapeHtml(businessName)}</strong> are being activated right now.</p>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Here's what happens next:</p>
      <ul style="color: #333; font-size: 16px; line-height: 1.8;">
        <li>Your services will be live within <strong>48 hours</strong></li>
        <li>Your dedicated dashboard is ready now</li>
        <li>An account manager will reach out within 1 hour</li>
      </ul>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${magicLinkUrl}" style="background: linear-gradient(135deg, #4c85ff, #22d3a1); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
          View Your Dashboard
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">This link is valid for 7 days. You can request a new sign-in link anytime at sovereignai.com/login.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
      <p style="color: #999; font-size: 12px; text-align: center;">Sovereign AI — AI-Powered Marketing for Local Businesses</p>
    </div>
  `;

  await sendEmail(
    email,
    `Welcome to Sovereign AI, ${escapeHtml(ownerName)}!`,
    html
  );
}

export async function sendReviewRequestEmail(
  email: string,
  customerName: string,
  businessName: string,
  reviewUrl: string
) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Hi ${escapeHtml(customerName)},</p>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Thank you for choosing <strong>${escapeHtml(businessName)}</strong>! We hope you had a great experience.</p>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Would you mind taking 30 seconds to leave us a review? It really helps small businesses like ours.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${safeHttpUrl(reviewUrl)}" style="background: #fbbf24; color: #1a1a1a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
          ⭐ Leave a Review
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">Thank you so much — it means the world to us!</p>
      <p style="color: #999; font-size: 12px;">— The ${escapeHtml(businessName)} Team</p>
    </div>
  `;

  await sendEmail(
    email,
    `How was your experience with ${escapeHtml(businessName)}?`,
    html
  );
}

export async function sendCampaignEmail(
  to: string,
  subject: string,
  body: string
) {
  await sendEmail(to, subject, body);
}

export async function sendBookingReminderEmail(
  email: string,
  customerName: string,
  businessName: string,
  appointmentDate: string,
  appointmentTime: string
) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #0a0a0f; font-size: 24px; margin: 0;">Appointment Reminder</h1>
      </div>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Hi ${escapeHtml(customerName)},</p>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">This is a friendly reminder that you have an upcoming appointment with <strong>${escapeHtml(businessName)}</strong>:</p>
      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="color: #333; font-size: 18px; font-weight: 600; margin: 0;">${escapeHtml(appointmentDate)}</p>
        <p style="color: #666; font-size: 16px; margin: 8px 0 0;">at ${escapeHtml(appointmentTime)}</p>
      </div>
      <p style="color: #666; font-size: 14px;">If you need to reschedule, please contact us as soon as possible.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
      <p style="color: #999; font-size: 12px; text-align: center;">— The ${escapeHtml(businessName)} Team</p>
    </div>
  `;

  await sendEmail(email, `Reminder: Your appointment with ${escapeHtml(businessName)} tomorrow`, html);
}

export async function sendDripEmail(
  to: string,
  subject: string,
  body: string,
  businessName: string
) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      ${body}
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
      <p style="color: #999; font-size: 12px; text-align: center;">Sent by ${escapeHtml(businessName)} via Sovereign AI</p>
    </div>
  `;

  await sendEmail(to, subject, html);
}

/**
 * Queue an email via the email queue system (for non-urgent sends).
 * Falls back to direct send if the queue module cannot be loaded.
 */
async function sendEmailQueued(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  try {
    const { queueEmail } = await import("@/lib/email-queue");
    await queueEmail(to, subject, html);
  } catch {
    // Fallback to direct send if queue is unavailable
    await sendEmail(to, subject, html);
  }
}

export {
  escapeHtml,
  isValidEmail,
  safeHttpUrl,
  emailFooter,
  emailLayout,
  emailButton,
  sendEmail,
  sendEmailQueued,
};
