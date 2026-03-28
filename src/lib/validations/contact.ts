import { z } from "zod";

/**
 * Shared Zod schemas for contact and communication entities.
 *
 * Used across consent, compliance, support tickets, career applications,
 * and other contact-related API routes.
 */

/** Schema for cookie consent preferences (POST /api/consent). */
export const cookieConsentSchema = z.object({
  analytics: z.boolean(),
  marketing: z.boolean(),
  functional: z.boolean(),
});

/** Schema for compliance consent recording (POST /api/compliance/consent). */
export const complianceConsentSchema = z.object({
  clientId: z.string().min(1).max(100),
  contactPhone: z.string().max(30).optional(),
  contactEmail: z.string().email().max(254).optional(),
  channel: z.enum(["sms", "email", "voice"]),
  consentType: z.enum(["express_written", "opt_in", "implied"]),
  consentSource: z.enum(["form", "chatbot", "api", "manual"]),
  consentText: z.string().max(5000).optional(),
});

/** Schema for consent revocation (POST /api/compliance/revoke). */
export const consentRevokeSchema = z.object({
  clientId: z.string().min(1).max(100),
  channel: z.enum(["sms", "email", "voice"]),
  contactIdentifier: z.string().min(1).max(254),
});

/** Schema for compliance check (POST /api/compliance/check). */
export const complianceCheckSchema = z.object({
  channel: z.enum(["email", "sms", "voice"]),
  contactEmail: z.string().email().max(254).optional(),
  contactPhone: z.string().min(1).max(30).optional(),
  html: z.string().max(100000).optional(),
});

/** Schema for career applications (POST /api/careers/[id]/apply). */
export const careerApplySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Enter a valid email").max(254),
  phone: z.string().max(30).optional(),
  experience: z.string().max(5000).optional(),
  certifications: z.array(z.string().max(200)).max(20).optional(),
  coverLetter: z.string().max(10000).optional(),
});

/** Schema for support ticket creation (POST /api/dashboard/support). */
export const supportTicketSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(1, "Message is required").max(10000),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
});

/** Schema for push notification subscription (POST /api/push/subscribe). */
export const pushSubscribeSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(500),
  }),
});

export type CookieConsentInput = z.infer<typeof cookieConsentSchema>;
export type ComplianceConsentInput = z.infer<typeof complianceConsentSchema>;
export type ConsentRevokeInput = z.infer<typeof consentRevokeSchema>;
export type ComplianceCheckInput = z.infer<typeof complianceCheckSchema>;
export type CareerApplyInput = z.infer<typeof careerApplySchema>;
export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
export type PushSubscribeInput = z.infer<typeof pushSubscribeSchema>;
