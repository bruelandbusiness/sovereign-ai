import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatRelative,
  formatShort,
  formatFull,
  formatDateRange,
  isWithinDays,
  getStartOfPeriod,
  toISODateString,
} from "@/lib/date-utils";

// Pin "now" so tests are deterministic.
const NOW = new Date("2026-03-28T14:30:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// formatShort
// ---------------------------------------------------------------------------

describe("formatShort", () => {
  it("formats a Date object", () => {
    // Use local midnight to avoid UTC-to-local timezone shift
    expect(formatShort(new Date(2026, 2, 28))).toBe("Mar 28, 2026");
  });

  it("formats an ISO string", () => {
    expect(formatShort("2025-01-01T12:00:00Z")).toBe("Jan 1, 2025");
  });

  it("formats a Unix timestamp (number)", () => {
    // Use local midnight to avoid timezone shift
    const ts = new Date(2026, 2, 28).getTime();
    expect(formatShort(ts)).toBe("Mar 28, 2026");
  });
});

// ---------------------------------------------------------------------------
// formatFull
// ---------------------------------------------------------------------------

describe("formatFull", () => {
  it("includes date and time with AM/PM", () => {
    const result = formatFull(new Date("2026-03-28T14:30:00"));
    expect(result).toContain("March");
    expect(result).toContain("2026");
    expect(result).toMatch(/at \d{1,2}:\d{2} [AP]M/);
  });
});

// ---------------------------------------------------------------------------
// formatRelative
// ---------------------------------------------------------------------------

describe("formatRelative", () => {
  it('returns a string ending with "ago"', () => {
    const twoHoursAgo = new Date(NOW.getTime() - 2 * 60 * 60 * 1000);
    const result = formatRelative(twoHoursAgo);
    expect(result).toContain("ago");
  });

  it("handles a string input", () => {
    const result = formatRelative("2026-03-28T12:30:00Z");
    expect(result).toContain("ago");
  });
});

// ---------------------------------------------------------------------------
// formatDateRange
// ---------------------------------------------------------------------------

describe("formatDateRange", () => {
  it("omits year on start when both dates share the same year", () => {
    // Use local-time Date objects to avoid timezone shifts
    const result = formatDateRange(new Date(2026, 2, 22), new Date(2026, 2, 28));
    expect(result).toMatch(/^Mar 22 - Mar 28, 2026$/);
  });

  it("includes year on both ends when years differ", () => {
    const result = formatDateRange(new Date(2025, 11, 28), new Date(2026, 0, 3));
    expect(result).toMatch(/^Dec 28, 2025 - Jan 3, 2026$/);
  });
});

// ---------------------------------------------------------------------------
// isWithinDays
// ---------------------------------------------------------------------------

describe("isWithinDays", () => {
  it("returns true for a date within the window", () => {
    const yesterday = new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000);
    expect(isWithinDays(yesterday, 7)).toBe(true);
  });

  it("returns false for a date outside the window", () => {
    const longAgo = new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000);
    expect(isWithinDays(longAgo, 7)).toBe(false);
  });

  it("returns true for today with days=0", () => {
    // "now" is after startOfDay(subDays(now, 0)) which is startOfDay(now)
    expect(isWithinDays(NOW, 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getStartOfPeriod
// ---------------------------------------------------------------------------

describe("getStartOfPeriod", () => {
  it("returns a Date in the past for 7d", () => {
    const start = getStartOfPeriod("7d");
    expect(start).toBeInstanceOf(Date);
    expect(start.getTime()).toBeLessThan(NOW.getTime());
  });

  it("returns an earlier date for larger periods", () => {
    const d7 = getStartOfPeriod("7d");
    const d30 = getStartOfPeriod("30d");
    const d90 = getStartOfPeriod("90d");
    const y1 = getStartOfPeriod("1y");

    expect(d30.getTime()).toBeLessThan(d7.getTime());
    expect(d90.getTime()).toBeLessThan(d30.getTime());
    expect(y1.getTime()).toBeLessThan(d90.getTime());
  });

  it("returns start-of-day (midnight)", () => {
    const start = getStartOfPeriod("30d");
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// toISODateString
// ---------------------------------------------------------------------------

describe("toISODateString", () => {
  it("returns yyyy-MM-dd format", () => {
    expect(toISODateString(new Date("2026-03-28T14:30:00"))).toBe(
      "2026-03-28"
    );
  });

  it("handles a numeric timestamp", () => {
    const ts = new Date("2025-12-25T00:00:00").getTime();
    expect(toISODateString(ts)).toBe("2025-12-25");
  });

  it("handles an ISO string input", () => {
    expect(toISODateString("2024-07-04T18:00:00Z")).toMatch(
      /^\d{4}-\d{2}-\d{2}$/
    );
  });
});
