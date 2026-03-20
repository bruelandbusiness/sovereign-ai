function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildWeeklyReportEmail(data: {
  businessName: string;
  ownerName: string;
  leads: number;
  reviews: number;
  contentPublished: number;
  chatbotConversations: number;
  bookings: number;
  estimatedRevenue: number;
}) {
  const {
    businessName,
    ownerName,
    leads,
    reviews,
    contentPublished,
    chatbotConversations,
    bookings,
    estimatedRevenue,
  } = data;

  const safeName = escapeHtml(ownerName);
  const safeBusiness = escapeHtml(businessName);

  const subject = `Weekly Report: ${leads} Leads, ${reviews} Reviews — ${safeBusiness}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #0a0a0f; font-size: 24px; margin: 0;">Your Weekly AI Report</h1>
        <p style="color: #666; font-size: 14px; margin-top: 8px;">Sovereign AI Performance Summary</p>
      </div>

      <p style="color: #333; font-size: 16px; line-height: 1.5;">Hi ${safeName},</p>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">Here's what your AI marketing systems accomplished for <strong>${safeBusiness}</strong> this week:</p>

      <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
              <span style="color: #666; font-size: 14px;">New Leads</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
              <strong style="color: #4c85ff; font-size: 20px;">${leads}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
              <span style="color: #666; font-size: 14px;">Reviews Received</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
              <strong style="color: #22d3a1; font-size: 20px;">${reviews}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
              <span style="color: #666; font-size: 14px;">Content Published</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
              <strong style="color: #333; font-size: 20px;">${contentPublished}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
              <span style="color: #666; font-size: 14px;">Chatbot Conversations</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
              <strong style="color: #333; font-size: 20px;">${chatbotConversations}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
              <span style="color: #666; font-size: 14px;">Bookings</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
              <strong style="color: #333; font-size: 20px;">${bookings}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0;">
              <span style="color: #666; font-size: 14px;">Est. Revenue Impact</span>
            </td>
            <td style="padding: 12px 0; text-align: right;">
              <strong style="color: #22d3a1; font-size: 20px;">$${estimatedRevenue.toLocaleString()}</strong>
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="https://sovereignai.com/dashboard" style="background: linear-gradient(135deg, #4c85ff, #22d3a1); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
          View Full Dashboard
        </a>
      </div>

      <p style="color: #666; font-size: 14px; text-align: center;">Your AI systems are working 24/7. Keep up the momentum!</p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
      <p style="color: #999; font-size: 12px; text-align: center;">Sovereign AI — AI-Powered Marketing for Local Businesses</p>
    </div>
  `;

  return { subject, html };
}
