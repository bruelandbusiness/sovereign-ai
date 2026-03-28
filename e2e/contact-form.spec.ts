import { test, expect } from "@playwright/test";

test.describe("Contact / Strategy Call form", () => {
  test.describe("Contact page", () => {
    test("loads without errors", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(String(err)));

      const response = await page.goto("/contact");

      expect(response?.status()).toBeLessThan(400);
      expect(errors).toHaveLength(0);
      await expect(page.locator("body")).not.toBeEmpty();
    });

    test("displays contact channels", async ({ page }) => {
      await page.goto("/contact");

      await expect(
        page.getByRole("heading", { name: /get in touch/i }),
      ).toBeVisible({ timeout: 10_000 });

      // All three contact channels should be visible
      await expect(page.getByText("Email Support")).toBeVisible();
      await expect(page.getByText("Strategy Call")).toBeVisible();
      await expect(page.getByText("Client Dashboard")).toBeVisible();
    });

    test("strategy call link navigates correctly", async ({ page }) => {
      await page.goto("/contact");

      await expect(
        page.getByRole("heading", { name: /get in touch/i }),
      ).toBeVisible({ timeout: 10_000 });

      // The "Book a Free Strategy Call" CTA should be present
      const ctaLink = page.getByRole("link", {
        name: /book a free strategy call/i,
      });
      await expect(ctaLink).toBeVisible();
      await expect(ctaLink).toHaveAttribute("href", /\/strategy-call/);
    });
  });

  test.describe("Strategy Call form (booking form)", () => {
    test.beforeEach(async ({ page }) => {
      // Mock the leads/capture endpoint to return success
      await page.route("**/api/leads/capture", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        }),
      );

      await page.goto("/strategy-call");

      // Wait for the page to load
      await expect(
        page.getByRole("heading", { name: /ai marketing roadmap/i }),
      ).toBeVisible({ timeout: 15_000 });
    });

    test("form renders with all required fields", async ({ page }) => {
      // The form should show all expected fields
      await expect(page.getByLabel(/your name/i)).toBeVisible();
      await expect(page.getByLabel(/business name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/phone/i)).toBeVisible();
      await expect(page.getByText(/industry/i)).toBeVisible();

      // Submit button should be present
      await expect(
        page.getByRole("button", { name: /book my free strategy call/i }),
      ).toBeVisible();
    });

    test("submitting empty form shows validation errors", async ({ page }) => {
      // Click the submit button without filling any fields
      await page
        .getByRole("button", { name: /book my free strategy call/i })
        .click();

      // Validation errors should appear for required fields
      await expect(page.getByText(/name is required/i)).toBeVisible({
        timeout: 5_000,
      });
      await expect(page.getByText(/business name is required/i)).toBeVisible({
        timeout: 5_000,
      });
    });

    test("successful submission shows confirmation", async ({ page }) => {
      // Fill all required fields
      await page.getByLabel(/your name/i).fill("Jane Doe");
      await page.getByLabel(/business name/i).fill("Doe Plumbing");
      await page.getByLabel(/email/i).fill("jane@doeplumbing.com");

      // Select an industry via the select trigger
      await page.getByRole("combobox").click();
      await page.getByRole("option").first().click();

      // Submit the form
      await page
        .getByRole("button", { name: /book my free strategy call/i })
        .click();

      // Success confirmation should appear
      await expect(
        page.getByRole("heading", { name: /request received/i }),
      ).toBeVisible({ timeout: 10_000 });

      await expect(
        page.getByText(/we'll reach out within 24 hours/i),
      ).toBeVisible();
    });

    test("shows error message on server failure", async ({ page }) => {
      // Override the route to return a server error
      await page.route("**/api/leads/capture", (route) =>
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        }),
      );

      // Fill all required fields
      await page.getByLabel(/your name/i).fill("Jane Doe");
      await page.getByLabel(/business name/i).fill("Doe Plumbing");
      await page.getByLabel(/email/i).fill("jane@doeplumbing.com");

      // Select an industry
      await page.getByRole("combobox").click();
      await page.getByRole("option").first().click();

      // Submit the form
      await page
        .getByRole("button", { name: /book my free strategy call/i })
        .click();

      // Error message should appear
      await expect(
        page.getByText(/internal server error|something went wrong|failed/i),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("rate limiting message appears on 429 response", async ({ page }) => {
      // Override the route to return 429
      await page.route("**/api/leads/capture", (route) =>
        route.fulfill({
          status: 429,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Too many requests. Please try again later.",
          }),
        }),
      );

      // Fill all required fields
      await page.getByLabel(/your name/i).fill("Jane Doe");
      await page.getByLabel(/business name/i).fill("Doe Plumbing");
      await page.getByLabel(/email/i).fill("jane@doeplumbing.com");

      // Select an industry
      await page.getByRole("combobox").click();
      await page.getByRole("option").first().click();

      // Submit the form
      await page
        .getByRole("button", { name: /book my free strategy call/i })
        .click();

      // Rate limit / error message should appear
      await expect(
        page.getByText(/too many requests|please try again/i),
      ).toBeVisible({ timeout: 10_000 });
    });
  });
});
