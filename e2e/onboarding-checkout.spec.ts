import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

const FAKE_CHECKOUT_URL = "https://checkout.stripe.com/c/pay_test_abc123";

test.describe("Onboarding checkout flow with starter bundle", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "client");

    // Clear onboarding localStorage so each test starts fresh
    await page.addInitScript(() => {
      localStorage.removeItem("sovereign-onboarding-v2");
    });
  });

  test("completes full onboarding flow and redirects to Stripe checkout", async ({
    page,
  }) => {
    // Mock the onboarding API to return a fake Stripe checkout URL
    await page.route("**/api/onboarding", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ checkout_url: FAKE_CHECKOUT_URL }),
      }),
    );

    // -----------------------------------------------------------------------
    // Navigate to onboarding with starter bundle pre-selected
    // -----------------------------------------------------------------------
    await page.goto("/onboarding?bundle=starter");

    // -----------------------------------------------------------------------
    // Step 1: Business Info
    // -----------------------------------------------------------------------
    await expect(
      page.getByRole("heading", {
        name: /let.s get your ai marketing running/i,
      }),
    ).toBeVisible({ timeout: 15_000 });

    await page.getByLabel(/business name/i).fill("Acme Plumbing Co");
    await page.getByLabel(/contact name/i).fill("Jane Doe");
    await page.getByLabel(/^email/i).fill("jane@acmeplumbing.com");
    await page.getByLabel(/phone/i).fill("(555) 123-4567");
    await page.getByLabel(/^city/i).fill("Austin");
    await page.getByLabel(/^state/i).fill("TX");

    // Select industry via custom Select component
    await page.getByRole("combobox", { name: /industry/i }).click();
    await page
      .getByRole("option", { name: /plumbing/i })
      .first()
      .click();

    // Advance to Step 2
    await page.getByRole("button", { name: /next/i }).click();

    // -----------------------------------------------------------------------
    // Step 2: Service Selection (starter bundle should be pre-selected)
    // -----------------------------------------------------------------------
    await expect(
      page.getByRole("heading", { name: /select your services/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Verify starter bundle services are pre-selected:
    // lead-gen, reviews, booking
    const leadGenSwitch = page.getByRole("switch", {
      name: /toggle ai lead generation/i,
    });
    const reviewsSwitch = page.getByRole("switch", {
      name: /toggle ai review management/i,
    });
    const bookingSwitch = page.getByRole("switch", {
      name: /toggle ai scheduling system/i,
    });

    await expect(leadGenSwitch).toBeChecked();
    await expect(reviewsSwitch).toBeChecked();
    await expect(bookingSwitch).toBeChecked();

    // The count should show 3 services selected
    await expect(page.getByText(/3.*services selected/i)).toBeVisible();

    // Advance to Step 3
    await page.getByRole("button", { name: /next/i }).click();

    // -----------------------------------------------------------------------
    // Step 3: Details & Access (all optional)
    // -----------------------------------------------------------------------
    await expect(
      page.getByRole("heading", { name: /details.*access/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Fill some optional fields
    await page.getByLabel(/average job value/i).fill("$8,000");
    await page.getByLabel(/monthly marketing budget/i).fill("$3,000");

    // Select a marketing activity
    await page.getByRole("button", { name: /^Google Ads$/i }).click();

    // Set GBP status
    await page.getByRole("button", { name: /^Active$/i }).click();

    // Fill account access fields
    await page
      .getByLabel(/google business profile email/i)
      .fill("acme-gbp@gmail.com");
    await page
      .getByLabel(/google analytics email/i)
      .fill("acme-analytics@gmail.com");

    // Advance to summary
    await page
      .getByRole("button", { name: /review.*submit/i })
      .click();

    // -----------------------------------------------------------------------
    // Summary Page: verify displayed information
    // -----------------------------------------------------------------------
    await expect(
      page.getByRole("heading", { name: /review your/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Business info
    await expect(page.getByText("Acme Plumbing Co")).toBeVisible();
    await expect(page.getByText("Jane Doe")).toBeVisible();
    await expect(page.getByText("jane@acmeplumbing.com")).toBeVisible();
    await expect(page.getByText("Austin, TX")).toBeVisible();
    await expect(page.getByText("Plumbing")).toBeVisible();

    // Selected services should be listed
    await expect(page.getByText("AI Lead Generation")).toBeVisible();
    await expect(page.getByText("AI Review Management")).toBeVisible();
    await expect(page.getByText("AI Scheduling System")).toBeVisible();

    // Account access info
    await expect(page.getByText("acme-gbp@gmail.com")).toBeVisible();
    await expect(page.getByText("acme-analytics@gmail.com")).toBeVisible();

    // Confirm & Submit button should be present
    const confirmButton = page.getByRole("button", {
      name: /confirm.*submit/i,
    });
    await expect(confirmButton).toBeVisible();

    // -----------------------------------------------------------------------
    // Submit and verify Stripe redirect
    // -----------------------------------------------------------------------
    // Intercept navigation to the Stripe checkout URL
    const navigationPromise = page.waitForURL(
      (url) => url.href.startsWith("https://checkout.stripe.com"),
      { timeout: 10_000 },
    ).catch(() => null);

    // Also listen for the request to verify it was made correctly
    const apiRequestPromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/onboarding") && req.method() === "POST",
    );

    await confirmButton.click();

    // Verify the API request was made
    const apiRequest = await apiRequestPromise;
    const requestBody = JSON.parse(apiRequest.postData() ?? "{}");

    // Verify request contains the correct business info
    expect(requestBody.step1.businessName).toBe("Acme Plumbing Co");
    expect(requestBody.step1.email).toBe("jane@acmeplumbing.com");

    // Verify request contains the starter bundle services
    expect(requestBody.step3.selectedServices).toContain("lead-gen");
    expect(requestBody.step3.selectedServices).toContain("reviews");
    expect(requestBody.step3.selectedServices).toContain("booking");

    // Verify the app attempted to navigate to the Stripe checkout URL.
    // Because Playwright will actually try to navigate, we check the URL
    // changed (or would change) to the checkout URL. Since it is an
    // external URL that won't load in the test, we verify via the
    // window.location.href assignment by checking the page URL.
    await navigationPromise;
    expect(page.url()).toContain("checkout.stripe.com");
  });
});

test.describe("Onboarding validation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "client");

    await page.addInitScript(() => {
      localStorage.removeItem("sovereign-onboarding-v2");
    });
  });

  test("shows validation errors when submitting Step 1 with empty required fields", async ({
    page,
  }) => {
    await page.goto("/onboarding");

    await expect(
      page.getByRole("heading", {
        name: /let.s get your ai marketing running/i,
      }),
    ).toBeVisible({ timeout: 15_000 });

    // Click Next without filling any fields
    await page.getByRole("button", { name: /next/i }).click();

    // Validation error messages should appear for required fields
    await expect(
      page.getByText(/business name is required/i),
    ).toBeVisible();
    await expect(
      page.getByText(/contact name is required/i),
    ).toBeVisible();
    await expect(page.getByText(/enter a valid email/i)).toBeVisible();
    await expect(
      page.getByText(/enter a valid phone number/i),
    ).toBeVisible();
    await expect(page.getByText(/city is required/i)).toBeVisible();
    await expect(page.getByText(/state is required/i)).toBeVisible();
    await expect(page.getByText(/select an industry/i)).toBeVisible();

    // Should still be on Step 1 (not advanced)
    await expect(
      page.getByRole("heading", {
        name: /let.s get your ai marketing running/i,
      }),
    ).toBeVisible();
  });

  test("shows error when trying to proceed from Step 2 with no services selected", async ({
    page,
  }) => {
    await page.goto("/onboarding");

    // Complete Step 1 with valid data to reach Step 2
    await page.getByLabel(/business name/i).fill("Validation Test LLC");
    await page.getByLabel(/contact name/i).fill("Bob Tester");
    await page.getByLabel(/^email/i).fill("bob@test.com");
    await page.getByLabel(/phone/i).fill("(555) 000-0000");
    await page.getByLabel(/^city/i).fill("Chicago");
    await page.getByLabel(/^state/i).fill("IL");
    await page.getByRole("combobox", { name: /industry/i }).click();
    await page
      .getByRole("option", { name: /hvac/i })
      .first()
      .click();
    await page.getByRole("button", { name: /next/i }).click();

    // Now on Step 2: Service Selection
    await expect(
      page.getByRole("heading", { name: /select your services/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Click Next without selecting any service
    await page.getByRole("button", { name: /next/i }).click();

    // Should see the inline error
    await expect(
      page.getByText(/select at least one service to continue/i),
    ).toBeVisible();

    // Should still be on Step 2
    await expect(
      page.getByRole("heading", { name: /select your services/i }),
    ).toBeVisible();
  });
});
