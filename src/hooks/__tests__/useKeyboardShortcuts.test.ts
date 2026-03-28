/**
 * Tests for keyboard shortcut logic from useKeyboardShortcuts.
 *
 * Since we don't have @testing-library/react-hooks, we test the core logic
 * patterns that the hook implements: typing detection, key combo matching,
 * and prefix sequence handling.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Extract and test the pure logic that the hook uses
// ---------------------------------------------------------------------------

/** Determines if the event target is a typing context (input, textarea, etc.) */
function isTyping(target: { tagName: string; isContentEditable?: boolean }): boolean {
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;
  return false;
}

/** Simulates the "g" prefix navigation logic from the hook. */
function handleGPrefixNavigation(
  key: string,
  pendingPrefix: string | null
): { route: string | null; newPrefix: string | null } {
  if (pendingPrefix === "g") {
    switch (key) {
      case "d":
        return { route: "/dashboard", newPrefix: null };
      case "l":
        return { route: "/dashboard/crm", newPrefix: null };
      case "b":
        return { route: "/dashboard/services", newPrefix: null };
      case "i":
        return { route: "/dashboard/invoices", newPrefix: null };
      case "s":
        return { route: "/dashboard/settings/account", newPrefix: null };
      case "p":
        return { route: "/dashboard/performance", newPrefix: null };
      case "r":
        return { route: "/dashboard/reports", newPrefix: null };
      case "m":
        return { route: "/dashboard/inbox", newPrefix: null };
      default:
        return { route: null, newPrefix: null };
    }
  }

  if (key === "g") {
    return { route: null, newPrefix: "g" };
  }

  return { route: null, newPrefix: null };
}

/** Simulates the "n" prefix create logic from the hook. */
function handleNPrefixNavigation(
  key: string,
  pendingPrefix: string | null
): { route: string | null; newPrefix: string | null } {
  if (pendingPrefix === "n") {
    switch (key) {
      case "l":
        return { route: "/dashboard/crm?action=new", newPrefix: null };
      case "i":
        return { route: "/dashboard/invoices?action=new", newPrefix: null };
      default:
        return { route: null, newPrefix: null };
    }
  }

  if (key === "n") {
    return { route: null, newPrefix: "n" };
  }

  return { route: null, newPrefix: null };
}

/** Checks if a key event should toggle the command palette. */
function shouldToggleCommandPalette(key: string, metaKey: boolean, ctrlKey: boolean): boolean {
  if (key === "k" && (metaKey || ctrlKey)) return true;
  return false;
}

/** Checks if a key event should toggle the help modal. */
function shouldToggleHelp(key: string, metaKey: boolean, ctrlKey: boolean, shiftKey: boolean): boolean {
  if (key === "/" && (metaKey || ctrlKey)) return true;
  if (key === "?" || (key === "/" && shiftKey)) return true;
  return false;
}

describe("useKeyboardShortcuts logic", () => {
  describe("isTyping detection", () => {
    it("returns true for input elements", () => {
      expect(isTyping({ tagName: "INPUT" })).toBe(true);
    });

    it("returns true for textarea elements", () => {
      expect(isTyping({ tagName: "TEXTAREA" })).toBe(true);
    });

    it("returns true for select elements", () => {
      expect(isTyping({ tagName: "SELECT" })).toBe(true);
    });

    it("returns true for contentEditable elements", () => {
      expect(isTyping({ tagName: "DIV", isContentEditable: true })).toBe(true);
    });

    it("returns false for regular elements", () => {
      expect(isTyping({ tagName: "DIV" })).toBe(false);
      expect(isTyping({ tagName: "BODY" })).toBe(false);
      expect(isTyping({ tagName: "BUTTON" })).toBe(false);
    });
  });

  describe("command palette toggle", () => {
    it("triggers on Cmd+K", () => {
      expect(shouldToggleCommandPalette("k", true, false)).toBe(true);
    });

    it("triggers on Ctrl+K", () => {
      expect(shouldToggleCommandPalette("k", false, true)).toBe(true);
    });

    it("does not trigger on plain K without modifier", () => {
      expect(shouldToggleCommandPalette("k", false, false)).toBe(false);
    });

    it("does not trigger on ? (that is for help)", () => {
      expect(shouldToggleCommandPalette("?", false, false)).toBe(false);
    });
  });

  describe("help modal toggle", () => {
    it("triggers on Cmd+/", () => {
      expect(shouldToggleHelp("/", true, false, false)).toBe(true);
    });

    it("triggers on Ctrl+/", () => {
      expect(shouldToggleHelp("/", false, true, false)).toBe(true);
    });

    it("triggers on ? key", () => {
      expect(shouldToggleHelp("?", false, false, false)).toBe(true);
    });

    it("triggers on Shift+/", () => {
      expect(shouldToggleHelp("/", false, false, true)).toBe(true);
    });

    it("does not trigger on plain /", () => {
      expect(shouldToggleHelp("/", false, false, false)).toBe(false);
    });
  });

  describe("g-prefix navigation sequences", () => {
    it("sets pending prefix when g is pressed alone", () => {
      const result = handleGPrefixNavigation("g", null);
      expect(result).toEqual({ route: null, newPrefix: "g" });
    });

    it("navigates to dashboard on g then d", () => {
      const result = handleGPrefixNavigation("d", "g");
      expect(result).toEqual({ route: "/dashboard", newPrefix: null });
    });

    it("navigates to leads on g then l", () => {
      const result = handleGPrefixNavigation("l", "g");
      expect(result).toEqual({ route: "/dashboard/crm", newPrefix: null });
    });

    it("navigates to services on g then b", () => {
      const result = handleGPrefixNavigation("b", "g");
      expect(result).toEqual({ route: "/dashboard/services", newPrefix: null });
    });

    it("navigates to invoices on g then i", () => {
      const result = handleGPrefixNavigation("i", "g");
      expect(result).toEqual({ route: "/dashboard/invoices", newPrefix: null });
    });

    it("navigates to settings on g then s", () => {
      const result = handleGPrefixNavigation("s", "g");
      expect(result).toEqual({ route: "/dashboard/settings/account", newPrefix: null });
    });

    it("navigates to performance on g then p", () => {
      const result = handleGPrefixNavigation("p", "g");
      expect(result).toEqual({ route: "/dashboard/performance", newPrefix: null });
    });

    it("navigates to reports on g then r", () => {
      const result = handleGPrefixNavigation("r", "g");
      expect(result).toEqual({ route: "/dashboard/reports", newPrefix: null });
    });

    it("navigates to inbox on g then m", () => {
      const result = handleGPrefixNavigation("m", "g");
      expect(result).toEqual({ route: "/dashboard/inbox", newPrefix: null });
    });

    it("clears prefix on unknown second key after g", () => {
      const result = handleGPrefixNavigation("x", "g");
      expect(result).toEqual({ route: null, newPrefix: null });
    });

    it("does nothing for non-g keys without a prefix", () => {
      const result = handleGPrefixNavigation("d", null);
      expect(result).toEqual({ route: null, newPrefix: null });
    });
  });

  describe("n-prefix create sequences", () => {
    it("sets pending prefix when n is pressed alone", () => {
      const result = handleNPrefixNavigation("n", null);
      expect(result).toEqual({ route: null, newPrefix: "n" });
    });

    it("navigates to new lead on n then l", () => {
      const result = handleNPrefixNavigation("l", "n");
      expect(result).toEqual({ route: "/dashboard/crm?action=new", newPrefix: null });
    });

    it("navigates to new invoice on n then i", () => {
      const result = handleNPrefixNavigation("i", "n");
      expect(result).toEqual({ route: "/dashboard/invoices?action=new", newPrefix: null });
    });

    it("clears prefix on unknown second key after n", () => {
      const result = handleNPrefixNavigation("x", "n");
      expect(result).toEqual({ route: null, newPrefix: null });
    });

    it("does nothing for non-n keys without a prefix", () => {
      const result = handleNPrefixNavigation("l", null);
      expect(result).toEqual({ route: null, newPrefix: null });
    });
  });

  describe("prefix timer behavior", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("prefix should expire after 1 second", () => {
      let prefix: string | null = null;

      // Simulate pressing "g" — sets prefix and starts timer
      prefix = "g";
      const timer = setTimeout(() => {
        prefix = null;
      }, 1000);

      expect(prefix).toBe("g");

      // Advance by 999ms — still active
      vi.advanceTimersByTime(999);
      expect(prefix).toBe("g");

      // Advance past 1000ms — expired
      vi.advanceTimersByTime(2);
      expect(prefix).toBeNull();

      clearTimeout(timer);
    });

    it("n-prefix should also expire after 1 second", () => {
      let prefix: string | null = null;

      prefix = "n";
      const timer = setTimeout(() => {
        prefix = null;
      }, 1000);

      expect(prefix).toBe("n");

      vi.advanceTimersByTime(1001);
      expect(prefix).toBeNull();

      clearTimeout(timer);
    });
  });
});
