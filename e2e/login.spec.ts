import { test, expect } from "@playwright/test";

test.describe("Login flow", () => {
  test("submits email and redirects to check-email page", async ({ page }) => {
    // Mock the magic link endpoint to return success
    await page.route("**/api/auth/send-magic-link", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      }),
    );

    await page.goto("/login");

    // Verify the page heading is visible
    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Fill out the email field
    await page.getByLabel(/email address/i).fill("demo@smithplumbing.com");

    // Submit the form
    await page
      .getByRole("button", { name: /send sign-in link/i })
      .click();

    // Verify redirect to /login/check-email
    await page.waitForURL("**/login/check-email**", { timeout: 10_000 });
    expect(page.url()).toContain("/login/check-email");
  });

  test("shows error message on rate limit (429)", async ({ page }) => {
    // Mock the magic link endpoint to return 429
    await page.route("**/api/auth/send-magic-link", (route) =>
      route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({ error: "Too many requests" }),
      }),
    );

    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Fill out the email field
    await page.getByLabel(/email address/i).fill("demo@smithplumbing.com");

    // Submit the form
    await page
      .getByRole("button", { name: /send sign-in link/i })
      .click();

    // Verify error message is shown (the component shows a generic error for non-ok responses)
    await expect(
      page.getByRole("alert").filter({
        hasText: /couldn.t send the sign-in link/i,
      }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
