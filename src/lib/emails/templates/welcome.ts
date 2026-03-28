/**
 * Welcome email template — sent when a user signs up for a trial.
 */

import { escapeHtml } from "@/lib/email";
import {
  baseLayout,
  heading,
  paragraph,
  stepList,
  ctaButton,
  infoCard,
  BRAND,
} from "./shared";

export interface WelcomeVars {
  name: string;
  businessName: string;
  dashboardUrl: string;
  trialDays?: number;
}

export function buildWelcome(vars: WelcomeVars): { subject: string; html: string } {
  const trialDays = vars.trialDays ?? 14;
  const safeName = escapeHtml(vars.name);
  const safeBusiness = escapeHtml(vars.businessName);

  const subject = `Welcome to Sovereign AI, ${escapeHtml(vars.name)}!`;

  const body = `
    ${heading(`Welcome aboard, ${safeName}!`)}
    ${paragraph(`Your AI marketing engine for <strong>${safeBusiness}</strong> is being activated right now. You have <strong>${trialDays} days</strong> of full access to see what AI-powered marketing can do for your business.`)}

    ${heading("Here's what happens next:", 2)}

    ${stepList([
      { number: "1", title: "Your dashboard is live", description: "Access real-time analytics, lead tracking, and service controls right now." },
      { number: "2", title: "AI services activating", description: "Your AI chatbot, CRM, and analytics are being configured for your business." },
      { number: "3", title: "First results within days", description: "Most businesses see their first AI-generated leads within 7 days." },
    ])}

    ${ctaButton("Open Your Dashboard", vars.dashboardUrl)}

    ${infoCard(`
      <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.muted};margin:0 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">What's included in your trial</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr><td style="padding:6px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;color:${BRAND.text};">&#x2713;&ensp;AI Chatbot (50 conversations/month)</td></tr>
        <tr><td style="padding:6px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;color:${BRAND.text};">&#x2713;&ensp;CRM with AI lead scoring (50 leads)</td></tr>
        <tr><td style="padding:6px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;color:${BRAND.text};">&#x2713;&ensp;Analytics dashboard (read-only)</td></tr>
        <tr><td style="padding:6px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;color:${BRAND.text};">&#x2713;&ensp;24/7 AI-powered support</td></tr>
      </table>
    `)}

    ${paragraph("Need help getting started? Reply to this email anytime — a real human will respond.", { muted: true, small: true })}
  `;

  return {
    subject,
    html: baseLayout({ preheader: `Welcome, ${escapeHtml(vars.name)}! Your ${trialDays}-day free trial for ${escapeHtml(vars.businessName)} is now active.`, body, isTransactional: true }),
  };
}
