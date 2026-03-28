import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";

/**
 * AnimatedCounter uses IntersectionObserver to trigger a counting animation.
 * The global test-setup.ts provides a mock IntersectionObserver that triggers
 * immediately, so the animation starts right away. The initial rendered value
 * is 0 (before requestAnimationFrame fires), which is sufficient for testing
 * the component renders correctly.
 */

describe("AnimatedCounter", () => {
  it("renders a span element", () => {
    const { container } = render(<AnimatedCounter target={100} />);
    expect(container.querySelector("span")).toBeInTheDocument();
  });

  it("displays prefix and suffix", () => {
    const { container } = render(
      <AnimatedCounter target={50} prefix="$" suffix="+" />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("$");
    expect(text).toContain("+");
  });

  it("renders a numeric value", () => {
    const { container } = render(
      <AnimatedCounter target={42} decimals={0} />,
    );
    const text = container.textContent ?? "";
    expect(text).toMatch(/\d+/);
  });

  it("applies decimal formatting", () => {
    const { container } = render(
      <AnimatedCounter target={3.14} decimals={2} />,
    );
    const text = container.textContent ?? "";
    expect(text).toMatch(/\d+\.\d{2}/);
  });
});
