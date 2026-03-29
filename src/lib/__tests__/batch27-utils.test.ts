import { describe, it, expect } from "vitest";

// Cache strategy
import {
  CACHE_STRATEGIES,
  buildCacheKey,
  shouldInvalidate,
  getCacheHeaders,
} from "../cache-strategy";

// Search engine
import {
  search,
  filterBy,
  sortBy,
  paginate,
  fuzzyMatch,
} from "../search-engine";

// Date utils
import {
  formatDate,
  formatRelative,
  getBusinessDays,
  isBusinessDay,
  daysBetween,
} from "../date-utils";

// Changelog generator
import {
  parseConventionalCommit,
  categorizeCommits,
  determineVersionBump,
  bumpVersion,
} from "../changelog-generator";
import type { ChangelogCommit } from "../changelog-generator";

// Permissions
import {
  hasPermission,
  getMissingPermissions,
} from "../permissions";

// ---------------------------------------------------------------------------
// 1. Cache strategy
// ---------------------------------------------------------------------------

describe("Cache strategy", () => {
  it("CACHE_STRATEGIES has 10 data types", () => {
    const keys = Object.keys(CACHE_STRATEGIES);
    expect(keys).toHaveLength(10);
    expect(keys).toContain("static_content");
    expect(keys).toContain("competitor_data");
  });

  it("buildCacheKey produces namespaced key with version", () => {
    const result = buildCacheKey("leads", ["org-42", "page-1"]);
    expect(result.key).toBe("v1:leads:org-42:page-1");
    expect(result.namespace).toBe("leads");
    expect(result.version).toBe("v1");
    expect(result.segments).toEqual(["org-42", "page-1"]);
  });

  it("shouldInvalidate returns true for expired data", () => {
    const now = Date.now();
    // service_health maxAge is 60s; cache 120s ago => expired
    const cachedAt = now - 120 * 1000;
    const result = shouldInvalidate("service_health", cachedAt, now);
    expect(result.shouldInvalidate).toBe(true);
    expect(result.reason).toContain("TTL expired");
  });

  it("getCacheHeaders includes max-age directive", () => {
    const header = getCacheHeaders("static_content");
    expect(header).toContain("max-age=");
    expect(header).toContain("public");
    expect(header).toContain("stale-while-revalidate=");
  });
});

// ---------------------------------------------------------------------------
// 2. Search engine
// ---------------------------------------------------------------------------

describe("Search engine", () => {
  const items = [
    { id: 1, name: "Alpha Widget", category: "tools" },
    { id: 2, name: "Beta Gadget", category: "electronics" },
    { id: 3, name: "Gamma Widget", category: "tools" },
    { id: 4, name: "Delta Device", category: "electronics" },
  ];

  it("search finds matching items by text", () => {
    const results = search(items, {
      text: "widget",
      fields: ["name"],
    });
    expect(results).toHaveLength(2);
    expect(results[0].item.name).toContain("Widget");
    expect(results[1].item.name).toContain("Widget");
  });

  it("filterBy with equals operator filters correctly", () => {
    const filtered = filterBy(items, [
      { field: "category", operator: "equals", value: "tools" },
    ]);
    expect(filtered).toHaveLength(2);
    expect(filtered.every((i) => i.category === "tools")).toBe(true);
  });

  it("sortBy sorts ascending and descending", () => {
    const asc = sortBy(items, [{ field: "name", direction: "asc" }]);
    expect(asc[0].name).toBe("Alpha Widget");
    expect(asc[asc.length - 1].name).toBe("Gamma Widget");

    const desc = sortBy(items, [{ field: "name", direction: "desc" }]);
    expect(desc[0].name).toBe("Gamma Widget");
    expect(desc[desc.length - 1].name).toBe("Alpha Widget");
  });

  it("paginate returns correct slice with total", () => {
    const page = paginate(items, 1, 2);
    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(4);
    expect(page.offset).toBe(1);
    expect(page.limit).toBe(2);
    expect(page.hasMore).toBe(true);
  });

  it("fuzzyMatch detects similar strings", () => {
    expect(fuzzyMatch("kitten", "kittens")).toBe(true);
    expect(fuzzyMatch("hello", "world")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Date utils
// ---------------------------------------------------------------------------

describe("Date utils", () => {
  it("formatDate returns formatted string", () => {
    const result = formatDate(new Date(2026, 0, 15), {
      style: "medium",
      locale: "en-US",
    });
    expect(typeof result).toBe("string");
    expect(result).toContain("2026");
    expect(result).toContain("15");
  });

  it("formatRelative returns 'ago' strings for past dates", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000);
    const result = formatRelative(twoDaysAgo);
    expect(result).toContain("ago");
  });

  it("getBusinessDays counts weekdays correctly", () => {
    // Mon Jan 5 2026 to Fri Jan 9 2026 (exclusive of both ends)
    // Tues, Wed, Thurs = 3 business days between them
    const start = new Date(2026, 0, 5); // Monday
    const end = new Date(2026, 0, 9);   // Friday
    const count = getBusinessDays(start, end);
    expect(count).toBe(3);
  });

  it("isBusinessDay returns false for Saturday/Sunday", () => {
    // Jan 10, 2026 is a Saturday
    expect(isBusinessDay(new Date(2026, 0, 10))).toBe(false);
    // Jan 11, 2026 is a Sunday
    expect(isBusinessDay(new Date(2026, 0, 11))).toBe(false);
    // Jan 12, 2026 is a Monday
    expect(isBusinessDay(new Date(2026, 0, 12))).toBe(true);
  });

  it("daysBetween returns correct count", () => {
    const a = new Date(2026, 0, 1);
    const b = new Date(2026, 0, 11);
    expect(daysBetween(a, b)).toBe(10);
    // Order should not matter
    expect(daysBetween(b, a)).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// 4. Changelog generator
// ---------------------------------------------------------------------------

describe("Changelog generator", () => {
  it('parseConventionalCommit parses "feat: message" correctly', () => {
    const result = parseConventionalCommit("feat: add dashboard widgets", {
      hash: "abc1234",
      author: "Alice",
    });
    expect(result).not.toBeNull();
    expect(result!.type).toBe("feat");
    expect(result!.message).toBe("add dashboard widgets");
    expect(result!.scope).toBeNull();
    expect(result!.breaking).toBe(false);
  });

  it("categorizeCommits groups by type", () => {
    const commits: ChangelogCommit[] = [
      {
        hash: "a1",
        type: "feat",
        scope: null,
        message: "new feature",
        body: null,
        breaking: false,
        author: "Alice",
        date: "2026-03-01",
      },
      {
        hash: "b2",
        type: "fix",
        scope: null,
        message: "fix bug",
        body: null,
        breaking: false,
        author: "Bob",
        date: "2026-03-02",
      },
      {
        hash: "c3",
        type: "feat",
        scope: null,
        message: "another feature",
        body: null,
        breaking: false,
        author: "Alice",
        date: "2026-03-03",
      },
    ];

    const sections = categorizeCommits(commits);
    const featSection = sections.find((s) => s.category === "features");
    const fixSection = sections.find((s) => s.category === "fixes");

    expect(featSection).toBeDefined();
    expect(featSection!.commits).toHaveLength(2);
    expect(fixSection).toBeDefined();
    expect(fixSection!.commits).toHaveLength(1);
  });

  it('determineVersionBump returns "minor" for features', () => {
    const commits: ChangelogCommit[] = [
      {
        hash: "a1",
        type: "feat",
        scope: null,
        message: "add feature",
        body: null,
        breaking: false,
        author: "Alice",
        date: "2026-03-01",
      },
    ];
    expect(determineVersionBump(commits)).toBe("minor");
  });

  it("bumpVersion increments correctly", () => {
    expect(bumpVersion("1.2.3", "patch")).toBe("1.2.4");
    expect(bumpVersion("1.2.3", "minor")).toBe("1.3.0");
    expect(bumpVersion("1.2.3", "major")).toBe("2.0.0");
  });
});

// ---------------------------------------------------------------------------
// 5. Permissions
// ---------------------------------------------------------------------------

describe("Permissions", () => {
  it("hasPermission returns true for superadmin", () => {
    expect(hasPermission("superadmin", "billing:refund")).toBe(true);
    expect(hasPermission("superadmin", "users:impersonate")).toBe(true);
    expect(hasPermission("superadmin", "admin:system_config")).toBe(true);
  });

  it("getMissingPermissions returns empty for admin on basic checks", () => {
    const missing = getMissingPermissions("admin", [
      "leads:view",
      "leads:edit",
      "leads:delete",
    ]);
    expect(missing).toHaveLength(0);
  });
});
