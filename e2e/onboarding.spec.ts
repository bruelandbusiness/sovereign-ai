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

  test("completes all three steps and reaches the summary page", async ({
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
    // Step 2: Service Selection
    // ---------------------------------------------------------------------------
    await expect(
      page.getByRole("heading", { name: /select your services/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Select at least 1 service by clicking the first service toggle button
    const firstServiceButton = page
      .getByRole("button", { name: /ai lead generation/i })
      .first();
    await firstServiceButton.click();

    // Click Next to advance to Step 3
    await page.getByRole("button", { name: /next/i }).click();

    // ---------------------------------------------------------------------------
    // Step 3: Details & Access (all optional — can also be skipped)
    // ---------------------------------------------------------------------------
    await expect(
      page.getByRole("heading", { name: /details.*access/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Fill a couple of optional fields
    await page.getByLabel(/average job value/i).fill("$5,000");
    await page
      .getByLabel(/google business profile email/i)
      .fill("test@gmail.com");

    // Click "Review & Submit" to advance to summary
    await page
      .getByRole("button", { name: /review.*submit/i })
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

  test("can skip the optional Details & Access step", async ({ page }) => {
    await page.goto("/onboarding");

    // Step 1: fill required business info
    await page.getByLabel(/business name/i).fill("Skip Test LLC");
    await page.getByLabel(/contact name/i).fill("Jane Skip");
    await page.getByLabel(/^email/i).fill("jane@skip.com");
    await page.getByLabel(/phone/i).fill("(555) 000-1111");
    await page.getByLabel(/^city/i).fill("Denver");
    await page.getByLabel(/^state/i).fill("CO");
    await page.getByRole("combobox", { name: /industry/i }).click();
    await page
      .getByRole("option", { name: /plumbing/i })
      .first()
      .click();
    await page.getByRole("button", { name: /next/i }).click();

    // Step 2: select a service
    await page
      .getByRole("button", { name: /ai lead generation/i })
      .first()
      .click();
    await page.getByRole("button", { name: /next/i }).click();

    // Step 3: skip it
    await expect(
      page.getByRole("heading", { name: /details.*access/i }),
    ).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /skip for now/i }).click();

    // Should be on the summary page
    await expect(
      page.getByRole("heading", { name: /review your/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
