import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Smoke tests — fast CI/CD gate (~30s)
// Run with: npx playwright test --grep @smoke
// ---------------------------------------------------------------------------

test.describe("Smoke tests @smoke", () => {
  // ── 1. Homepage loads ──────────────────────────────────────────────────
  test("homepage loads with 200 and main headline", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(String(err)));

    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    await expect(
      page.getByRole("heading", { name: /stop losing jobs to competitors/i }),
    ).toBeVisible({ timeout: 15_000 });

    expect(errors).toHaveLength(0);
  });

  // ── 2. Pricing page loads ──────────────────────────────────────────────
  test("pricing page loads with plan cards", async ({ page }) => {
    const response = await page.goto("/pricing");
    expect(response?.status()).toBe(200);

    await expect(
      page.getByRole("heading", { name: /replace your.*agency/i }),
    ).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText("Starter").first()).toBeVisible();
    await expect(page.getByText("Growth").first()).toBeVisible();
    await expect(page.getByText("Empire").first()).toBeVisible();
  });

  // ── 3. Blog index loads ────────────────────────────────────────────────
  test("blog index loads with posts", async ({ page }) => {
    const response = await page.goto("/blog");
    expect(response?.status()).toBe(200);

    await expect(
      page.getByRole("heading", { name: /blog/i }).first(),
    ).toBeVisible({ timeout: 15_000 });

    const blogLinks = page.getByRole("link", {
      name: /hvac|plumbing|roofing|contractor|lead|marketing|review|ai/i,
    });
    const count = await blogLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  // ── 4. Login page loads ────────────────────────────────────────────────
  test("login page loads with email input", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.status()).toBe(200);

    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible({ timeout: 10_000 });

    const emailInput = page.getByRole("textbox", { name: /email/i });
    await expect(emailInput).toBeVisible();
  });

  // ── 5. API health check ────────────────────────────────────────────────
  test("GET /api/health returns 200 with ok or degraded", async ({
    request,
  }) => {
    const response = await request.get("/api/health");
    const status = response.status();
    expect(status).toBe(200);

    const body = await response.json();
    expect(["ok", "degraded"]).toContain(body.status);
    expect(body.version).toBeDefined();
    expect(body.timestamp).toBeDefined();
  });

  // ── 6. API newsletter ──────────────────────────────────────────────────
  test("POST /api/newsletter with valid email returns 200", async ({
    request,
  }) => {
    const response = await request.post("/api/newsletter", {
      headers: {
        Origin: "http://localhost:3000",
      },
      data: { email: "smoke-test@example.com" },
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
  });

  // ── 7. Static assets ──────────────────────────────────────────────────
  test("static assets load from /_next/static/", async ({ page, request }) => {
    // Load the homepage to discover actual asset URLs
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Verify at least one CSS and one JS asset loaded successfully
    const cssTags = page.locator('link[rel="stylesheet"][href*="/_next/static"]');
    const cssCount = await cssTags.count();

    const jsTags = page.locator('script[src*="/_next/static"]');
    const jsCount = await jsTags.count();

    // At least one static asset should be present (CSS or JS)
    expect(cssCount + jsCount).toBeGreaterThan(0);

    // Verify a JS asset is reachable
    if (jsCount > 0) {
      const jsSrc = await jsTags.first().getAttribute("src");
      if (jsSrc) {
        const assetResponse = await request.get(jsSrc);
        expect(assetResponse.status()).toBe(200);
      }
    }
  });

  // ── 8. 404 page ────────────────────────────────────────────────────────
  test("GET /nonexistent-page-xyz returns 404 with friendly message", async ({
    page,
  }) => {
    const response = await page.goto("/nonexistent-page-xyz");
    expect(response?.status()).toBe(404);

    // The custom not-found page shows helpful links (Home, Services, etc.)
    await expect(
      page.getByRole("link", { name: /home/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── 9. Security headers ────────────────────────────────────────────────
  test("responses include security headers", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBeTruthy();
  });

  // ── 10. Robots.txt ─────────────────────────────────────────────────────
  test("GET /robots.txt returns 200 with expected content", async ({
    request,
  }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain("User-agent:");
    expect(body).toContain("Allow: /");
    expect(body).toContain("Disallow: /api/");
    expect(body).toContain("Sitemap:");
  });
});
