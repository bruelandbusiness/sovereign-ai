import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Client dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "client");
  });

  test("dashboard loads and displays KPI cards", async ({ page }) => {
    await page.goto("/dashboard");

    // Wait for the dashboard to finish loading (skeleton disappears, real content appears)
    // The KPIGrid renders inside a section with aria-label "Key performance indicators"
    await expect(
      page.getByLabel(/key performance indicators/i),
    ).toBeVisible({ timeout: 15_000 });

    // Verify at least one KPI card is present (look for common KPI labels)
    // The dashboard shows cards like "Leads This Month", etc.
    const kpiSection = page.getByLabel(/key performance indicators/i);
    await expect(kpiSection.locator("[class*='card']").first()).toBeVisible({
      timeout: 10_000,
    });

    // Verify the overview tab is visible
    await expect(page.getByRole("tab", { name: /overview/i })).toBeVisible();

    // Verify the lead goal section is present
    await expect(page.getByLabel(/monthly lead goal/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("CRM page loads and renders pipeline", async ({ page }) => {
    await page.goto("/dashboard/crm");

    // The CRM page has a heading "CRM Pipeline"
    await expect(
      page.getByRole("heading", { name: /crm pipeline/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Verify the pipeline statistics region is present
    await expect(
      page.getByLabel(/pipeline statistics/i),
    ).toBeVisible({ timeout: 10_000 });

    // Verify at least one pipeline stat card renders (e.g. "Total Leads")
    await expect(page.getByText(/total leads/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("services page loads and renders content", async ({ page }) => {
    await page.goto("/dashboard/services");

    // The services page has a heading "Your AI Services"
    await expect(
      page.getByRole("heading", { name: /your ai services/i }),
    ).toBeVisible({ timeout: 15_000 });

    // The page should either show active services or the empty state message
    const hasServices = await page
      .locator("a[href*='/dashboard/services/']")
      .first()
      .isVisible()
      .catch(() => false);

    if (!hasServices) {
      // Check for the empty state message
      await expect(
        page.getByText(/no services active yet/i),
      ).toBeVisible({ timeout: 10_000 });
    }
  });
});
