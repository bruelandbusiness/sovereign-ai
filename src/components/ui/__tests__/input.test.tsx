import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "@/components/ui/input";

describe("Input", () => {
  it("renders an input element", () => {
    render(<Input data-testid="input" />);
    expect(screen.getByTestId("input")).toBeInTheDocument();
  });

  it("renders with placeholder", () => {
    render(<Input placeholder="Enter value" />);
    expect(screen.getByPlaceholderText("Enter value")).toBeInTheDocument();
  });

  it("handles value changes", () => {
    const handleChange = vi.fn();
    render(<Input data-testid="input" onChange={handleChange} />);
    const input = screen.getByTestId("input");
    fireEvent.change(input, { target: { value: "hello" } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("renders as disabled", () => {
    render(<Input data-testid="input" disabled />);
    expect(screen.getByTestId("input")).toBeDisabled();
  });

  it("passes type attribute", () => {
    render(<Input data-testid="input" type="email" />);
    expect(screen.getByTestId("input")).toHaveAttribute("type", "email");
  });

  it("applies additional className", () => {
    render(<Input data-testid="input" className="my-input" />);
    expect(screen.getByTestId("input").classList.contains("my-input")).toBe(true);
  });

  it("sets the data-slot attribute", () => {
    render(<Input data-testid="input" />);
    expect(screen.getByTestId("input")).toHaveAttribute("data-slot", "input");
  });
});
