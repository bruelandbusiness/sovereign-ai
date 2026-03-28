import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestimonialsSection } from "../TestimonialsSection";

vi.mock("framer-motion", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  const motionHandler = {
    get(_target: unknown, prop: string) {
      return React.forwardRef(function MotionProxy(props: Record<string, unknown>, ref: unknown) {
        const {
          initial: _i,
          animate: _a,
          exit: _e,
          transition: _t,
          variants: _v,
          whileInView: _wiv,
          whileHover: _wh,
          viewport: _vp,
          ...rest
        } = props;
        return React.createElement(prop, { ...rest, ref });
      });
    },
  };
  return {
    motion: new Proxy({}, motionHandler),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useReducedMotion: () => false,
  };
});

vi.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: () => {}, inView: true }),
}));

vi.mock("embla-carousel-react", () => ({
  __esModule: true,
  default: () => [() => {}, null],
}));

vi.mock("embla-carousel-autoplay", () => ({
  __esModule: true,
  default: () => ({}),
}));

vi.mock("@/components/layout/Container", () => ({
  Container: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

vi.mock("lucide-react", () => ({
  ChevronLeft: () => <span data-testid="icon-chevron-left" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
  Star: ({ className }: { className?: string }) => (
    <span data-testid="icon-star" className={className} />
  ),
}));

// Import TESTIMONIALS so we can reference the data
vi.mock("@/lib/constants", () => ({
  TESTIMONIALS: [
    {
      name: "Mike Richardson",
      business: "Richardson HVAC",
      location: "Dallas, TX",
      quote: "We went from 12 leads a month to over 60.",
      rating: 5,
      vertical: "hvac",
      result: "5x more leads in 90 days",
    },
    {
      name: "Sarah Chen",
      business: "PipePro Plumbing",
      location: "Phoenix, AZ",
      quote: "Our Google rating went from 3.8 to 4.7 stars.",
      rating: 5,
      vertical: "plumbing",
      result: "3.8 to 4.7 star rating",
    },
  ],
}));

describe("TestimonialsSection", () => {
  it("renders the section heading", () => {
    render(<TestimonialsSection />);
    expect(
      screen.getByText(/Contractors Who Stopped/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText("Losing Jobs to Competitors")
    ).toBeInTheDocument();
  });

  it("renders testimonial quotes", () => {
    render(<TestimonialsSection />);
    expect(
      screen.getByText(/We went from 12 leads a month to over 60/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Our Google rating went from 3.8 to 4.7 stars/i)
    ).toBeInTheDocument();
  });

  it("renders testimonial author names and businesses", () => {
    render(<TestimonialsSection />);
    expect(screen.getByText("Mike Richardson")).toBeInTheDocument();
    expect(screen.getByText("Sarah Chen")).toBeInTheDocument();
    expect(
      screen.getByText(/Richardson HVAC/)
    ).toBeInTheDocument();
  });

  it("renders result badges", () => {
    render(<TestimonialsSection />);
    expect(
      screen.getByText("5x more leads in 90 days")
    ).toBeInTheDocument();
    expect(
      screen.getByText("3.8 to 4.7 star rating")
    ).toBeInTheDocument();
  });

  it("renders prev/next navigation buttons", () => {
    render(<TestimonialsSection />);
    const prevButtons = screen.getAllByLabelText("Previous testimonial");
    const nextButtons = screen.getAllByLabelText("Next testimonial");
    expect(prevButtons.length).toBeGreaterThanOrEqual(1);
    expect(nextButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the carousel section with an accessible label", () => {
    render(<TestimonialsSection />);
    const section = screen.getByLabelText("Customer testimonials");
    expect(section).toBeInTheDocument();
  });

  it("renders author initials", () => {
    render(<TestimonialsSection />);
    expect(screen.getByText("MR")).toBeInTheDocument();
    expect(screen.getByText("SC")).toBeInTheDocument();
  });
});
