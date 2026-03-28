import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, { get: (_, tag) => tag }),
  AnimatePresence: ({ children }: any) => children,
  useMotionValue: () => ({ get: () => 0, set: () => {}, on: () => () => {} }),
  useTransform: () => ({ get: () => 0, on: () => () => {} }),
  animate: () => ({ stop: () => {} }),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

vi.mock("lucide-react", () => ({
  Calendar: (props: any) => <span data-testid="icon-calendar" {...props} />,
  ChevronLeft: (props: any) => <span data-testid="icon-chevron-left" {...props} />,
  ChevronRight: (props: any) => <span data-testid="icon-chevron-right" {...props} />,
}));

import { DatePicker } from "./DatePicker";

describe("DatePicker", () => {
  let onChange: Mock<(date: Date) => void>;

  beforeEach(() => {
    onChange = vi.fn();
  });

  it("renders placeholder when no value", () => {
    render(<DatePicker placeholder="Pick a date" onChange={onChange} />);
    expect(screen.getByText("Pick a date")).toBeTruthy();
  });

  it("shows dropdown on click", () => {
    render(<DatePicker onChange={onChange} />);
    // Dropdown should not be visible initially — day headers not shown
    expect(screen.queryByText("Su")).toBeNull();

    // Click the trigger button
    fireEvent.click(screen.getByText("Select date"));

    // Now the calendar dropdown should appear with day headers
    expect(screen.getByText("Su")).toBeTruthy();
    expect(screen.getByText("Mo")).toBeTruthy();
    expect(screen.getByText("Fr")).toBeTruthy();
  });

  it("selecting a day calls onChange", () => {
    render(<DatePicker onChange={onChange} />);
    // Open the dropdown
    fireEvent.click(screen.getByText("Select date"));

    // Find a non-disabled day button and click it
    const allButtons = screen.getAllByRole("button");
    const dayButton = allButtons.find((btn) => {
      const text = btn.textContent?.trim() ?? "";
      const dayNum = parseInt(text, 10);
      return (
        dayNum >= 1 &&
        dayNum <= 28 &&
        !btn.hasAttribute("disabled") &&
        text === String(dayNum)
      );
    });
    expect(dayButton).toBeTruthy();
    fireEvent.click(dayButton!);

    expect(onChange).toHaveBeenCalledTimes(1);
    const calledWith = onChange.mock.calls[0][0];
    expect(calledWith).toBeInstanceOf(Date);
  });

  it("shows formatted date when value set", () => {
    // Use a fixed date: Jan 15, 2025
    const date = new Date(2025, 0, 15);
    render(<DatePicker value={date} onChange={onChange} />);
    // The component formats with en-US { month: "short", day: "numeric", year: "numeric" }
    expect(screen.getByText("Jan 15, 2025")).toBeTruthy();
  });
});
