const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@sovereignai.com";

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
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Hey ${ownerName},</p>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Welcome aboard! Your AI marketing services for <strong>${businessName}</strong> are being activated right now.</p>
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
    `Welcome to Sovereign AI, ${ownerName}!`,
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
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Hi ${customerName},</p>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Thank you for choosing <strong>${businessName}</strong>! We hope you had a great experience.</p>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Would you mind taking 30 seconds to leave us a review? It really helps small businesses like ours.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${reviewUrl}" style="background: #fbbf24; color: #1a1a1a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
          ⭐ Leave a Review
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">Thank you so much — it means the world to us!</p>
      <p style="color: #999; font-size: 12px;">— The ${businessName} Team</p>
    </div>
  `;

  await sendEmail(
    email,
    `How was your experience with ${businessName}?`,
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
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Hi ${customerName},</p>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">This is a friendly reminder that you have an upcoming appointment with <strong>${businessName}</strong>:</p>
      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="color: #333; font-size: 18px; font-weight: 600; margin: 0;">${appointmentDate}</p>
        <p style="color: #666; font-size: 16px; margin: 8px 0 0;">at ${appointmentTime}</p>
      </div>
      <p style="color: #666; font-size: 14px;">If you need to reschedule, please contact us as soon as possible.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
      <p style="color: #999; font-size: 12px; text-align: center;">— The ${businessName} Team</p>
    </div>
  `;

  await sendEmail(email, `Reminder: Your appointment with ${businessName} tomorrow`, html);
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
      <p style="color: #999; font-size: 12px; text-align: center;">Sent by ${businessName} via Sovereign AI</p>
    </div>
  `;

  await sendEmail(to, subject, html);
}
