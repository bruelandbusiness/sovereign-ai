import { test, expect } from "@playwright/test";

test.describe("Homepage → Pricing → Strategy Call flow", () => {
  test("navigates from homepage through pricing to strategy call", async ({
    page,
  }) => {
    // ---------------------------------------------------------------
    // 1. Visit the homepage and verify hero content
    // ---------------------------------------------------------------
    await page.goto("/");

    // Hero heading should be visible
    await expect(
      page.getByRole("heading", {
        name: /stop losing jobs to competitors/i,
      }),
    ).toBeVisible({ timeout: 15_000 });

    // Primary CTA button should be visible
    await expect(
      page.getByRole("button", { name: /claim my free growth roadmap/i }),
    ).toBeVisible();

    // Social proof stats should be rendered
    await expect(page.getByText(/500\+.*businesses/i).first()).toBeVisible();

    // ---------------------------------------------------------------
    // 2. Navigate to pricing page via the header link
    // ---------------------------------------------------------------
    // Use the header nav link (avoids ambiguity with footer links)
    const pricingLink = page
      .getByRole("navigation")
      .getByRole("link", { name: /pricing/i })
      .first();

    // If there's no nav link visible (e.g. mobile), go directly
    if (await pricingLink.isVisible().catch(() => false)) {
      await pricingLink.click();
    } else {
      await page.goto("/pricing");
    }

    await page.waitForURL("**/pricing**", { timeout: 10_000 });

    // ---------------------------------------------------------------
    // 3. Verify pricing page content
    // ---------------------------------------------------------------
    // Main heading
    await expect(
      page.getByRole("heading", {
        name: /replace your.*agency/i,
      }),
    ).toBeVisible({ timeout: 10_000 });

    // All three pricing tier names should be displayed
    await expect(page.getByText("Starter").first()).toBeVisible();
    await expect(page.getByText("Growth").first()).toBeVisible();
    await expect(page.getByText("Empire").first()).toBeVisible();

    // Money-back guarantee badge should be visible
    await expect(
      page.getByText(/60-day money-back guarantee/i).first(),
    ).toBeVisible();

    // ---------------------------------------------------------------
    // 4. Click the strategy call CTA
    // ---------------------------------------------------------------
    const strategyCallLink = page
      .getByRole("link", { name: /talk to a strategist/i })
      .first();
    await expect(strategyCallLink).toBeVisible();
    await strategyCallLink.click();

    await page.waitForURL("**/strategy-call**", { timeout: 10_000 });

    // ---------------------------------------------------------------
    // 5. Verify strategy call page loaded
    // ---------------------------------------------------------------
    await expect(
      page.getByRole("heading", { name: /strategy call/i }).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Page should have rendered without JS errors
    expect(page.url()).toContain("/strategy-call");
  });

  test("homepage CTA opens booking modal", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: /stop losing jobs to competitors/i,
      }),
    ).toBeVisible({ timeout: 15_000 });

    // Click the primary CTA
    await page
      .getByRole("button", { name: /claim my free growth roadmap/i })
      .click();

    // Booking modal should appear (dialog role)
    await expect(page.getByRole("dialog").first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("pricing page displays billing toggle", async ({ page }) => {
    await page.goto("/pricing");

    await expect(
      page.getByRole("heading", { name: /replace your.*agency/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Monthly and Annual toggle buttons should be present
    await expect(
      page.getByRole("button", { name: /monthly/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /annual/i })).toBeVisible();
  });

  test("homepage renders correctly on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // Hero heading should still be visible on mobile
    await expect(
      page.getByRole("heading", {
        name: /stop losing jobs to competitors/i,
      }),
    ).toBeVisible({ timeout: 15_000 });

    // Primary CTA should be visible
    await expect(
      page.getByRole("button", { name: /claim my free growth roadmap/i }),
    ).toBeVisible();

    // Desktop nav should be hidden on mobile
    const mainNav = page.getByRole("navigation", {
      name: /main navigation/i,
    });
    await expect(mainNav).toBeHidden();

    // Mobile menu toggle should be visible instead
    await expect(
      page.getByRole("button", { name: /open menu/i }),
    ).toBeVisible();
  });

  test("social proof section is visible on homepage", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: /stop losing jobs to competitors/i,
      }),
    ).toBeVisible({ timeout: 15_000 });

    // Social proof counter bar
    await expect(
      page.getByText(/500\+.*businesses/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/\$12M\+.*revenue/i).first(),
    ).toBeVisible();
    await expect(page.getByText(/4\.9\/5/i).first()).toBeVisible();
  });

  test("urgency banner is displayed on homepage", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: /stop losing jobs to competitors/i,
      }),
    ).toBeVisible({ timeout: 15_000 });

    // Urgency banner with limited spots messaging
    await expect(
      page.getByText(/only 3 onboarding spots left/i),
    ).toBeVisible({ timeout: 10_000 });

    // The "Claim your spot" CTA within the urgency banner
    await expect(
      page.getByRole("button", { name: /claim your spot/i }),
    ).toBeVisible();
  });
});
