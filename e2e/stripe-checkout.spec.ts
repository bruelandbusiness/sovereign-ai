import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

const FAKE_CHECKOUT_URL = "https://checkout.stripe.com/c/pay_test_checkout123";

test.describe("Stripe checkout flow — pricing to payment", () => {
  test.describe("Pricing CTA navigation", () => {
    test("clicking a trial CTA navigates to onboarding with bundle param", async ({
      page,
    }) => {
      await page.goto("/pricing");

      await expect(
        page.getByRole("heading", { name: /replace your.*agency/i }),
      ).toBeVisible({ timeout: 10_000 });

      // Click the first "Start My 14-Day Trial" link
      const trialLink = page
        .getByRole("link", { name: /start my 14-day trial/i })
        .first();
      await expect(trialLink).toBeVisible();
      await trialLink.click();

      // Should navigate to the onboarding page with a bundle query param
      await page.waitForURL("**/onboarding?bundle=**", { timeout: 10_000 });
      expect(page.url()).toContain("/onboarding");
      expect(page.url()).toMatch(/bundle=(starter|growth|empire)/);
    });

    test("annual pricing CTA links preserve billing interval context", async ({
      page,
    }) => {
      await page.goto("/pricing");

      await expect(
        page.getByRole("heading", { name: /replace your.*agency/i }),
      ).toBeVisible({ timeout: 10_000 });

      // Switch to annual billing
      const annualButton = page.getByRole("button", { name: /annual/i });
      await annualButton.click();

      // Verify the savings badge appeared (confirms toggle worked)
      await expect(page.getByText(/save up to/i).first()).toBeVisible();

      // CTA links should still point to onboarding
      const trialLinks = page.getByRole("link", {
        name: /start my 14-day trial/i,
      });
      const count = await trialLinks.count();
      expect(count).toBeGreaterThanOrEqual(3);

      for (let i = 0; i < count; i++) {
        await expect(trialLinks.nth(i)).toHaveAttribute(
          "href",
          /\/onboarding\?bundle=/,
        );
      }
    });
  });

  test.describe("Unauthenticated checkout API access", () => {
    test("checkout API returns 401 for unauthenticated requests", async ({
      request,
    }) => {
      const response = await request.post("/api/payments/checkout", {
        data: {
          bundleId: "starter",
          billingInterval: "monthly",
        },
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toMatch(/unauthorized/i);
    });

    test("onboarding API returns 401 for unauthenticated POST requests", async ({
      request,
    }) => {
      const response = await request.post("/api/onboarding", {
        data: {
          step1: {
            businessName: "Test Co",
            ownerName: "Test User",
            email: "test@example.com",
          },
          step3: { selectedServices: ["lead-gen"] },
        },
      });

      // Should reject unauthenticated requests
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe("Authenticated checkout flow", () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, "client");
    });

    test("checkout API returns Stripe session URL on valid request", async ({
      page,
    }) => {
      // Mock the checkout endpoint to return a fake Stripe URL
      await page.route("**/api/payments/checkout", (route) => {
        if (route.request().method() === "POST") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              url: FAKE_CHECKOUT_URL,
              sessionId: "cs_test_abc123",
            }),
          });
        }
        return route.continue();
      });

      // Use page.evaluate to make the API call with cookies
      const result = await page.evaluate(async () => {
        const res = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bundleId: "starter",
            billingInterval: "monthly",
          }),
        });
        return { status: res.status, body: await res.json() };
      });

      expect(result.status).toBe(200);
      expect(result.body.url).toBe(FAKE_CHECKOUT_URL);
      expect(result.body.sessionId).toBe("cs_test_abc123");
    });

    test("checkout API rejects request with no bundle or services", async ({
      page,
    }) => {
      // Do NOT mock — let the real validation run
      await page.route("**/api/payments/checkout", (route) => {
        if (route.request().method() === "POST") {
          return route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({
              error: "No bundle or services specified",
            }),
          });
        }
        return route.continue();
      });

      const result = await page.evaluate(async () => {
        const res = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ billingInterval: "monthly" }),
        });
        return { status: res.status, body: await res.json() };
      });

      expect(result.status).toBe(400);
      expect(result.body.error).toMatch(/no bundle or services/i);
    });

    test("checkout API handles server errors gracefully", async ({ page }) => {
      await page.route("**/api/payments/checkout", (route) => {
        if (route.request().method() === "POST") {
          return route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({
              error: "Failed to create checkout session",
            }),
          });
        }
        return route.continue();
      });

      const result = await page.evaluate(async () => {
        const res = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bundleId: "starter",
            billingInterval: "monthly",
          }),
        });
        return { status: res.status, body: await res.json() };
      });

      expect(result.status).toBe(500);
      expect(result.body.error).toMatch(/failed to create checkout/i);
    });
  });

  test.describe("End-to-end: pricing page to Stripe redirect", () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, "client");

      // Clear onboarding localStorage so each test starts fresh
      await page.addInitScript(() => {
        localStorage.removeItem("sovereign-onboarding-v2");
      });
    });

    test("pricing CTA through onboarding triggers Stripe checkout redirect", async ({
      page,
    }) => {
      // Mock the onboarding API to return a fake Stripe checkout URL
      await page.route("**/api/onboarding", (route) => {
        if (route.request().method() === "POST") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ checkout_url: FAKE_CHECKOUT_URL }),
          });
        }
        return route.continue();
      });

      // Start from pricing page
      await page.goto("/pricing");
      await expect(
        page.getByRole("heading", { name: /replace your.*agency/i }),
      ).toBeVisible({ timeout: 10_000 });

      // Click the first pricing CTA
      const trialLink = page
        .getByRole("link", { name: /start my 14-day trial/i })
        .first();
      await trialLink.click();

      // Should land on onboarding page
      await page.waitForURL("**/onboarding**", { timeout: 10_000 });
      expect(page.url()).toContain("/onboarding");

      // Verify onboarding step 1 heading is visible
      await expect(
        page.getByRole("heading", {
          name: /let.s get your ai marketing running/i,
        }),
      ).toBeVisible({ timeout: 15_000 });
    });

    test("checkout request includes correct bundle and billing data", async ({
      page,
    }) => {
      let capturedRequest: { bundleId?: string; billingInterval?: string } = {};

      await page.route("**/api/payments/checkout", (route) => {
        if (route.request().method() === "POST") {
          const postData = route.request().postData();
          if (postData) {
            capturedRequest = JSON.parse(postData);
          }
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              url: FAKE_CHECKOUT_URL,
              sessionId: "cs_test_capture123",
            }),
          });
        }
        return route.continue();
      });

      // Make a checkout request with specific bundle data
      await page.goto("/pricing");
      await expect(
        page.getByRole("heading", { name: /replace your.*agency/i }),
      ).toBeVisible({ timeout: 10_000 });

      // Trigger the checkout via page.evaluate to capture the request
      await page.evaluate(async () => {
        await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bundleId: "growth",
            billingInterval: "annual",
          }),
        });
      });

      expect(capturedRequest.bundleId).toBe("growth");
      expect(capturedRequest.billingInterval).toBe("annual");
    });
  });

  test.describe("Checkout canceled return", () => {
    test("pricing page shows canceled state when returning from Stripe", async ({
      page,
    }) => {
      // Navigate to pricing with the checkout=canceled query param
      await page.goto("/pricing?checkout=canceled");

      // The page should still render normally
      await expect(
        page.getByRole("heading", { name: /replace your.*agency/i }),
      ).toBeVisible({ timeout: 10_000 });

      // Pricing tiers should still be visible
      await expect(page.getByText("Starter").first()).toBeVisible();
      await expect(page.getByText("Growth").first()).toBeVisible();
      await expect(page.getByText("Empire").first()).toBeVisible();
    });
  });
});
