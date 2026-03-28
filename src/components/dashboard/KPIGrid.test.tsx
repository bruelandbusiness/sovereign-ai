import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

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

vi.mock("@/components/shared/AnimatedCounter", () => ({
  AnimatedCounter: ({ target }: { target: number }) => <span>{target}</span>,
}));

vi.mock("@/components/shared/FadeInView", () => ({
  FadeInView: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ render }: any) => render ?? null,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("lucide-react", () => ({
  Users: (props: any) => <span data-testid="icon-users" {...props} />,
  Zap: (props: any) => <span data-testid="icon-zap" {...props} />,
  Star: (props: any) => <span data-testid="icon-star" {...props} />,
  MessageSquare: (props: any) => <span {...props} />,
  DollarSign: (props: any) => <span {...props} />,
  TrendingUp: (props: any) => <span {...props} />,
  Calendar: (props: any) => <span {...props} />,
  AlertCircle: (props: any) => <span data-testid="icon-alert" {...props} />,
  RefreshCw: (props: any) => <span {...props} />,
  ArrowUp: (props: any) => <span {...props} />,
  ArrowDown: (props: any) => <span {...props} />,
  Info: (props: any) => <span {...props} />,
}));

import { KPIGrid } from "./KPIGrid";
import type { KPIData } from "@/types/dashboard";

describe("KPIGrid", () => {
  const sampleKPIs: KPIData[] = [
    {
      label: "Leads This Month",
      value: 127,
      change: "+15%",
      changeType: "positive",
      subtext: "vs last month",
    },
    {
      label: "Conversion Rate",
      value: 24,
      change: "-2%",
      changeType: "negative",
    },
  ];

  it("renders loading skeleton when isLoading is true", () => {
    const { container } = render(<KPIGrid isLoading={true} />);

    const pulsingElements = container.querySelectorAll(".animate-pulse");
    expect(pulsingElements.length).toBeGreaterThan(0);
  });

  it("renders error state with retry button", () => {
    const onRetry = vi.fn();
    render(
      <KPIGrid error={new Error("Network error")} onRetry={onRetry} />
    );

    expect(screen.getByText("Unable to load KPIs")).toBeTruthy();
    expect(
      screen.getByText("Something went wrong fetching your metrics.")
    ).toBeTruthy();

    const retryButton = screen.getByText("Retry");
    expect(retryButton).toBeTruthy();
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders error state without retry button when onRetry is not provided", () => {
    render(<KPIGrid error={new Error("fail")} />);

    expect(screen.getByText("Unable to load KPIs")).toBeTruthy();
    expect(screen.queryByText("Retry")).toBeNull();
  });

  it("renders empty state when kpis array is empty", () => {
    render(<KPIGrid kpis={[]} />);

    expect(screen.getByText("Your metrics are on the way")).toBeTruthy();
    expect(screen.getByText("Leads")).toBeTruthy();
    expect(screen.getByText("Revenue")).toBeTruthy();
    expect(screen.getByText("Reviews")).toBeTruthy();
    expect(screen.getByText("Calls")).toBeTruthy();
  });

  it("renders multiple KPI cards with correct labels", () => {
    render(<KPIGrid kpis={sampleKPIs} />);

    expect(screen.getByText("Leads This Month")).toBeTruthy();
    expect(screen.getByText("Conversion Rate")).toBeTruthy();
  });

  it("renders KPI values", () => {
    render(<KPIGrid kpis={sampleKPIs} />);

    expect(screen.getByText("127")).toBeTruthy();
    expect(screen.getByText("24")).toBeTruthy();
  });

  it("renders change indicators on KPI cards", () => {
    render(<KPIGrid kpis={sampleKPIs} />);

    expect(screen.getByText("+15%")).toBeTruthy();
    expect(screen.getByText("-2%")).toBeTruthy();
  });

  it("handles non-numeric KPI values with displayOverride", () => {
    const kpis: KPIData[] = [
      { label: "Status", value: "N/A" },
    ];
    render(<KPIGrid kpis={kpis} />);

    expect(screen.getByText("Status")).toBeTruthy();
    expect(screen.getByText("N/A")).toBeTruthy();
  });
});
