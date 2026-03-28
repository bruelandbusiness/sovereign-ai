import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
}));

import { EmptyState } from "./EmptyState";

const FakeIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  function FakeIcon(props, ref) { return <svg data-testid="empty-state-icon" ref={ref} {...props} />; }
) as import("lucide-react").LucideIcon;

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        icon={FakeIcon}
        title="No leads yet"
        description="Start by adding your first lead."
      />
    );

    expect(screen.getByText("No leads yet")).toBeTruthy();
    expect(screen.getByText("Start by adding your first lead.")).toBeTruthy();
  });

  it("renders the icon", () => {
    render(
      <EmptyState
        icon={FakeIcon}
        title="Empty"
        description="Nothing here."
      />
    );

    expect(screen.getAllByTestId("empty-state-icon").length).toBeGreaterThan(0);
  });

  it("renders primary action button with onClick handler", () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        icon={FakeIcon}
        title="No data"
        description="Add some data."
        actionLabel="Add Data"
        onAction={onAction}
      />
    );

    const button = screen.getByText("Add Data");
    expect(button).toBeTruthy();
    fireEvent.click(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("renders primary action as a link when actionHref is provided", () => {
    render(
      <EmptyState
        icon={FakeIcon}
        title="No data"
        description="Add some data."
        actionLabel="Go to CRM"
        actionHref="/dashboard/crm"
      />
    );

    const link = screen.getByText("Go to CRM").closest("a");
    expect(link).toBeTruthy();
    expect(link?.getAttribute("href")).toBe("/dashboard/crm");
  });

  it("does not render action button when actionLabel is absent", () => {
    render(
      <EmptyState icon={FakeIcon} title="Empty" description="Nothing." />
    );

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders secondary action button with onClick handler", () => {
    const onSecondary = vi.fn();
    render(
      <EmptyState
        icon={FakeIcon}
        title="No data"
        description="Add some data."
        secondaryLabel="Learn More"
        onSecondaryAction={onSecondary}
      />
    );

    const button = screen.getByText("Learn More");
    expect(button).toBeTruthy();
    fireEvent.click(button);
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it("renders secondary action as a link when secondaryHref is provided", () => {
    render(
      <EmptyState
        icon={FakeIcon}
        title="No data"
        description="Nothing."
        secondaryLabel="Docs"
        secondaryHref="/docs"
      />
    );

    const link = screen.getByText("Docs").closest("a");
    expect(link).toBeTruthy();
    expect(link?.getAttribute("href")).toBe("/docs");
  });

  it("renders default variant illustration with concentric rings", () => {
    const { container } = render(
      <EmptyState icon={FakeIcon} title="Empty" description="Nothing." />
    );

    const hiddenSvgs = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenSvgs.length).toBeGreaterThan(0);
  });

  it("renders celebration variant illustration with sparkle accents", () => {
    const { container } = render(
      <EmptyState
        icon={FakeIcon}
        title="Congrats!"
        description="You did it."
        variant="celebration"
      />
    );

    const hiddenSvgs = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenSvgs.length).toBeGreaterThan(0);
  });

  it("renders the title as an h2 element", () => {
    render(
      <EmptyState icon={FakeIcon} title="Heading Test" description="Desc." />
    );

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toBeTruthy();
    expect(heading.textContent).toBe("Heading Test");
  });
});
