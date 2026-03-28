import { describe, it, expect, vi, beforeEach } from "vitest";
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
  X: (props: any) => <span data-testid="icon-x" {...props} />,
}));

import { Drawer } from "./Drawer";

describe("Drawer", () => {
  let onClose: () => void;

  beforeEach(() => {
    onClose = vi.fn();
  });

  it("renders children when open", () => {
    render(
      <Drawer open={true} onClose={onClose}>
        <p>Drawer content here</p>
      </Drawer>,
    );
    expect(screen.getByText("Drawer content here")).toBeTruthy();
  });

  it("doesn't render when closed", () => {
    const { container } = render(
      <Drawer open={false} onClose={onClose}>
        <p>Drawer content here</p>
      </Drawer>,
    );
    expect(screen.queryByText("Drawer content here")).toBeNull();
    expect(container.textContent).toBe("");
  });

  it("calls onClose on backdrop click", () => {
    render(
      <Drawer open={true} onClose={onClose}>
        <p>Content</p>
      </Drawer>,
    );
    // The backdrop is the first div rendered (with bg-black class).
    // It has an onClick={onClose} handler. We can find it by its class pattern.
    const backdrop = document.querySelector(".fixed.inset-0.z-50");
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders title and description", () => {
    render(
      <Drawer
        open={true}
        onClose={onClose}
        title="Settings Panel"
        description="Configure your preferences"
      >
        <p>Body</p>
      </Drawer>,
    );
    expect(screen.getByText("Settings Panel")).toBeTruthy();
    expect(screen.getByText("Configure your preferences")).toBeTruthy();
  });
});
