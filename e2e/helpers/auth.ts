import { Page } from "@playwright/test";

export async function loginAs(page: Page, role: "admin" | "client" | "client2") {
  const tokens: Record<string, string> = {
    admin: "admin-dev-session",
    client: "demo-dev-session",
    client2: "demo2-dev-session",
  };

  await page.context().addCookies([
    {
      name: "sovereign-session",
      value: tokens[role],
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}
