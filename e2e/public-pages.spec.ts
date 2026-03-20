import { test, expect } from "@playwright/test";

const PUBLIC_PAGES = [
  { path: "/", title: "Homepage" },
  { path: "/about", title: "About" },
  { path: "/products", title: "Products" },
  { path: "/blog", title: "Blog" },
  { path: "/faq", title: "FAQ" },
  { path: "/find-a-pro", title: "Find a Pro" },
  { path: "/knowledge", title: "Knowledge Base" },
  { path: "/guarantee", title: "Guarantee" },
  { path: "/legal", title: "Legal" },
  { path: "/changelog", title: "Changelog" },
];

for (const { path, title } of PUBLIC_PAGES) {
  test(`${title} (${path}) loads without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const response = await page.goto(path);

    expect(response?.status()).toBeLessThan(400);
    expect(errors).toHaveLength(0);

    // Page should have rendered meaningful content
    await expect(page.locator("body")).not.toBeEmpty();
  });
}
