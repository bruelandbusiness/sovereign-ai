import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = vi.hoisted(() => ({
  client: { findUniqueOrThrow: vi.fn() },
  activityEvent: { create: vi.fn() },
}));

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));

vi.mock("@/lib/governance/ai-guard", () => ({
  guardedAnthropicCall: vi.fn(),
  GovernanceBlockedError: class extends Error {
    reason: string;
    constructor(reason: string) {
      super(reason);
      this.reason = reason;
    }
  },
}));

vi.mock("@/lib/ai-utils", () => ({
  extractTextContent: vi.fn((_response: unknown, fallback: string) => fallback),
  extractJSONContent: vi.fn((_response: unknown, fallback: unknown) => fallback),
  sanitizeForPrompt: vi.fn((input: string) => input),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), errorWithCause: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { generateBookingConfirmation, generateReminderSequence } from "@/lib/services/booking";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";
import { extractJSONContent } from "@/lib/ai-utils";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CLIENT_ID = "client-1";
const CLIENT = {
  id: CLIENT_ID,
  businessName: "Ace Plumbing",
  ownerName: "John",
  vertical: "plumbing",
  city: "Austin",
  state: "TX",
  phone: "512-555-1234",
};

const APPOINTMENT = {
  customerName: "Alice",
  customerPhone: "512-555-9999",
  serviceType: "drain cleaning",
  startsAt: new Date("2026-04-15T10:00:00Z"),
  notes: "Back door entrance",
};

function setupDefaults() {
  mockPrisma.client.findUniqueOrThrow.mockResolvedValue(CLIENT);
  mockPrisma.activityEvent.create.mockResolvedValue({});
  vi.mocked(guardedAnthropicCall).mockResolvedValue({} as never);
}

// ---------------------------------------------------------------------------
// generateBookingConfirmation
// ---------------------------------------------------------------------------

describe("generateBookingConfirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns subject and message from AI response", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      subject: "Your drain cleaning appointment is confirmed!",
      message: "Hi Alice, your appointment is set for April 15.",
    });

    const result = await generateBookingConfirmation(CLIENT_ID, APPOINTMENT);

    expect(result.subject).toBe("Your drain cleaning appointment is confirmed!");
    expect(result.message).toBe("Hi Alice, your appointment is set for April 15.");
  });

  it("uses fallback subject when AI returns no subject", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      message: "Some confirmation text",
    });

    const result = await generateBookingConfirmation(CLIENT_ID, APPOINTMENT);

    expect(result.subject).toContain("drain cleaning");
    expect(result.subject).toContain("Ace Plumbing");
  });

  it("uses fallback message when AI returns empty message", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({});

    const result = await generateBookingConfirmation(CLIENT_ID, APPOINTMENT);

    expect(result.message).toContain("Alice");
    expect(result.message).toContain("Ace Plumbing");
    expect(result.message).toContain("drain cleaning");
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(generateBookingConfirmation(CLIENT_ID, APPOINTMENT)).rejects.toThrow("blocked");
  });

  it("uses fallback on generic AI errors and still returns a valid result", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("network error"));

    const result = await generateBookingConfirmation(CLIENT_ID, APPOINTMENT);

    expect(result.subject).toContain("drain cleaning");
    expect(result.message).toContain("Alice");
    expect(result.message).toContain("Ace Plumbing");
  });

  it("creates an activity event for the booking", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      subject: "Confirmed!",
      message: "Your appointment is confirmed.",
    });

    await generateBookingConfirmation(CLIENT_ID, APPOINTMENT);

    expect(mockPrisma.activityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "call_booked",
          title: "Booking confirmed: Alice",
        }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// generateReminderSequence
// ---------------------------------------------------------------------------

describe("generateReminderSequence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns 3 reminders and an appointmentSummary from AI response", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      reminders: [
        { timing: "1_day", timingLabel: "1 day before", subject: "Tomorrow!", message: "Your appointment is tomorrow." },
        { timing: "2_hours", timingLabel: "2 hours before", subject: "2 hours!", message: "Almost time!" },
        { timing: "30_min", timingLabel: "30 minutes before", subject: "30 min!", message: "We're ready!" },
      ],
    });

    const result = await generateReminderSequence(CLIENT_ID, APPOINTMENT);

    expect(result.reminders).toHaveLength(3);
    expect(result.appointmentSummary).toContain("drain cleaning");
  });

  it("uses fallback reminders when AI returns fewer than 3", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      reminders: [{ timing: "1_day", timingLabel: "1 day before", subject: "S", message: "M" }],
    });

    const result = await generateReminderSequence(CLIENT_ID, APPOINTMENT);

    expect(result.reminders).toHaveLength(3);
    expect(result.reminders[0].message).toContain("Alice");
    expect(result.reminders[0].message).toContain("Ace Plumbing");
  });

  it("uses fallback reminders on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("network error"));

    const result = await generateReminderSequence(CLIENT_ID, APPOINTMENT);

    expect(result.reminders).toHaveLength(3);
    expect(result.reminders[0].timing).toBe("1_day");
    expect(result.reminders[1].timing).toBe("2_hours");
    expect(result.reminders[2].timing).toBe("30_min");
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(generateReminderSequence(CLIENT_ID, APPOINTMENT)).rejects.toThrow("blocked");
  });

  it("ensures each reminder has all required fields with defaults", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      reminders: [
        { timing: "", timingLabel: "", subject: "", message: "" },
        { timing: "", timingLabel: "", subject: "", message: "" },
        { timing: "", timingLabel: "", subject: "", message: "" },
      ],
    });

    const result = await generateReminderSequence(CLIENT_ID, APPOINTMENT);

    // Falls back since reminders have empty fields but length >= 3
    for (const reminder of result.reminders) {
      expect(reminder.timing).toBeTruthy();
      expect(reminder.timingLabel).toBeTruthy();
      expect(reminder.subject).toBeTruthy();
      expect(reminder.message).toBeTruthy();
    }
  });

  it("creates an activity event for the reminder sequence", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      reminders: [
        { timing: "1_day", timingLabel: "1 day before", subject: "S1", message: "M1" },
        { timing: "2_hours", timingLabel: "2 hours before", subject: "S2", message: "M2" },
        { timing: "30_min", timingLabel: "30 min before", subject: "S3", message: "M3" },
      ],
    });

    await generateReminderSequence(CLIENT_ID, APPOINTMENT);

    expect(mockPrisma.activityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "call_booked",
          title: "Reminder sequence created for Alice",
        }),
      })
    );
  });
});
