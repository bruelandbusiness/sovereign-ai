import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("calls onClick handler when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire click when disabled", () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it("applies disabled styling", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button.className).toContain("disabled:opacity-50");
  });

  it.each(["primary", "secondary", "ghost", "danger", "outline", "default", "destructive", "link"] as const)(
    "renders %s variant without error",
    (variant) => {
      render(<Button variant={variant}>Button</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    },
  );

  it.each(["sm", "md", "lg", "icon", "icon-sm"] as const)(
    "renders %s size without error",
    (size) => {
      render(<Button size={size}>B</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    },
  );

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLButtonElement);
  });

  it("passes additional className", () => {
    render(<Button className="custom-class">Styled</Button>);
    expect(screen.getByRole("button").classList.contains("custom-class")).toBe(true);
  });

  it("forwards HTML button attributes", () => {
    render(<Button type="submit" data-testid="submit-btn">Submit</Button>);
    const button = screen.getByTestId("submit-btn");
    expect(button).toHaveAttribute("type", "submit");
  });
});
