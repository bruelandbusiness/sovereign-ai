import { describe, it, expect } from "vitest";

// These are pure functions exported from email.ts — no mocking needed.
import { escapeHtml, isValidEmail, safeHttpUrl } from "@/lib/email";

// ---------------------------------------------------------------------------
// escapeHtml
// ---------------------------------------------------------------------------

describe("escapeHtml", () => {
  it("escapes all five special HTML characters", () => {
    const input = `<div class="x" data-val='a&b'>`;
    const result = escapeHtml(input);
    expect(result).toBe(
      "&lt;div class=&quot;x&quot; data-val=&#39;a&amp;b&#39;&gt;"
    );
  });

  it("returns an empty string unchanged", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("leaves plain text without special characters unchanged", () => {
    expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
  });

  it("handles a string composed entirely of special characters", () => {
    expect(escapeHtml(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
  });

  it("handles multiple consecutive ampersands", () => {
    expect(escapeHtml("a&&b")).toBe("a&amp;&amp;b");
  });
});

// ---------------------------------------------------------------------------
// isValidEmail
// ---------------------------------------------------------------------------

describe("isValidEmail", () => {
  it("accepts a standard email address", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
  });

  it("accepts an email with subdomain", () => {
    expect(isValidEmail("admin@mail.example.co.uk")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });

  it("rejects a string without @", () => {
    expect(isValidEmail("userexample.com")).toBe(false);
  });

  it("rejects a string with multiple @ symbols", () => {
    expect(isValidEmail("user@@example.com")).toBe(false);
  });

  it("rejects when the domain part has no dot", () => {
    expect(isValidEmail("user@localhost")).toBe(false);
  });

  it("rejects an email with spaces", () => {
    expect(isValidEmail("user @example.com")).toBe(false);
  });

  it("rejects an email longer than 254 characters", () => {
    const longLocal = "a".repeat(250);
    expect(isValidEmail(`${longLocal}@example.com`)).toBe(false);
  });

  it("accepts email with trailing dot in domain (basic validation allows it)", () => {
    // Documents current behavior — the simple validator only checks for the
    // presence of a dot in the domain, not trailing-dot correctness.
    expect(isValidEmail("user@example.com.")).toBe(true);
  });

  it("accepts email with plus addressing", () => {
    expect(isValidEmail("user+tag@example.com")).toBe(true);
  });

  it("accepts email with dots in local part", () => {
    expect(isValidEmail("first.last@example.com")).toBe(true);
  });

  it("rejects email with no local part", () => {
    expect(isValidEmail("@example.com")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// safeHttpUrl
// ---------------------------------------------------------------------------

describe("safeHttpUrl", () => {
  it("passes through an https URL unchanged", () => {
    expect(safeHttpUrl("https://example.com/path")).toBe(
      "https://example.com/path"
    );
  });

  it("passes through an http URL unchanged", () => {
    expect(safeHttpUrl("http://localhost:3000")).toBe("http://localhost:3000");
  });

  it('returns "#" for a javascript: protocol URL', () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBe("#");
  });

  it('returns "#" for a data: protocol URL', () => {
    expect(safeHttpUrl("data:text/html,<h1>hi</h1>")).toBe("#");
  });

  it('returns "#" for an empty string', () => {
    expect(safeHttpUrl("")).toBe("#");
  });

  it("is case-insensitive for the protocol check", () => {
    expect(safeHttpUrl("HTTPS://EXAMPLE.COM")).toBe("HTTPS://EXAMPLE.COM");
  });

  it('returns "#" for a relative path (no protocol)', () => {
    expect(safeHttpUrl("/some/path")).toBe("#");
  });
});
