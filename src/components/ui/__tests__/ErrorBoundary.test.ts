 
/**
 * Tests for ErrorBoundary component logic.
 *
 * Since we don't have @testing-library/react in this project, we test the
 * class-level logic directly: getDerivedStateFromError, componentDidCatch
 * behavior, and the reset mechanism.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock external dependencies before importing the module
vi.mock("@/lib/monitoring/report-client-error", () => ({
  reportClientError: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  AlertCircle: "AlertCircle",
  RotateCcw: "RotateCcw",
}));

// We need to import after mocks are set up
import { ErrorBoundary } from "../ErrorBoundary";
import { reportClientError } from "@/lib/monitoring/report-client-error";

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("getDerivedStateFromError", () => {
    it("returns hasError true and captures the error object", () => {
      const error = new Error("test failure");
      const state = ErrorBoundary.getDerivedStateFromError(error);

      expect(state).toEqual({ hasError: true, error });
    });

    it("works with errors that have no message", () => {
      const error = new Error();
      const state = ErrorBoundary.getDerivedStateFromError(error);

      expect(state.hasError).toBe(true);
      expect(state.error).toBe(error);
    });
  });

  describe("componentDidCatch behavior", () => {
    it("calls onError callback when provided", () => {
      const onError = vi.fn();
      const error = new Error("component crash");
      const errorInfo = { componentStack: "<App>\n  <Child>" } as React.ErrorInfo;

      const instance = new ErrorBoundary({ children: null, onError });
      instance.componentDidCatch(error, errorInfo);

      expect(onError).toHaveBeenCalledWith(error, errorInfo);
    });

    it("reports error to monitoring via reportClientError", () => {
      const error = new Error("render failure");
      error.stack = "Error: render failure\n  at Child";
      const errorInfo = { componentStack: "<App>" } as React.ErrorInfo;

      const instance = new ErrorBoundary({ children: null });
      instance.componentDidCatch(error, errorInfo);

      expect(reportClientError).toHaveBeenCalledWith({
        message: "render failure",
        stack: error.stack,
        componentStack: "<App>",
        boundary: "ErrorBoundary",
      });
    });

    it("does not crash if onError callback throws", () => {
      const onError = vi.fn(() => {
        throw new Error("callback exploded");
      });
      const error = new Error("original error");
      const errorInfo = { componentStack: "" } as React.ErrorInfo;

      const instance = new ErrorBoundary({ children: null, onError });

      // Should not throw
      expect(() => instance.componentDidCatch(error, errorInfo)).not.toThrow();
    });

    it("logs error to console.error", () => {
      const error = new Error("logged error");
      const errorInfo = { componentStack: "<Stack>" } as React.ErrorInfo;

      const instance = new ErrorBoundary({ children: null });
      instance.componentDidCatch(error, errorInfo);

      expect(console.error).toHaveBeenCalledWith(
        "[ErrorBoundary] Component error:",
        error,
        "<Stack>"
      );
    });
  });

  describe("state management", () => {
    it("initializes with hasError false and error null", () => {
      const instance = new ErrorBoundary({ children: null });
      expect(instance.state).toEqual({ hasError: false, error: null });
    });

    it("handleReset resets state back to no-error", () => {
      const instance = new ErrorBoundary({ children: null });

      // Simulate error state
      instance.state = { hasError: true, error: new Error("boom") };

      // The handleReset is a private arrow function property, but it calls setState.
      // We can access it via the instance since arrow functions are own properties.
      const setStateSpy = vi.fn();
      instance.setState = setStateSpy;

      // Access the private method via any
      (instance as any).handleReset();

      expect(setStateSpy).toHaveBeenCalledWith({ hasError: false, error: null });
    });
  });

  describe("render logic", () => {
    it("returns children when there is no error", () => {
      const children = "child content";
      const instance = new ErrorBoundary({ children });
      instance.state = { hasError: false, error: null };

      const result = instance.render();
      expect(result).toBe(children);
    });

    it("calls function fallback with error and reset when error occurs", () => {
      const fallbackFn = vi.fn().mockReturnValue("fallback-ui");
      const error = new Error("crash");
      const instance = new ErrorBoundary({ children: null, fallback: fallbackFn });
      instance.state = { hasError: true, error };

      const result = instance.render();

      expect(fallbackFn).toHaveBeenCalledWith({
        error,
        reset: expect.any(Function),
      });
      expect(result).toBe("fallback-ui");
    });

    it("renders static fallback node when provided as non-function", () => {
      const staticFallback = "static-fallback";
      const instance = new ErrorBoundary({
        children: null,
        fallback: staticFallback,
      });
      instance.state = { hasError: true, error: new Error("crash") };

      const result = instance.render();
      expect(result).toBe(staticFallback);
    });
  });
});
