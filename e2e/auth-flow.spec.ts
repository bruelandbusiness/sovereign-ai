import { test, expect } from "@playwright/test";

test.describe("Auth flow — login and signup pages", () => {
  test.describe("Login page", () => {
    test("renders login form with heading and email input", async ({
      page,
    }) => {
      await page.goto("/login");

      await expect(
        page.getByRole("heading", { name: /welcome back/i }),
      ).toBeVisible({ timeout: 10_000 });

      await expect(page.getByLabel(/email address/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /send sign-in link/i }),
      ).toBeVisible();
    });

    test("magic link form submits and redirects to check-email", async ({
      page,
    }) => {
      // Mock the magic link API to succeed
      await page.route("**/api/auth/send-magic-link", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        }),
      );

      await page.goto("/login");

      await expect(
        page.getByRole("heading", { name: /welcome back/i }),
      ).toBeVisible({ timeout: 10_000 });

      await page.getByLabel(/email address/i).fill("test@example.com");
      await page
        .getByRole("button", { name: /send sign-in link/i })
        .click();

      await page.waitForURL("**/login/check-email**", { timeout: 10_000 });
      expect(page.url()).toContain("/login/check-email");
    });

    test("shows error on failed magic link request", async ({ page }) => {
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

      await page.getByLabel(/email address/i).fill("test@example.com");
      await page
        .getByRole("button", { name: /send sign-in link/i })
        .click();

      await expect(
        page
          .getByRole("alert")
          .filter({ hasText: /something went wrong/i }),
      ).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe("Signup page", () => {
    test.beforeEach(async ({ page }) => {
      await page.route("**/api/auth/signup-free", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        }),
      );

      await page.goto("/signup");
      await expect(
        page.getByRole("heading", { name: /start getting more leads/i }),
      ).toBeVisible({ timeout: 15_000 });
    });

    test("signup form renders with all required fields", async ({ page }) => {
      await expect(page.getByLabel(/your name/i)).toBeVisible();
      await expect(page.getByLabel(/email address/i)).toBeVisible();
      await expect(page.getByLabel(/business name/i)).toBeVisible();
      await expect(page.getByLabel(/industry/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /activate my free trial/i }),
      ).toBeVisible();
    });

    test("sign-in link navigates to login page", async ({ page }) => {
      const signInLink = page.getByRole("link", { name: /sign in/i });
      await expect(signInLink).toBeVisible();

      await signInLink.click();
      await page.waitForURL("**/login**", { timeout: 10_000 });
      expect(page.url()).toContain("/login");
    });

    test("form submits successfully and shows confirmation", async ({
      page,
    }) => {
      await page.getByLabel(/your name/i).fill("Test User");
      await page.getByLabel(/email address/i).fill("test@example.com");
      await page.getByLabel(/business name/i).fill("Test Plumbing Co");
      await page.getByLabel(/industry/i).selectOption({ index: 1 });

      await page
        .getByRole("button", { name: /activate my free trial/i })
        .click();

      await expect(
        page.getByRole("heading", { name: /check your email/i }),
      ).toBeVisible({ timeout: 10_000 });
    });

    test("inline validation triggers on empty fields", async ({ page }) => {
      const nameInput = page.getByLabel(/your name/i);
      await nameInput.focus();
      await nameInput.blur();

      await expect(page.getByText("Name is required")).toBeVisible({
        timeout: 5_000,
      });
    });
  });
});
