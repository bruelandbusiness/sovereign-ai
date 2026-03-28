import { z } from "zod";

/**
 * Shared Zod schemas for lead-related entities.
 *
 * Used across lead capture, inbound lead, funnel capture, and
 * exit-intent API routes to ensure consistent validation.
 */

/** Core contact fields reused across lead schemas. */
export const leadContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Enter a valid email").max(254),
  phone: z.string().max(30).optional(),
});

/** UTM tracking parameters. */
export const utmSchema = z.object({
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(200).optional(),
});

/** Schema for POST /api/leads/capture. */
export const leadCaptureSchema = leadContactSchema.extend({
  source: z.string().max(50).optional().default("website"),
  trade: z.string().max(50).optional(),
  partnerSlug: z.string().max(100).optional(),
  referralCode: z.string().max(50).optional(),
  clientId: z.string().max(100).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  ...utmSchema.shape,
});

/** Schema for a single inbound lead (POST /api/leads/inbound). */
export const inboundLeadSchema = leadContactSchema.extend({
  trade: z.string().max(50).optional(),
  source: z.string().max(50).optional().default("clay"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/** Batch wrapper for inbound leads. */
export const inboundLeadBatchSchema = z.object({
  leads: z.array(inboundLeadSchema).min(1).max(100),
});

/** Schema for POST /api/exit-capture. */
export const exitCaptureSchema = z.object({
  email: z.string().email("Enter a valid email").max(254),
  clientId: z.string().min(1).max(100).optional(),
});

/** Schema for POST /api/funnel-capture. */
export const funnelCaptureSchema = leadContactSchema.extend({
  business: z.string().max(200).optional(),
  trade: z.string().max(50).optional(),
  source: z.enum(["free-audit", "webinar", "playbook", "strategy-call"]),
  ...utmSchema.shape,
});

/** Schema for POST /api/find-a-pro/request. */
export const findAProRequestSchema = leadContactSchema.extend({
  clientId: z.string().min(1).max(100),
  serviceNeeded: z.string().max(500).optional(),
  message: z.string().max(5000).optional(),
});

export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>;
export type InboundLeadInput = z.infer<typeof inboundLeadSchema>;
export type ExitCaptureInput = z.infer<typeof exitCaptureSchema>;
export type FunnelCaptureInput = z.infer<typeof funnelCaptureSchema>;
export type FindAProRequestInput = z.infer<typeof findAProRequestSchema>;
