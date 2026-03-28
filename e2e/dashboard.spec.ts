import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Dashboard — critical customer journey", () => {
  test("unauthenticated users are redirected to /login", async ({ page }) => {
    // Do NOT set any session cookie — middleware should redirect
    await page.goto("/dashboard");

    await page.waitForURL("**/login**", { timeout: 10_000 });
    expect(page.url()).toContain("/login");

    // The redirect URL should include a ?redirect=/dashboard param
    expect(page.url()).toContain("redirect=%2Fdashboard");
  });

  test.describe("Authenticated dashboard", () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, "client");
    });

    test("dashboard layout has sidebar navigation", async ({ page }) => {
      await page.goto("/dashboard");

      // The sidebar nav has aria-label "Dashboard navigation"
      const sidebarNav = page.getByRole("navigation", {
        name: /dashboard navigation/i,
      });
      await expect(sidebarNav).toBeVisible({ timeout: 15_000 });

      // Sidebar should contain key nav items
      await expect(
        sidebarNav.getByRole("link", { name: /home|overview|dashboard/i }).first(),
      ).toBeVisible();
    });

    test("KPI section renders with cards", async ({ page }) => {
      await page.goto("/dashboard");

      // The KPIGrid renders inside a section with aria-label
      const kpiSection = page.getByLabel(/key performance indicators/i);
      await expect(kpiSection).toBeVisible({ timeout: 15_000 });

      // At least one KPI card should be present (may show loading/placeholder state)
      await expect(
        kpiSection.locator("[class*='card']").first(),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("overview tab is visible on dashboard", async ({ page }) => {
      await page.goto("/dashboard");

      await expect(
        page.getByRole("tab", { name: /overview/i }),
      ).toBeVisible({ timeout: 15_000 });
    });

    test("monthly lead goal section is present", async ({ page }) => {
      await page.goto("/dashboard");

      await expect(page.getByLabel(/monthly lead goal/i)).toBeVisible({
        timeout: 15_000,
      });
    });

    test("CRM page loads and shows pipeline heading", async ({ page }) => {
      await page.goto("/dashboard/crm");

      await expect(
        page.getByRole("heading", { name: /crm pipeline/i }),
      ).toBeVisible({ timeout: 15_000 });

      await expect(
        page.getByLabel(/pipeline statistics/i),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("services page loads", async ({ page }) => {
      await page.goto("/dashboard/services");

      await expect(
        page.getByRole("heading", { name: /your ai services/i }),
      ).toBeVisible({ timeout: 15_000 });
    });
  });
});
