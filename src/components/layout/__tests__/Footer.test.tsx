import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "../Footer";

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

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

vi.mock("@/lib/tracking", () => ({
  trackNewsletterSignup: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  Shield: () => <span data-testid="icon-shield" />,
  Mail: () => <span data-testid="icon-mail" />,
  ArrowRight: () => <span data-testid="icon-arrow-right" />,
}));

describe("Footer", () => {
  it("renders as a footer landmark", () => {
    render(<Footer />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders the logo", () => {
    render(<Footer />);
    expect(screen.getByTestId("sovereign-logo")).toBeInTheDocument();
  });

  it("renders footer column headings", () => {
    render(<Footer />);
    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.getByText("Company")).toBeInTheDocument();
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByText("Legal")).toBeInTheDocument();
  });

  it("renders product links", () => {
    render(<Footer />);
    expect(screen.getByText("Free Audit")).toBeInTheDocument();
    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText("Live Demo")).toBeInTheDocument();
  });

  it("renders company links", () => {
    render(<Footer />);
    expect(screen.getByText("About Us")).toBeInTheDocument();
    expect(screen.getByText("Guarantee")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
  });

  it("renders copyright notice with the current year", () => {
    render(<Footer />);
    const year = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`${year} Sovereign AI`))
    ).toBeInTheDocument();
  });

  it("renders bottom bar legal links", () => {
    render(<Footer />);
    const privacyLinks = screen.getAllByText("Privacy");
    expect(privacyLinks.length).toBeGreaterThanOrEqual(1);
    const termsLinks = screen.getAllByText("Terms");
    expect(termsLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("renders trust badges", () => {
    render(<Footer />);
    expect(
      screen.getByText("60-Day Money-Back Guarantee")
    ).toBeInTheDocument();
    expect(screen.getByText("No Long-Term Contracts")).toBeInTheDocument();
    expect(screen.getByText("256-Bit Data Encryption")).toBeInTheDocument();
  });

  it("renders the newsletter subscribe form", () => {
    render(<Footer />);
    expect(
      screen.getByLabelText("Email address for newsletter")
    ).toBeInTheDocument();
    expect(screen.getByText("Subscribe")).toBeInTheDocument();
  });

  it("renders footer navigation landmarks", () => {
    render(<Footer />);
    const navs = screen.getAllByRole("navigation");
    expect(navs.length).toBeGreaterThanOrEqual(4);
  });
});
