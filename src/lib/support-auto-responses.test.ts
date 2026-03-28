import { describe, it, expect } from "vitest";

import {
  findAutoResponse,
  SUPPORT_AUTO_RESPONSES,
} from "@/lib/support-auto-responses";

// ---------------------------------------------------------------------------
// findAutoResponse
// ---------------------------------------------------------------------------

describe("findAutoResponse", () => {
  it("returns a response for a query matching an account trigger", () => {
    const result = findAutoResponse("I need to reset password please");
    expect(result).not.toBeNull();
    expect(result).toContain("reset");
  });

  it("returns a response for a billing-related query", () => {
    const result = findAutoResponse("Where can I see my invoice?");
    expect(result).not.toBeNull();
    expect(result).toContain("Billing");
  });

  it("returns a response for a service status query", () => {
    const result = findAutoResponse("Is the system down? I see an outage");
    expect(result).not.toBeNull();
    expect(result).toContain("status");
  });

  it("returns a response for an integration query", () => {
    const result = findAutoResponse("How do I connect integration?");
    expect(result).not.toBeNull();
    expect(result).toContain("Integrations");
  });

  it("returns a response for a dashboard help query", () => {
    const result = findAutoResponse("How to use dashboard?");
    expect(result).not.toBeNull();
    expect(result).toContain("dashboard");
  });

  it("returns a response for a cancellation query", () => {
    const result = findAutoResponse("I want to cancel my subscription");
    expect(result).not.toBeNull();
    expect(result).toContain("Cancel");
  });

  it("returns a response for an upgrade query", () => {
    const result = findAutoResponse("How do I upgrade to a higher plan?");
    expect(result).not.toBeNull();
    expect(result).toContain("upgrade");
  });

  it("returns a response for a contact query", () => {
    const result = findAutoResponse("How can I email support?");
    expect(result).not.toBeNull();
    expect(result).toContain("support@trysovereignai.com");
  });

  it("returns a response for an office hours query", () => {
    const result = findAutoResponse("What are your business hours?");
    expect(result).not.toBeNull();
    expect(result).toContain("Monday");
  });

  it("returns a response for an SLA query", () => {
    const result = findAutoResponse("What is your uptime guarantee?");
    expect(result).not.toBeNull();
    expect(result).toContain("99.9%");
  });

  it("returns a response for a data export query", () => {
    const result = findAutoResponse("How do I export data from my account?");
    expect(result).not.toBeNull();
    expect(result).toContain("Export");
  });

  it("returns a response for a review management query", () => {
    const result = findAutoResponse("How do I manage reviews?");
    expect(result).not.toBeNull();
    expect(result).toContain("Google Business Profile");
  });

  it("returns a response for a lead tracking query", () => {
    const result = findAutoResponse("Where are my leads?");
    expect(result).not.toBeNull();
    expect(result).toContain("Leads");
  });

  it("returns a response for a voice agent query", () => {
    const result = findAutoResponse("How do I set up voice agent?");
    expect(result).not.toBeNull();
    expect(result).toContain("Voice Agent");
  });

  it("returns a response for a booking widget query", () => {
    const result = findAutoResponse("How to embed booking widget on my site?");
    expect(result).not.toBeNull();
    expect(result).toContain("Booking Widget");
  });

  // -- Negative / edge cases --

  it("returns null for an unknown query", () => {
    const result = findAutoResponse("Tell me about quantum physics");
    expect(result).toBeNull();
  });

  it("returns null for gibberish text", () => {
    const result = findAutoResponse("asdjfklasdjfkl2234");
    expect(result).toBeNull();
  });

  it("returns null for an empty string", () => {
    const result = findAutoResponse("");
    expect(result).toBeNull();
  });

  it("returns null for whitespace-only input", () => {
    const result = findAutoResponse("   ");
    expect(result).toBeNull();
  });

  it("is case-insensitive", () => {
    const lower = findAutoResponse("reset password");
    const upper = findAutoResponse("RESET PASSWORD");
    const mixed = findAutoResponse("Reset Password");
    expect(lower).not.toBeNull();
    expect(upper).toBe(lower);
    expect(mixed).toBe(lower);
  });

  it("matches partial trigger within a longer sentence", () => {
    const result = findAutoResponse(
      "Hey, I need help because my payment failed yesterday"
    );
    expect(result).not.toBeNull();
    expect(result).toContain("Billing");
  });

  it("returns the first matching response when multiple could match", () => {
    // "cancel" is a trigger in the cancellation category
    const result = findAutoResponse("cancel");
    expect(result).not.toBeNull();
    // Verify it returns one of the defined responses
    const allResponses = SUPPORT_AUTO_RESPONSES.map((r) => r.response);
    expect(allResponses).toContain(result);
  });
});

// ---------------------------------------------------------------------------
// SUPPORT_AUTO_RESPONSES structure
// ---------------------------------------------------------------------------

describe("SUPPORT_AUTO_RESPONSES", () => {
  it("has at least 10 auto-response entries", () => {
    expect(SUPPORT_AUTO_RESPONSES.length).toBeGreaterThanOrEqual(10);
  });

  it("every entry has triggers, response, and category", () => {
    for (const entry of SUPPORT_AUTO_RESPONSES) {
      expect(entry.triggers).toBeDefined();
      expect(entry.triggers.length).toBeGreaterThan(0);
      expect(typeof entry.response).toBe("string");
      expect(entry.response.length).toBeGreaterThan(0);
      expect(typeof entry.category).toBe("string");
      expect(entry.category.length).toBeGreaterThan(0);
    }
  });

  it("all triggers are non-empty lowercase strings", () => {
    for (const entry of SUPPORT_AUTO_RESPONSES) {
      for (const trigger of entry.triggers) {
        expect(trigger.length).toBeGreaterThan(0);
        expect(trigger).toBe(trigger.toLowerCase());
      }
    }
  });
});
