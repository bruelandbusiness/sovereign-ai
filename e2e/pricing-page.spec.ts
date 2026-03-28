import { test, expect } from "@playwright/test";

test.describe("Pricing page", () => {
  test("loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(String(err)));

    const response = await page.goto("/pricing");

    expect(response?.status()).toBeLessThan(400);
    expect(errors).toHaveLength(0);
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("has proper page title and meta description", async ({ page }) => {
    await page.goto("/pricing");

    // Title should contain "Pricing" (set via layout metadata)
    await expect(page).toHaveTitle(/pricing/i);

    // Meta description should be present
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute("content", /.+/);
  });

  test("displays the main heading", async ({ page }) => {
    await page.goto("/pricing");

    await expect(
      page.getByRole("heading", { name: /replace your.*agency/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("bundle cards are visible with tier names", async ({ page }) => {
    await page.goto("/pricing");

    await expect(
      page.getByRole("heading", { name: /replace your.*agency/i }),
    ).toBeVisible({ timeout: 10_000 });

    // All three pricing tier names should be displayed
    await expect(page.getByText("Starter").first()).toBeVisible();
    await expect(page.getByText("Growth").first()).toBeVisible();
    await expect(page.getByText("Empire").first()).toBeVisible();
  });

  test("pricing toggle switches between monthly and annual", async ({
    page,
  }) => {
    await page.goto("/pricing");

    await expect(
      page.getByRole("heading", { name: /replace your.*agency/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Monthly button should be visible and active by default
    const monthlyButton = page.getByRole("button", { name: /monthly/i });
    const annualButton = page.getByRole("button", { name: /annual/i });
    await expect(monthlyButton).toBeVisible();
    await expect(annualButton).toBeVisible();

    // Click Annual to switch billing cycle
    await annualButton.click();

    // Annual savings badge should appear in the annual button
    await expect(page.getByText(/save up to/i).first()).toBeVisible();

    // Switch back to Monthly
    await monthlyButton.click();

    // The toggle should work without errors
    await expect(monthlyButton).toBeVisible();
  });

  test("CTA buttons are present with correct hrefs", async ({ page }) => {
    await page.goto("/pricing");

    await expect(
      page.getByRole("heading", { name: /replace your.*agency/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Each tier card should have a CTA linking to onboarding
    const setupLinks = page.getByRole("link", {
      name: /start my 14-day trial/i,
    });
    const count = await setupLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Each CTA should link to the onboarding page with a bundle param
    for (let i = 0; i < count; i++) {
      await expect(setupLinks.nth(i)).toHaveAttribute(
        "href",
        /\/onboarding\?bundle=/,
      );
    }

    // "Talk to a Strategist First" link should also be present
    const strategyLink = page
      .getByRole("link", { name: /talk to a strategist/i })
      .first();
    await expect(strategyLink).toBeVisible();
    await expect(strategyLink).toHaveAttribute("href", /\/strategy-call/);
  });

  test("money-back guarantee badge is visible", async ({ page }) => {
    await page.goto("/pricing");

    await expect(
      page.getByRole("heading", { name: /replace your.*agency/i }),
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByText(/60-day money-back guarantee/i).first(),
    ).toBeVisible();
  });

  test("DIY plan link is present", async ({ page }) => {
    await page.goto("/pricing");

    await expect(
      page.getByRole("heading", { name: /replace your.*agency/i }),
    ).toBeVisible({ timeout: 10_000 });

    const diyLink = page.getByRole("link", { name: /diy plan/i });
    await expect(diyLink).toBeVisible();
    await expect(diyLink).toHaveAttribute("href", /\/onboarding\?bundle=diy/);
  });
});
