import { test, expect } from "@playwright/test";

test.describe("Homepage — critical customer journey", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /stop losing jobs to competitors/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("page loads without JS errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(String(err)));

    // Re-navigate so the error listener is active from the start
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /stop losing jobs to competitors/i }),
    ).toBeVisible({ timeout: 15_000 });

    expect(errors).toHaveLength(0);
  });

  test("hero section renders with heading and subheading", async ({ page }) => {
    // The main heading is already asserted in beforeEach; verify subheading too
    await expect(
      page.locator("main").getByText(/ai-powered marketing/i).first(),
    ).toBeVisible();
  });

  test("primary CTA button is visible and clickable", async ({ page }) => {
    const cta = page.getByRole("button", {
      name: /claim my free growth roadmap/i,
    });
    await expect(cta).toBeVisible();
    await expect(cta).toBeEnabled();
  });

  test("secondary CTA (strategy call) is visible", async ({ page }) => {
    // There should be a strategy call or similar secondary action link
    const secondaryCta = page
      .getByRole("link", { name: /book.*strategy.*call|strategy.*call/i })
      .first();

    // Some homepage variants use a button instead
    const ctaButton = page
      .getByRole("button", { name: /book.*strategy.*call/i })
      .first();

    const isLinkVisible = await secondaryCta.isVisible().catch(() => false);
    const isButtonVisible = await ctaButton.isVisible().catch(() => false);

    expect(isLinkVisible || isButtonVisible).toBe(true);
  });

  test("navigation links are present in header", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: /main navigation/i });

    await expect(nav.getByRole("link", { name: /services/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /pricing/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /blog/i })).toBeVisible();
    await expect(
      nav.getByRole("link", { name: /case studies/i }),
    ).toBeVisible();
  });

  test("nav links navigate to correct pages", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: /main navigation/i });

    // Navigate to services
    await nav.getByRole("link", { name: /services/i }).click();
    await page.waitForURL("**/services**", { timeout: 10_000 });
    expect(page.url()).toContain("/services");

    // Go back and navigate to blog
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /stop losing jobs to competitors/i }),
    ).toBeVisible({ timeout: 15_000 });

    await page
      .getByRole("navigation", { name: /main navigation/i })
      .getByRole("link", { name: /blog/i })
      .click();
    await page.waitForURL("**/blog**", { timeout: 10_000 });
    expect(page.url()).toContain("/blog");
  });

  test("footer renders with expected sections", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    const footerNav = page.getByRole("navigation", {
      name: /footer navigation/i,
    });
    await expect(footerNav).toBeVisible({ timeout: 10_000 });

    // Product links
    await expect(
      footerNav.getByRole("link", { name: /services/i }),
    ).toBeVisible();
    await expect(
      footerNav.getByRole("link", { name: /pricing/i }),
    ).toBeVisible();

    // Company links
    await expect(
      footerNav.getByRole("link", { name: /about us/i }),
    ).toBeVisible();
    await expect(
      footerNav.getByRole("link", { name: /contact/i }),
    ).toBeVisible();

    // Legal links
    await expect(
      footerNav.getByRole("link", { name: /privacy policy/i }),
    ).toBeVisible();
    await expect(
      footerNav.getByRole("link", { name: /terms/i }),
    ).toBeVisible();

    // Trust badges
    await expect(
      footer.getByText(/60-day money-back guarantee/i),
    ).toBeVisible();
  });

  test("social proof stats are displayed", async ({ page }) => {
    await expect(
      page.getByText(/500\+.*businesses/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/\$12M\+.*revenue/i).first(),
    ).toBeVisible();
    await expect(page.getByText(/4\.9\/5/i).first()).toBeVisible();
  });
});
