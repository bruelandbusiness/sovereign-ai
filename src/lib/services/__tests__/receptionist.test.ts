import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = vi.hoisted(() => ({
  client: { findUniqueOrThrow: vi.fn() },
  receptionistConfig: { findUnique: vi.fn() },
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

vi.mock("@/lib/twilio", () => ({
  twilioPhoneNumber: "+15551234567",
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { generateCallScript, handleVoiceQuery } from "@/lib/services/receptionist";
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
  phone: "5125551234",
};

const RECEPTIONIST_CONFIG = {
  clientId: CLIENT_ID,
  greeting: "Thank you for calling Ace Plumbing!",
  emergencyKeywords: JSON.stringify(["emergency", "flood", "leak", "fire"]),
};

function setupDefaults() {
  mockPrisma.client.findUniqueOrThrow.mockResolvedValue(CLIENT);
  mockPrisma.receptionistConfig.findUnique.mockResolvedValue(RECEPTIONIST_CONFIG);
  mockPrisma.activityEvent.create.mockResolvedValue({});
  vi.mocked(guardedAnthropicCall).mockResolvedValue({} as never);
}

// ---------------------------------------------------------------------------
// generateCallScript
// ---------------------------------------------------------------------------

describe("generateCallScript", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns AI-generated call script when response is complete", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      greeting: "Hi, thanks for calling Ace Plumbing!",
      mainScript: "How can I help you today?",
      closingScript: "Thanks for calling, have a great day!",
      objectionHandlers: [{ objection: "Too expensive", response: "We offer free estimates." }],
    });

    const result = await generateCallScript(CLIENT_ID, "new_inquiry");

    expect(result.greeting).toContain("Ace Plumbing");
    expect(result.mainScript).toBeDefined();
    expect(result.closingScript).toBeDefined();
    expect(result.objectionHandlers).toHaveLength(1);
    expect(result.callType).toBe("new_inquiry");
  });

  it("creates an activity event on success", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      greeting: "G", mainScript: "M", closingScript: "C",
      objectionHandlers: [{ objection: "O", response: "R" }],
    });

    await generateCallScript(CLIENT_ID, "emergency");

    expect(mockPrisma.activityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "call_booked",
          title: expect.stringContaining("emergency"),
        }),
      })
    );
  });

  it("fills fallback greeting from config when AI omits it", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      mainScript: "Main",
      closingScript: "Close",
    });

    const result = await generateCallScript(CLIENT_ID, "new_inquiry");

    expect(result.greeting).toBe("Thank you for calling Ace Plumbing!");
  });

  it("uses fallback objection handlers when AI returns non-array", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      greeting: "G", mainScript: "M", closingScript: "C",
    });

    const result = await generateCallScript(CLIENT_ID, "new_inquiry");

    expect(result.objectionHandlers.length).toBeGreaterThan(0);
    expect(result.objectionHandlers[0].objection).toBeDefined();
    expect(result.objectionHandlers[0].response).toBeDefined();
  });

  it("returns full fallback on generic AI errors", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await generateCallScript(CLIENT_ID, "after_hours");

    expect(result.greeting).toContain("Ace Plumbing");
    expect(result.mainScript).toBeDefined();
    expect(result.closingScript).toContain("Ace Plumbing");
    expect(result.objectionHandlers.length).toBeGreaterThan(0);
    expect(result.callType).toBe("after_hours");
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(generateCallScript(CLIENT_ID, "new_inquiry")).rejects.toThrow("blocked");
  });

  it("looks up receptionist config for the client", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      greeting: "G", mainScript: "M", closingScript: "C", objectionHandlers: [],
    });

    await generateCallScript(CLIENT_ID, "existing_customer");

    expect(mockPrisma.receptionistConfig.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clientId: CLIENT_ID } })
    );
  });
});

// ---------------------------------------------------------------------------
// handleVoiceQuery
// ---------------------------------------------------------------------------

describe("handleVoiceQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns AI-generated response for a normal inquiry", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      response: "I'd be happy to help with scheduling.",
      intent: "scheduling",
      shouldTransfer: false,
      suggestedAction: "book appointment",
      leadCaptured: false,
    });

    const result = await handleVoiceQuery(CLIENT_ID, "I'd like to schedule an appointment");

    expect(result.response).toContain("scheduling");
    expect(result.intent).toBe("scheduling");
    expect(result.shouldTransfer).toBe(false);
  });

  it("detects emergency keywords and flags for transfer", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      response: "Stay calm, help is on the way.",
      intent: "emergency",
      shouldTransfer: true,
      suggestedAction: "Transfer to emergency line",
      leadCaptured: false,
    });

    const result = await handleVoiceQuery(CLIENT_ID, "I have a major flood in my basement!");

    expect(result.intent).toBe("emergency");
    expect(result.shouldTransfer).toBe(true);
  });

  it("creates an activity event on success", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      response: "R", intent: "inquiry", shouldTransfer: false,
      suggestedAction: "continue", leadCaptured: false,
    });

    await handleVoiceQuery(CLIENT_ID, "What services do you offer?");

    expect(mockPrisma.activityEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: CLIENT_ID,
          type: "call_booked",
        }),
      })
    );
  });

  it("returns emergency fallback when AI fails and transcript contains emergency keyword", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await handleVoiceQuery(CLIENT_ID, "There's a leak in my kitchen!");

    expect(result.intent).toBe("emergency");
    expect(result.shouldTransfer).toBe(true);
    expect(result.response).toContain("urgent");
  });

  it("returns general fallback when AI fails on non-emergency transcript", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("timeout"));

    const result = await handleVoiceQuery(CLIENT_ID, "I want to know your pricing");

    expect(result.intent).toBe("general");
    expect(result.shouldTransfer).toBe(false);
    expect(result.response).toContain("Ace Plumbing");
  });

  it("re-throws GovernanceBlockedError", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("blocked"));

    await expect(handleVoiceQuery(CLIENT_ID, "Hello")).rejects.toThrow("blocked");
  });

  it("defaults intent to emergency when transcript has emergency keywords and AI omits intent", async () => {
    vi.mocked(extractJSONContent).mockReturnValue({
      response: "Let me help.",
    });

    const result = await handleVoiceQuery(CLIENT_ID, "We have a fire in the building");

    expect(result.intent).toBe("emergency");
    expect(result.shouldTransfer).toBe(true);
  });
});
