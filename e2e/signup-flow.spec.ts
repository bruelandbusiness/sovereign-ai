import { test, expect } from "@playwright/test";

test.describe("Signup page", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the signup endpoint so tests never hit a real backend
    await page.route("**/api/auth/signup-free", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      }),
    );

    await page.goto("/signup");

    // Wait for the page to be interactive
    await expect(
      page.getByRole("heading", { name: /start getting more leads/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("all form fields are present", async ({ page }) => {
    // Verify every expected input is rendered
    await expect(page.getByLabel(/your name/i)).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/business name/i)).toBeVisible();
    await expect(page.getByLabel(/industry/i)).toBeVisible();

    // Submit button should also be present
    await expect(
      page.getByRole("button", { name: /activate my free trial/i }),
    ).toBeVisible();

    // "Already have an account?" link to /login
    await expect(
      page.getByRole("link", { name: /sign in/i }),
    ).toBeVisible();
  });

  test("inline validation shows errors when empty fields are blurred", async ({
    page,
  }) => {
    // Focus then blur the name field without typing
    const nameInput = page.getByLabel(/your name/i);
    await nameInput.focus();
    await nameInput.blur();
    await expect(page.getByText("Name is required")).toBeVisible({
      timeout: 5_000,
    });

    // Focus then blur the email field without typing
    const emailInput = page.getByLabel(/email address/i);
    await emailInput.focus();
    await emailInput.blur();
    await expect(page.getByText("Email is required")).toBeVisible({
      timeout: 5_000,
    });

    // Focus then blur the business name field without typing
    const businessInput = page.getByLabel(/business name/i);
    await businessInput.focus();
    await businessInput.blur();
    await expect(page.getByText("Business name is required")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("shows validation error for invalid email format", async ({ page }) => {
    const emailInput = page.getByLabel(/email address/i);
    await emailInput.fill("not-an-email");
    await emailInput.blur();

    await expect(
      page.getByText(/please enter a valid email address/i),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("submitting with server error shows alert message", async ({
    page,
  }) => {
    // Override the route to return an error
    await page.route("**/api/auth/signup-free", (route) =>
      route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({ error: "Email already registered" }),
      }),
    );

    // Fill all fields with valid data
    await page.getByLabel(/your name/i).fill("Test User");
    await page.getByLabel(/email address/i).fill("taken@example.com");
    await page.getByLabel(/business name/i).fill("Test Co");
    await page.getByLabel(/industry/i).selectOption({ index: 1 });

    // Submit
    await page
      .getByRole("button", { name: /activate my free trial/i })
      .click();

    // The error alert should appear
    await expect(
      page.getByRole("alert").filter({ hasText: /email already registered/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("form has proper accessibility attributes", async ({ page }) => {
    // All inputs should have associated labels (tested via getByLabel succeeding)
    // Additionally verify aria-invalid and aria-describedby wiring

    const nameInput = page.getByLabel(/your name/i);
    await expect(nameInput).toHaveAttribute("autocomplete", "name");
    await expect(nameInput).toHaveAttribute("required", "");

    const emailInput = page.getByLabel(/email address/i);
    await expect(emailInput).toHaveAttribute("autocomplete", "email");
    await expect(emailInput).toHaveAttribute("type", "email");

    const businessInput = page.getByLabel(/business name/i);
    await expect(businessInput).toHaveAttribute("autocomplete", "organization");

    // Trigger an inline error and check aria-invalid is set
    await nameInput.focus();
    await nameInput.blur();
    await expect(nameInput).toHaveAttribute("aria-invalid", "true");

    // The error message element should be linked via aria-describedby
    await expect(nameInput).toHaveAttribute(
      "aria-describedby",
      "signup-name-error",
    );

    // The free trial features list should have an accessible label
    await expect(
      page.getByRole("list", { name: /free trial features/i }),
    ).toBeVisible();
  });
});
