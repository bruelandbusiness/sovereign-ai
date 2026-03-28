 
import { describe, it, expect, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock Stripe SDK — must use a class so `new Stripe(...)` works
// ---------------------------------------------------------------------------

vi.mock("stripe", () => {
  class StripeMock {
    constructor(public key: string, public opts: Record<string, unknown>) {}
  }
  return { default: StripeMock };
});

// Set required env var before importing stripe module
process.env.STRIPE_SECRET_KEY = "sk_test_fake_key_for_testing";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("stripe module", () => {
  it("exports a configured stripe instance", async () => {
    const { stripe } = await import("@/lib/stripe");
    expect(stripe).toBeDefined();
    // The mock class stores the key as a property
    expect((stripe as any).key).toBe("sk_test_fake_key_for_testing");
  });

  it("exports an assertStripeConfigured function", async () => {
    const { assertStripeConfigured } = await import("@/lib/stripe");
    expect(typeof assertStripeConfigured).toBe("function");
  });

  it("assertStripeConfigured does not throw when STRIPE_SECRET_KEY is set", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_key";
    const { assertStripeConfigured } = await import("@/lib/stripe");
    expect(() => assertStripeConfigured()).not.toThrow();
  });

  it("assertStripeConfigured throws when STRIPE_SECRET_KEY is missing", async () => {
    const originalKey = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    const { assertStripeConfigured } = await import("@/lib/stripe");
    expect(() => assertStripeConfigured()).toThrow(
      "STRIPE_SECRET_KEY is required but not configured"
    );

    // Restore
    process.env.STRIPE_SECRET_KEY = originalKey;
  });

  it("passes typescript: true to the Stripe constructor", async () => {
    const { stripe } = await import("@/lib/stripe");
    expect((stripe as any).opts).toMatchObject({ typescript: true });
  });
});
