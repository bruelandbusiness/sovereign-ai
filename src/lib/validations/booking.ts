import { z } from "zod";

/**
 * Shared Zod schemas for booking-related entities.
 *
 * Used across the public booking form, embedded booking widget,
 * and dashboard booking management routes.
 */

/** Schema for the public website booking form (POST /api/bookings). */
export const bookingFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  businessName: z.string().min(2, "Business name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  interestedIn: z.string().min(1, "Select an option"),
  notes: z.string().optional(),
});

/** Schema for the embedded booking widget (POST /api/services/booking/book). */
export const bookingSlotSchema = z.object({
  clientId: z.string().min(1).max(100),
  customerName: z.string().min(1, "Customer name is required").max(200),
  customerEmail: z.string().email("Enter a valid email").max(254),
  customerPhone: z.string().max(30).optional(),
  serviceType: z.string().max(200).optional(),
  startsAt: z.string().datetime("Invalid start date/time"),
  endsAt: z.string().datetime("Invalid end date/time"),
});

/** Schema for financing applications (POST /api/financing/apply). */
export const financingApplySchema = z.object({
  clientId: z.string().min(1).max(100),
  customerName: z.string().min(1, "Customer name is required").max(200),
  customerEmail: z.string().email("Enter a valid email").max(254),
  customerPhone: z.string().max(30).optional(),
  amount: z.number().int().min(50000).max(2500000),
  term: z.number().int().refine((val) => [6, 12, 24].includes(val), {
    message: "Term must be 6, 12, or 24 months",
  }),
});

export type BookingFormInput = z.infer<typeof bookingFormSchema>;
/** Alias for backward compatibility with existing component imports. */
export type BookingFormValues = BookingFormInput;
export type BookingSlotInput = z.infer<typeof bookingSlotSchema>;
export type FinancingApplyInput = z.infer<typeof financingApplySchema>;
