import { escapeHtml, emailLayout, emailButton } from "@/lib/email";

export interface BookingNoshowVars {
  customerName: string;
  businessName: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
  rebookUrl: string;
}

export function buildBookingNoshowEmail(vars: BookingNoshowVars): {
  subject: string;
  html: string;
} {
  const safeName = escapeHtml(vars.customerName);
  const safeBusiness = escapeHtml(vars.businessName);
  const safeService = escapeHtml(vars.serviceType);
  const safeDate = escapeHtml(vars.appointmentDate);
  const safeTime = escapeHtml(vars.appointmentTime);

  const subject = `We missed you, ${vars.customerName}!`;
  const preheader = `We noticed you weren\u2019t able to make your ${vars.serviceType} appointment. Let\u2019s reschedule.`;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";

  const body = `
    <p style="color:#333;font-size:16px;line-height:1.5;">Hi ${safeName},</p>
    <p style="color:#333;font-size:16px;line-height:1.5;">We noticed you weren&rsquo;t able to make your <strong>${safeService}</strong> appointment with <strong>${safeBusiness}</strong> on <strong>${safeDate}</strong> at <strong>${safeTime}</strong>.</p>
    <p style="color:#333;font-size:16px;line-height:1.5;">We understand that things come up &mdash; no worries at all! We&rsquo;d love to help you reschedule at a time that works better for you.</p>
    ${emailButton("Rebook Your Appointment", vars.rebookUrl)}
    <p style="color:#999;font-size:13px;text-align:center;margin-top:24px;">If you have any questions, simply reply to this email.</p>
  `;

  const html = emailLayout({
    preheader,
    body,
    unsubscribeUrl: `${appUrl}/unsubscribe`,
  });

  return { subject, html };
}
