import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Admin panel", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("admin overview page loads", async ({ page }) => {
    await page.goto("/admin");

    // The admin overview has a heading "Overview"
    await expect(
      page.getByRole("heading", { name: /overview/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Verify the description text is present
    await expect(
      page.getByText(/business performance at a glance/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("admin clients page loads and shows seed data", async ({ page }) => {
    await page.goto("/admin/clients");

    // The clients page has a heading "Clients"
    await expect(
      page.getByRole("heading", { name: /clients/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Verify the description text
    await expect(
      page.getByText(/manage all client accounts/i),
    ).toBeVisible({ timeout: 10_000 });

    // Verify the search input is present
    await expect(
      page.getByPlaceholder(/search by name or email/i),
    ).toBeVisible();

    // Look for "Smith Plumbing" from seed data in the clients table.
    // The table may take a moment to load via the API call.
    await expect(
      page.getByRole("link", { name: /smith plumbing/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("non-admin user sees access denied on admin pages", async ({
    page,
  }) => {
    // Log in as a regular client
    await loginAs(page, "client");

    await page.goto("/admin");

    // The admin layout shows "Access Denied" for non-admin users
    await expect(
      page.getByRole("heading", { name: /access denied/i }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
