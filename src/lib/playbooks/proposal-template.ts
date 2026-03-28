/**
 * HTML proposal template for contractor prospects.
 * Generates a 1-page PDF-ready proposal with projected ROI.
 *
 * Used by acquisition/proposal-generator.ts as a structured fallback
 * and by the proposal API routes for consistent formatting.
 */

export interface ProposalContext {
  companyName: string;
  contractorName: string;
  serviceArea: string;
  vertical: string;
  avgJobValue: number; // dollars
  projectedLeads: number;
  closeRate: number; // percentage, e.g., 15
  monthlyPrice: number; // dollars
  setupFee: number; // dollars
  pilotPrice: number; // dollars
  planName: string;
  leadsIncluded: number;
  channels: string; // e.g., "Email + SMS"
  sourceCount: number;
  supportChannel: string;
  ctaLink: string;
  phone: string;
  // Optional case study metrics
  caseStudies?: Array<{
    companyName: string;
    vertical: string;
    metric: string; // e.g., "42 leads/month at $18 CPL"
  }>;
}

export function generateProposalHtml(ctx: ProposalContext): string {
  const projectedJobs = Math.round(ctx.projectedLeads * (ctx.closeRate / 100));
  const projectedRevenue = projectedJobs * ctx.avgJobValue;
  const roi = ctx.monthlyPrice > 0
    ? (projectedRevenue / ctx.monthlyPrice).toFixed(1)
    : "N/A";

  const caseStudyRows = ctx.caseStudies?.length
    ? ctx.caseStudies
        .map(
          (cs) =>
            `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;">${esc(cs.companyName)} (${esc(cs.vertical)})</td><td style="padding:6px 12px;border-bottom:1px solid #eee;">${esc(cs.metric)}</td></tr>`
        )
        .join("")
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Proposal for ${esc(ctx.companyName)}</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a2e;background:#fff;">
<div style="max-width:680px;margin:0 auto;padding:40px 32px;">

  <!-- Header -->
  <div style="border-bottom:3px solid #4c85ff;padding-bottom:20px;margin-bottom:24px;">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#4c85ff;margin-bottom:4px;">Sovereign Empire</div>
    <h1 style="margin:0;font-size:24px;color:#1a1a2e;">Lead Generation Proposal for ${esc(ctx.companyName)}</h1>
  </div>

  <!-- Intro -->
  <p style="font-size:15px;line-height:1.6;color:#333;">
    ${esc(ctx.contractorName)}, here's what an AI-powered lead pipeline looks like for ${esc(ctx.companyName)}:
  </p>

  <!-- Market Section -->
  <h2 style="font-size:16px;color:#4c85ff;margin:24px 0 12px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;">Your Market</h2>
  <table style="width:100%;font-size:14px;border-collapse:collapse;">
    <tr><td style="padding:6px 0;color:#666;">Service Area</td><td style="padding:6px 0;text-align:right;font-weight:600;">${esc(ctx.serviceArea)}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Vertical</td><td style="padding:6px 0;text-align:right;font-weight:600;">${esc(ctx.vertical)}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Average Job Value</td><td style="padding:6px 0;text-align:right;font-weight:600;">$${ctx.avgJobValue.toLocaleString()}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">Estimated Monthly Leads</td><td style="padding:6px 0;text-align:right;font-weight:600;">${ctx.projectedLeads}</td></tr>
  </table>

  <!-- ROI Section -->
  <h2 style="font-size:16px;color:#4c85ff;margin:24px 0 12px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;">Your Projected ROI</h2>
  <div style="background:#f0f4ff;border-radius:8px;padding:20px;margin:12px 0;">
    <table style="width:100%;font-size:14px;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#333;">Monthly leads delivered</td><td style="padding:6px 0;text-align:right;font-weight:700;">${ctx.projectedLeads}</td></tr>
      <tr><td style="padding:6px 0;color:#333;">Conservative close rate</td><td style="padding:6px 0;text-align:right;font-weight:700;">${ctx.closeRate}%</td></tr>
      <tr><td style="padding:6px 0;color:#333;">Projected monthly jobs</td><td style="padding:6px 0;text-align:right;font-weight:700;">${projectedJobs}</td></tr>
      <tr><td style="padding:6px 0;color:#333;">Projected monthly revenue</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#22d3a1;">$${projectedRevenue.toLocaleString()}</td></tr>
      <tr><td style="padding:6px 0;color:#333;">Service cost</td><td style="padding:6px 0;text-align:right;font-weight:700;">$${ctx.monthlyPrice.toLocaleString()}/mo</td></tr>
      <tr style="border-top:2px solid #4c85ff;"><td style="padding:10px 0;color:#1a1a2e;font-weight:700;font-size:16px;">Projected ROI</td><td style="padding:10px 0;text-align:right;font-weight:800;font-size:20px;color:#4c85ff;">${roi}x</td></tr>
    </table>
  </div>

  <!-- What's Included -->
  <h2 style="font-size:16px;color:#4c85ff;margin:24px 0 12px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;">What's Included</h2>
  <ul style="font-size:14px;line-height:1.8;color:#333;padding-left:20px;">
    <li>AI-powered lead discovery from ${ctx.sourceCount} data sources</li>
    <li>Contact verification before delivery</li>
    <li>Personalized outreach on your behalf</li>
    <li>Automated follow-up sequences</li>
    <li>Real-time dashboard with lead pipeline</li>
    <li>Weekly performance reports</li>
    <li>Dedicated support via ${esc(ctx.supportChannel)}</li>
  </ul>

  ${caseStudyRows ? `
  <!-- Social Proof -->
  <h2 style="font-size:16px;color:#4c85ff;margin:24px 0 12px;border-bottom:1px solid #e5e7eb;padding-bottom:6px;">Results From Similar Companies</h2>
  <table style="width:100%;font-size:14px;border-collapse:collapse;">
    <tr style="background:#f8f9fa;"><th style="padding:8px 12px;text-align:left;font-weight:600;">Company</th><th style="padding:8px 12px;text-align:left;font-weight:600;">Results</th></tr>
    ${caseStudyRows}
  </table>` : ""}

  <!-- Recommended Plan -->
  <div style="background:#1a1a2e;color:#fff;border-radius:8px;padding:24px;margin:24px 0;text-align:center;">
    <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#4c85ff;margin-bottom:8px;">Recommended Plan</div>
    <div style="font-size:22px;font-weight:700;margin-bottom:4px;">${esc(ctx.planName)} — $${ctx.monthlyPrice.toLocaleString()}/month</div>
    <div style="font-size:13px;color:#aaa;">${ctx.setupFee > 0 ? `+ $${ctx.setupFee.toLocaleString()} setup · ` : ""}${ctx.leadsIncluded} leads/month via ${esc(ctx.channels)}</div>
  </div>

  <!-- Pilot Option -->
  <div style="border:2px solid #22d3a1;border-radius:8px;padding:20px;margin:16px 0;text-align:center;">
    <div style="font-size:14px;font-weight:700;color:#22d3a1;margin-bottom:4px;">30-Day Pilot Option</div>
    <div style="font-size:14px;color:#333;">Try it risk-reduced at <strong>$${ctx.pilotPrice.toLocaleString()}/month</strong> for the first 30 days.</div>
  </div>

  <!-- CTA -->
  <div style="text-align:center;margin:32px 0;">
    <a href="${esc(ctx.ctaLink)}" style="background:linear-gradient(135deg,#4c85ff,#22d3a1);color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;">Ready to Start</a>
  </div>
  <p style="text-align:center;font-size:14px;color:#666;">
    Questions? Call Seth: <strong>${esc(ctx.phone)}</strong> or reply to this email.
  </p>

  <!-- Footer -->
  <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
  <p style="text-align:center;font-size:11px;color:#999;">Sovereign Empire · AI-Powered Lead Generation</p>
</div>
</body>
</html>`;
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
