import { describe, it, expect } from "vitest";
import {
  SERVICES,
  BUNDLES,
  VERTICALS,
  TESTIMONIALS,
  HOW_IT_WORKS,
  SERVICE_CATEGORIES,
  getServiceById,
  getBundleById,
  formatPrice,
} from "../constants";

describe("SERVICES", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(SERVICES)).toBe(true);
    expect(SERVICES.length).toBeGreaterThan(0);
  });

  it("has unique IDs across all services", () => {
    const ids = SERVICES.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("every service has required fields", () => {
    for (const service of SERVICES) {
      expect(service.id).toBeTruthy();
      expect(typeof service.id).toBe("string");
      expect(service.name).toBeTruthy();
      expect(typeof service.name).toBe("string");
      expect(service.tagline).toBeTruthy();
      expect(typeof service.tagline).toBe("string");
      expect(service.description).toBeTruthy();
      expect(typeof service.description).toBe("string");
      expect(typeof service.price).toBe("number");
      expect(service.price).toBeGreaterThan(0);
      expect(service.color).toBeTruthy();
      expect(typeof service.color).toBe("string");
      expect(service.category).toBeTruthy();
      expect(Array.isArray(service.features)).toBe(true);
      expect(service.features.length).toBeGreaterThan(0);
    }
  });

  it("all categories are valid SERVICE_CATEGORIES", () => {
    const validCategories = SERVICE_CATEGORIES.map((c) => c.id).filter(
      (id) => id !== "all"
    );
    for (const service of SERVICES) {
      expect(validCategories).toContain(service.category);
    }
  });

  it("popular flag is only set on some services", () => {
    const popular = SERVICES.filter((s) => s.popular);
    const notPopular = SERVICES.filter((s) => !s.popular);
    expect(popular.length).toBeGreaterThan(0);
    expect(notPopular.length).toBeGreaterThan(0);
  });
});

describe("BUNDLES", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(BUNDLES)).toBe(true);
    expect(BUNDLES.length).toBeGreaterThan(0);
  });

  it("has unique IDs across all bundles", () => {
    const ids = BUNDLES.map((b) => b.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("every bundle has required fields", () => {
    for (const bundle of BUNDLES) {
      expect(bundle.id).toBeTruthy();
      expect(bundle.name).toBeTruthy();
      expect(typeof bundle.price).toBe("number");
      expect(bundle.price).toBeGreaterThan(0);
      expect(typeof bundle.annualPrice).toBe("number");
      expect(bundle.annualPrice).toBeGreaterThan(0);
      expect(bundle.annualPrice).toBeLessThan(bundle.price);
      expect(Array.isArray(bundle.services)).toBe(true);
      expect(bundle.services.length).toBeGreaterThan(0);
      expect(bundle.description).toBeTruthy();
      expect(bundle.savings).toBeTruthy();
    }
  });

  it("all bundle service references point to valid service IDs", () => {
    const serviceIds = new Set(SERVICES.map((s) => s.id));
    for (const bundle of BUNDLES) {
      for (const serviceId of bundle.services) {
        expect(serviceIds.has(serviceId)).toBe(true);
      }
    }
  });

  it("at most one bundle is marked popular", () => {
    const popular = BUNDLES.filter((b) => b.popular);
    expect(popular.length).toBeLessThanOrEqual(1);
  });
});

describe("VERTICALS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(VERTICALS)).toBe(true);
    expect(VERTICALS.length).toBeGreaterThan(0);
  });

  it("has unique IDs", () => {
    const ids = VERTICALS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every vertical has id and label", () => {
    for (const vertical of VERTICALS) {
      expect(vertical.id).toBeTruthy();
      expect(vertical.label).toBeTruthy();
    }
  });

  it("includes an 'other' option", () => {
    const other = VERTICALS.find((v) => v.id === "other");
    expect(other).toBeDefined();
  });
});

describe("TESTIMONIALS", () => {
  it("is an array (may be empty per policy)", () => {
    expect(Array.isArray(TESTIMONIALS)).toBe(true);
  });
});

describe("HOW_IT_WORKS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(HOW_IT_WORKS)).toBe(true);
    expect(HOW_IT_WORKS.length).toBeGreaterThan(0);
  });

  it("every step has required fields", () => {
    for (const step of HOW_IT_WORKS) {
      expect(step.step).toBeTruthy();
      expect(step.title).toBeTruthy();
      expect(step.time).toBeTruthy();
      expect(step.description).toBeTruthy();
    }
  });

  it("steps are in sequential order", () => {
    const stepNumbers = HOW_IT_WORKS.map((s) => parseInt(s.step, 10));
    for (let i = 1; i < stepNumbers.length; i++) {
      expect(stepNumbers[i]).toBeGreaterThan(stepNumbers[i - 1]);
    }
  });
});

describe("SERVICE_CATEGORIES", () => {
  it("includes an 'all' category", () => {
    const all = SERVICE_CATEGORIES.find((c) => c.id === "all");
    expect(all).toBeDefined();
    expect(all!.label).toBe("All Services");
  });

  it("has unique IDs", () => {
    const ids = SERVICE_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getServiceById", () => {
  it("returns a service for a valid ID", () => {
    const service = getServiceById("seo");
    expect(service).toBeDefined();
    expect(service!.id).toBe("seo");
    expect(service!.name).toBe("AI SEO Domination");
  });

  it("returns undefined for an invalid ID", () => {
    expect(getServiceById("nonexistent")).toBeUndefined();
  });
});

describe("getBundleById", () => {
  it("returns a bundle for a valid ID", () => {
    const bundle = getBundleById("growth");
    expect(bundle).toBeDefined();
    expect(bundle!.id).toBe("growth");
  });

  it("returns undefined for an invalid ID", () => {
    expect(getBundleById("nonexistent")).toBeUndefined();
  });
});

describe("formatPrice", () => {
  it("formats a whole number as USD without decimals", () => {
    expect(formatPrice(2500)).toBe("$2,500");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe("$0");
  });

  it("formats large numbers with commas", () => {
    expect(formatPrice(12997)).toBe("$12,997");
  });
});
