 
import { describe, it, expect, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks for external dependencies
// ---------------------------------------------------------------------------

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
  extractTextContent: vi.fn((_response, fallback) => fallback),
  sanitizeForPrompt: vi.fn((input: string, _max?: number) => input),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    errorWithCause: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import {
  generateOpening,
  determineNextPhase,
  generateFollowUpSms,
  createInitialState,
  type ProspectContext,
  type ConversationState,
} from "@/lib/outreach/sales-script";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseProspect: ProspectContext = {
  businessName: "Ace Plumbing",
  ownerName: "John",
  vertical: "plumbing",
  city: "Austin",
  state: "TX",
  rating: 4.5,
  reviewCount: 50,
  website: "https://aceplumbing.com",
};

function makeState(overrides?: Partial<ConversationState>): ConversationState {
  return {
    phase: "intro",
    turns: [],
    meetingBooked: false,
    objectionCount: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// generateOpening
// ---------------------------------------------------------------------------

describe("generateOpening", () => {
  it("includes the owner name and business name in the greeting", () => {
    const result = generateOpening(baseProspect);
    expect(result).toContain("John");
    expect(result).toContain("Ace Plumbing");
    expect(result).toContain("Sarah from Sovereign AI");
  });

  it("uses a low-rating hook when rating < 4.0", () => {
    const prospect = { ...baseProspect, rating: 3.2 };
    const result = generateOpening(prospect);
    expect(result).toContain("online reputation");
  });

  it("uses a low-review-count hook when reviewCount < 20", () => {
    const prospect = { ...baseProspect, rating: 4.5, reviewCount: 10 };
    const result = generateOpening(prospect);
    expect(result).toContain("competitors");
  });

  it("uses a no-website hook when website is null", () => {
    const prospect = { ...baseProspect, rating: 4.5, reviewCount: 50, website: null };
    const result = generateOpening(prospect);
    expect(result).toContain("doesn't seem to have a website");
  });

  it("omits name prefix when ownerName is null", () => {
    const prospect = { ...baseProspect, ownerName: null };
    const result = generateOpening(prospect);
    expect(result).toMatch(/^Hi, this is Sarah/);
  });
});

// ---------------------------------------------------------------------------
// determineNextPhase
// ---------------------------------------------------------------------------

describe("determineNextPhase", () => {
  it("transitions from intro to discovery by default", () => {
    const result = determineNextPhase("intro", "Tell me more", makeState());
    expect(result).toBe("discovery");
  });

  it("goes to objection phase when the user says 'too busy'", () => {
    const result = determineNextPhase("discovery", "I'm too busy right now", makeState());
    expect(result).toBe("objection");
  });

  it("goes to goodbye after 3+ objections", () => {
    const state = makeState({ objectionCount: 3 });
    const result = determineNextPhase("offer", "not interested", state);
    expect(result).toBe("goodbye");
  });

  it("goes to close when the prospect agrees during the offer phase", () => {
    const result = determineNextPhase("offer", "Sure, sounds good", makeState());
    expect(result).toBe("close");
  });

  it("goes to goodbye when the prospect says bye with 2+ objections", () => {
    const state = makeState({ objectionCount: 2 });
    const result = determineNextPhase("offer", "Goodbye", state);
    expect(result).toBe("goodbye");
  });

  it("follows natural progression from discovery to pain_point", () => {
    const result = determineNextPhase("discovery", "We rely on word of mouth", makeState());
    expect(result).toBe("pain_point");
  });

  it("transitions from objection back to discovery for early conversations", () => {
    const state = makeState({ phase: "objection", turns: [{ role: "user", content: "hmm" }] });
    const result = determineNextPhase("objection", "Okay tell me more", state);
    expect(result).toBe("discovery");
  });

  it("transitions from objection to offer for longer conversations (>6 turns)", () => {
    const longTurns = Array.from({ length: 8 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `turn ${i}`,
    }));
    const state = makeState({ phase: "objection", turns: longTurns });
    const result = determineNextPhase("objection", "Okay fine", state);
    expect(result).toBe("offer");
  });
});

// ---------------------------------------------------------------------------
// generateFollowUpSms
// ---------------------------------------------------------------------------

describe("generateFollowUpSms", () => {
  it("includes a calendly link and business name when meeting was booked", () => {
    const sms = generateFollowUpSms(baseProspect, true);
    expect(sms).toContain("calendly.com");
    expect(sms).toContain("Ace Plumbing");
    expect(sms).toContain("John");
    expect(sms).toContain("book your free strategy session");
  });

  it("sends a softer message when meeting was NOT booked", () => {
    const sms = generateFollowUpSms(baseProspect, false);
    expect(sms).toContain("No pressure");
    expect(sms).toContain("calendly.com");
  });

  it("omits the owner name from SMS when ownerName is undefined", () => {
    const prospect = { ...baseProspect, ownerName: undefined };
    const sms = generateFollowUpSms(prospect, true);
    expect(sms).toMatch(/^Hi!/);
  });
});

// ---------------------------------------------------------------------------
// createInitialState
// ---------------------------------------------------------------------------

describe("createInitialState", () => {
  it("creates a state in the intro phase with one assistant turn", () => {
    const state = createInitialState(baseProspect);
    expect(state.phase).toBe("intro");
    expect(state.meetingBooked).toBe(false);
    expect(state.objectionCount).toBe(0);
    expect(state.turns).toHaveLength(1);
    expect(state.turns[0].role).toBe("assistant");
    expect(state.turns[0].content).toContain("Sarah from Sovereign AI");
  });
});
