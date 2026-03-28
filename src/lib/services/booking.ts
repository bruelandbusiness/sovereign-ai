import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  guardedAnthropicCall,
  GovernanceBlockedError,
} from "@/lib/governance/ai-guard";
import {
  extractTextContent,
  extractJSONContent,
  sanitizeForPrompt,
} from "@/lib/ai-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BookingConfirmationResult {
  message: string;
  subject: string;
}

export interface ReminderMessage {
  timing: string; // "1_day" | "2_hours" | "30_min"
  timingLabel: string;
  subject: string;
  message: string;
}

export interface ReminderSequenceResult {
  reminders: ReminderMessage[];
  appointmentSummary: string;
}

interface AppointmentInfo {
  customerName: string;
  customerPhone?: string;
  serviceType: string;
  startsAt: Date;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Provisioning (existing)
// ---------------------------------------------------------------------------

/**
 * Provision the booking/scheduling service for a client.
 * Stores default business hours (Mon-Fri 9-5, 60-min slots) in ClientService.config.
 */
export async function provisionBooking(clientId: string) {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const defaultConfig = {
    businessHours: {
      mon: "9:00-17:00",
      tue: "9:00-17:00",
      wed: "9:00-17:00",
      thu: "9:00-17:00",
      fri: "9:00-17:00",
    },
    slotDuration: 60,
  };

  const clientService = await prisma.clientService.findUnique({
    where: { clientId_serviceId: { clientId, serviceId: "booking" } },
  });

  if (clientService) {
    // Idempotency: skip if config already set (re-provisioning)
    if (clientService.config) return;

    await prisma.clientService.update({
      where: { id: clientService.id },
      data: { config: JSON.stringify(defaultConfig) },
    });
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "call_booked",
      title: "Booking system activated",
      description: `Online booking is now available for ${client.businessName}. Default hours: Mon-Fri, 9 AM - 5 PM with 60-minute slots.`,
    },
  });
}

// ---------------------------------------------------------------------------
// generateBookingConfirmation — personalized confirmation message
// ---------------------------------------------------------------------------

/**
 * Generate a personalized booking confirmation message for a customer.
 *
 * Uses the client's brand voice and includes all relevant appointment details.
 * Suitable for email or SMS delivery.
 *
 * @param clientId    - The client whose brand to use
 * @param appointment - The appointment details
 */
export async function generateBookingConfirmation(
  clientId: string,
  appointment: AppointmentInfo
): Promise<BookingConfirmationResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  const safeOwnerName = sanitizeForPrompt(client.ownerName, 100);
  const safeVertical = sanitizeForPrompt(client.vertical || "home service", 100);
  const safeCustomerName = sanitizeForPrompt(appointment.customerName, 100);
  const safeServiceType = sanitizeForPrompt(appointment.serviceType, 200);
  const safeNotes = appointment.notes ? sanitizeForPrompt(appointment.notes, 300) : "";

  const appointmentDate = appointment.startsAt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const appointmentTime = appointment.startsAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const systemPrompt = `You are a customer communication specialist for ${safeBusinessName}, a ${safeVertical} company. Write warm, professional confirmation messages that make customers feel valued and confident in their booking.`;

  const userPrompt = `Write a booking confirmation message for:

Customer: ${safeCustomerName}
Service: ${safeServiceType}
Date: ${appointmentDate}
Time: ${appointmentTime}
${safeNotes ? `Notes: ${safeNotes}` : ""}
Business: ${safeBusinessName} (owner: ${safeOwnerName})
Phone: ${client.phone || "N/A"}

Requirements:
- Thank them for booking
- Confirm all appointment details clearly
- Include what to expect / how to prepare (brief, relevant to ${safeServiceType})
- Include the business phone number for questions or rescheduling
- Keep it under 150 words
- Sign off with ${safeOwnerName} and the team

Return a JSON object with:
- "subject": email subject line for the confirmation
- "message": the full confirmation message text`;

  let subject: string;
  let message: string;

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "booking.confirmation",
      description: `Generate booking confirmation for ${safeCustomerName}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<{ subject?: string; message?: string }>(response, {});

    subject = parsed.subject || `Your ${appointment.serviceType} appointment is confirmed — ${client.businessName}`;
    message = parsed.message || extractTextContent(response, "");
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[booking] Confirmation generation failed:", error);
    subject = `Your ${appointment.serviceType} appointment is confirmed — ${client.businessName}`;
    message = "";
  }

  if (!message) {
    message = `Hi ${appointment.customerName},

Thank you for booking with ${client.businessName}! Your appointment is confirmed:

Service: ${appointment.serviceType}
Date: ${appointmentDate}
Time: ${appointmentTime}
${appointment.notes ? `Notes: ${appointment.notes}\n` : ""}
If you need to reschedule or have any questions, please call us at ${client.phone || "our office"}.

We look forward to seeing you!

— ${client.ownerName} and the ${client.businessName} Team`;
  }

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "call_booked",
      title: `Booking confirmed: ${appointment.customerName}`,
      description: `${appointment.serviceType} appointment confirmed for ${appointmentDate} at ${appointmentTime}.`,
    },
  });

  return { message, subject };
}

// ---------------------------------------------------------------------------
// generateReminderSequence — 3-message reminder sequence
// ---------------------------------------------------------------------------

/**
 * Generate a 3-message reminder sequence for an upcoming appointment:
 * 1. One day before
 * 2. Two hours before
 * 3. Thirty minutes before
 *
 * Each message is progressively shorter and more urgent.
 *
 * @param clientId    - The client whose brand to use
 * @param appointment - The appointment details
 */
export async function generateReminderSequence(
  clientId: string,
  appointment: AppointmentInfo
): Promise<ReminderSequenceResult> {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const safeBusinessName = sanitizeForPrompt(client.businessName, 200);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const safeOwnerName = sanitizeForPrompt(client.ownerName, 100);
  const safeCustomerName = sanitizeForPrompt(appointment.customerName, 100);
  const safeServiceType = sanitizeForPrompt(appointment.serviceType, 200);

  const appointmentDate = appointment.startsAt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const appointmentTime = appointment.startsAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const appointmentSummary = `${safeServiceType} on ${appointmentDate} at ${appointmentTime}`;

  const systemPrompt = `You are a customer communication specialist for ${safeBusinessName}. Write brief, friendly appointment reminders that reduce no-shows. Keep messages SMS-friendly (under 160 characters for the 2-hour and 30-min reminders).`;

  const userPrompt = `Create 3 appointment reminders for:

Customer: ${safeCustomerName}
Service: ${safeServiceType}
Date: ${appointmentDate}
Time: ${appointmentTime}
Business: ${safeBusinessName}
Phone: ${client.phone || "N/A"}

Create these 3 reminders:

1. ONE DAY BEFORE (email-friendly, 2-3 sentences):
   - Remind about tomorrow's appointment
   - Include preparation tips if relevant
   - Include option to reschedule

2. TWO HOURS BEFORE (SMS-friendly, under 160 chars):
   - Quick reminder with time
   - Brief and direct

3. THIRTY MINUTES BEFORE (SMS-friendly, under 160 chars):
   - "Almost time" reminder
   - Very brief

Return a JSON object with:
- "reminders": Array of 3 objects with:
  - "timing": "1_day" | "2_hours" | "30_min"
  - "timingLabel": "1 day before" | "2 hours before" | "30 minutes before"
  - "subject": email subject (for the 1-day reminder)
  - "message": the reminder text`;

  let reminders: ReminderMessage[];

  try {
    const response = await guardedAnthropicCall({
      clientId,
      action: "booking.reminders",
      description: `Generate reminder sequence for ${safeCustomerName}`,
      params: {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      },
    });

    const parsed = extractJSONContent<{ reminders?: ReminderMessage[] }>(response, {});

    reminders = Array.isArray(parsed.reminders) && parsed.reminders.length >= 3
      ? parsed.reminders.slice(0, 3)
      : [];
  } catch (error) {
    if (error instanceof GovernanceBlockedError) {
      throw error;
    }
    logger.errorWithCause("[booking] Reminder sequence generation failed:", error);
    reminders = [];
  }

  if (reminders.length < 3) {
    reminders = [
      {
        timing: "1_day",
        timingLabel: "1 day before",
        subject: `Reminder: Your ${appointment.serviceType} appointment tomorrow — ${client.businessName}`,
        message: `Hi ${appointment.customerName}, this is a friendly reminder that your ${appointment.serviceType} appointment with ${client.businessName} is tomorrow at ${appointmentTime}. If you need to reschedule, please call us at ${client.phone || "our office"}. We look forward to seeing you!`,
      },
      {
        timing: "2_hours",
        timingLabel: "2 hours before",
        subject: `Your appointment is in 2 hours`,
        message: `Hi ${appointment.customerName}! Your ${appointment.serviceType} with ${client.businessName} is in 2 hours at ${appointmentTime}. See you soon!`,
      },
      {
        timing: "30_min",
        timingLabel: "30 minutes before",
        subject: `Almost time for your appointment`,
        message: `${appointment.customerName}, your ${appointment.serviceType} starts in 30 min. ${client.businessName} is ready for you!`,
      },
    ];
  }

  // Ensure each reminder has required fields
  reminders = reminders.map((r, i) => ({
    timing: r.timing || ["1_day", "2_hours", "30_min"][i],
    timingLabel: r.timingLabel || ["1 day before", "2 hours before", "30 minutes before"][i],
    subject: r.subject || `Appointment reminder — ${client.businessName}`,
    message: r.message || `Reminder: ${appointmentSummary} with ${client.businessName}.`,
  }));

  await prisma.activityEvent.create({
    data: {
      clientId,
      type: "call_booked",
      title: `Reminder sequence created for ${appointment.customerName}`,
      description: `3-message reminder sequence generated for ${appointmentSummary}.`,
    },
  });

  return {
    reminders,
    appointmentSummary,
  };
}
