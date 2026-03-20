import { describe, it, expect, vi } from "vitest";

// Mock external dependencies before importing
vi.mock("@/lib/email-queue", () => ({
  queueEmail: vi.fn().mockResolvedValue("queue-id-123"),
}));

vi.mock("@/lib/fetch-with-timeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const { escapeHtml, isValidEmail, safeHttpUrl, emailFooter } = await import(
  "./email"
);

// ── escapeHtml ───────────────────────────────────────────────

describe("escapeHtml", () => {
  it("escapes ampersands", () => {
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("escapes less-than signs", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes greater-than signs", () => {
    expect(escapeHtml("a > b")).toBe("a &gt; b");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("escapes all special characters in combination", () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;"
    );
  });

  it("returns empty string for empty input", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("leaves safe text unchanged", () => {
    expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
  });

  it("handles XSS attack vectors", () => {
    const xss = '<img src=x onerror="alert(1)">';
    const result = escapeHtml(xss);
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
    expect(result).toContain("&lt;");
  });

  it("escapes multiple ampersands correctly (no double-escaping in single call)", () => {
    expect(escapeHtml("A & B & C")).toBe("A &amp; B &amp; C");
  });
});

// ── isValidEmail ─────────────────────────────────────────────

describe("isValidEmail", () => {
  it("accepts valid email addresses", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("first.last@domain.org")).toBe(true);
    expect(isValidEmail("user+tag@sub.domain.com")).toBe(true);
    expect(isValidEmail("a@b.co")).toBe(true);
  });

  it("rejects emails without @", () => {
    expect(isValidEmail("userexample.com")).toBe(false);
  });

  it("rejects emails without domain dot", () => {
    expect(isValidEmail("user@domain")).toBe(false);
  });

  it("rejects emails with spaces", () => {
    expect(isValidEmail("user @example.com")).toBe(false);
    expect(isValidEmail("user@ example.com")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });

  it("rejects excessively long emails (>254 chars)", () => {
    const longLocal = "a".repeat(250);
    expect(isValidEmail(`${longLocal}@b.com`)).toBe(false);
  });

  it("accepts email at exactly 254 characters", () => {
    // local@domain.com = local(247) + @(1) + domain(3) + .(1) + com(3) = 255
    // We need exactly 254: local(244) + @ + d.com(5) = 250... let's compute:
    // total = local.length + 1(@) + domain part length
    // 254 = local.length + 1 + 5 (d.com) => local = 248
    const local = "a".repeat(248);
    const email = `${local}@d.com`; // 248 + 1 + 5 = 254
    expect(email.length).toBe(254);
    expect(isValidEmail(email)).toBe(true);
  });

  it("rejects double @ signs", () => {
    expect(isValidEmail("user@@domain.com")).toBe(false);
  });

  it("rejects @-only input", () => {
    expect(isValidEmail("@")).toBe(false);
  });
});

// ── safeHttpUrl ──────────────────────────────────────────────

describe("safeHttpUrl", () => {
  it("accepts http URLs", () => {
    expect(safeHttpUrl("http://example.com")).toBe("http://example.com");
  });

  it("accepts https URLs", () => {
    expect(safeHttpUrl("https://example.com/path")).toBe(
      "https://example.com/path"
    );
  });

  it("accepts HTTP with uppercase", () => {
    expect(safeHttpUrl("HTTP://EXAMPLE.COM")).toBe("HTTP://EXAMPLE.COM");
  });

  it("rejects javascript: protocol", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBe("#");
  });

  it("rejects data: protocol", () => {
    expect(safeHttpUrl("data:text/html,<h1>evil</h1>")).toBe("#");
  });

  it("rejects empty string", () => {
    expect(safeHttpUrl("")).toBe("#");
  });

  it("rejects relative paths", () => {
    expect(safeHttpUrl("/relative/path")).toBe("#");
  });

  it("rejects ftp protocol", () => {
    expect(safeHttpUrl("ftp://files.example.com")).toBe("#");
  });

  it("rejects mailto protocol", () => {
    expect(safeHttpUrl("mailto:user@example.com")).toBe("#");
  });

  it("rejects vbscript protocol", () => {
    expect(safeHttpUrl("vbscript:MsgBox")).toBe("#");
  });
});

// ── emailFooter ──────────────────────────────────────────────

describe("emailFooter", () => {
  it("returns footer without unsubscribe link when no URL given", () => {
    const footer = emailFooter();
    expect(footer).toContain("Sovereign AI, Inc.");
    expect(footer).not.toContain("Unsubscribe");
  });

  it("includes unsubscribe link when URL is provided", () => {
    const footer = emailFooter("https://example.com/unsubscribe");
    expect(footer).toContain("Sovereign AI, Inc.");
    expect(footer).toContain("Unsubscribe");
    expect(footer).toContain("https://example.com/unsubscribe");
  });
});
