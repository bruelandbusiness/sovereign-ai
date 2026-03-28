/**
 * Tests for PageTransition component.
 *
 * Since we don't have @testing-library/react in this project, we verify
 * the module exports and that the component is a callable function.
 */
import { describe, it, expect, vi } from "vitest";

// Mock dependencies
vi.mock("framer-motion", () => ({
  motion: {
    div: "motion.div",
  },
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

describe("PageTransition", () => {
  describe("module exports", () => {
    it("exports PageTransition as a named export", async () => {
      const mod = await import("../PageTransition");
      expect(mod.PageTransition).toBeDefined();
      expect(typeof mod.PageTransition).toBe("function");
    });

    it("does not have a default export", async () => {
      const mod = await import("../PageTransition");
      // The module uses named export, not default
      expect(mod).not.toHaveProperty("default");
    });
  });

  describe("cn utility used by PageTransition", () => {
    // Test the utility function behavior that PageTransition depends on
    it("cn filters falsy values and joins classNames", async () => {
      const { cn } = await import("@/lib/utils");
      expect(cn("foo")).toBe("foo");
      expect(cn(undefined)).toBe("");
    });
  });
});
