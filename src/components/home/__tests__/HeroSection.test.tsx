import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "../HeroSection";

// Mock framer-motion to render plain elements
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
    useMotionValue: () => ({
      on: () => () => {},
    }),
    useTransform: () => ({
      on: () => () => {},
    }),
    animate: () => ({ stop: () => {} }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useReducedMotion: () => false,
  };
});

vi.mock("react-wrap-balancer", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/components/layout/Container", () => ({
  Container: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/shared/GradientButton", () => ({
  GradientButton: ({ children, onClick, ...props }: Record<string, unknown>) => (
    <button onClick={onClick as () => void} {...props}>
      {children as React.ReactNode}
    </button>
  ),
}));

vi.mock("lucide-react", () => ({
  ArrowRight: () => <span data-testid="icon-arrow-right" />,
  Play: () => <span data-testid="icon-play" />,
  Sparkles: () => <span data-testid="icon-sparkles" />,
  ShieldCheck: () => <span data-testid="icon-shield-check" />,
  Clock: () => <span data-testid="icon-clock" />,
  CalendarCheck: () => <span data-testid="icon-calendar-check" />,
  XCircle: () => <span data-testid="icon-x-circle" />,
}));

describe("HeroSection", () => {
  it("renders the headline text", () => {
    render(<HeroSection />);
    expect(
      screen.getByText(/Every Missed Call Is a Job Your Competitor/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Already Booked")).toBeInTheDocument();
  });

  it("renders the primary CTA button", () => {
    render(<HeroSection />);
    expect(
      screen.getByText("Start Getting More Leads")
    ).toBeInTheDocument();
  });

  it("renders the demo CTA when onDemoClick is provided", () => {
    const handleDemo = vi.fn();
    render(<HeroSection onDemoClick={handleDemo} />);
    expect(screen.getByText("Watch 2-Min Demo")).toBeInTheDocument();
  });

  it("does not render the demo CTA when onDemoClick is absent", () => {
    render(<HeroSection />);
    expect(screen.queryByText("Watch 2-Min Demo")).not.toBeInTheDocument();
  });

  it("renders social proof stats labels", () => {
    render(<HeroSection />);
    expect(screen.getByText("Businesses")).toBeInTheDocument();
    expect(screen.getByText("Revenue Generated")).toBeInTheDocument();
    expect(screen.getByText("Avg. Rating")).toBeInTheDocument();
  });

  it("renders trust badges", () => {
    render(<HeroSection />);
    expect(screen.getByText("No contracts")).toBeInTheDocument();
    expect(screen.getByText("60-day guarantee")).toBeInTheDocument();
    expect(screen.getByText("Setup in 48 hours")).toBeInTheDocument();
    expect(screen.getByText("Cancel anytime")).toBeInTheDocument();
  });

  it("renders the trust bar content", () => {
    render(<HeroSection />);
    const matches = screen.getAllByText(/home service businesses/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("16 AI systems")).toBeInTheDocument();
  });

  it("renders mini testimonial quotes", () => {
    render(<HeroSection />);
    expect(
      screen.getByText(/Went from 12 to 54 leads\/month/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Best ROI of any marketing/i)
    ).toBeInTheDocument();
  });

  it("renders the section as a landmark element", () => {
    const { container } = render(<HeroSection />);
    const section = container.querySelector("section");
    expect(section).toBeInTheDocument();
  });
});
