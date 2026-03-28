import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, { get: (_, tag) => tag }),
  AnimatePresence: ({ children }: any) => children,
  useMotionValue: () => ({ get: () => 0, set: () => {}, on: () => () => {} }),
  useTransform: () => ({ get: () => 0, on: () => () => {} }),
  useReducedMotion: () => false,
}));

vi.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: { current: null }, inView: true }),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

vi.mock("@/components/shared/AnimatedCounter", () => ({
  AnimatedCounter: ({
    target,
    prefix,
    suffix,
    decimals,
  }: {
    target: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
  }) => (
    <span>
      {prefix}
      {target.toFixed(decimals ?? 0)}
      {suffix}
    </span>
  ),
}));

vi.mock("@/components/shared/FadeInView", () => ({
  FadeInView: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div data-testid="card-content" {...props}>
      {children}
    </div>
  ),
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ render }: any) => render ?? null,
  TooltipContent: ({ children }: any) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
}));

vi.mock("lucide-react", () => ({
  ArrowUp: (props: any) => <span data-testid="arrow-up" {...props} />,
  ArrowDown: (props: any) => <span data-testid="arrow-down" {...props} />,
  Info: (props: any) => <span data-testid="icon-info" {...props} />,
}));

import { KPICard } from "./KPICard";

const FakeIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  function FakeIcon(props, ref) { return <svg data-testid="kpi-icon" ref={ref} {...props} />; }
) as import("lucide-react").LucideIcon;

describe("KPICard", () => {
  it("renders label and value", () => {
    render(<KPICard label="Leads" value={42} icon={FakeIcon} />);

    expect(screen.getByText("Leads")).toBeTruthy();
    expect(screen.getByText("42")).toBeTruthy();
  });

  it("renders prefix and suffix around value", () => {
    const { container } = render(
      <KPICard label="Revenue" value={1500} icon={FakeIcon} prefix="$" suffix="k" />
    );

    const valueEl = container.querySelector(".text-2xl");
    expect(valueEl?.textContent).toContain("$");
    expect(valueEl?.textContent).toContain("1500");
    expect(valueEl?.textContent).toContain("k");
  });

  it("renders displayOverride instead of animated counter when provided", () => {
    render(
      <KPICard label="Score" value={0} icon={FakeIcon} displayOverride={"\u2014"} />
    );

    const valueP = screen.getByText("Score")
      .closest(".space-y-1")
      ?.querySelector(".text-2xl");
    expect(valueP?.textContent).toBe("\u2014");
  });

  it("renders change indicator when change prop is provided", () => {
    render(
      <KPICard
        label="Conversion"
        value={25}
        icon={FakeIcon}
        change="+12%"
        changeType="positive"
      />
    );

    expect(screen.getByText("+12%")).toBeTruthy();
    expect(screen.getByTestId("arrow-up")).toBeTruthy();
  });

  it("renders downward arrow for negative change", () => {
    render(
      <KPICard
        label="Churn"
        value={5}
        icon={FakeIcon}
        change="-3%"
        changeType="negative"
      />
    );

    expect(screen.getByText("-3%")).toBeTruthy();
    expect(screen.getByTestId("arrow-down")).toBeTruthy();
  });

  it("does not render change indicator when change prop is absent", () => {
    render(<KPICard label="Leads" value={10} icon={FakeIcon} />);

    expect(screen.queryByTestId("arrow-up")).toBeNull();
    expect(screen.queryByTestId("arrow-down")).toBeNull();
  });

  it("renders subtext when provided", () => {
    render(
      <KPICard label="Leads" value={10} icon={FakeIcon} subtext="vs last month" />
    );

    expect(screen.getByText("vs last month")).toBeTruthy();
  });

  it("renders tooltip when tooltipText is provided", () => {
    render(
      <KPICard
        label="Revenue"
        value={500}
        icon={FakeIcon}
        tooltipText="Total monthly revenue"
      />
    );

    expect(screen.getByTestId("tooltip-content")).toBeTruthy();
    expect(screen.getByText("Total monthly revenue")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Info about Revenue" })
    ).toBeTruthy();
  });

  it("does not render tooltip when tooltipText is absent", () => {
    render(<KPICard label="Leads" value={10} icon={FakeIcon} />);

    expect(screen.queryByTestId("tooltip-content")).toBeNull();
  });

  it("renders sparkline when sparklineData has >= 2 points", () => {
    render(
      <KPICard
        label="Leads"
        value={50}
        icon={FakeIcon}
        sparklineData={[10, 20, 30, 40, 50]}
        changeType="positive"
      />
    );

    expect(screen.getByRole("img", { name: "Metric trend sparkline" })).toBeTruthy();
  });

  it("does not render sparkline when sparklineData has < 2 points", () => {
    render(
      <KPICard label="Leads" value={50} icon={FakeIcon} sparklineData={[10]} />
    );

    expect(
      screen.queryByRole("img", { name: "Metric trend sparkline" })
    ).toBeNull();
  });
});
