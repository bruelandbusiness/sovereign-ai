import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, { get: (_, tag) => tag }),
  AnimatePresence: ({ children }: any) => children,
  useReducedMotion: () => false,
}));

vi.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: { current: null }, inView: true }),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/dynamic", () => ({
  default: () => () => null,
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
}));

vi.mock("@/components/shared/FadeInView", () => ({
  FadeInView: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("lucide-react", () => ({
  UserPlus: (props: any) => <span data-testid="icon-user-plus" {...props} />,
  FileText: (props: any) => <span data-testid="icon-file-text" {...props} />,
  BarChart3: (props: any) => (
    <span data-testid="icon-bar-chart" {...props} />
  ),
  Share2: (props: any) => (
    <span data-testid="icon-share2" {...props} />
  ),
}));

import { QuickActionsBar } from "./QuickActionsBar";

describe("QuickActionsBar", () => {
  it("renders all four quick action buttons", () => {
    render(<QuickActionsBar />);

    expect(screen.getByText("Add Lead")).toBeTruthy();
    expect(screen.getByText("Create Invoice")).toBeTruthy();
    expect(screen.getByText("View Reports")).toBeTruthy();
    expect(screen.getByText("Share Dashboard")).toBeTruthy();
  });

  it("renders action descriptions", () => {
    render(<QuickActionsBar />);

    expect(screen.getByText("Capture a new contact")).toBeTruthy();
    expect(screen.getByText("Bill a customer")).toBeTruthy();
    expect(screen.getByText("See analytics")).toBeTruthy();
    expect(screen.getByText("Send a snapshot")).toBeTruthy();
  });

  it("renders correct links for link-based actions", () => {
    render(<QuickActionsBar />);

    const links = screen.getAllByRole("link");
    const hrefs = links.map((link) => link.getAttribute("href"));

    expect(hrefs).toContain("/dashboard/crm");
    expect(hrefs).toContain("/dashboard/invoices");
    expect(hrefs).toContain("/dashboard/reports");
  });

  it("renders Share Dashboard as a button (not a link)", () => {
    render(<QuickActionsBar />);

    const buttons = screen.getAllByRole("button");
    const shareButton = buttons.find((btn) =>
      btn.textContent?.includes("Share Dashboard"),
    );
    expect(shareButton).toBeTruthy();
  });

  it("renders an icon for each action", () => {
    render(<QuickActionsBar />);

    expect(screen.getByTestId("icon-user-plus")).toBeTruthy();
    expect(screen.getByTestId("icon-file-text")).toBeTruthy();
    expect(screen.getByTestId("icon-bar-chart")).toBeTruthy();
    expect(screen.getByTestId("icon-share2")).toBeTruthy();
  });
});
