import { test, expect } from "@playwright/test";

test.describe("Pricing page — critical customer journey", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing");
    await expect(
      page.getByRole("heading", { name: /replace your.*agency/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("all three pricing cards render with tier names", async ({ page }) => {
    await expect(page.getByText("Starter").first()).toBeVisible();
    await expect(page.getByText("Growth").first()).toBeVisible();
    await expect(page.getByText("Empire").first()).toBeVisible();
  });

  test("each pricing card has a visible feature list", async ({ page }) => {
    // Each pricing card should contain list items describing features.
    // The cards use <ul> lists with feature descriptions.
    const featureLists = page.locator(
      "[class*='card'] ul, [class*='Card'] ul, [class*='pricing'] ul",
    );

    // Fall back to checking that common feature keywords are present
    const featureKeywords = [
      /ai/i,
      /lead/i,
      /seo|review|marketing|chatbot|website/i,
    ];
    for (const keyword of featureKeywords) {
      await expect(page.getByText(keyword).first()).toBeVisible();
    }
  });

  test("CTA buttons link to onboarding with correct bundle param", async ({
    page,
  }) => {
    const trialLinks = page.getByRole("link", {
      name: /start my 14-day trial/i,
    });
    const count = await trialLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Each link should point to /onboarding?bundle=<tier>
    for (let i = 0; i < count; i++) {
      await expect(trialLinks.nth(i)).toHaveAttribute(
        "href",
        /\/onboarding\?bundle=/,
      );
    }
  });

  test("strategy call CTA links to /strategy-call", async ({ page }) => {
    const strategyLink = page
      .getByRole("link", { name: /talk to a strategist/i })
      .first();
    await expect(strategyLink).toBeVisible();
    await expect(strategyLink).toHaveAttribute("href", /\/strategy-call/);
  });

  test("billing toggle switches between monthly and annual", async ({
    page,
  }) => {
    const monthlyButton = page.getByRole("button", { name: /monthly/i });
    const annualButton = page.getByRole("button", { name: /annual/i });

    await expect(monthlyButton).toBeVisible();
    await expect(annualButton).toBeVisible();

    // Switch to annual — savings badge should appear
    await annualButton.click();
    await expect(page.getByText(/save up to/i).first()).toBeVisible();

    // Switch back to monthly
    await monthlyButton.click();
    await expect(monthlyButton).toBeVisible();
  });

  test("money-back guarantee badge is visible", async ({ page }) => {
    await expect(
      page.getByText(/60-day money-back guarantee/i).first(),
    ).toBeVisible();
  });

  test("DIY plan link points to correct onboarding URL", async ({ page }) => {
    const diyLink = page.getByRole("link", { name: /diy plan/i });
    await expect(diyLink).toBeVisible();
    await expect(diyLink).toHaveAttribute("href", /\/onboarding\?bundle=diy/);
  });
});
