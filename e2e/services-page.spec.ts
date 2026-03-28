import { test, expect } from "@playwright/test";

test.describe("Services page", () => {
  test("loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(String(err)));

    const response = await page.goto("/services");

    expect(response?.status()).toBeLessThan(400);
    expect(errors).toHaveLength(0);
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("displays the hero heading", async ({ page }) => {
    await page.goto("/services");

    await expect(
      page.getByRole("heading", { name: /16 ai systems/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("service cards are displayed", async ({ page }) => {
    await page.goto("/services");

    await expect(
      page.getByRole("heading", { name: /16 ai systems/i }),
    ).toBeVisible({ timeout: 10_000 });

    // The service grid section should be visible
    await expect(
      page.getByRole("heading", { name: /dominate your market/i }),
    ).toBeVisible();

    // There should be multiple service cards rendered as links
    const serviceLinks = page.locator(
      '#all-services a[href*="/onboarding?service="]',
    );
    const count = await serviceLinks.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test("category filters work", async ({ page }) => {
    await page.goto("/services");

    await expect(
      page.getByRole("heading", { name: /dominate your market/i }),
    ).toBeVisible({ timeout: 10_000 });

    // "All Services" filter should be present
    const allButton = page.getByRole("button", { name: /all services/i });
    await expect(allButton).toBeVisible();

    // Category filter buttons should be visible
    const leadGenButton = page.getByRole("button", {
      name: /lead generation/i,
    });
    await expect(leadGenButton).toBeVisible();

    const engagementButton = page.getByRole("button", {
      name: /engagement/i,
    });
    await expect(engagementButton).toBeVisible();

    const managementButton = page.getByRole("button", {
      name: /management/i,
    });
    await expect(managementButton).toBeVisible();

    const intelligenceButton = page.getByRole("button", {
      name: /intelligence/i,
    });
    await expect(intelligenceButton).toBeVisible();

    // Count all service cards initially
    const allServiceCards = page.locator(
      '#all-services a[href*="/onboarding?service="]',
    );
    const totalCount = await allServiceCards.count();

    // Click "Lead Generation" to filter
    await leadGenButton.click();

    // Wait for the animation to complete
    await page.waitForTimeout(500);

    // The number of visible cards should be less than the total
    const filteredCount = await allServiceCards.count();
    expect(filteredCount).toBeLessThan(totalCount);
    expect(filteredCount).toBeGreaterThan(0);

    // Click "All Services" to reset the filter
    await allButton.click();
    await page.waitForTimeout(500);

    const resetCount = await allServiceCards.count();
    expect(resetCount).toBe(totalCount);
  });

  test("service detail links point to onboarding", async ({ page }) => {
    await page.goto("/services");

    await expect(
      page.getByRole("heading", { name: /dominate your market/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Each service card should link to the onboarding page with a service param
    const serviceLinks = page.locator(
      '#all-services a[href*="/onboarding?service="]',
    );
    const count = await serviceLinks.count();
    expect(count).toBeGreaterThan(0);

    // Verify the first card has a valid href pattern
    await expect(serviceLinks.first()).toHaveAttribute(
      "href",
      /\/onboarding\?service=[\w-]+/,
    );
  });

  test("CTA buttons are present in hero section", async ({ page }) => {
    await page.goto("/services");

    await expect(
      page.getByRole("heading", { name: /16 ai systems/i }),
    ).toBeVisible({ timeout: 10_000 });

    // "Get Your Free AI Audit" CTA
    const auditLink = page
      .getByRole("link", { name: /get your free ai audit/i })
      .first();
    await expect(auditLink).toBeVisible();
    await expect(auditLink).toHaveAttribute("href", /\/free-audit/);

    // "View Pricing & Bundles" CTA
    const pricingLink = page
      .getByRole("link", { name: /view pricing/i })
      .first();
    await expect(pricingLink).toBeVisible();
    await expect(pricingLink).toHaveAttribute("href", /\/pricing/);
  });

  test("before/after comparison section is visible", async ({ page }) => {
    await page.goto("/services");

    await expect(
      page.getByRole("heading", { name: /16 ai systems/i }),
    ).toBeVisible({ timeout: 10_000 });

    // The comparison section heading
    await expect(
      page.getByRole("heading", { name: /without.*with.*sovereign ai/i }),
    ).toBeVisible();

    // Table headers
    await expect(page.getByText("Without AI")).toBeVisible();
    await expect(page.getByText("With Sovereign AI")).toBeVisible();
  });

  test("stats row is displayed in hero", async ({ page }) => {
    await page.goto("/services");

    await expect(
      page.getByRole("heading", { name: /16 ai systems/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Stats in the hero section
    await expect(page.getByText("16").first()).toBeVisible();
    await expect(page.getByText("AI Services").first()).toBeVisible();
    await expect(page.getByText("48hr").first()).toBeVisible();
    await expect(page.getByText("24/7").first()).toBeVisible();
  });
});
