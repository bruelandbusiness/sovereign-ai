import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks (hoisted above imports)
// ---------------------------------------------------------------------------

const mockMessagesCreate = vi.fn();
const mockCallsCreate = vi.fn();
const mockValidateRequest = vi.fn();

vi.mock("twilio", () => {
  const twilioFactory = vi.fn(() => ({
    messages: { create: mockMessagesCreate },
    calls: { create: mockCallsCreate },
  }));
  // Attach validateRequest as a static method
  (twilioFactory as unknown as Record<string, unknown>).validateRequest = mockValidateRequest;
  return { default: twilioFactory };
});

vi.mock("@/lib/compliance", () => ({
  canSendSms: vi.fn(),
  canMakeCall: vi.fn(),
}));

vi.mock("@/lib/compliance/tcpa", () => ({
  logContactAttempt: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    errorWithCause: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Helpers to dynamically import the module with controlled env vars
// ---------------------------------------------------------------------------

async function importTwilioModule(envOverrides: Record<string, string | undefined> = {}) {
  // Reset module registry so each test gets a fresh singleton
  vi.resetModules();

  // Set env defaults for a "configured" Twilio
  process.env.TWILIO_ACCOUNT_SID = envOverrides.TWILIO_ACCOUNT_SID ?? "ACtest1234567890abcdef1234567890ab";
  process.env.TWILIO_AUTH_TOKEN = envOverrides.TWILIO_AUTH_TOKEN ?? "test-auth-token";
  process.env.TWILIO_PHONE_NUMBER = envOverrides.TWILIO_PHONE_NUMBER ?? "+15550001111";
  if (envOverrides.NODE_ENV !== undefined) {
     
    (process.env as any).NODE_ENV = envOverrides.NODE_ENV;
  }

  const mod = await import("../twilio");
  return mod;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("isValidPhoneNumber", () => {
  let isValidPhoneNumber: (phone: string) => boolean;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await importTwilioModule();
    isValidPhoneNumber = mod.isValidPhoneNumber;
  });

  it("accepts valid E.164 US number", () => {
    expect(isValidPhoneNumber("+15551234567")).toBe(true);
  });

  it("accepts valid E.164 UK number", () => {
    expect(isValidPhoneNumber("+447911123456")).toBe(true);
  });

  it("accepts number with minimum 10 digits", () => {
    // +1 followed by 9 more digits = 10 total
    expect(isValidPhoneNumber("+1234567890")).toBe(true);
  });

  it("accepts number with maximum 15 digits", () => {
    expect(isValidPhoneNumber("+123456789012345")).toBe(true);
  });

  it("rejects number without + prefix", () => {
    expect(isValidPhoneNumber("15551234567")).toBe(false);
  });

  it("rejects number starting with +0", () => {
    expect(isValidPhoneNumber("+0551234567")).toBe(false);
  });

  it("rejects number with too few digits", () => {
    expect(isValidPhoneNumber("+123456789")).toBe(false);
  });

  it("rejects number with too many digits", () => {
    expect(isValidPhoneNumber("+1234567890123456")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidPhoneNumber("")).toBe(false);
  });

  it("rejects letters", () => {
    expect(isValidPhoneNumber("+1555abc4567")).toBe(false);
  });

  it("strips spaces and parens before validation", () => {
    expect(isValidPhoneNumber("+1 (555) 123-4567")).toBe(true);
  });
});

describe("sendSms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success with messageSid on valid send", async () => {
    mockMessagesCreate.mockResolvedValue({ sid: "SM123" });
    const mod = await importTwilioModule();

    const result = await mod.sendSms("+15551234567", "Hello");

    expect(result).toEqual({ success: true, messageSid: "SM123" });
    expect(mockMessagesCreate).toHaveBeenCalledWith({
      to: "+15551234567",
      from: "+15550001111",
      body: "Hello",
    });
  });

  it("rejects invalid phone number without calling Twilio", async () => {
    const mod = await importTwilioModule();

    const result = await mod.sendSms("bad-number", "Hello");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid phone number");
    expect(mockMessagesCreate).not.toHaveBeenCalled();
  });

  it("rejects message exceeding max length (1600 chars)", async () => {
    const mod = await importTwilioModule();
    const longBody = "x".repeat(1601);

    const result = await mod.sendSms("+15551234567", longBody);

    expect(result.success).toBe(false);
    expect(result.error).toContain("exceeds maximum length");
    expect(mockMessagesCreate).not.toHaveBeenCalled();
  });

  it("blocks send when compliance check fails", async () => {
    const { canSendSms } = await import("@/lib/compliance");
    vi.mocked(canSendSms).mockResolvedValue({
      allowed: false,
      reason: "No consent",
      checks: [],
    });

    const mod = await importTwilioModule();
    const result = await mod.sendSms("+15551234567", "Hi", "client-1");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Compliance");
    expect(mockMessagesCreate).not.toHaveBeenCalled();
  });

  it("logs contact attempt when compliance passes with clientId", async () => {
    const { canSendSms } = await import("@/lib/compliance");
    const { logContactAttempt } = await import("@/lib/compliance/tcpa");
    vi.mocked(canSendSms).mockResolvedValue({
      allowed: true,
      checks: [],
    });
    mockMessagesCreate.mockResolvedValue({ sid: "SM456" });

    const mod = await importTwilioModule();
    await mod.sendSms("+15551234567", "Hi", "client-1");

    expect(logContactAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "client-1",
        contactPhone: "+15551234567",
        channel: "sms",
        status: "sent",
      })
    );
  });

  it("returns error when Twilio is not configured", async () => {
    const mod = await importTwilioModule({
      TWILIO_ACCOUNT_SID: "",
      TWILIO_AUTH_TOKEN: "",
    });

    const result = await mod.sendSms("+15551234567", "Hello");

    expect(result).toEqual({ success: false, error: "Twilio not configured" });
  });

  it("returns error when Twilio API throws", async () => {
    mockMessagesCreate.mockRejectedValue(new Error("Network error"));
    const mod = await importTwilioModule();

    const result = await mod.sendSms("+15551234567", "Hello");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Network error");
  });
});

describe("makeCall", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns callSid on success", async () => {
    mockCallsCreate.mockResolvedValue({ sid: "CA789" });
    const mod = await importTwilioModule();

    const result = await mod.makeCall("+15551234567", "https://example.com/twiml");

    expect(result).toEqual({ callSid: "CA789" });
    expect(mockCallsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "+15551234567",
        from: "+15550001111",
        url: "https://example.com/twiml",
        timeLimit: 1800,
        record: false,
      })
    );
  });

  it("returns null when client is not configured", async () => {
    const mod = await importTwilioModule({
      TWILIO_ACCOUNT_SID: "",
      TWILIO_AUTH_TOKEN: "",
    });

    const result = await mod.makeCall("+15551234567", "https://example.com/twiml");

    expect(result).toBeNull();
  });

  it("blocks call when compliance check fails", async () => {
    const { canMakeCall } = await import("@/lib/compliance");
    vi.mocked(canMakeCall).mockResolvedValue({
      allowed: false,
      reason: "DNC list",
      checks: [],
    });

    const mod = await importTwilioModule();
    const result = await mod.makeCall("+15551234567", "https://example.com/twiml", {
      clientId: "client-1",
    });

    expect(result).toBeNull();
    expect(mockCallsCreate).not.toHaveBeenCalled();
  });

  it("respects custom timeLimit and record options", async () => {
    mockCallsCreate.mockResolvedValue({ sid: "CA000" });
    const mod = await importTwilioModule();

    await mod.makeCall("+15551234567", "https://example.com/twiml", {
      timeLimit: 600,
      record: true,
    });

    expect(mockCallsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        timeLimit: 600,
        record: true,
      })
    );
  });
});

describe("validateTwilioSignature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when Twilio validateRequest returns true", async () => {
    mockValidateRequest.mockReturnValue(true);
    const mod = await importTwilioModule();

    const result = mod.validateTwilioSignature(
      "https://example.com/webhook",
      { Body: "test" },
      "valid-sig"
    );

    expect(result).toBe(true);
    expect(mockValidateRequest).toHaveBeenCalledWith(
      "test-auth-token",
      "valid-sig",
      "https://example.com/webhook",
      { Body: "test" }
    );
  });

  it("returns false when Twilio validateRequest returns false", async () => {
    mockValidateRequest.mockReturnValue(false);
    const mod = await importTwilioModule();

    const result = mod.validateTwilioSignature(
      "https://example.com/webhook",
      {},
      "bad-sig"
    );

    expect(result).toBe(false);
  });

  it("returns false in production when auth token is missing", async () => {
    const mod = await importTwilioModule({
      TWILIO_AUTH_TOKEN: "",
      TWILIO_ACCOUNT_SID: "",
      NODE_ENV: "production",
    });

    const result = mod.validateTwilioSignature("https://example.com", {}, "sig");

    expect(result).toBe(false);
  });

  it("returns true in dev when auth token is missing (skips validation)", async () => {
    const mod = await importTwilioModule({
      TWILIO_AUTH_TOKEN: "",
      TWILIO_ACCOUNT_SID: "",
      NODE_ENV: "development",
    });

    const result = mod.validateTwilioSignature("https://example.com", {}, "sig");

    expect(result).toBe(true);
  });
});

describe("signedRecordingUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty string for empty input", async () => {
    const mod = await importTwilioModule();
    expect(mod.signedRecordingUrl("")).toBe("");
  });

  it("extracts recording SID and returns proxied URL", async () => {
    const mod = await importTwilioModule();
    const url = mod.signedRecordingUrl(
      "https://api.twilio.com/2010-04-01/Accounts/AC123/Recordings/REabcdef1234567890abcdef1234567890"
    );
    expect(url).toContain("/api/services/voice/recording?sid=REabcdef1234567890abcdef1234567890");
  });

  it("returns original URL when no recording SID found", async () => {
    const mod = await importTwilioModule();
    const original = "https://example.com/some-other-url";
    expect(mod.signedRecordingUrl(original)).toBe(original);
  });
});
