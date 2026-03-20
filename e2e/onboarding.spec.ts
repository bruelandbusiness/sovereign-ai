import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Onboarding wizard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "client");

    // Mock the onboarding submission endpoint
    await page.route("**/api/onboarding", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      }),
    );
  });

  test("completes all four steps and reaches the summary page", async ({
    page,
  }) => {
    await page.goto("/onboarding");

    // ---------------------------------------------------------------------------
    // Step 1: Business Info
    // ---------------------------------------------------------------------------
    await expect(
      page.getByRole("heading", {
        name: /let.s get your ai marketing running/i,
      }),
    ).toBeVisible({ timeout: 15_000 });

    // Fill required fields
    await page.getByLabel(/business name/i).fill("Test Plumbing LLC");
    await page.getByLabel(/contact name/i).fill("John Tester");
    await page.getByLabel(/^email/i).fill("john@testplumbing.com");
    await page.getByLabel(/phone/i).fill("(555) 987-6543");
    await page.getByLabel(/^city/i).fill("Phoenix");
    await page.getByLabel(/^state/i).fill("AZ");

    // Select industry via the Select trigger (custom component)
    await page.getByRole("combobox", { name: /industry/i }).click();
    await page
      .getByRole("option", { name: /plumbing/i })
      .first()
      .click();

    // Click Next to advance to Step 2
    await page.getByRole("button", { name: /next/i }).click();

    // ---------------------------------------------------------------------------
    // Step 2: Current Setup
    // ---------------------------------------------------------------------------
    await expect(
      page.getByRole("heading", { name: /current setup/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Fill optional fields
    await page.getByLabel(/average job value/i).fill("$5,000");
    await page.getByLabel(/monthly marketing budget/i).fill("$1,500");

    // Select a marketing activity (checkbox-like buttons)
    await page.getByRole("checkbox", { name: /google ads/i }).click();
    await page.getByRole("checkbox", { name: /referrals/i }).click();

    // Click Next to advance to Step 3
    await page.getByRole("button", { name: /next/i }).click();

    // ---------------------------------------------------------------------------
    // Step 3: Service Selection
    // ---------------------------------------------------------------------------
    await expect(
      page.getByRole("heading", { name: /select your services/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Select at least 1 service by clicking the first service toggle button
    // The service toggles use aria-pressed, so we can find them by role "button"
    // with the service name
    const firstServiceButton = page
      .getByRole("button", { name: /ai lead generation/i })
      .first();
    await firstServiceButton.click();

    // Click Next to advance to Step 4
    await page.getByRole("button", { name: /next/i }).click();

    // ---------------------------------------------------------------------------
    // Step 4: Account Access
    // ---------------------------------------------------------------------------
    await expect(
      page.getByRole("heading", { name: /account access/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Fill optional fields
    await page.getByLabel(/google business profile email/i).fill("test@gmail.com");

    // Click "Submit Onboarding" to advance to summary
    await page
      .getByRole("button", { name: /submit onboarding/i })
      .click();

    // ---------------------------------------------------------------------------
    // Summary Page
    // ---------------------------------------------------------------------------
    await expect(
      page.getByRole("heading", { name: /review your/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Verify summary contains entered data
    await expect(page.getByText("Test Plumbing LLC")).toBeVisible();
    await expect(page.getByText("John Tester")).toBeVisible();
    await expect(page.getByText("john@testplumbing.com")).toBeVisible();
    await expect(page.getByText("Phoenix, AZ")).toBeVisible();

    // Verify the Confirm & Submit button is present
    await expect(
      page.getByRole("button", { name: /confirm.*submit/i }),
    ).toBeVisible();
  });
});
