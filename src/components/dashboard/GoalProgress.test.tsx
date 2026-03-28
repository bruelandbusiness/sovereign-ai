import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        const Component = ({ children, ...props }: any) => {
          const filteredProps: Record<string, any> = {};
          for (const [key, val] of Object.entries(props)) {
            if (
              typeof val !== "object" ||
              val === null ||
              key === "className" ||
              key === "style" ||
              key === "role" ||
              key.startsWith("aria-") ||
              key.startsWith("data-")
            ) {
              filteredProps[key] = val;
            }
          }
          return React.createElement(tag as string, filteredProps, children);
        };
        Component.displayName = `motion.${String(tag)}`;
        return Component;
      },
    }
  ),
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

vi.mock("@/components/ui/Confetti", () => ({
  Confetti: () => null,
}));

vi.mock("lucide-react", () => ({
  Target: (props: any) => <span data-testid="icon-target" {...props} />,
  TrendingUp: (props: any) => (
    <span data-testid="icon-trending-up" {...props} />
  ),
  Trophy: (props: any) => <span data-testid="icon-trophy" {...props} />,
  PartyPopper: (props: any) => (
    <span data-testid="icon-party" {...props} />
  ),
}));

import { GoalProgress } from "./GoalProgress";

describe("GoalProgress", () => {
  it("renders the progress bar with correct aria attributes", () => {
    render(<GoalProgress current={30} total={100} />);

    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toBeTruthy();
    expect(progressbar.getAttribute("aria-valuenow")).toBe("30");
    expect(progressbar.getAttribute("aria-valuemin")).toBe("0");
    expect(progressbar.getAttribute("aria-valuemax")).toBe("100");
  });

  it("displays the current count and total in the label", () => {
    render(<GoalProgress current={45} total={100} />);

    expect(screen.getByText("100 leads")).toBeTruthy();
    expect(screen.getByText("45")).toBeTruthy();
    expect(screen.getByText("(45%)")).toBeTruthy();
  });

  it("shows 'to go' count when goal is not reached", () => {
    render(<GoalProgress current={60} total={100} />);

    expect(screen.getByText("40 to go")).toBeTruthy();
  });

  it("uses custom label when provided", () => {
    render(<GoalProgress current={10} total={50} label="customers" />);

    expect(screen.getByText("50 customers")).toBeTruthy();
  });

  it("renders pace indicator", () => {
    render(<GoalProgress current={30} total={100} />);

    expect(screen.getByTestId("icon-trending-up")).toBeTruthy();
  });

  it("shows goal achieved state when current >= total", () => {
    render(<GoalProgress current={100} total={100} />);

    expect(
      screen.getByText((content) => content.includes("Goal achieved"))
    ).toBeTruthy();
    expect(screen.getByTestId("icon-trophy")).toBeTruthy();
  });

  it("shows celebration badge when goal is exceeded", () => {
    render(<GoalProgress current={120} total={100} />);

    expect(
      screen.getByText((content) =>
        content.includes("exceeded your monthly target")
      )
    ).toBeTruthy();
    expect(screen.getByText("+20 above goal!")).toBeTruthy();
  });

  it("caps percentage at 100 when current exceeds total", () => {
    render(<GoalProgress current={150} total={100} />);

    const progressbar = screen.getByRole("progressbar");
    expect(progressbar.getAttribute("aria-valuenow")).toBe("100");
  });

  it("handles zero total gracefully", () => {
    render(<GoalProgress current={0} total={0} />);

    const progressbar = screen.getByRole("progressbar");
    expect(progressbar.getAttribute("aria-valuenow")).toBe("0");
  });

  it("does not show 'to go' when goal is reached", () => {
    render(<GoalProgress current={100} total={100} />);

    expect(screen.queryByText(/to go/)).toBeNull();
  });
});
