import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

let mockPathname = "/dashboard/crm";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("lucide-react", () => ({
  LayoutDashboard: (props: any) => (
    <span data-testid="icon-dashboard" {...props} />
  ),
}));

import { Breadcrumbs } from "./Breadcrumbs";

describe("Breadcrumbs", () => {
  it("renders breadcrumb nav with aria-label", () => {
    mockPathname = "/dashboard/crm";
    render(<Breadcrumbs />);

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(nav).toBeTruthy();
  });

  it("always renders Dashboard as the first crumb", () => {
    mockPathname = "/dashboard/crm";
    render(<Breadcrumbs />);

    const dashLink = screen.getByText("Dashboard");
    expect(dashLink).toBeTruthy();
    expect(dashLink.closest("a")?.getAttribute("href")).toBe("/dashboard");
  });

  it("renders the current page segment as text (not a link)", () => {
    mockPathname = "/dashboard/crm";
    render(<Breadcrumbs />);

    const crmText = screen.getByText("CRM");
    expect(crmText).toBeTruthy();
    expect(crmText.closest("a")).toBeNull();
  });

  it("renders intermediate segments as links", () => {
    mockPathname = "/dashboard/settings/account";
    render(<Breadcrumbs />);

    const settingsLink = screen.getByText("Settings");
    expect(settingsLink.closest("a")).toBeTruthy();
    expect(settingsLink.closest("a")?.getAttribute("href")).toBe(
      "/dashboard/settings"
    );

    const accountText = screen.getByText("Account");
    expect(accountText.closest("a")).toBeNull();
  });

  it("returns null when pathname is /dashboard", () => {
    mockPathname = "/dashboard";
    const { container } = render(<Breadcrumbs />);

    expect(container.innerHTML).toBe("");
  });

  it("returns null when pathname is null", () => {
    mockPathname = null as any;
    const { container } = render(<Breadcrumbs />);

    expect(container.innerHTML).toBe("");
  });

  it("formats segment labels from the segmentLabels map", () => {
    mockPathname = "/dashboard/voice";
    render(<Breadcrumbs />);

    expect(screen.getByText("Voice Agent")).toBeTruthy();
  });

  it("formats unknown segments with title case and hyphen replacement", () => {
    mockPathname = "/dashboard/custom-page";
    render(<Breadcrumbs />);

    expect(screen.getByText("Custom Page")).toBeTruthy();
  });

  it("renders separator between crumbs", () => {
    mockPathname = "/dashboard/crm";
    render(<Breadcrumbs />);

    expect(screen.getByText("/")).toBeTruthy();
  });

  it("renders the dashboard icon", () => {
    mockPathname = "/dashboard/crm";
    render(<Breadcrumbs />);

    expect(screen.getByTestId("icon-dashboard")).toBeTruthy();
  });
});
