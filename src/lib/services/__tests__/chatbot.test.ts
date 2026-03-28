import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = vi.hoisted(() => ({
  client: { findUniqueOrThrow: vi.fn() },
  chatbotConfig: { findUnique: vi.fn(), create: vi.fn() },
  chatbotConversation: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  lead: { findFirst: vi.fn(), create: vi.fn() },
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
  sanitizeForPrompt: vi.fn((input: string) => input),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), errorWithCause: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { handleChatMessage } from "@/lib/services/chatbot";
import { guardedAnthropicCall, GovernanceBlockedError } from "@/lib/governance/ai-guard";
import { extractTextContent } from "@/lib/ai-utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CLIENT_ID = "client-1";
const CONFIG = {
  id: "config-1",
  clientId: CLIENT_ID,
  systemPrompt: "You are a helpful assistant.",
  greeting: "Hello!",
  primaryColor: "#fff",
  isActive: true,
};

const CLIENT = {
  id: CLIENT_ID,
  businessName: "Ace Plumbing",
  ownerName: "John",
  vertical: "plumbing",
  city: "Austin",
  state: "TX",
  website: "https://aceplumbing.com",
  serviceAreaRadius: "25",
};

function setupDefaults() {
  mockPrisma.chatbotConfig.findUnique.mockResolvedValue(CONFIG);
  mockPrisma.chatbotConversation.findUnique.mockResolvedValue(null);
  mockPrisma.chatbotConversation.create.mockResolvedValue({ id: "conv-new" });
  mockPrisma.lead.findFirst.mockResolvedValue(null);
  mockPrisma.lead.create.mockResolvedValue({ id: "lead-1" });
  mockPrisma.activityEvent.create.mockResolvedValue({});
  mockPrisma.client.findUniqueOrThrow.mockResolvedValue(CLIENT);
  vi.mocked(guardedAnthropicCall).mockResolvedValue({} as never);
  vi.mocked(extractTextContent).mockReturnValue("Sure, I can help with that!");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("handleChatMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("returns a reply and a new conversationId for a fresh conversation", async () => {
    const result = await handleChatMessage(CLIENT_ID, "Hi there");

    expect(result).toEqual({
      reply: "Sure, I can help with that!",
      conversationId: "conv-new",
      leadCaptured: false,
    });
    expect(mockPrisma.chatbotConversation.create).toHaveBeenCalledOnce();
  });

  it("returns an unavailable message when chatbot config is inactive", async () => {
    mockPrisma.chatbotConfig.findUnique.mockResolvedValue({ ...CONFIG, isActive: false });

    const result = await handleChatMessage(CLIENT_ID, "Hello");

    expect(result.reply).toContain("currently unavailable");
    expect(result.leadCaptured).toBe(false);
  });

  it("provisions a new chatbot config if none exists", async () => {
    mockPrisma.chatbotConfig.findUnique.mockResolvedValue(null);
    mockPrisma.chatbotConfig.create.mockResolvedValue(CONFIG);

    const result = await handleChatMessage(CLIENT_ID, "Hello");

    expect(mockPrisma.client.findUniqueOrThrow).toHaveBeenCalled();
    expect(result.reply).toBe("Sure, I can help with that!");
  });

  it("loads and continues an existing conversation", async () => {
    const existingConv = {
      id: "conv-existing",
      chatbotId: CONFIG.id,
      messages: JSON.stringify([
        { role: "user", content: "Hi", timestamp: "2025-01-01T00:00:00Z" },
        { role: "assistant", content: "Hello!", timestamp: "2025-01-01T00:00:00Z" },
      ]),
    };
    mockPrisma.chatbotConversation.findUnique.mockResolvedValue(existingConv);
    mockPrisma.chatbotConversation.update.mockResolvedValue({});

    const result = await handleChatMessage(CLIENT_ID, "Need plumbing help", "conv-existing");

    expect(result.conversationId).toBe("conv-existing");
    expect(mockPrisma.chatbotConversation.update).toHaveBeenCalledOnce();
    expect(mockPrisma.chatbotConversation.create).not.toHaveBeenCalled();
  });

  it("detects a lead when the message contains a phone number", async () => {
    vi.mocked(extractTextContent).mockReturnValue(
      "Great! My number is 512-555-1234, please call me."
    );

    const result = await handleChatMessage(CLIENT_ID, "My number is 512-555-1234");

    expect(result.leadCaptured).toBe(true);
    expect(mockPrisma.lead.create).toHaveBeenCalled();
    expect(mockPrisma.activityEvent.create).toHaveBeenCalled();
  });

  it("detects a lead when the message contains an email address", async () => {
    vi.mocked(extractTextContent).mockReturnValue(
      "I'll send you the details. You can reach me at john@example.com."
    );

    const result = await handleChatMessage(CLIENT_ID, "My email is john@example.com");

    expect(result.leadCaptured).toBe(true);
  });

  it("returns a governance-blocked fallback when GovernanceBlockedError is thrown", async () => {
    const BlockedError = GovernanceBlockedError as unknown as new (reason: string) => Error;
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new BlockedError("rate limit"));

    const result = await handleChatMessage(CLIENT_ID, "Hello");

    expect(result.reply).toContain("temporarily unable to respond");
    expect(result.leadCaptured).toBe(false);
  });

  it("returns a graceful error message when the AI call fails with a generic error", async () => {
    vi.mocked(guardedAnthropicCall).mockRejectedValue(new Error("network timeout"));

    const result = await handleChatMessage(CLIENT_ID, "Hello");

    expect(result.reply).toContain("having a little trouble");
    expect(result.leadCaptured).toBe(false);
  });
});
