/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mocks — available at vi.mock() factory time
// ---------------------------------------------------------------------------
const { mockPrisma, mockRequireClient, mockCompliance, mockDiscovery, mockOutreach, mockClassifyReply, mockRateLimit, HoistedAuthError } =
  vi.hoisted(() => {
    class HoistedAuthError extends Error {
      status: number;
      constructor(message: string, status: number) {
        super(message);
        this.status = status;
      }
    }
    return {
      HoistedAuthError,
      mockPrisma: {
        prospectLead: { create: vi.fn() },
        outreachSequence: { findUnique: vi.fn() },
        followUpSequence: { findFirst: vi.fn() },
      },
      mockRequireClient: vi.fn(),
      mockCompliance: {
        canSendEmail: vi.fn(),
        canSendSms: vi.fn(),
        canMakeCall: vi.fn(),
      },
      mockDiscovery: {
        runDiscoveryForClient: vi.fn(),
      },
      mockOutreach: {
        enrollInSequence: vi.fn(),
      },
      mockClassifyReply: vi.fn(),
      mockRateLimit: vi.fn(),
    };
  });

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/require-client", () => ({
  requireClient: mockRequireClient,
  AuthError: HoistedAuthError,
  getErrorMessage: (e: unknown) => (e instanceof Error ? e.message : String(e)),
}));

vi.mock("@/lib/compliance", () => mockCompliance);

vi.mock("@/lib/discovery", () => mockDiscovery);

vi.mock("@/lib/outreach", () => mockOutreach);

vi.mock("@/lib/followup/reply-classifier", () => ({
  classifyReply: mockClassifyReply,
}));

vi.mock("@/lib/followup", () => ({
  enrollInFollowUp: vi.fn(),
}));

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...original,
    rateLimitByIP: mockRateLimit,
  };
});

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
// Lazy route imports (after mocks are wired)
// ---------------------------------------------------------------------------
const complianceRoute = () => import("@/app/api/compliance/check/route");
const discoveryRoute = () => import("@/app/api/discovery/run/route");
const outreachRoute = () => import("@/app/api/outreach/enroll/route");
const followupRoute = () => import("@/app/api/followup/classify/route");
const leadsRoute = () => import("@/app/api/leads/capture/route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(
  url: string,
  body: unknown,
  headers?: Record<string, string>,
): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const CLIENT_ID = "client_test_123";
const ACCOUNT_ID = "account_test_456";

function authenticatedSession() {
  mockRequireClient.mockResolvedValue({
    clientId: CLIENT_ID,
    accountId: ACCOUNT_ID,
    session: { account: { id: ACCOUNT_ID, client: { id: CLIENT_ID } } },
  });
}

function unauthenticated() {
  mockRequireClient.mockRejectedValue(new HoistedAuthError("Unauthorized", 401));
}

// ---------------------------------------------------------------------------
// Reset all mocks between tests
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  // Default: rate limiter allows requests
  mockRateLimit.mockReturnValue({ allowed: true, remaining: 9 });
});

// ===========================================================================
// 1. POST /api/compliance/check
// ===========================================================================
describe("POST /api/compliance/check", () => {
  const url = "http://localhost/api/compliance/check";

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { POST } = await complianceRoute();
    const res = await POST(makeRequest(url, { channel: "email", contactEmail: "a@b.com" }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  it("returns 400 when channel is missing", async () => {
    authenticatedSession();
    const { POST } = await complianceRoute();
    const res = await POST(makeRequest(url, {}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
    expect(json).toHaveProperty("details");
  });

  it("returns 400 when channel is invalid enum value", async () => {
    authenticatedSession();
    const { POST } = await complianceRoute();
    const res = await POST(makeRequest(url, { channel: "pigeon" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when email channel lacks contactEmail", async () => {
    authenticatedSession();
    mockCompliance.canSendEmail.mockResolvedValue({ allowed: true });
    const { POST } = await complianceRoute();
    const res = await POST(makeRequest(url, { channel: "email" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("contactEmail");
  });

  it("returns 400 when sms channel lacks contactPhone", async () => {
    authenticatedSession();
    const { POST } = await complianceRoute();
    const res = await POST(makeRequest(url, { channel: "sms" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("contactPhone");
  });

  it("returns 400 when voice channel lacks contactPhone", async () => {
    authenticatedSession();
    const { POST } = await complianceRoute();
    const res = await POST(makeRequest(url, { channel: "voice" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("contactPhone");
  });

  it("returns 200 with compliance result for email channel", async () => {
    authenticatedSession();
    const complianceResult = { allowed: true, reason: null };
    mockCompliance.canSendEmail.mockResolvedValue(complianceResult);
    const { POST } = await complianceRoute();
    const res = await POST(
      makeRequest(url, { channel: "email", contactEmail: "user@test.com" }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(complianceResult);
    expect(mockCompliance.canSendEmail).toHaveBeenCalledWith(CLIENT_ID, "user@test.com", undefined);
  });

  it("returns 200 with compliance result for sms channel", async () => {
    authenticatedSession();
    const complianceResult = { allowed: false, reason: "no consent" };
    mockCompliance.canSendSms.mockResolvedValue(complianceResult);
    const { POST } = await complianceRoute();
    const res = await POST(
      makeRequest(url, { channel: "sms", contactPhone: "+15551234567" }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(complianceResult);
  });

  it("returns 200 with compliance result for voice channel", async () => {
    authenticatedSession();
    const complianceResult = { allowed: true };
    mockCompliance.canMakeCall.mockResolvedValue(complianceResult);
    const { POST } = await complianceRoute();
    const res = await POST(
      makeRequest(url, { channel: "voice", contactPhone: "+15551234567" }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(complianceResult);
  });
});

// ===========================================================================
// 2. POST /api/discovery/run
// ===========================================================================
describe("POST /api/discovery/run", () => {
  const url = "http://localhost/api/discovery/run";

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { POST } = await discoveryRoute();
    const res = await POST();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  it("returns 200 with success and result on valid request", async () => {
    authenticatedSession();
    const discoveryResult = { leadsFound: 5, sources: ["google", "yelp"] };
    mockDiscovery.runDiscoveryForClient.mockResolvedValue(discoveryResult);
    const { POST } = await discoveryRoute();
    const res = await POST();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.leadsFound).toBe(5);
    expect(json.sources).toEqual(["google", "yelp"]);
  });

  it("calls runDiscoveryForClient with the authenticated clientId", async () => {
    authenticatedSession();
    mockDiscovery.runDiscoveryForClient.mockResolvedValue({});
    const { POST } = await discoveryRoute();
    await POST();
    expect(mockDiscovery.runDiscoveryForClient).toHaveBeenCalledWith(CLIENT_ID);
  });

  it("returns 500 when discovery throws", async () => {
    authenticatedSession();
    mockDiscovery.runDiscoveryForClient.mockRejectedValue(new Error("boom"));
    const { POST } = await discoveryRoute();
    const res = await POST();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Discovery run failed");
  });
});

// ===========================================================================
// 3. POST /api/outreach/enroll
// ===========================================================================
describe("POST /api/outreach/enroll", () => {
  const url = "http://localhost/api/outreach/enroll";

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { POST } = await outreachRoute();
    const res = await POST(makeRequest(url, { sequenceId: "seq_1", contactEmail: "a@b.com" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when sequenceId is missing", async () => {
    authenticatedSession();
    const { POST } = await outreachRoute();
    const res = await POST(makeRequest(url, { contactEmail: "a@b.com" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 400 when sequenceId is empty string", async () => {
    authenticatedSession();
    const { POST } = await outreachRoute();
    const res = await POST(makeRequest(url, { sequenceId: "", contactEmail: "a@b.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when sequence does not exist", async () => {
    authenticatedSession();
    mockPrisma.outreachSequence.findUnique.mockResolvedValue(null);
    const { POST } = await outreachRoute();
    const res = await POST(
      makeRequest(url, { sequenceId: "seq_missing", contactEmail: "a@b.com" }),
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Sequence not found");
  });

  it("returns 404 when sequence belongs to a different client", async () => {
    authenticatedSession();
    mockPrisma.outreachSequence.findUnique.mockResolvedValue({
      clientId: "other_client",
      isActive: true,
    });
    const { POST } = await outreachRoute();
    const res = await POST(
      makeRequest(url, { sequenceId: "seq_1", contactEmail: "a@b.com" }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 when sequence is inactive", async () => {
    authenticatedSession();
    mockPrisma.outreachSequence.findUnique.mockResolvedValue({
      clientId: CLIENT_ID,
      isActive: false,
    });
    const { POST } = await outreachRoute();
    const res = await POST(
      makeRequest(url, { sequenceId: "seq_1", contactEmail: "a@b.com" }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Sequence is not active");
  });

  it("returns 400 when neither contactEmail nor contactPhone is provided", async () => {
    authenticatedSession();
    mockPrisma.outreachSequence.findUnique.mockResolvedValue({
      clientId: CLIENT_ID,
      isActive: true,
    });
    const { POST } = await outreachRoute();
    const res = await POST(makeRequest(url, { sequenceId: "seq_1" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("contactEmail or contactPhone");
  });

  it("returns 201 with entryId on successful enrollment", async () => {
    authenticatedSession();
    mockPrisma.outreachSequence.findUnique.mockResolvedValue({
      clientId: CLIENT_ID,
      isActive: true,
    });
    mockOutreach.enrollInSequence.mockResolvedValue("entry_abc");
    const { POST } = await outreachRoute();
    const res = await POST(
      makeRequest(url, { sequenceId: "seq_1", contactEmail: "a@b.com" }),
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.entryId).toBe("entry_abc");
  });

  it("passes correct params to enrollInSequence", async () => {
    authenticatedSession();
    mockPrisma.outreachSequence.findUnique.mockResolvedValue({
      clientId: CLIENT_ID,
      isActive: true,
    });
    mockOutreach.enrollInSequence.mockResolvedValue("entry_xyz");
    const { POST } = await outreachRoute();
    await POST(
      makeRequest(url, {
        sequenceId: "seq_1",
        contactEmail: "a@b.com",
        contactPhone: "+15559999999",
        contactName: "Jane",
      }),
    );
    expect(mockOutreach.enrollInSequence).toHaveBeenCalledWith({
      clientId: CLIENT_ID,
      sequenceId: "seq_1",
      contactEmail: "a@b.com",
      contactPhone: "+15559999999",
      contactName: "Jane",
    });
  });
});

// ===========================================================================
// 4. POST /api/followup/classify
// ===========================================================================
describe("POST /api/followup/classify", () => {
  const url = "http://localhost/api/followup/classify";

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { POST } = await followupRoute();
    const res = await POST(makeRequest(url, { replyText: "yes I'm interested" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when replyText is missing", async () => {
    authenticatedSession();
    const { POST } = await followupRoute();
    const res = await POST(makeRequest(url, {}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 400 when replyText is empty string", async () => {
    authenticatedSession();
    const { POST } = await followupRoute();
    const res = await POST(makeRequest(url, { replyText: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when replyText exceeds 5000 chars", async () => {
    authenticatedSession();
    const { POST } = await followupRoute();
    const res = await POST(makeRequest(url, { replyText: "x".repeat(5001) }));
    expect(res.status).toBe(400);
  });

  it("returns 200 with classification on valid request", async () => {
    authenticatedSession();
    const classification = { intent: "interested", confidence: 0.95, suggestedAction: "reply" };
    mockClassifyReply.mockResolvedValue(classification);
    const { POST } = await followupRoute();
    const res = await POST(makeRequest(url, { replyText: "Sounds great, send me more info" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(classification);
  });

  it("passes context to classifyReply when provided", async () => {
    authenticatedSession();
    mockClassifyReply.mockResolvedValue({ intent: "interested", confidence: 0.8 });
    const { POST } = await followupRoute();
    await POST(
      makeRequest(url, {
        replyText: "Sure thing",
        context: { vertical: "plumbing", contactName: "Bob" },
      }),
    );
    expect(mockClassifyReply).toHaveBeenCalledWith("Sure thing", {
      vertical: "plumbing",
      contactName: "Bob",
    });
  });

  it("returns 500 when classifier throws", async () => {
    authenticatedSession();
    mockClassifyReply.mockRejectedValue(new Error("AI service down"));
    const { POST } = await followupRoute();
    const res = await POST(makeRequest(url, { replyText: "hello" }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to classify reply");
  });
});

// ===========================================================================
// 5. POST /api/leads/capture
// ===========================================================================
describe("POST /api/leads/capture", () => {
  const url = "http://localhost/api/leads/capture";

  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockReturnValue({ allowed: false, remaining: 0 });
    const { POST } = await leadsRoute();
    const res = await POST(makeRequest(url, { name: "Test", email: "a@b.com" }));
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toContain("Too many requests");
  });

  it("returns 400 when name is missing", async () => {
    const { POST } = await leadsRoute();
    const res = await POST(makeRequest(url, { email: "a@b.com" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("returns 400 when email is missing", async () => {
    const { POST } = await leadsRoute();
    const res = await POST(makeRequest(url, { name: "Test User" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when email is invalid format", async () => {
    const { POST } = await leadsRoute();
    const res = await POST(makeRequest(url, { name: "Test", email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when name is empty string", async () => {
    const { POST } = await leadsRoute();
    const res = await POST(makeRequest(url, { name: "", email: "a@b.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 200 with success and id on valid minimal request", async () => {
    mockPrisma.prospectLead.create.mockResolvedValue({ id: "lead_001" });
    const { POST } = await leadsRoute();
    const res = await POST(makeRequest(url, { name: "Alice", email: "alice@test.com" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.id).toBe("lead_001");
  });

  it("returns 200 with all optional fields", async () => {
    mockPrisma.prospectLead.create.mockResolvedValue({ id: "lead_002" });
    const { POST } = await leadsRoute();
    const res = await POST(
      makeRequest(url, {
        name: "Bob",
        email: "bob@test.com",
        phone: "555-1234",
        source: "referral",
        trade: "plumbing",
        partnerSlug: "partner-1",
        referralCode: "REF123",
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "spring_2025",
        metadata: { customField: "value" },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("creates lead in database with correct data", async () => {
    mockPrisma.prospectLead.create.mockResolvedValue({ id: "lead_003" });
    const { POST } = await leadsRoute();
    await POST(
      makeRequest(url, {
        name: "Carol",
        email: "carol@test.com",
        phone: "555-9999",
        source: "chatbot",
        trade: "hvac",
      }),
    );
    expect(mockPrisma.prospectLead.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Carol",
        email: "carol@test.com",
        phone: "555-9999",
        source: "chatbot",
        trade: "hvac",
      }),
    });
  });

  it("returns 500 when prisma create fails", async () => {
    mockPrisma.prospectLead.create.mockRejectedValue(new Error("DB error"));
    const { POST } = await leadsRoute();
    const res = await POST(makeRequest(url, { name: "Dave", email: "dave@test.com" }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to capture lead");
  });

  it("does not require authentication (public endpoint)", async () => {
    // leads/capture has no requireClient call; it uses rate limiting instead
    unauthenticated();
    mockPrisma.prospectLead.create.mockResolvedValue({ id: "lead_public" });
    const { POST } = await leadsRoute();
    const res = await POST(makeRequest(url, { name: "Public", email: "pub@test.com" }));
    // Should succeed regardless of auth state
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
