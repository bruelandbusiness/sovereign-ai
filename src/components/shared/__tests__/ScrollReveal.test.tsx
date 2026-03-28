import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock framer-motion to render plain elements instead of animated ones
vi.mock("framer-motion", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  const createMotionComponent = (tag: string) =>
    React.forwardRef(function MotionProxy(props: Record<string, unknown>, ref: React.Ref<unknown>) {
      // Strip framer-motion specific props and render a plain element
      const {
        initial: _initial,
        animate: _animate,
        transition: _transition,
        variants: _variants,
        whileHover: _whileHover,
        whileTap: _whileTap,
        whileInView: _whileInView,
        ...rest
      } = props;
      return React.createElement(tag, { ...rest, ref });
    });

  return {
    motion: new Proxy(
      {},
      {
        get: (_target: object, prop: string) => createMotionComponent(prop),
      },
    ),
    useReducedMotion: () => false,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock react-intersection-observer
vi.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: vi.fn(), inView: true }),
}));

import { ScrollReveal } from "@/components/shared/ScrollReveal";

describe("ScrollReveal", () => {
  it("renders children", () => {
    render(
      <ScrollReveal>
        <p>Revealed content</p>
      </ScrollReveal>,
    );
    expect(screen.getByText("Revealed content")).toBeInTheDocument();
  });

  it("renders with custom className", () => {
    const { container } = render(
      <ScrollReveal className="reveal-wrapper">
        <span>Content</span>
      </ScrollReveal>,
    );
    expect(container.firstElementChild!.classList.contains("reveal-wrapper")).toBe(true);
  });

  it("renders multiple children", () => {
    render(
      <ScrollReveal>
        <p>First</p>
        <p>Second</p>
      </ScrollReveal>,
    );
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("renders with different direction props without error", () => {
    const { container } = render(
      <ScrollReveal direction="left">
        <span>Left reveal</span>
      </ScrollReveal>,
    );
    expect(container.firstElementChild).toBeInTheDocument();
  });
});
