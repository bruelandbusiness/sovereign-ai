import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Dashboard flows — extended user journeys", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "client");
  });

  // -----------------------------------------------------------------------
  // 1. Dashboard loading — activity feed visible
  // -----------------------------------------------------------------------
  test("activity feed renders on the overview tab", async ({ page }) => {
    await page.goto("/dashboard");

    // Switch to the Activity tab to isolate the feed
    const activityTab = page.getByRole("tab", { name: /activity/i });
    await expect(activityTab).toBeVisible({ timeout: 15_000 });
    await activityTab.click();

    // The ActivityFeed component should render (loading or populated)
    await expect(
      page.getByText(/activity|recent|no activity/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  // -----------------------------------------------------------------------
  // 2. Dashboard loading — subscription card in sidebar
  // -----------------------------------------------------------------------
  test("sidebar shows subscription card", async ({ page }) => {
    await page.goto("/dashboard");

    const sidebar = page.getByRole("complementary", {
      name: /account summary/i,
    });
    await expect(sidebar).toBeVisible({ timeout: 15_000 });

    // Subscription card or active-services card should be present
    await expect(
      sidebar.locator("[class*='card']").first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  // -----------------------------------------------------------------------
  // 3. Service navigation — click services tab, see service cards
  // -----------------------------------------------------------------------
  test("services tab shows service cards with status badges", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const servicesTab = page.getByRole("tab", { name: /services/i });
    await expect(servicesTab).toBeVisible({ timeout: 15_000 });
    await servicesTab.click();

    // Heading within the services tab content
    await expect(
      page.getByRole("heading", { name: /your ai services/i }),
    ).toBeVisible({ timeout: 10_000 });

    // At least one service card should be present
    await expect(
      page.getByText(/active|inactive|configuring/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  // -----------------------------------------------------------------------
  // 4. Service navigation — navigate to dedicated services page
  // -----------------------------------------------------------------------
  test("dedicated services page loads and shows heading", async ({ page }) => {
    await page.goto("/dashboard/services");

    await expect(
      page.getByRole("heading", { name: /your ai services/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  // -----------------------------------------------------------------------
  // 5. Settings page — account settings form fields render
  // -----------------------------------------------------------------------
  test("settings/account page shows profile form fields", async ({ page }) => {
    await page.goto("/dashboard/settings/account");

    // Heading
    await expect(
      page.getByRole("heading", { name: /account settings/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Key profile form fields should be present
    await expect(
      page.getByText(/business name|owner name|email|phone/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  // -----------------------------------------------------------------------
  // 6. Settings page — settings redirects to account sub-page
  // -----------------------------------------------------------------------
  test("/dashboard/settings redirects to /dashboard/settings/account", async ({
    page,
  }) => {
    await page.goto("/dashboard/settings");

    await page.waitForURL("**/settings/account**", { timeout: 10_000 });
    expect(page.url()).toContain("/settings/account");
  });

  // -----------------------------------------------------------------------
  // 7. Notification bell — click opens notification panel
  // -----------------------------------------------------------------------
  test("clicking notification bell opens the notification panel", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // The bell button has an aria-label starting with "Notifications"
    const bellButton = page.getByRole("button", {
      name: /notifications/i,
    });
    await expect(bellButton).toBeVisible({ timeout: 15_000 });
    await bellButton.click();

    // The panel is a region with aria-label "Notifications"
    const panel = page.getByRole("region", { name: /notifications/i });
    await expect(panel).toBeVisible({ timeout: 5_000 });

    // Panel should contain a heading "Notifications"
    await expect(
      panel.getByRole("heading", { name: /notifications/i }),
    ).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // 8. Notification bell — panel has view-all link to notifications page
  // -----------------------------------------------------------------------
  test("notification panel links to full notifications page", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const bellButton = page.getByRole("button", {
      name: /notifications/i,
    });
    await expect(bellButton).toBeVisible({ timeout: 15_000 });
    await bellButton.click();

    const panel = page.getByRole("region", { name: /notifications/i });
    await expect(panel).toBeVisible({ timeout: 5_000 });

    // Look for the "View all" or "See all" link inside the panel
    const viewAllLink = panel.getByRole("link", {
      name: /view all|see all|all notifications/i,
    });
    await expect(viewAllLink).toBeVisible({ timeout: 5_000 });
    await viewAllLink.click();

    await page.waitForURL("**/notifications**", { timeout: 10_000 });
    expect(page.url()).toContain("/notifications");
  });

  // -----------------------------------------------------------------------
  // 9. Leads / CRM — /dashboard/leads redirects to CRM pipeline
  // -----------------------------------------------------------------------
  test("/dashboard/leads redirects to CRM pipeline", async ({ page }) => {
    await page.goto("/dashboard/leads");

    await page.waitForURL("**/dashboard/crm**", { timeout: 10_000 });
    expect(page.url()).toContain("/dashboard/crm");

    await expect(
      page.getByRole("heading", { name: /crm pipeline/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  // -----------------------------------------------------------------------
  // 10. Leads tab — dashboard leads tab renders the lead table
  // -----------------------------------------------------------------------
  test("leads tab on dashboard renders lead table", async ({ page }) => {
    await page.goto("/dashboard");

    const leadsTab = page.getByRole("tab", { name: /leads/i });
    await expect(leadsTab).toBeVisible({ timeout: 15_000 });
    await leadsTab.click();

    // The LeadTable should render — look for table headers or an
    // empty-state message indicating the table component loaded
    await expect(
      page
        .getByText(
          /name|source|status|no leads|generating leads|lead/i,
        )
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
