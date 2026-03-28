import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";

describe("Badge", () => {
  it("renders with default variant", () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  it("renders default label when no children provided for pipeline variants", () => {
    render(<Badge variant="discovered" />);
    expect(screen.getByText("Discovered")).toBeInTheDocument();
  });

  it("renders children over default label", () => {
    render(<Badge variant="discovered">Custom Label</Badge>);
    expect(screen.getByText("Custom Label")).toBeInTheDocument();
    expect(screen.queryByText("Discovered")).not.toBeInTheDocument();
  });

  it.each<BadgeVariant>([
    "discovered",
    "enriched",
    "contacted",
    "responded",
    "qualified",
    "converted",
    "dead",
    "default",
    "secondary",
    "destructive",
    "outline",
  ])("renders %s variant without error", (variant) => {
    const { container } = render(
      <Badge variant={variant}>Label</Badge>,
    );
    const span = container.querySelector("span");
    expect(span).toBeInTheDocument();
  });

  it("applies outline border style for outline variant", () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    const span = container.querySelector("span")!;
    expect(span.style.border).toBe("1px solid var(--border)");
    expect(span.style.backgroundColor).toBe("transparent");
  });

  it("applies no border for non-outline variants", () => {
    const { container } = render(<Badge variant="default">Default</Badge>);
    const span = container.querySelector("span")!;
    expect(span.style.border).not.toContain("solid");
  });

  it("passes additional className", () => {
    const { container } = render(
      <Badge className="extra-class">Styled</Badge>,
    );
    const span = container.querySelector("span")!;
    expect(span.classList.contains("extra-class")).toBe(true);
  });

  it("forwards HTML attributes", () => {
    render(<Badge data-testid="my-badge">Test</Badge>);
    expect(screen.getByTestId("my-badge")).toBeInTheDocument();
  });
});
