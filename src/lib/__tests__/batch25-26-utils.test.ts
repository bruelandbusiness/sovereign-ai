import { describe, it, expect } from "vitest";

// Stripe helpers
import {
  formatStripeAmount,
  isSubscriptionActive,
  calculateMRRFromSubscription,
  STRIPE_EVENTS,
} from "../stripe-helpers";

// Dashboard widgets
import {
  WIDGETS,
  getWidgetsForRole,
  validateLayout,
} from "../dashboard-widgets";
import type { DashboardLayout } from "../dashboard-widgets";

// Accessibility
import {
  calculateContrastRatio,
  checkColorContrast,
  hexToRgb,
  COMMON_A11Y_ISSUES,
} from "../accessibility";

// Error codes
import {
  ERROR_CODES,
  getErrorByCode,
  isRetryableError,
} from "../error-codes";

// Form validation
import {
  required,
  email,
  validateForm,
} from "../form-validation";
import type { FormSchema } from "../form-validation";

// Analytics events
import {
  EVENT_CATALOG,
  createEvent,
  validateEvent,
} from "../analytics-events";

// ---------------------------------------------------------------------------
// 1. Stripe helpers (4 tests)
// ---------------------------------------------------------------------------

describe("Stripe helpers", () => {
  it("formatStripeAmount converts cents to formatted currency", () => {
    const result = formatStripeAmount(4999);
    expect(result).toBe("$49.99");
  });

  it("isSubscriptionActive returns true for active status", () => {
    const sub = {
      status: "active",
      currentPeriodEnd: Math.floor(Date.now() / 1000) + 86400,
      items: [],
    };
    expect(isSubscriptionActive(sub)).toBe(true);
  });

  it("calculateMRRFromSubscription returns positive number for valid items", () => {
    const sub = {
      items: [
        { priceId: "price_1", unitAmountCents: 4900, interval: "month" as const, quantity: 1 },
      ],
    };
    const mrr = calculateMRRFromSubscription(sub);
    expect(mrr).toBe(4900);
    expect(mrr).toBeGreaterThan(0);
  });

  it("STRIPE_EVENTS has 8 event types", () => {
    expect(Object.keys(STRIPE_EVENTS)).toHaveLength(8);
  });
});

// ---------------------------------------------------------------------------
// 2. Dashboard widgets (3 tests)
// ---------------------------------------------------------------------------

describe("Dashboard widgets", () => {
  it("WIDGETS has 12 widgets", () => {
    expect(WIDGETS).toHaveLength(12);
  });

  it("getWidgetsForRole returns widgets for owner role", () => {
    // Owner layout has widgets with no required services plus some with services.
    // Without active services, only service-agnostic widgets are returned.
    const widgets = getWidgetsForRole("owner");
    expect(widgets.length).toBeGreaterThan(0);
    // All returned widgets should have empty requiredServices
    for (const w of widgets) {
      expect(w.requiredServices).toHaveLength(0);
    }
  });

  it("validateLayout detects invalid widget IDs", () => {
    const layout: DashboardLayout = {
      id: "test-layout",
      name: "Test",
      description: "Test layout",
      role: "owner",
      columns: 4,
      widgets: [
        {
          widgetId: "nonexistent-widget",
          size: "small",
          position: { col: 0, row: 0, colSpan: 1, rowSpan: 1 },
          visible: true,
          refreshSeconds: 60,
        },
      ],
    };
    const result = validateLayout(layout);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "UNKNOWN_WIDGET")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Accessibility (4 tests)
// ---------------------------------------------------------------------------

describe("Accessibility", () => {
  it("calculateContrastRatio returns 21 for black/white", () => {
    const ratio = calculateContrastRatio("#000000", "#ffffff");
    expect(ratio).toBe(21);
  });

  it("checkColorContrast passes for high-contrast pair", () => {
    const result = checkColorContrast("#000000", "#ffffff");
    expect(result.passed).toBe(true);
  });

  it("hexToRgb correctly parses hex colors", () => {
    const rgb = hexToRgb("#ff8800");
    expect(rgb).toEqual({ r: 255, g: 136, b: 0 });
  });

  it("COMMON_A11Y_ISSUES has 15 items", () => {
    expect(COMMON_A11Y_ISSUES).toHaveLength(15);
  });
});

// ---------------------------------------------------------------------------
// 4. Error codes (3 tests)
// ---------------------------------------------------------------------------

describe("Error codes", () => {
  it("ERROR_CODES has 50+ entries", () => {
    expect(ERROR_CODES.length).toBeGreaterThanOrEqual(50);
  });

  it("getErrorByCode returns error for code 1000", () => {
    const error = getErrorByCode(1000);
    expect(error).toBeDefined();
    expect(error!.key).toBe("invalid_credentials");
    expect(error!.category).toBe("AUTH");
  });

  it("isRetryableError returns correct boolean", () => {
    // code 1000 (invalid_credentials) is not retryable
    expect(isRetryableError(1000)).toBe(false);
    // code 4000 (service_unavailable) is retryable
    expect(isRetryableError(4000)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Form validation (3 tests)
// ---------------------------------------------------------------------------

describe("Form validation", () => {
  it("required() returns error for empty string", () => {
    const rule = required();
    expect(rule("")).toBe("This field is required");
    expect(rule("hello")).toBeNull();
  });

  it("email() validates correct format", () => {
    const rule = email();
    expect(rule("bad")).toBe("Please enter a valid email address");
    expect(rule("user@example.com")).toBeNull();
  });

  it("validateForm returns errors for invalid data", () => {
    const schema: FormSchema = {
      name: {
        fieldName: "name",
        label: "Name",
        validators: [required()],
      },
      email: {
        fieldName: "email",
        label: "Email",
        validators: [required(), email()],
      },
    };

    const result = validateForm({ name: "", email: "not-an-email" }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    // name should have required error
    expect(result.errorsByField["name"]).toBeDefined();
    // email should have format error
    expect(result.errorsByField["email"]).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 6. Analytics events (3 tests)
// ---------------------------------------------------------------------------

describe("Analytics events", () => {
  it("EVENT_CATALOG has events across 8 categories", () => {
    const categories = Object.keys(EVENT_CATALOG);
    expect(categories).toHaveLength(8);
    expect(categories).toContain("Page");
    expect(categories).toContain("Auth");
    expect(categories).toContain("Dashboard");
    expect(categories).toContain("Lead");
    expect(categories).toContain("Service");
    expect(categories).toContain("Billing");
    expect(categories).toContain("Support");
    expect(categories).toContain("Marketing");
  });

  it("createEvent generates event with id and timestamp", () => {
    const event = createEvent("page_view", "user-1", "session-1");
    expect(event.id).toBeDefined();
    expect(event.id.startsWith("evt_")).toBe(true);
    expect(event.timestamp).toBeDefined();
    expect(event.category).toBe("Page");
    expect(event.action).toBe("page_view");
    expect(event.userId).toBe("user-1");
    expect(event.sessionId).toBe("session-1");
  });

  it("validateEvent catches missing fields", () => {
    const result = validateEvent({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    // Should mention id, category, action, timestamp, sessionId, userId
    expect(result.errors.some((e) => e.includes("id"))).toBe(true);
    expect(result.errors.some((e) => e.includes("category"))).toBe(true);
    expect(result.errors.some((e) => e.includes("action"))).toBe(true);
  });
});
