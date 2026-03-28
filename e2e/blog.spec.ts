import { test, expect } from "@playwright/test";

test.describe("Blog — critical customer journey", () => {
  test.describe("Blog listing page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/blog");
      await expect(
        page.getByRole("heading", { name: /blog/i }).first(),
      ).toBeVisible({ timeout: 15_000 });
    });

    test("blog listing renders with post cards", async ({ page }) => {
      // The listing uses seed posts; at least a few should render as links
      const blogLinks = page.getByRole("link", {
        name: /hvac|plumbing|roofing|contractor|lead|marketing|review|ai/i,
      });
      const count = await blogLinks.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test("post cards show titles and excerpts", async ({ page }) => {
      // Check for a known seed post title
      await expect(
        page.getByText(/hvac companies are switching/i).first(),
      ).toBeVisible();

      // Check for a known seed post excerpt snippet
      await expect(
        page.getByText(/traditional marketing agencies/i).first(),
      ).toBeVisible();
    });

    test("category labels are visible on post cards", async ({ page }) => {
      // Seed posts have category labels like "Lead Generation", "AI Marketing", etc.
      const categories = [
        /lead generation/i,
        /case study/i,
        /industry insights/i,
      ];

      let found = 0;
      for (const cat of categories) {
        const el = page.getByText(cat).first();
        if (await el.isVisible().catch(() => false)) {
          found++;
        }
      }
      expect(found).toBeGreaterThanOrEqual(2);
    });

    test("CTA section links to free audit", async ({ page }) => {
      await expect(
        page
          .getByRole("link", { name: /get my free ai marketing audit/i })
          .first(),
      ).toBeVisible();
    });
  });

  test.describe("Individual blog post page", () => {
    test("static blog post renders with content", async ({ page }) => {
      // Use a known static (seed) blog post route
      await page.goto("/blog/hvac-companies-switching-ai-marketing");

      await expect(
        page.getByRole("heading", {
          name: /hvac companies.*switching.*ai marketing/i,
        }),
      ).toBeVisible({ timeout: 15_000 });

      // Category badge should be present
      await expect(
        page.getByText(/lead generation/i).first(),
      ).toBeVisible();

      // Reading time should be visible
      await expect(page.getByText(/min read/i).first()).toBeVisible();

      // "All Posts" back link should be present
      await expect(
        page.getByRole("link", { name: /all posts/i }),
      ).toBeVisible();
    });

    test("social share buttons are visible on blog post", async ({ page }) => {
      await page.goto("/blog/hvac-companies-switching-ai-marketing");

      await expect(
        page.getByRole("heading", {
          name: /hvac companies.*switching.*ai marketing/i,
        }),
      ).toBeVisible({ timeout: 15_000 });

      // SocialShare component renders these buttons/links
      await expect(
        page.getByRole("link", { name: /share on x/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /share on linkedin/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /share on facebook/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /copy link/i }),
      ).toBeVisible();
    });

    test("share on X link has correct URL format", async ({ page }) => {
      await page.goto("/blog/hvac-companies-switching-ai-marketing");

      await expect(
        page.getByRole("heading", {
          name: /hvac companies.*switching.*ai marketing/i,
        }),
      ).toBeVisible({ timeout: 15_000 });

      const twitterLink = page.getByRole("link", { name: /share on x/i });
      await expect(twitterLink).toHaveAttribute(
        "href",
        /twitter\.com\/intent\/tweet/,
      );
    });
  });
});
