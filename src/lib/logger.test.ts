import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@sentry/core", () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}));

import {
  logger,
  redactContext,
  scrubMessage,
  maskEmail,
  maskPhone,
} from "./logger";

// ---------------------------------------------------------------------------
// PII masking: maskEmail
// ---------------------------------------------------------------------------

describe("maskEmail", () => {
  it("masks a standard email address", () => {
    expect(maskEmail("user@example.com")).toBe("u***@e***.com");
  });

  it("masks a single-char local part", () => {
    expect(maskEmail("a@example.com")).toBe("a***@e***.com");
  });

  it("returns fallback for malformed email without @", () => {
    expect(maskEmail("notanemail")).toBe("***@***");
  });

  it("returns fallback when @ is the first character", () => {
    expect(maskEmail("@example.com")).toBe("***@***");
  });

  it("handles domain without a dot", () => {
    expect(maskEmail("user@localhost")).toBe("u***@***");
  });

  it("preserves the TLD", () => {
    const masked = maskEmail("info@company.co.uk");
    expect(masked).toMatch(/\.uk$/);
  });
});

// ---------------------------------------------------------------------------
// PII masking: maskPhone
// ---------------------------------------------------------------------------

describe("maskPhone", () => {
  it("masks a US phone number with country code", () => {
    expect(maskPhone("+15551234567")).toBe("+***4567");
  });

  it("masks a phone number without country code prefix", () => {
    expect(maskPhone("5551234567")).toBe("***4567");
  });

  it("returns *** for very short numbers", () => {
    expect(maskPhone("123")).toBe("***");
  });

  it("masks a formatted phone number", () => {
    expect(maskPhone("+1 (555) 123-4567")).toBe("+***4567");
  });
});

// ---------------------------------------------------------------------------
// scrubMessage
// ---------------------------------------------------------------------------

describe("scrubMessage", () => {
  it("masks email addresses embedded in a message", () => {
    const result = scrubMessage("Contact user@example.com for help");
    expect(result).not.toContain("user@example.com");
    expect(result).toContain("u***@e***.com");
  });

  it("masks phone numbers embedded in a message", () => {
    const result = scrubMessage("Call +15551234567 now");
    expect(result).not.toContain("+15551234567");
    expect(result).toContain("***");
  });

  it("leaves messages without PII unchanged", () => {
    const msg = "Server started on port 3000";
    expect(scrubMessage(msg)).toBe(msg);
  });

  it("masks multiple emails in one message", () => {
    const result = scrubMessage("From a@b.com to c@d.com");
    expect(result).not.toContain("a@b.com");
    expect(result).not.toContain("c@d.com");
  });
});

// ---------------------------------------------------------------------------
// redactContext
// ---------------------------------------------------------------------------

describe("redactContext", () => {
  it("fully redacts secret keys", () => {
    const ctx = { password: "s3cret", apiKey: "abc123", token: "tok" };
    const result = redactContext(ctx);
    expect(result.password).toBe("[REDACTED]");
    expect(result.apiKey).toBe("[REDACTED]");
    expect(result.token).toBe("[REDACTED]");
  });

  it("masks email values", () => {
    const ctx = { email: "user@example.com" };
    const result = redactContext(ctx);
    expect(result.email).toBe("u***@e***.com");
  });

  it("masks phone values", () => {
    const ctx = { phone: "+15551234567" };
    const result = redactContext(ctx);
    expect(result.phone).toBe("+***4567");
  });

  it("masks IP address values", () => {
    const ctx = { ip: "192.168.1.42" };
    const result = redactContext(ctx);
    expect(result.ip).toBe("192.168.x.x");
  });

  it("masks ipAddress key", () => {
    const ctx = { ipAddress: "10.0.0.1" };
    const result = redactContext(ctx);
    expect(result.ipAddress).toBe("10.0.x.x");
  });

  it("recurses into nested objects", () => {
    const ctx = {
      user: {
        email: "deep@nested.com",
        password: "hunter2",
      },
    };
    const result = redactContext(ctx) as Record<string, Record<string, unknown>>;
    expect(result.user.email).toBe("d***@n***.com");
    expect(result.user.password).toBe("[REDACTED]");
  });

  it("passes through non-sensitive keys unchanged", () => {
    const ctx = { status: "active", count: 42 };
    const result = redactContext(ctx);
    expect(result.status).toBe("active");
    expect(result.count).toBe(42);
  });

  it("does not mutate the original object", () => {
    const original = { password: "secret", name: "test" };
    const copy = { ...original };
    redactContext(original);
    expect(original).toEqual(copy);
  });

  it("handles empty PII string values gracefully", () => {
    const ctx = { email: "" };
    const result = redactContext(ctx);
    // Empty string is not masked (length check)
    expect(result.email).toBe("");
  });

  it("handles non-string PII values gracefully", () => {
    const ctx = { email: 42 };
    const result = redactContext(ctx as unknown as Record<string, unknown>);
    // Non-string values pass through as-is
    expect(result.email).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// logger methods
// ---------------------------------------------------------------------------

describe("logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  it("logger.info calls console.info", () => {
    logger.info("test message");
    expect(console.info).toHaveBeenCalledTimes(1);
  });

  it("logger.warn calls console.warn", () => {
    logger.warn("warning");
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("logger.error calls console.error", () => {
    logger.error("error occurred");
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it("logger.info redacts PII in context", () => {
    logger.info("User login", { email: "user@example.com" });
    const logOutput = (console.info as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(logOutput).not.toContain("user@example.com");
    expect(logOutput).toContain("u***@e***.com");
  });

  it("logger.info scrubs PII from the message string", () => {
    logger.info("Login from user@example.com");
    const logOutput = (console.info as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(logOutput).not.toContain("user@example.com");
  });

  it("logger.errorWithCause serializes the error", () => {
    const err = new Error("db connection failed");
    logger.errorWithCause("Query failed", err, { query: "SELECT 1" });
    expect(console.error).toHaveBeenCalled();
    const logOutput = (console.error as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(logOutput).toContain("Query failed");
  });

  it("logger.errorWithCause handles non-Error values", () => {
    logger.errorWithCause("Unknown failure", "some string error");
    expect(console.error).toHaveBeenCalled();
  });

  it("logger.warnWithCause logs warning with serialized error", () => {
    logger.warnWithCause("Retry needed", new Error("timeout"), {
      attempt: 3,
    });
    expect(console.warn).toHaveBeenCalled();
  });
});
