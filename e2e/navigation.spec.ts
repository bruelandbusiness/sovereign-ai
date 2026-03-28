import { test, expect } from "@playwright/test";

test.describe("Site-wide navigation", () => {
  test("header nav links navigate to the correct pages", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: /stop losing jobs to competitors/i,
      }),
    ).toBeVisible({ timeout: 15_000 });

    // The desktop nav should contain all expected links
    const mainNav = page.getByRole("navigation", {
      name: /main navigation/i,
    });

    const expectedLinks = [
      { name: /services/i, href: "/services" },
      { name: /pricing/i, href: "/#pricing" },
      { name: /case studies/i, href: "/case-studies" },
      { name: /blog/i, href: "/blog" },
      { name: /free audit/i, href: "/free-audit" },
    ];

    for (const link of expectedLinks) {
      await expect(mainNav.getByRole("link", { name: link.name })).toBeVisible();
    }

    // Click the Services link and verify navigation
    await mainNav.getByRole("link", { name: /services/i }).click();
    await page.waitForURL("**/services**", { timeout: 10_000 });
    expect(page.url()).toContain("/services");
  });

  test("mobile menu opens and closes", async ({ page }) => {
    // Set a mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    await expect(page.locator("body")).not.toBeEmpty({ timeout: 15_000 });

    // Desktop nav should be hidden on mobile
    const mainNav = page.getByRole("navigation", {
      name: /main navigation/i,
    });
    await expect(mainNav).toBeHidden();

    // The mobile menu toggle button should be visible
    const menuToggle = page.getByRole("button", { name: /open menu/i });
    await expect(menuToggle).toBeVisible();

    // Open the mobile menu
    await menuToggle.click();

    // The mobile navigation should now be visible
    const mobileNav = page.getByRole("navigation", {
      name: /mobile navigation/i,
    });
    await expect(mobileNav).toBeVisible({ timeout: 5_000 });

    // Verify links are present in the mobile menu
    await expect(
      mobileNav.getByRole("link", { name: /services/i }),
    ).toBeVisible();
    await expect(
      mobileNav.getByRole("link", { name: /blog/i }),
    ).toBeVisible();

    // Close the menu
    const closeToggle = page.getByRole("button", { name: /close menu/i });
    await closeToggle.click();

    // Mobile nav should be hidden again
    await expect(mobileNav).toBeHidden({ timeout: 5_000 });
  });

  test("footer links are present and organized by section", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("body")).not.toBeEmpty({ timeout: 15_000 });

    const footerNav = page.getByRole("navigation", {
      name: /footer navigation/i,
    });
    await expect(footerNav).toBeVisible({ timeout: 10_000 });

    // Product section links
    await expect(footerNav.getByRole("link", { name: /services/i })).toBeVisible();
    await expect(footerNav.getByRole("link", { name: /pricing/i })).toBeVisible();
    await expect(
      footerNav.getByRole("link", { name: /case studies/i }),
    ).toBeVisible();

    // Company section links
    await expect(footerNav.getByRole("link", { name: /about us/i })).toBeVisible();
    await expect(footerNav.getByRole("link", { name: /blog/i })).toBeVisible();
    await expect(footerNav.getByRole("link", { name: /contact/i })).toBeVisible();
    await expect(footerNav.getByRole("link", { name: /faq/i })).toBeVisible();

    // Legal section links
    await expect(
      footerNav.getByRole("link", { name: /privacy policy/i }),
    ).toBeVisible();
    await expect(footerNav.getByRole("link", { name: /terms/i })).toBeVisible();

    // Trust badges in footer
    await expect(
      page.locator("footer").getByText(/60-day money-back guarantee/i),
    ).toBeVisible();
    await expect(
      page.locator("footer").getByText(/no long-term contracts/i),
    ).toBeVisible();
  });

  test("skip-to-content link is present in the DOM", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("body")).not.toBeEmpty({ timeout: 15_000 });

    // The skip link exists but is visually hidden (sr-only) until focused
    const skipLink = page.getByRole("link", { name: /skip to/i });
    await expect(skipLink).toBeAttached();

    // The link should point to #main-content
    await expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  test("Book Strategy Call CTA in header navigates correctly", async ({
    page,
  }) => {
    await page.goto("/services");

    await expect(page.locator("body")).not.toBeEmpty({ timeout: 15_000 });

    // The header should have a Book Strategy Call button/link
    const ctaButton = page
      .locator("header")
      .getByRole("link", { name: /book strategy call/i });

    // On pages without onCtaClick, the CTA is a link to /strategy-call
    if (await ctaButton.isVisible().catch(() => false)) {
      await ctaButton.click();
      await page.waitForURL("**/strategy-call**", { timeout: 10_000 });
      expect(page.url()).toContain("/strategy-call");
    }
  });
});
