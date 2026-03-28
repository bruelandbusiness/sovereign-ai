 
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/governance/ai-guard", () => ({
  guardedAnthropicCall: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    errorWithCause: vi.fn(),
  },
}));

const { guardedAnthropicCall } = await import("@/lib/governance/ai-guard");
const { classifyReply, generateAutoResponse } = await import(
  "../reply-classifier"
);

const mockGuardedCall = vi.mocked(guardedAnthropicCall);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeClassificationResponse(json: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(json) }],
    usage: { input_tokens: 50, output_tokens: 100 },
  };
}

function makeTextResponse(text: string) {
  return {
    content: [{ type: "text" as const, text }],
    usage: { input_tokens: 50, output_tokens: 100 },
  };
}

// ---------------------------------------------------------------------------
// classifyReply tests
// ---------------------------------------------------------------------------

describe("classifyReply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Core classifications ------------------------------------------------

  it('classifies "yes I\'m interested" as interested/hot_lead', async () => {
    mockGuardedCall.mockResolvedValueOnce(
      makeClassificationResponse({
        intent: "hot_lead",
        confidence: 0.95,
        summary: "Customer expresses strong interest and readiness to proceed.",
        urgency: "high",
        sentiment: "positive",
        needs_human: false,
        suggested_response: "Great to hear! Let me schedule a time for you.",
      }) as any,
    );

    const result = await classifyReply("yes I'm interested");

    expect(result.intent).toBe("hot_lead");
    expect(result.sentiment).toBe("positive");
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('classifies "stop texting me" as unsubscribe', async () => {
    mockGuardedCall.mockResolvedValueOnce(
      makeClassificationResponse({
        intent: "unsubscribe",
        confidence: 0.98,
        summary: "Customer requests to stop receiving messages.",
        urgency: "high",
        sentiment: "negative",
        needs_human: false,
        suggested_response: null,
      }) as any,
    );

    const result = await classifyReply("stop texting me");

    expect(result.intent).toBe("unsubscribe");
    expect(result.suggested_response).toBeNull();
  });

  it('classifies "how much does it cost?" as question', async () => {
    mockGuardedCall.mockResolvedValueOnce(
      makeClassificationResponse({
        intent: "question",
        confidence: 0.92,
        summary: "Customer asks about pricing.",
        urgency: "medium",
        sentiment: "neutral",
        needs_human: false,
        suggested_response: "Thanks for asking! Pricing depends on the scope of work.",
      }) as any,
    );

    const result = await classifyReply("how much does it cost?");

    expect(result.intent).toBe("question");
    expect(result.urgency).toBe("medium");
    expect(result.sentiment).toBe("neutral");
  });

  it('classifies "wrong number" as wrong_person', async () => {
    mockGuardedCall.mockResolvedValueOnce(
      makeClassificationResponse({
        intent: "wrong_person",
        confidence: 0.97,
        summary: "Recipient says this is the wrong number.",
        urgency: "low",
        sentiment: "neutral",
        needs_human: false,
        suggested_response: null,
      }) as any,
    );

    const result = await classifyReply("wrong number");

    expect(result.intent).toBe("wrong_person");
  });

  it('classifies "not interested" as not_interested', async () => {
    mockGuardedCall.mockResolvedValueOnce(
      makeClassificationResponse({
        intent: "not_interested",
        confidence: 0.96,
        summary: "Customer declines the offer.",
        urgency: "low",
        sentiment: "negative",
        needs_human: false,
        suggested_response:
          "Thank you for letting us know. We'll reach out next season.",
      }) as any,
    );

    const result = await classifyReply("not interested");

    expect(result.intent).toBe("not_interested");
    expect(result.sentiment).toBe("negative");
  });

  it('classifies "I am going to sue you" as angry with needs_human', async () => {
    mockGuardedCall.mockResolvedValueOnce(
      makeClassificationResponse({
        intent: "angry",
        confidence: 0.99,
        summary: "Customer threatens legal action.",
        urgency: "high",
        sentiment: "negative",
        needs_human: true,
        suggested_response: null,
      }) as any,
    );

    const result = await classifyReply("I am going to sue you");

    expect(result.intent).toBe("angry");
    expect(result.needs_human).toBe(true);
    expect(result.suggested_response).toBeNull();
  });

  it("classifies out-of-office auto-reply correctly", async () => {
    mockGuardedCall.mockResolvedValueOnce(
      makeClassificationResponse({
        intent: "out_of_office",
        confidence: 0.99,
        summary: "Automated out of office response.",
        urgency: "low",
        sentiment: "neutral",
        needs_human: false,
        suggested_response: null,
      }) as any,
    );

    const result = await classifyReply(
      "I am out of the office until March 30. I will respond when I return.",
    );

    expect(result.intent).toBe("out_of_office");
  });

  // ---- Fallback / error paths ---------------------------------------------

  it('falls back to "question" on JSON parse failure', async () => {
    mockGuardedCall.mockResolvedValueOnce({
      content: [{ type: "text", text: "This is not valid JSON at all" }],
      usage: { input_tokens: 50, output_tokens: 50 },
    } as any);

    const result = await classifyReply("some reply");

    expect(result.intent).toBe("question");
    expect(result.confidence).toBe(0.2);
    expect(result.needs_human).toBe(true);
    expect(result.summary).toContain("failed");
  });

  it('falls back to "question" when model returns invalid intent', async () => {
    mockGuardedCall.mockResolvedValueOnce(
      makeClassificationResponse({
        intent: "totally_invalid_intent",
        confidence: 0.9,
        summary: "Some summary.",
        urgency: "medium",
        sentiment: "neutral",
        needs_human: false,
        suggested_response: null,
      }) as any,
    );

    const result = await classifyReply("some reply");

    expect(result.intent).toBe("question");
    expect(result.confidence).toBe(0.3);
    expect(result.needs_human).toBe(true);
  });

  it("handles empty reply text without throwing", async () => {
    mockGuardedCall.mockResolvedValueOnce(
      makeClassificationResponse({
        intent: "spam",
        confidence: 0.7,
        summary: "Empty message, likely spam.",
        urgency: "low",
        sentiment: "neutral",
        needs_human: false,
        suggested_response: null,
      }) as any,
    );

    const result = await classifyReply("");

    expect(result.intent).toBe("spam");
    // Key check: did not throw
  });

  it("handles very long reply text (sends it to Claude without crashing)", async () => {
    const longText = "word ".repeat(10000); // ~50,000 chars

    mockGuardedCall.mockResolvedValueOnce(
      makeClassificationResponse({
        intent: "question",
        confidence: 0.5,
        summary: "Very long reply.",
        urgency: "low",
        sentiment: "neutral",
        needs_human: true,
        suggested_response: null,
      }) as any,
    );

    const result = await classifyReply(longText);

    expect(result.intent).toBe("question");
    // Verify the call was made (didn't crash before calling Claude)
    expect(mockGuardedCall).toHaveBeenCalledTimes(1);
  });

  // ---- Confidence clamping ------------------------------------------------

  it("clamps confidence to [0, 1] range when model returns out-of-range value", async () => {
    mockGuardedCall.mockResolvedValueOnce(
      makeClassificationResponse({
        intent: "interested",
        confidence: 1.5,
        summary: "Over-confident.",
        urgency: "medium",
        sentiment: "positive",
        needs_human: false,
        suggested_response: "Great!",
      }) as any,
    );

    const result = await classifyReply("yes please");

    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });

  it("clamps negative confidence to 0", async () => {
    mockGuardedCall.mockResolvedValueOnce(
      makeClassificationResponse({
        intent: "interested",
        confidence: -0.5,
        summary: "Negative confidence.",
        urgency: "medium",
        sentiment: "positive",
        needs_human: false,
        suggested_response: "Great!",
      }) as any,
    );

    const result = await classifyReply("maybe");

    expect(result.confidence).toBe(0);
  });

  // ---- Defaults for missing fields ----------------------------------------

  it("defaults urgency to medium when not provided", async () => {
    mockGuardedCall.mockResolvedValueOnce(
      makeClassificationResponse({
        intent: "question",
        confidence: 0.8,
        summary: "Asks a question.",
        sentiment: "neutral",
        needs_human: false,
        suggested_response: "Sure!",
      }) as any,
    );

    const result = await classifyReply("what services do you offer?");

    expect(result.urgency).toBe("medium");
  });

  it("defaults sentiment to neutral when not provided", async () => {
    mockGuardedCall.mockResolvedValueOnce(
      makeClassificationResponse({
        intent: "question",
        confidence: 0.8,
        summary: "Neutral question.",
        urgency: "low",
        needs_human: false,
        suggested_response: "Sure!",
      }) as any,
    );

    const result = await classifyReply("hello?");

    expect(result.sentiment).toBe("neutral");
  });

  it("defaults needs_human to false when not provided", async () => {
    mockGuardedCall.mockResolvedValueOnce(
      makeClassificationResponse({
        intent: "interested",
        confidence: 0.9,
        summary: "Customer is interested.",
        urgency: "medium",
        sentiment: "positive",
        suggested_response: "Awesome!",
      }) as any,
    );

    const result = await classifyReply("sounds great");

    expect(result.needs_human).toBe(false);
  });

  it("defaults summary to 'No summary provided' when missing", async () => {
    mockGuardedCall.mockResolvedValueOnce(
      makeClassificationResponse({
        intent: "interested",
        confidence: 0.9,
        urgency: "medium",
        sentiment: "positive",
        needs_human: false,
        suggested_response: "Great!",
      }) as any,
    );

    const result = await classifyReply("yes");

    expect(result.summary).toBe("No summary provided");
  });

  // ---- Context forwarding -------------------------------------------------

  it("includes vertical and contactName in classify prompt when context provided", async () => {
    mockGuardedCall.mockResolvedValueOnce(
      makeClassificationResponse({
        intent: "interested",
        confidence: 0.9,
        summary: "Interested.",
        urgency: "medium",
        sentiment: "positive",
        needs_human: false,
        suggested_response: "Great!",
      }) as any,
    );

    await classifyReply("sounds good", {
      vertical: "plumbing",
      contactName: "Bob Smith",
      contractorName: "Bob's Plumbing",
    });

    const callArgs = mockGuardedCall.mock.calls[0][0];
    const userMessage = callArgs.params.messages[0].content as string;

    expect(userMessage).toContain("plumbing");
    expect(userMessage).toContain("Bob Smith");
  });

  it("sends correct model parameters to guardedAnthropicCall", async () => {
    mockGuardedCall.mockResolvedValueOnce(
      makeClassificationResponse({
        intent: "question",
        confidence: 0.8,
        summary: "A question.",
        urgency: "low",
        sentiment: "neutral",
        needs_human: false,
        suggested_response: null,
      }) as any,
    );

    await classifyReply("what do you offer?");

    const callArgs = mockGuardedCall.mock.calls[0][0];
    expect(callArgs.clientId).toBe("__system__");
    expect(callArgs.action).toBe("followup.classify_reply");
    expect(callArgs.params.model).toBe("claude-haiku-4-5-20251001");
    expect(callArgs.params.max_tokens).toBe(512);
  });
});

// ---------------------------------------------------------------------------
// generateAutoResponse tests
// ---------------------------------------------------------------------------

describe("generateAutoResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const autoContext = {
    clientBusinessName: "Acme Roofing",
    contactName: "Jane",
    contractorPhone: "555-1234",
  };

  it("returns suggested_response when available and no human needed", async () => {
    const classification = {
      intent: "interested" as const,
      confidence: 0.9,
      summary: "Customer is interested.",
      urgency: "medium" as const,
      sentiment: "positive" as const,
      needs_human: false,
      suggested_response: "Thanks for your interest! Let me schedule a time.",
    };

    const result = await generateAutoResponse(classification, autoContext);

    expect(result).toBe("Thanks for your interest! Let me schedule a time.");
    // Should NOT call Claude again since suggested_response is available
    expect(mockGuardedCall).not.toHaveBeenCalled();
  });

  it("returns null for unsubscribe intent", async () => {
    const classification = {
      intent: "unsubscribe" as const,
      confidence: 0.98,
      summary: "Wants to unsubscribe.",
      urgency: "high" as const,
      sentiment: "negative" as const,
      needs_human: false,
      suggested_response: null,
    };

    const result = await generateAutoResponse(classification, autoContext);

    expect(result).toBeNull();
  });

  it("returns null when needs_human is true", async () => {
    const classification = {
      intent: "angry" as const,
      confidence: 0.95,
      summary: "Customer is very angry.",
      urgency: "high" as const,
      sentiment: "negative" as const,
      needs_human: true,
      suggested_response: null,
    };

    const result = await generateAutoResponse(classification, autoContext);

    expect(result).toBeNull();
  });

  it("returns null for spam intent", async () => {
    const classification = {
      intent: "spam" as const,
      confidence: 0.99,
      summary: "Spam message.",
      urgency: "low" as const,
      sentiment: "neutral" as const,
      needs_human: false,
      suggested_response: null,
    };

    const result = await generateAutoResponse(classification, autoContext);

    expect(result).toBeNull();
  });

  it("returns null for wrong_person intent", async () => {
    const classification = {
      intent: "wrong_person" as const,
      confidence: 0.97,
      summary: "Wrong number.",
      urgency: "low" as const,
      sentiment: "neutral" as const,
      needs_human: false,
      suggested_response: null,
    };

    const result = await generateAutoResponse(classification, autoContext);

    expect(result).toBeNull();
  });

  it("returns null for out_of_office intent", async () => {
    const classification = {
      intent: "out_of_office" as const,
      confidence: 0.99,
      summary: "OOO auto-reply.",
      urgency: "low" as const,
      sentiment: "neutral" as const,
      needs_human: false,
      suggested_response: null,
    };

    const result = await generateAutoResponse(classification, autoContext);

    expect(result).toBeNull();
  });

  it("generates a response via Claude when no suggested_response for interested intent", async () => {
    mockGuardedCall.mockResolvedValueOnce(
      makeTextResponse(
        "Hi Jane, thanks for your interest! A team member will follow up shortly.",
      ) as any,
    );

    const classification = {
      intent: "interested" as const,
      confidence: 0.9,
      summary: "Customer is interested.",
      urgency: "medium" as const,
      sentiment: "positive" as const,
      needs_human: false,
      suggested_response: null,
    };

    const result = await generateAutoResponse(classification, autoContext);

    expect(result).toContain("Jane");
    expect(mockGuardedCall).toHaveBeenCalledTimes(1);
  });

  it("returns null when Claude call fails during auto-response generation", async () => {
    mockGuardedCall.mockRejectedValueOnce(new Error("API error"));

    const classification = {
      intent: "question" as const,
      confidence: 0.8,
      summary: "Asks about pricing.",
      urgency: "medium" as const,
      sentiment: "neutral" as const,
      needs_human: false,
      suggested_response: null,
    };

    const result = await generateAutoResponse(classification, autoContext);

    expect(result).toBeNull();
  });

  it("returns null for non-actionable intents without suggested_response", async () => {
    const classification = {
      intent: "complaint" as const,
      confidence: 0.85,
      summary: "Customer complains about service.",
      urgency: "medium" as const,
      sentiment: "negative" as const,
      needs_human: false,
      suggested_response: null,
    };

    const result = await generateAutoResponse(classification, autoContext);

    // complaint is not in the actionable list: interested, question, not_interested, angry
    // Actually let me check... complaint is NOT in the list so should return null
    expect(result).toBeNull();
  });
});
