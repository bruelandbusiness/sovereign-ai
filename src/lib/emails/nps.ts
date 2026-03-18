export function buildNPSEmail(
  ownerName: string,
  businessName: string,
  surveyType: "30day" | "90day",
  responseUrl: string
) {
  const isDay30 = surveyType === "30day";

  const subject = isDay30
    ? `Quick question about your experience, ${ownerName}`
    : `How are things going with Sovereign AI, ${ownerName}?`;

  const intro = isDay30
    ? `You've been using Sovereign AI for <strong>${businessName}</strong> for 30 days now. We'd love to know how it's going!`
    : `You've been part of the Sovereign AI family for 90 days. Your feedback helps us improve for businesses like ${businessName}.`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #0a0a0f; font-size: 24px; margin: 0;">Sovereign AI</h1>
      </div>

      <p style="color: #333; font-size: 16px; line-height: 1.5;">Hi ${ownerName},</p>
      <p style="color: #333; font-size: 16px; line-height: 1.5;">${intro}</p>

      <p style="color: #333; font-size: 16px; line-height: 1.5; font-weight: 600;">How likely are you to recommend Sovereign AI to a fellow business owner?</p>

      <div style="text-align: center; margin: 24px 0;">
        <table style="margin: 0 auto; border-collapse: collapse;">
          <tr>
            ${Array.from({ length: 10 }, (_, i) => {
              const score = i + 1;
              const bg = score <= 6 ? "#ef4444" : score <= 8 ? "#f59e0b" : "#22c55e";
              return `<td style="padding: 4px;">
                <a href="${responseUrl}?score=${score}" style="display: inline-block; width: 36px; height: 36px; line-height: 36px; text-align: center; background: ${bg}22; color: ${bg}; border: 2px solid ${bg}44; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">${score}</a>
              </td>`;
            }).join("")}
          </tr>
        </table>
        <div style="display: flex; justify-content: space-between; max-width: 400px; margin: 8px auto 0;">
          <span style="color: #999; font-size: 11px;">Not likely</span>
          <span style="color: #999; font-size: 11px;">Very likely</span>
        </div>
      </div>

      <p style="color: #666; font-size: 14px; text-align: center;">Click a number above — it takes 2 seconds.</p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
      <p style="color: #999; font-size: 12px; text-align: center;">Sovereign AI — AI-Powered Marketing for Local Businesses</p>
    </div>
  `;

  return { subject, html };
}
