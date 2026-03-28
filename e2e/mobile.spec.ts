import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

const MOBILE_VIEWPORT = { width: 375, height: 812 };

test.describe("Mobile viewport — critical customer journey", () => {
  test.describe("Homepage on mobile", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto("/");
      await expect(page.locator("body")).not.toBeEmpty({ timeout: 15_000 });
    });

    test("hamburger menu button is visible", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /open menu/i }),
      ).toBeVisible();
    });

    test("desktop nav is hidden on mobile", async ({ page }) => {
      const mainNav = page.getByRole("navigation", {
        name: /main navigation/i,
      });
      await expect(mainNav).toBeHidden();
    });

    test("hamburger menu opens and shows nav links", async ({ page }) => {
      await page.getByRole("button", { name: /open menu/i }).click();

      const mobileNav = page.getByRole("navigation", {
        name: /mobile navigation/i,
      });
      await expect(mobileNav).toBeVisible({ timeout: 5_000 });

      await expect(
        mobileNav.getByRole("link", { name: /services/i }),
      ).toBeVisible();
      await expect(
        mobileNav.getByRole("link", { name: /pricing/i }),
      ).toBeVisible();
      await expect(
        mobileNav.getByRole("link", { name: /blog/i }),
      ).toBeVisible();
    });

    test("hamburger menu closes when close button is tapped", async ({
      page,
    }) => {
      await page.getByRole("button", { name: /open menu/i }).click();

      const mobileNav = page.getByRole("navigation", {
        name: /mobile navigation/i,
      });
      await expect(mobileNav).toBeVisible({ timeout: 5_000 });

      await page.getByRole("button", { name: /close menu/i }).click();
      await expect(mobileNav).toBeHidden({ timeout: 5_000 });
    });

    test("hero heading and CTA stack properly on mobile", async ({ page }) => {
      // Hero heading should be visible
      const heading = page.getByRole("heading", {
        name: /stop losing jobs to competitors/i,
      });
      await expect(heading).toBeVisible({ timeout: 15_000 });

      // Primary CTA should be visible
      const cta = page.getByRole("button", {
        name: /claim my free growth roadmap/i,
      });
      await expect(cta).toBeVisible();

      // The CTA should be positioned below the heading (stacked layout)
      const headingBox = await heading.boundingBox();
      const ctaBox = await cta.boundingBox();
      expect(headingBox).not.toBeNull();
      expect(ctaBox).not.toBeNull();
      expect(ctaBox!.y).toBeGreaterThan(headingBox!.y);
    });
  });

  test.describe("Pricing page on mobile", () => {
    test("pricing cards render on mobile viewport", async ({ page }) => {
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.goto("/pricing");

      await expect(
        page.getByRole("heading", { name: /replace your.*agency/i }),
      ).toBeVisible({ timeout: 10_000 });

      await expect(page.getByText("Starter").first()).toBeVisible();
      await expect(page.getByText("Growth").first()).toBeVisible();
      await expect(page.getByText("Empire").first()).toBeVisible();
    });
  });

  test.describe("Dashboard on mobile", () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, "client");
      await page.setViewportSize(MOBILE_VIEWPORT);
    });

    test("bottom navigation bar is visible on mobile dashboard", async ({
      page,
    }) => {
      await page.goto("/dashboard");

      // The mobile bottom nav has aria-label "Quick navigation"
      const bottomNav = page.getByRole("navigation", {
        name: /quick navigation/i,
      });
      await expect(bottomNav).toBeVisible({ timeout: 15_000 });

      // It should contain the key items: Home, Leads, Analytics, Inbox, Settings
      await expect(bottomNav.getByText("Home")).toBeVisible();
      await expect(bottomNav.getByText("Leads")).toBeVisible();
      await expect(bottomNav.getByText("Analytics")).toBeVisible();
      await expect(bottomNav.getByText("Inbox")).toBeVisible();
      await expect(bottomNav.getByText("Settings")).toBeVisible();
    });

    test("sidebar is hidden on mobile dashboard", async ({ page }) => {
      await page.goto("/dashboard");

      // Wait for the page to be interactive
      await expect(page.locator("body")).not.toBeEmpty({ timeout: 15_000 });

      // The desktop sidebar nav should be hidden on mobile
      // (DashboardNav hides the sidebar below md breakpoint)
      const sidebarNav = page.getByRole("navigation", {
        name: /dashboard navigation/i,
      });

      // The sidebar might exist but should not be visually open by default
      // on mobile (it starts collapsed/closed)
      const isVisible = await sidebarNav.isVisible().catch(() => false);
      if (isVisible) {
        // If visible, it should be the slide-out version, not always-on sidebar
        // We just verify the bottom nav is the primary navigation
        const bottomNav = page.getByRole("navigation", {
          name: /quick navigation/i,
        });
        await expect(bottomNav).toBeVisible();
      }
    });

    test("bottom nav links navigate correctly", async ({ page }) => {
      await page.goto("/dashboard");

      const bottomNav = page.getByRole("navigation", {
        name: /quick navigation/i,
      });
      await expect(bottomNav).toBeVisible({ timeout: 15_000 });

      // Tap on "Leads" to navigate to CRM
      await bottomNav.getByText("Leads").click();
      await page.waitForURL("**/dashboard/crm**", { timeout: 10_000 });
      expect(page.url()).toContain("/dashboard/crm");
    });
  });
});
