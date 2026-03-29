import { z } from "zod";

/**
 * Centralized Zod schema library for commonly validated API inputs.
 *
 * Provides reusable field-level schemas (email, phone, name, etc.) and
 * composite schemas (pagination, contact form, lead creation, booking).
 *
 * Existing domain-specific schemas in src/lib/validations/ should be
 * preferred when they cover the use-case. Import primitives from this
 * file to keep field-level rules consistent across the codebase.
 */

// ---------------------------------------------------------------------------
// Common field schemas
// ---------------------------------------------------------------------------

export const emailSchema = z.string().email().max(254).toLowerCase().trim();

export const phoneSchema = z
  .string()
  .max(30)
  .regex(/^[+\d\s()-]+$/, "Invalid phone format")
  .optional();

export const nameSchema = z.string().min(1).max(200).trim();

export const urlSchema = z.string().url().max(2048).optional();

export const idSchema = z.string().cuid();

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ---------------------------------------------------------------------------
// Contact form
//
// For the route-specific contact schema that includes `subject`, see
// src/app/api/contact/route.ts. This version is a general-purpose
// contact form suitable for most landing pages and widget embeds.
// ---------------------------------------------------------------------------

export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  message: z.string().min(10).max(5000).trim(),
  company: z.string().max(200).optional(),
});

// ---------------------------------------------------------------------------
// Lead creation
//
// For richer lead schemas with UTM tracking and batch ingest, see
// src/lib/validations/lead.ts (leadCaptureSchema, inboundLeadSchema).
// ---------------------------------------------------------------------------

export const leadCreateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  source: z.string().max(50).default("website"),
  vertical: z.string().max(50).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Booking
//
// For the embedded booking widget schema (with clientId and endsAt), see
// src/lib/validations/booking.ts (bookingSlotSchema).
// ---------------------------------------------------------------------------

export const bookingSchema = z.object({
  serviceType: z.string().min(1).max(100),
  customerName: nameSchema,
  customerEmail: emailSchema,
  customerPhone: phoneSchema,
  startsAt: z.coerce.date(),
  duration: z.number().int().min(15).max(480), // minutes
  notes: z.string().max(2000).optional(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type PaginationInput = z.infer<typeof paginationSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type LeadCreateInput = z.infer<typeof leadCreateSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
