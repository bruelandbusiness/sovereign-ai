import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Textarea } from "@/components/ui/textarea";

describe("Textarea", () => {
  it("renders a textarea element", () => {
    render(<Textarea data-testid="textarea" />);
    const el = screen.getByTestId("textarea");
    expect(el).toBeInTheDocument();
    expect(el.tagName).toBe("TEXTAREA");
  });

  it("renders with placeholder", () => {
    render(<Textarea placeholder="Write here..." />);
    expect(screen.getByPlaceholderText("Write here...")).toBeInTheDocument();
  });

  it("handles value changes", () => {
    const handleChange = vi.fn();
    render(<Textarea data-testid="textarea" onChange={handleChange} />);
    fireEvent.change(screen.getByTestId("textarea"), {
      target: { value: "new text" },
    });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("renders as disabled", () => {
    render(<Textarea data-testid="textarea" disabled />);
    expect(screen.getByTestId("textarea")).toBeDisabled();
  });

  it("applies additional className", () => {
    render(<Textarea data-testid="textarea" className="custom" />);
    expect(screen.getByTestId("textarea").classList.contains("custom")).toBe(true);
  });

  it("sets data-slot attribute", () => {
    render(<Textarea data-testid="textarea" />);
    expect(screen.getByTestId("textarea")).toHaveAttribute("data-slot", "textarea");
  });
});
