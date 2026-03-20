import { describe, it, expect } from "vitest";
import {
  scoreLead,
  getLeadStage,
  isValidLeadStatus,
  VALID_LEAD_STATUSES,
  VALID_LEAD_SOURCES,
  type LeadInput,
} from "./lead-scoring";

// Fixed reference time for deterministic tests
const NOW = new Date("2025-06-15T12:00:00Z");

function makeLead(overrides: Partial<LeadInput> = {}): LeadInput {
  return {
    source: "website",
    status: "new",
    createdAt: new Date("2025-06-01T00:00:00Z"), // >1 week old => 0 recency
    ...overrides,
  };
}

describe("scoreLead", () => {
  // ── Contact info points ─────────────────────────────────────
  describe("contact info scoring", () => {
    it("gives 0 points for no contact info", () => {
      const score = scoreLead(makeLead({ email: null, phone: null }), NOW);
      // source=website (1.1x), status=new (0), no recency, no completeness
      // raw = 0, 0 * 1.1 = 0
      expect(score).toBe(0);
    });

    it("gives 15 points for email only", () => {
      const score = scoreLead(
        makeLead({ email: "a@b.com", phone: null }),
        NOW
      );
      // raw = 15, 15 * 1.1 = 16.5 -> 17
      expect(score).toBe(17);
    });

    it("gives 20 points for phone only", () => {
      const score = scoreLead(
        makeLead({ email: null, phone: "555-1234" }),
        NOW
      );
      // raw = 20, 20 * 1.1 = 22
      expect(score).toBe(22);
    });

    it("gives 45 points (15+20+10 bonus) for both email and phone", () => {
      const score = scoreLead(
        makeLead({ email: "a@b.com", phone: "555-1234" }),
        NOW
      );
      // raw = 45, 45 * 1.1 = 49.5 -> 50
      expect(score).toBe(50);
    });

    it("treats empty string email as falsy (no points)", () => {
      const score = scoreLead(makeLead({ email: "", phone: null }), NOW);
      expect(score).toBe(0);
    });
  });

  // ── Source multiplier ───────────────────────────────────────
  describe("source multiplier", () => {
    it("applies 1.3x for referral source", () => {
      const score = scoreLead(
        makeLead({ source: "referral", email: "a@b.com" }),
        NOW
      );
      // raw = 15, 15 * 1.3 = 19.5 -> 20
      expect(score).toBe(20);
    });

    it("applies 1.0x for chatbot source", () => {
      const score = scoreLead(
        makeLead({ source: "chatbot", email: "a@b.com" }),
        NOW
      );
      // raw = 15, 15 * 1.0 = 15
      expect(score).toBe(15);
    });

    it("applies 1.2x for phone source", () => {
      const score = scoreLead(
        makeLead({ source: "phone", email: "a@b.com" }),
        NOW
      );
      // raw = 15, 15 * 1.2 = 18
      expect(score).toBe(18);
    });

    it("defaults to 1.0x for unknown source", () => {
      const score = scoreLead(
        makeLead({ source: "carrier-pigeon", email: "a@b.com" }),
        NOW
      );
      // raw = 15, 15 * 1.0 = 15
      expect(score).toBe(15);
    });
  });

  // ── Status points ───────────────────────────────────────────
  describe("status points", () => {
    it("gives 0 for 'new' status", () => {
      const base = scoreLead(makeLead({ status: "new" }), NOW);
      expect(base).toBe(0);
    });

    it("gives 10 for 'contacted' status", () => {
      const score = scoreLead(makeLead({ status: "contacted" }), NOW);
      // raw = 10, 10 * 1.1 = 11
      expect(score).toBe(11);
    });

    it("gives 40 for 'proposal' status", () => {
      const score = scoreLead(makeLead({ status: "proposal" }), NOW);
      // raw = 40, 40 * 1.1 = 44
      expect(score).toBe(44);
    });

    it("gives 0 for 'lost' status", () => {
      const score = scoreLead(makeLead({ status: "lost" }), NOW);
      expect(score).toBe(0);
    });

    it("gives 0 for unknown status", () => {
      const score = scoreLead(makeLead({ status: "mystery" }), NOW);
      expect(score).toBe(0);
    });
  });

  // ── Recency points ─────────────────────────────────────────
  describe("recency scoring", () => {
    it("gives 15 points for lead created < 1 hour ago", () => {
      const tenMinAgo = new Date(NOW.getTime() - 10 * 60 * 1000);
      const score = scoreLead(makeLead({ createdAt: tenMinAgo }), NOW);
      // raw = 15 (recency), 15 * 1.1 = 16.5 -> 17
      expect(score).toBe(17);
    });

    it("gives 10 points for lead created < 1 day ago", () => {
      const twoHoursAgo = new Date(NOW.getTime() - 2 * 60 * 60 * 1000);
      const score = scoreLead(makeLead({ createdAt: twoHoursAgo }), NOW);
      // raw = 10 (recency), 10 * 1.1 = 11
      expect(score).toBe(11);
    });

    it("gives 5 points for lead created < 1 week ago", () => {
      const threeDaysAgo = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000);
      const score = scoreLead(makeLead({ createdAt: threeDaysAgo }), NOW);
      // raw = 5 (recency), 5 * 1.1 = 5.5 -> 6
      expect(score).toBe(6);
    });

    it("gives 0 points for lead older than 1 week", () => {
      const twoWeeksAgo = new Date(NOW.getTime() - 14 * 24 * 60 * 60 * 1000);
      const score = scoreLead(makeLead({ createdAt: twoWeeksAgo }), NOW);
      expect(score).toBe(0);
    });
  });

  // ── Data completeness ──────────────────────────────────────
  describe("data completeness", () => {
    it("gives 5 points for having notes", () => {
      const score = scoreLead(
        makeLead({ notes: "Interested in premium plan" }),
        NOW
      );
      // raw = 5 (notes), 5 * 1.1 = 5.5 -> 6
      expect(score).toBe(6);
    });

    it("gives 5 points for having a positive value", () => {
      const score = scoreLead(makeLead({ value: 500 }), NOW);
      // raw = 5 (value), 5 * 1.1 = 5.5 -> 6
      expect(score).toBe(6);
    });

    it("gives 0 for value of 0", () => {
      const score = scoreLead(makeLead({ value: 0 }), NOW);
      expect(score).toBe(0);
    });

    it("gives 0 for null value", () => {
      const score = scoreLead(makeLead({ value: null }), NOW);
      expect(score).toBe(0);
    });

    it("gives 0 for negative value", () => {
      const score = scoreLead(makeLead({ value: -10 }), NOW);
      expect(score).toBe(0);
    });

    it("gives 0 for empty string notes", () => {
      const score = scoreLead(makeLead({ notes: "" }), NOW);
      expect(score).toBe(0);
    });
  });

  // ── Score clamping ─────────────────────────────────────────
  describe("score clamping", () => {
    it("clamps score to max of 100", () => {
      // Max everything: email(15) + phone(20) + both(10) + proposal(40) + recent(15) + notes(5) + value(5)
      // raw = 110, with referral 1.3x = 143 -> clamped to 100
      const score = scoreLead(
        makeLead({
          email: "a@b.com",
          phone: "555-1234",
          source: "referral",
          status: "proposal",
          notes: "VIP",
          value: 10000,
          createdAt: new Date(NOW.getTime() - 5 * 60 * 1000), // 5 min ago
        }),
        NOW
      );
      expect(score).toBe(100);
    });

    it("never returns negative score", () => {
      const score = scoreLead(makeLead(), NOW);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Default `now` ──────────────────────────────────────────
  describe("default now parameter", () => {
    it("uses current time when now is not provided", () => {
      // Just make sure it does not throw
      const score = scoreLead(makeLead({ createdAt: new Date() }));
      expect(typeof score).toBe("number");
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});

describe("getLeadStage", () => {
  it("returns 'new' for score 0", () => {
    expect(getLeadStage(0)).toBe("new");
  });

  it("returns 'new' for score 20", () => {
    expect(getLeadStage(20)).toBe("new");
  });

  it("returns 'nurturing' for score 21", () => {
    expect(getLeadStage(21)).toBe("nurturing");
  });

  it("returns 'nurturing' for score 40", () => {
    expect(getLeadStage(40)).toBe("nurturing");
  });

  it("returns 'hot' for score 41", () => {
    expect(getLeadStage(41)).toBe("hot");
  });

  it("returns 'hot' for score 70", () => {
    expect(getLeadStage(70)).toBe("hot");
  });

  it("returns 'converted' for score 71", () => {
    expect(getLeadStage(71)).toBe("converted");
  });

  it("returns 'converted' for score 100", () => {
    expect(getLeadStage(100)).toBe("converted");
  });
});

describe("isValidLeadStatus", () => {
  it("returns true for all valid statuses", () => {
    for (const status of VALID_LEAD_STATUSES) {
      expect(isValidLeadStatus(status)).toBe(true);
    }
  });

  it("returns false for invalid statuses", () => {
    expect(isValidLeadStatus("invalid")).toBe(false);
    expect(isValidLeadStatus("")).toBe(false);
    expect(isValidLeadStatus("NEW")).toBe(false); // case-sensitive
    expect(isValidLeadStatus("Won")).toBe(false);
  });
});

describe("constants", () => {
  it("VALID_LEAD_STATUSES contains expected values", () => {
    expect(VALID_LEAD_STATUSES).toContain("new");
    expect(VALID_LEAD_STATUSES).toContain("won");
    expect(VALID_LEAD_STATUSES).toContain("lost");
    expect(VALID_LEAD_STATUSES.length).toBe(7);
  });

  it("VALID_LEAD_SOURCES contains expected values", () => {
    expect(VALID_LEAD_SOURCES).toContain("chatbot");
    expect(VALID_LEAD_SOURCES).toContain("referral");
    expect(VALID_LEAD_SOURCES).toContain("voice");
    expect(VALID_LEAD_SOURCES.length).toBe(8);
  });
});
