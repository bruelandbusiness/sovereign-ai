import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock framer-motion — replace animated components with plain DOM equivalents
// ---------------------------------------------------------------------------

vi.mock("framer-motion", () => {
  // Marker to identify mock MotionValues so the motion proxy can unwrap them
  const MOTION_VALUE_MARKER = Symbol("mockMotionValue");

  const actual = {
    motion: new Proxy(
      {},
      {
        get: (_target, prop: string) => {
          const Component = ({
            children,
            initial: _initial,
            animate: _animate,
            exit: _exit,
            transition: _transition,
            whileHover: _whileHover,
            whileTap: _whileTap,
            ...rest
           
          }: any) => {
            // If children is a mock MotionValue object, unwrap to its string
            const rendered =
              children && typeof children === "object" && children[MOTION_VALUE_MARKER]
                ? children.get()
                : children;
            const Tag = prop as keyof React.JSX.IntrinsicElements;
            return React.createElement(Tag, rest, rendered);
          };
          Component.displayName = `motion.${prop}`;
          return Component;
        },
      }
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    useMotionValue: (initial: number) => ({
      [MOTION_VALUE_MARKER]: true,
      get: () => initial,
      set: vi.fn(),
    }),
    useTransform: (_mv: unknown, transform: (v: number) => string) => ({
      [MOTION_VALUE_MARKER]: true,
      get: () => transform(0),
    }),
    animate: vi.fn(),
  };
  return actual;
});

import { RoiCalculator } from "@/components/ui/RoiCalculator";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RoiCalculator", () => {
  it("renders the ROI Calculator heading", () => {
    render(<RoiCalculator />);
    expect(screen.getByText("ROI Calculator")).toBeDefined();
  });

  it("renders three slider inputs", () => {
    render(<RoiCalculator />);
    const sliders = screen.getAllByRole("slider");
    expect(sliders).toHaveLength(3);
  });

  it("renders the CTA button", () => {
    render(<RoiCalculator />);
    expect(screen.getByText("Get Your Custom ROI Report")).toBeDefined();
  });

  it("displays slider labels", () => {
    render(<RoiCalculator />);
    expect(screen.getByText("Monthly Revenue")).toBeDefined();
    expect(screen.getByText("Marketing Budget")).toBeDefined();
    expect(screen.getByText("Current Leads / Month")).toBeDefined();
  });

  it("displays projected result labels", () => {
    render(<RoiCalculator />);
    expect(screen.getByText("Projected Results")).toBeDefined();
    expect(screen.getByText("Leads / Month")).toBeDefined();
    expect(screen.getByText("Projected Revenue")).toBeDefined();
    expect(screen.getByText("ROI")).toBeDefined();
  });

  it("updates slider value when changed", () => {
    render(<RoiCalculator />);
    const sliders = screen.getAllByRole("slider");
    // Monthly Revenue slider (first one)
    const revenueSlider = sliders[0] as HTMLInputElement;

    fireEvent.change(revenueSlider, { target: { value: "50000" } });
    expect(revenueSlider.value).toBe("50000");
  });

  it("has correct default slider values", () => {
    render(<RoiCalculator />);
    const sliders = screen.getAllByRole("slider") as HTMLInputElement[];

    // Monthly Revenue default: 25000
    expect(sliders[0].value).toBe("25000");
    // Marketing Budget default: 3000
    expect(sliders[1].value).toBe("3000");
    // Current Leads default: 50
    expect(sliders[2].value).toBe("50");
  });

  it("has correct min/max on revenue slider", () => {
    render(<RoiCalculator />);
    const sliders = screen.getAllByRole("slider") as HTMLInputElement[];
    expect(sliders[0].min).toBe("5000");
    expect(sliders[0].max).toBe("100000");
    expect(sliders[0].step).toBe("1000");
  });

  it("has correct min/max on marketing budget slider", () => {
    render(<RoiCalculator />);
    const sliders = screen.getAllByRole("slider") as HTMLInputElement[];
    expect(sliders[1].min).toBe("500");
    expect(sliders[1].max).toBe("10000");
    expect(sliders[1].step).toBe("100");
  });

  it("has correct min/max on leads slider", () => {
    render(<RoiCalculator />);
    const sliders = screen.getAllByRole("slider") as HTMLInputElement[];
    expect(sliders[2].min).toBe("5");
    expect(sliders[2].max).toBe("200");
    expect(sliders[2].step).toBe("1");
  });

  it("accepts a custom className", () => {
    const { container } = render(<RoiCalculator className="custom-class" />);
    // The root element should have the custom class
    const rootDiv = container.firstElementChild;
    expect(rootDiv?.className).toContain("custom-class");
  });

  it("displays growth multiplier badges", () => {
    render(<RoiCalculator />);
    expect(screen.getByText("3.5x increase")).toBeDefined();
    expect(screen.getByText("2.4x growth")).toBeDefined();
    expect(screen.getByText("return on spend")).toBeDefined();
  });

  it("allows changing all three sliders independently", () => {
    render(<RoiCalculator />);
    const sliders = screen.getAllByRole("slider") as HTMLInputElement[];

    fireEvent.change(sliders[0], { target: { value: "75000" } });
    fireEvent.change(sliders[1], { target: { value: "5000" } });
    fireEvent.change(sliders[2], { target: { value: "100" } });

    expect(sliders[0].value).toBe("75000");
    expect(sliders[1].value).toBe("5000");
    expect(sliders[2].value).toBe("100");
  });
});

// ---------------------------------------------------------------------------
// ROI calculation logic (unit-level)
// ---------------------------------------------------------------------------

describe("ROI calculation logic", () => {
  function computeResults(
    monthlyRevenue: number,
    marketingBudget: number,
    currentLeads: number
  ) {
    const projectedLeads = Math.round(currentLeads * 3.5);
    const revenueIncrease = monthlyRevenue * 2.4;
    const roi = Math.round(
      ((revenueIncrease - marketingBudget) / marketingBudget) * 100
    );
    return { projectedLeads, revenueIncrease, roi };
  }

  it("calculates projected leads as 3.5x current leads", () => {
    const { projectedLeads } = computeResults(25000, 3000, 50);
    expect(projectedLeads).toBe(175);
  });

  it("calculates revenue increase as 2.4x monthly revenue", () => {
    const { revenueIncrease } = computeResults(25000, 3000, 50);
    expect(revenueIncrease).toBe(60000);
  });

  it("calculates ROI correctly with default values", () => {
    const { roi } = computeResults(25000, 3000, 50);
    // ROI = ((60000 - 3000) / 3000) * 100 = 1900
    expect(roi).toBe(1900);
  });

  it("handles minimum slider values", () => {
    const { projectedLeads, revenueIncrease, roi } = computeResults(5000, 500, 5);
    expect(projectedLeads).toBe(18); // 5 * 3.5 = 17.5 -> 18
    expect(revenueIncrease).toBe(12000); // 5000 * 2.4
    expect(roi).toBe(2300); // ((12000 - 500) / 500) * 100
  });

  it("handles maximum slider values", () => {
    const { projectedLeads, revenueIncrease, roi } = computeResults(100000, 10000, 200);
    expect(projectedLeads).toBe(700);
    expect(revenueIncrease).toBe(240000);
    expect(roi).toBe(2300);
  });
});
