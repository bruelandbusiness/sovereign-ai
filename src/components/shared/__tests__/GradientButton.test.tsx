import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GradientButton } from "@/components/shared/GradientButton";

describe("GradientButton", () => {
  it("renders children", () => {
    render(<GradientButton>Get Started</GradientButton>);
    expect(screen.getByRole("button", { name: "Get Started" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<GradientButton onClick={handleClick}>Click</GradientButton>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire click when disabled", () => {
    const handleClick = vi.fn();
    render(
      <GradientButton disabled onClick={handleClick}>
        Disabled
      </GradientButton>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it.each(["gradient", "outline", "ghost"] as const)(
    "renders %s variant without error",
    (variant) => {
      render(<GradientButton variant={variant}>V</GradientButton>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    },
  );

  it.each(["sm", "md", "lg"] as const)(
    "renders %s size without error",
    (size) => {
      render(<GradientButton size={size}>S</GradientButton>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    },
  );

  it("forwards ref", () => {
    const ref = vi.fn();
    render(<GradientButton ref={ref}>Ref</GradientButton>);
    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLButtonElement);
  });

  it("passes additional className", () => {
    render(<GradientButton className="extra">E</GradientButton>);
    expect(screen.getByRole("button").classList.contains("extra")).toBe(true);
  });

  it("renders as a button element (not an anchor)", () => {
    render(<GradientButton>Button</GradientButton>);
    expect(screen.getByRole("button").tagName).toBe("BUTTON");
  });
});
