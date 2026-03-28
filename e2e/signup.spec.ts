import { test, expect } from "@playwright/test";

test.describe("Signup flow", () => {
  test("completes signup and shows Check Your Email message", async ({ page }) => {
    // Mock the signup endpoint to return success
    await page.route("**/api/auth/signup-free", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      }),
    );

    await page.goto("/signup");

    // Verify the page heading is visible
    await expect(
      page.getByRole("heading", { name: /start getting more leads/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Fill out the required fields using their labels
    await page.getByLabel(/your name/i).fill("Jane Doe");
    await page.getByLabel(/email address/i).fill("jane@testbusiness.com");
    await page.getByLabel(/business name/i).fill("Jane's Plumbing");
    await page.getByLabel(/industry/i).selectOption("plumbing");

    // Submit the form
    await page
      .getByRole("button", { name: /activate my free trial/i })
      .click();

    // Verify the success screen appears
    await expect(
      page.getByRole("heading", { name: /check your email/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Verify the email address is shown in the success message
    await expect(page.getByText("jane@testbusiness.com")).toBeVisible();
  });

  test("shows error message on failed signup", async ({ page }) => {
    // Mock the signup endpoint to return an error
    await page.route("**/api/auth/signup-free", (route) =>
      route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({ error: "Email already registered" }),
      }),
    );

    await page.goto("/signup");

    await expect(
      page.getByRole("heading", { name: /start getting more leads/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Fill out the required fields
    await page.getByLabel(/your name/i).fill("Jane Doe");
    await page.getByLabel(/email address/i).fill("existing@test.com");
    await page.getByLabel(/business name/i).fill("Existing Co");
    await page.getByLabel(/industry/i).selectOption("plumbing");

    // Submit the form
    await page
      .getByRole("button", { name: /activate my free trial/i })
      .click();

    // Verify the error message is displayed
    await expect(
      page.getByRole("alert").filter({ hasText: /email already registered/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
