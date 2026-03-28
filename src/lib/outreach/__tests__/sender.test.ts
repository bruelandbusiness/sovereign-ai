/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Tests for cold outreach sender utilities.
 *
 * Tests the pure exported functions: calculateTodayLimit, personalizeContent,
 * injectTrackingPixel, rewriteLinks, and pickSubject.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing
vi.mock("@/lib/db", () => ({
  prisma: {},
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    errorWithCause: vi.fn(),
  },
}));

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "https://app.example.com",
  },
}));

import {
  calculateTodayLimit,
  personalizeContent,
  injectTrackingPixel,
  rewriteLinks,
  pickSubject,
} from "../sender";

describe("calculateTodayLimit", () => {
  it("returns dailySendLimit when warmup is disabled", () => {
    const result = calculateTodayLimit({
      warmupEnabled: false,
      warmupStartSent: 5,
      warmupRampRate: 3,
      dailySendLimit: 100,
      startedAt: new Date(),
    });
    expect(result).toBe(100);
  });

  it("returns dailySendLimit when startedAt is null", () => {
    const result = calculateTodayLimit({
      warmupEnabled: true,
      warmupStartSent: 5,
      warmupRampRate: 3,
      dailySendLimit: 100,
      startedAt: null,
    });
    expect(result).toBe(100);
  });

  it("returns warmupStartSent on day zero", () => {
    const result = calculateTodayLimit({
      warmupEnabled: true,
      warmupStartSent: 5,
      warmupRampRate: 3,
      dailySendLimit: 100,
      startedAt: new Date(), // today
    });
    expect(result).toBe(5);
  });

  it("ramps up correctly over days", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const result = calculateTodayLimit({
      warmupEnabled: true,
      warmupStartSent: 5,
      warmupRampRate: 10,
      dailySendLimit: 100,
      startedAt: threeDaysAgo,
    });
    // 5 + 3 * 10 = 35
    expect(result).toBe(35);
  });

  it("caps at dailySendLimit when warmup exceeds it", () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = calculateTodayLimit({
      warmupEnabled: true,
      warmupStartSent: 5,
      warmupRampRate: 10,
      dailySendLimit: 50,
      startedAt: thirtyDaysAgo,
    });
    // 5 + 30 * 10 = 305, capped at 50
    expect(result).toBe(50);
  });
});

describe("personalizeContent", () => {
  it("replaces all template variables with recipient data", () => {
    const template = "Hi {{name}} from {{company}} in {{city}}, we help {{vertical}} businesses.";
    const result = personalizeContent(template, {
      name: "Alice",
      company: "Acme Plumbing",
      vertical: "plumbing",
      city: "Austin",
    });
    expect(result).toBe("Hi Alice from Acme Plumbing in Austin, we help plumbing businesses.");
  });

  it("uses fallback values when data fields are empty strings", () => {
    const template = "Hi {{name}} from {{company}} in {{city}}, {{vertical}} pro.";
    const result = personalizeContent(template, {
      name: "",
      company: "",
      vertical: "",
      city: "",
    });
    expect(result).toBe("Hi there from your company in your area, home service pro.");
  });

  it("handles multiple occurrences of the same variable", () => {
    const template = "{{name}}, {{name}}, {{name}}!";
    const result = personalizeContent(template, {
      name: "Bob",
      company: "X",
      vertical: "X",
      city: "X",
    });
    expect(result).toBe("Bob, Bob, Bob!");
  });

  it("returns template unchanged if no variables present", () => {
    const template = "Plain text with no variables.";
    const result = personalizeContent(template, {
      name: "Alice",
      company: "Acme",
      vertical: "HVAC",
      city: "Dallas",
    });
    expect(result).toBe("Plain text with no variables.");
  });
});

describe("injectTrackingPixel", () => {
  it("injects pixel before </body> tag", () => {
    const html = "<html><body><p>Hello</p></body></html>";
    const result = injectTrackingPixel(html, "track-123");

    expect(result).toContain("track/open/track-123");
    expect(result).toContain('width="1" height="1"');
    expect(result).toMatch(/<img[^>]+\/>\s*<\/body>/);
  });

  it("appends pixel at end when no </body> tag exists", () => {
    const html = "<p>Hello</p>";
    const result = injectTrackingPixel(html, "track-456");

    expect(result).toContain("track/open/track-456");
    expect(result).toMatch(/<p>Hello<\/p><img/);
  });

  it("uses the correct app URL in tracking pixel", () => {
    const result = injectTrackingPixel("<body></body>", "abc");
    expect(result).toContain("https://app.example.com/api/outreach/track/open/abc");
  });
});

describe("rewriteLinks", () => {
  it("rewrites http links through click tracker", () => {
    const html = '<a href="https://example.com/page">Click</a>';
    const result = rewriteLinks(html, "track-789");

    expect(result).toContain("track/click/track-789");
    expect(result).toContain(encodeURIComponent("https://example.com/page"));
  });

  it("rewrites multiple links in the same HTML", () => {
    const html = '<a href="https://a.com">A</a><a href="http://b.com">B</a>';
    const result = rewriteLinks(html, "t1");

    expect(result).toContain(encodeURIComponent("https://a.com"));
    expect(result).toContain(encodeURIComponent("http://b.com"));
  });

  it("does not rewrite mailto links", () => {
    const html = '<a href="mailto:test@example.com">Email</a>';
    const result = rewriteLinks(html, "t2");

    // mailto links don't match https?:// pattern so they stay intact
    expect(result).toBe(html);
  });

  it("does not rewrite anchor-only links", () => {
    const html = '<a href="#section">Jump</a>';
    const result = rewriteLinks(html, "t3");
    expect(result).toBe(html);
  });
});

describe("pickSubject", () => {
  it("returns default subject when variants array is empty", () => {
    const result = pickSubject([], {
      name: "Alice",
      company: "Acme",
      vertical: "plumbing",
      city: "Austin",
    });
    expect(result).toBe("Quick question");
  });

  it("picks and personalizes a subject variant", () => {
    const variants = ["Hey {{name}}, quick question about {{company}}"];
    const result = pickSubject(variants, {
      name: "Bob",
      company: "Bob's Plumbing",
      vertical: "plumbing",
      city: "Dallas",
    });
    expect(result).toBe("Hey Bob, quick question about Bob's Plumbing");
  });

  it("selects from multiple variants (always returns a valid one)", () => {
    const variants = ["Subject A", "Subject B", "Subject C"];
    const data = { name: "X", company: "Y", vertical: "Z", city: "W" };

    // Run multiple times to confirm it always picks a valid variant
    for (let i = 0; i < 20; i++) {
      const result = pickSubject(variants, data);
      expect(variants).toContain(result);
    }
  });
});
