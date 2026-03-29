import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Public page flows — deeper interaction tests for pages not fully covered
// by existing E2E specs (contact-form, blog, public-pages, smoke, etc.).
// ---------------------------------------------------------------------------

test.describe("Contact form submission", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the /api/contact endpoint so tests are deterministic
    await page.route("**/api/contact", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      }),
    );

    await page.goto("/contact");
    await expect(
      page.getByRole("heading", { name: /get in touch/i }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("contact form validates required fields on empty submit", async ({
    page,
  }) => {
    // Click Send without filling anything
    await page.getByRole("button", { name: /send message/i }).click();

    // Validation errors for required fields
    await expect(page.getByText(/name is required/i)).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/please select a subject/i)).toBeVisible();
    await expect(page.getByText(/message is required/i)).toBeVisible();
  });

  test("contact form submits successfully and shows confirmation", async ({
    page,
  }) => {
    // Fill all required fields
    await page.getByLabel(/name/i).first().fill("John Smith");
    await page.getByLabel(/email/i).first().fill("john@example.com");
    await page.locator("select#contact-subject").selectOption("General");
    await page
      .getByLabel(/message/i)
      .fill("I would like to learn more about your AI marketing services.");

    // Submit
    await page.getByRole("button", { name: /send message/i }).click();

    // Success state
    await expect(
      page.getByRole("heading", { name: /message sent/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText(/our team will respond within 4 hours/i),
    ).toBeVisible();
  });
});

test.describe("Blog post navigation flow", () => {
  test("clicking a blog post from listing navigates to the full article", async ({
    page,
  }) => {
    await page.goto("/blog");
    await expect(
      page.getByRole("heading", { name: /blog/i }).first(),
    ).toBeVisible({ timeout: 15_000 });

    // Find the first blog post link that matches known seed content
    const firstPostLink = page
      .getByRole("link", {
        name: /hvac|plumbing|roofing|contractor|lead|marketing|review|ai/i,
      })
      .first();
    await expect(firstPostLink).toBeVisible();

    // Capture the link text so we can verify it appears on the detail page
    const linkText = await firstPostLink.textContent();

    // Click through to the post
    await firstPostLink.click();
    await page.waitForURL("**/blog/**", { timeout: 10_000 });

    // The post detail page should have the article heading
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible({ timeout: 15_000 });

    // "All Posts" back link should be present for return navigation
    await expect(
      page.getByRole("link", { name: /all posts/i }),
    ).toBeVisible();
  });
});

test.describe("Competitor comparison pages", () => {
  test("Scorpion comparison page renders hero and comparison table", async ({
    page,
  }) => {
    await page.goto("/vs/scorpion");

    // Hero heading with competitor name
    await expect(
      page.getByRole("heading", { name: /scorpion.*vs.*sovereign ai/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Comparison table region with feature rows
    const tableRegion = page.locator(
      '[role="region"][aria-label*="comparison"]',
    );
    await expect(tableRegion).toBeVisible();

    // Table headers: Feature, Sovereign AI, Scorpion
    const table = tableRegion.locator("table");
    await expect(table.locator("th", { hasText: /feature/i })).toBeVisible();
    await expect(
      table.locator("th", { hasText: /sovereign ai/i }),
    ).toBeVisible();
    await expect(
      table.locator("th", { hasText: /scorpion/i }),
    ).toBeVisible();

    // At least several feature rows should render
    const rows = table.locator("tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(5);
  });

  test("Scorpion comparison page shows price cards and advantages", async ({
    page,
  }) => {
    await page.goto("/vs/scorpion");

    await expect(
      page.getByRole("heading", { name: /scorpion.*vs.*sovereign ai/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Price comparison section
    await expect(
      page.getByRole("heading", { name: /price comparison/i }),
    ).toBeVisible();

    // Competitor price card
    await expect(page.getByText(/\$2,000/)).toBeVisible();

    // Sovereign price card
    await expect(page.getByText(/\$3,497/)).toBeVisible();

    // Advantages section
    await expect(
      page.getByRole("heading", { name: /why businesses switch/i }),
    ).toBeVisible();
  });
});

test.describe("Knowledge base", () => {
  test("knowledge base loads categories and articles", async ({ page }) => {
    // Mock the /api/knowledge endpoint
    await page.route("**/api/knowledge", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          categories: [
            {
              id: "getting-started",
              label: "Getting Started",
              icon: "rocket",
              articles: [
                {
                  id: "1",
                  slug: "account-setup",
                  category: "getting-started",
                  title: "Setting Up Your Account",
                  order: 1,
                },
                {
                  id: "2",
                  slug: "first-campaign",
                  category: "getting-started",
                  title: "Launching Your First Campaign",
                  order: 2,
                },
              ],
            },
            {
              id: "billing",
              label: "Billing & Payments",
              icon: "credit-card",
              articles: [
                {
                  id: "3",
                  slug: "update-payment",
                  category: "billing",
                  title: "Updating Payment Methods",
                  order: 1,
                },
              ],
            },
          ],
          articles: [
            {
              id: "1",
              slug: "account-setup",
              category: "getting-started",
              title: "Setting Up Your Account",
              order: 1,
            },
            {
              id: "2",
              slug: "first-campaign",
              category: "getting-started",
              title: "Launching Your First Campaign",
              order: 2,
            },
            {
              id: "3",
              slug: "update-payment",
              category: "billing",
              title: "Updating Payment Methods",
              order: 1,
            },
          ],
        }),
      }),
    );

    await page.goto("/knowledge");

    // Page heading
    await expect(
      page.getByRole("heading", { name: /help center/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Category sections render
    await expect(page.getByText("Getting Started")).toBeVisible();
    await expect(page.getByText("Billing & Payments")).toBeVisible();

    // Article titles render inside category sections
    await expect(page.getByText("Setting Up Your Account")).toBeVisible();
    await expect(
      page.getByText("Launching Your First Campaign"),
    ).toBeVisible();
    await expect(page.getByText("Updating Payment Methods")).toBeVisible();

    // Article count annotations
    await expect(page.getByText("(2 articles)")).toBeVisible();
    await expect(page.getByText("(1 articles)")).toBeVisible();
  });
});

test.describe("Changelog page", () => {
  test("changelog renders entries with version, date, and category badges", async ({
    page,
  }) => {
    await page.goto("/changelog");

    // Page heading
    await expect(
      page.getByRole("heading", { name: /what's new/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Filter buttons should be visible
    await expect(
      page.getByRole("button", { name: /all updates/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /features/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /improvements/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /fixes/i })).toBeVisible();

    // At least one changelog entry should be visible (known seed data)
    await expect(
      page.getByText(/ai lead scoring.*smart notifications/i),
    ).toBeVisible();

    // Version number should be displayed
    await expect(page.getByText(/v2\.8\.0/)).toBeVisible();

    // Category badge should be present
    await expect(page.getByText(/new feature/i).first()).toBeVisible();
  });

  test("changelog category filter narrows displayed entries", async ({
    page,
  }) => {
    await page.goto("/changelog");

    await expect(
      page.getByRole("heading", { name: /what's new/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Click the "Security" filter
    await page.getByRole("button", { name: /security/i }).click();

    // The security entry (v2.7.1) should be visible
    await expect(
      page.getByText(/content safety.*ai governance/i),
    ).toBeVisible();

    // A non-security entry (v2.8.0 "feature") should be hidden
    await expect(
      page.getByText(/ai lead scoring.*smart notifications/i),
    ).toBeHidden();

    // Click "All Updates" to reset
    await page.getByRole("button", { name: /all updates/i }).click();

    // Feature entry should reappear
    await expect(
      page.getByText(/ai lead scoring.*smart notifications/i),
    ).toBeVisible();
  });
});

test.describe("Status page", () => {
  test("status page renders service categories and status indicators", async ({
    page,
  }) => {
    // Mock the /api/health endpoint for deterministic output
    await page.route("**/api/health", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          overall: "operational",
          categories: [
            {
              category: "Platform",
              services: [
                {
                  name: "Website & Dashboard",
                  status: "operational",
                  description: "Main website and client dashboard",
                  responseTime: 120,
                },
                {
                  name: "API",
                  status: "operational",
                  description: "REST API and integrations",
                  responseTime: 45,
                },
              ],
            },
            {
              category: "Email",
              services: [
                {
                  name: "Transactional Email",
                  status: "operational",
                  description: "Notifications and system emails",
                  responseTime: 200,
                },
              ],
            },
          ],
          uptime: 99.95,
          uptimeHistory: Array.from({ length: 30 }, () => 99.9),
          lastChecked: new Date().toISOString(),
          incidents: [],
        }),
      }),
    );

    await page.goto("/status");

    // Page heading
    await expect(
      page.getByRole("heading", { name: /system status/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Overall status banner
    await expect(
      page.getByText(/all systems operational/i),
    ).toBeVisible({ timeout: 10_000 });

    // Category sections render with service names
    await expect(page.getByText("Platform").first()).toBeVisible();
    await expect(page.getByText("Website & Dashboard")).toBeVisible();
    await expect(page.getByText("API").first()).toBeVisible();
    await expect(page.getByText("Transactional Email")).toBeVisible();

    // Status indicators (green "Operational" labels)
    const operationalLabels = page.getByText("Operational", { exact: true });
    const opCount = await operationalLabels.count();
    expect(opCount).toBeGreaterThanOrEqual(3);

    // Uptime percentage displayed
    await expect(page.getByText(/99\.9%/)).toBeVisible();
  });
});

test.describe("Help center categories", () => {
  test("help center displays category cards with article counts", async ({
    page,
  }) => {
    await page.goto("/help");

    await expect(
      page.getByRole("heading", { name: /how can we help/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Category cards should be visible
    await expect(page.getByText("Getting Started")).toBeVisible();
    await expect(page.getByText("Billing & Payments")).toBeVisible();
    await expect(page.getByText("Services & Features")).toBeVisible();
    await expect(page.getByText("API & Integrations")).toBeVisible();
    await expect(page.getByText("Troubleshooting")).toBeVisible();

    // Article counts
    await expect(page.getByText("8 articles")).toBeVisible();
    await expect(page.getByText("12 articles")).toBeVisible();

    // FAQ section
    await expect(
      page.getByRole("heading", { name: /frequently asked questions/i }),
    ).toBeVisible();

    // "Still need help?" CTA
    await expect(
      page.getByRole("heading", { name: /still need help/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /contact support/i }),
    ).toBeVisible();
  });
});
