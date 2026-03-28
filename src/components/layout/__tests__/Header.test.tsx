import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "../Header";

// Mock framer-motion
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
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

vi.mock("@/components/brand/SovereignLogo", () => ({
  SovereignLogo: () => <span data-testid="sovereign-logo">Sovereign AI</span>,
}));

vi.mock("@/components/layout/Container", () => ({
  Container: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
  }) => <button {...props}>{children}</button>,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

vi.mock("@/lib/auth-context", () => ({
  useSession: () => ({ user: null, isLoading: false }),
}));

vi.mock("@/components/dashboard/NotificationBell", () => ({
  NotificationBell: () => <span data-testid="notification-bell" />,
}));

vi.mock("lucide-react", () => ({
  Menu: ({ className: _className, ...props }: Record<string, unknown>) => (
    <span data-testid="icon-menu" {...props} />
  ),
  X: ({ className: _className, ...props }: Record<string, unknown>) => (
    <span data-testid="icon-x" {...props} />
  ),
  Search: ({ className: _className, ...props }: Record<string, unknown>) => (
    <span data-testid="icon-search" {...props} />
  ),
}));

describe("Header", () => {
  it("renders the logo", () => {
    render(<Header />);
    expect(screen.getByTestId("sovereign-logo")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<Header />);
    expect(screen.getByRole("navigation", { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText("Pricing")).toBeInTheDocument();
    expect(screen.getByText("Case Studies")).toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
    expect(screen.getByText("Free Audit")).toBeInTheDocument();
  });

  it("renders nav links as anchor elements with correct hrefs", () => {
    render(<Header />);
    const servicesLink = screen.getByText("Services").closest("a");
    expect(servicesLink).toHaveAttribute("href", "/services");
    const pricingLink = screen.getByText("Pricing").closest("a");
    expect(pricingLink).toHaveAttribute("href", "/pricing");
  });

  it("renders the mobile menu toggle button", () => {
    render(<Header />);
    const toggleButton = screen.getByLabelText("Open menu");
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
  });

  it("renders the CTA button with default label", () => {
    render(<Header />);
    expect(screen.getByText("Book Strategy Call")).toBeInTheDocument();
  });

  it("renders a custom CTA label when provided", () => {
    render(<Header ctaLabel="Get Started" />);
    expect(screen.getByText("Get Started")).toBeInTheDocument();
  });

  it("renders Client Login when user is not logged in", () => {
    render(<Header />);
    expect(screen.getByText("Client Login")).toBeInTheDocument();
  });

  it("renders as a header landmark", () => {
    render(<Header />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders minimal variant with back link", () => {
    render(<Header variant="minimal" />);
    expect(screen.getByText("Back to site")).toBeInTheDocument();
    // Should not render main nav in minimal variant
    expect(screen.queryByRole("navigation", { name: /main navigation/i })).not.toBeInTheDocument();
  });
});
