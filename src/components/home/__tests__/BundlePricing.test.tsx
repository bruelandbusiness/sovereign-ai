import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BundlePricing } from "../BundlePricing";

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

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/layout/Section", () => ({
  Section: ({ children, ...props }: { children: React.ReactNode }) => (
    <section {...props}>{children}</section>
  ),
}));

vi.mock("@/components/layout/Container", () => ({
  Container: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/shared/GradientText", () => ({
  GradientText: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

vi.mock("@/components/shared/FadeInView", () => ({
  FadeInView: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("../BundleCard", () => ({
  BundleCard: ({ bundle }: { bundle: { id: string; name: string; price: number; description: string } }) => (
    <div data-testid={`bundle-card-${bundle.id}`}>
      <h3>{bundle.name}</h3>
      <p>{bundle.description}</p>
      <span>${bundle.price}/mo</span>
    </div>
  ),
}));

vi.mock("@/lib/constants", () => ({
  formatPrice: (n: number) => `$${n}`,
  getServiceById: () => null,
  BUNDLES: [
    {
      id: "starter",
      name: "Starter",
      description: "Essential AI marketing",
      price: 497,
      annualPrice: 397,
      services: [],
      popular: false,
    },
    {
      id: "growth",
      name: "Growth",
      description: "Scale your business",
      price: 997,
      annualPrice: 797,
      services: [],
      popular: true,
    },
    {
      id: "empire",
      name: "Empire",
      description: "Full market domination",
      price: 1997,
      annualPrice: 1597,
      services: [],
      popular: false,
    },
  ],
}));

vi.mock("@/lib/formatters", () => ({
  formatCurrency: (n: number) => `$${n}`,
}));

vi.mock("@/components/shared/GradientButton", () => ({
  GradientButton: ({ children, ...props }: Record<string, unknown>) => (
    <button {...props}>{children as React.ReactNode}</button>
  ),
}));

vi.mock("@/components/shared/PriceDisplay", () => ({
  PriceDisplay: ({ amount }: { amount: number }) => (
    <span data-testid="price-display">${amount}/mo</span>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/types/services", () => ({}));

vi.mock("lucide-react", () => ({
  Shield: () => <span data-testid="icon-shield" />,
  Star: ({ className }: { className?: string }) => (
    <span data-testid="icon-star" className={className} />
  ),
  Users: () => <span data-testid="icon-users" />,
  Check: () => <span data-testid="icon-check" />,
  ArrowRight: () => <span data-testid="icon-arrow-right" />,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

describe("BundlePricing", () => {
  it("renders the pricing section heading", () => {
    render(<BundlePricing />);
    expect(
      screen.getByText("Cheaper Than an Agency.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Better Results Than a Full-Time Hire/i)
    ).toBeInTheDocument();
  });

  it("renders the 60-day guarantee badge", () => {
    render(<BundlePricing />);
    expect(
      screen.getByText("60-Day Money-Back Guarantee")
    ).toBeInTheDocument();
  });

  it("renders bundle cards for each tier", () => {
    render(<BundlePricing />);
    expect(screen.getByTestId("bundle-card-starter")).toBeInTheDocument();
    expect(screen.getByTestId("bundle-card-growth")).toBeInTheDocument();
    expect(screen.getByTestId("bundle-card-empire")).toBeInTheDocument();
  });

  it("renders tier names", () => {
    render(<BundlePricing />);
    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("Growth")).toBeInTheDocument();
    expect(screen.getByText("Empire")).toBeInTheDocument();
  });

  it("renders the billing toggle with Monthly and Annual options", () => {
    render(<BundlePricing />);
    expect(screen.getByText("Monthly")).toBeInTheDocument();
    expect(screen.getByText("Annual")).toBeInTheDocument();
  });

  it("renders the billing toggle as a radiogroup", () => {
    render(<BundlePricing />);
    const radiogroup = screen.getByRole("radiogroup", {
      name: /billing frequency/i,
    });
    expect(radiogroup).toBeInTheDocument();
  });

  it("renders the urgency element", () => {
    render(<BundlePricing />);
    expect(
      screen.getByText(/Only accepting 10 new clients/i)
    ).toBeInTheDocument();
  });

  it("renders the onboarding link", () => {
    render(<BundlePricing />);
    const link = screen.getByText("Start onboarding");
    expect(link).toHaveAttribute("href", "/onboarding");
  });
});
