import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        const Component = ({ children, ...props }: any) => {
          const filteredProps: Record<string, any> = {};
          for (const [key, val] of Object.entries(props)) {
            if (
              typeof val !== "object" ||
              val === null ||
              key === "className" ||
              key === "style" ||
              key === "role" ||
              key.startsWith("aria-")
            ) {
              filteredProps[key] = val;
            }
          }
          return React.createElement(tag as string, filteredProps, children);
        };
        Component.displayName = `motion.${String(tag)}`;
        return Component;
      },
    }
  ),
  AnimatePresence: ({ children }: any) => children,
}));

let mockUnreadCount = 0;

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => ({
    unreadCount: mockUnreadCount,
    notifications: [],
    isLoading: false,
    error: null,
    markAsRead: vi.fn(),
    markAllRead: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("./NotificationPanel", () => ({
  NotificationPanel: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="notification-panel">
      <button onClick={onClose}>Close Panel</button>
    </div>
  ),
}));

vi.mock("lucide-react", () => ({
  Bell: (props: any) => <span data-testid="bell-icon" {...props} />,
}));

import { NotificationBell } from "./NotificationBell";

describe("NotificationBell", () => {
  beforeEach(() => {
    mockUnreadCount = 0;
  });

  it("renders the bell icon", () => {
    render(<NotificationBell />);

    expect(screen.getByTestId("bell-icon")).toBeTruthy();
  });

  it("renders accessible button with aria-label", () => {
    render(<NotificationBell />);

    const button = screen.getByRole("button", { name: "Notifications" });
    expect(button).toBeTruthy();
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.getAttribute("aria-haspopup")).toBe("true");
  });

  it("does not render unread count badge when count is 0", () => {
    mockUnreadCount = 0;
    render(<NotificationBell />);

    const button = screen.getByRole("button", { name: "Notifications" });
    expect(button.getAttribute("aria-label")).toBe("Notifications");
  });

  it("renders unread count badge when there are unread notifications", () => {
    mockUnreadCount = 5;
    render(<NotificationBell />);

    expect(screen.getByText("5")).toBeTruthy();
    const button = screen.getByRole("button", {
      name: "Notifications (5 unread)",
    });
    expect(button).toBeTruthy();
  });

  it("caps displayed count at 99+", () => {
    mockUnreadCount = 150;
    render(<NotificationBell />);

    expect(screen.getByText("99+")).toBeTruthy();
  });

  it("opens notification panel on click", () => {
    render(<NotificationBell />);

    expect(screen.queryByTestId("notification-panel")).toBeNull();

    const button = screen.getByRole("button", { name: "Notifications" });
    fireEvent.click(button);

    expect(screen.getByTestId("notification-panel")).toBeTruthy();
  });

  it("closes notification panel on second click", () => {
    render(<NotificationBell />);

    const button = screen.getByRole("button", { name: "Notifications" });
    fireEvent.click(button);
    expect(screen.getByTestId("notification-panel")).toBeTruthy();

    fireEvent.click(button);
    expect(screen.queryByTestId("notification-panel")).toBeNull();
  });

  it("has aria-expanded true when panel is open", () => {
    render(<NotificationBell />);

    const button = screen.getByRole("button", { name: "Notifications" });
    fireEvent.click(button);

    expect(button.getAttribute("aria-expanded")).toBe("true");
  });
});
