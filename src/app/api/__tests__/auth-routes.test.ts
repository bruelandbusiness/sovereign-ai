import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mocks — available at vi.mock() factory time
// ---------------------------------------------------------------------------
const {
  mockPrisma,
  mockRateLimitByIP,
  mockSetRateLimitHeaders,
  mockGenerateMagicLink,
  mockVerifyMagicLink,
  mockSetSessionCookie,
  mockClearSessionCookie,
  mockSignOut,
  mockRotateSession,
  mockGetSession,
  mockListSessions,
  mockRevokeSession,
  mockSendMagicLinkEmail,
  mockSendEmail,
  mockRequireClient,
  mockCookiesGet,
  HoistedAuthError,
} = vi.hoisted(() => {
  class HoistedAuthError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }

  const mockSetRateLimitHeaders = vi.fn((res: unknown) => res);

  return {
    HoistedAuthError,
    mockPrisma: {
      account: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
      client: { findUnique: vi.fn(), create: vi.fn() },
      subscription: { create: vi.fn() },
      clientService: { create: vi.fn() },
      onboardingStep: { create: vi.fn() },
      auditLog: { create: vi.fn() },
      $transaction: vi.fn(),
    },
    mockRateLimitByIP: vi.fn(),
    mockSetRateLimitHeaders,
    mockGenerateMagicLink: vi.fn(),
    mockVerifyMagicLink: vi.fn(),
    mockSetSessionCookie: vi.fn(),
    mockClearSessionCookie: vi.fn(),
    mockSignOut: vi.fn(),
    mockRotateSession: vi.fn(),
    mockGetSession: vi.fn(),
    mockListSessions: vi.fn(),
    mockRevokeSession: vi.fn(),
    mockSendMagicLinkEmail: vi.fn(),
    mockSendEmail: vi.fn(),
    mockRequireClient: vi.fn(),
    mockCookiesGet: vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimitByIP: mockRateLimitByIP,
  setRateLimitHeaders: mockSetRateLimitHeaders,
}));

vi.mock("@/lib/auth", () => ({
  generateMagicLink: mockGenerateMagicLink,
  verifyMagicLink: mockVerifyMagicLink,
  setSessionCookie: mockSetSessionCookie,
  clearSessionCookie: mockClearSessionCookie,
  signOut: mockSignOut,
  getSession: mockGetSession,
  listSessions: mockListSessions,
  revokeSession: mockRevokeSession,
  rotateSession: mockRotateSession,
}));

vi.mock("@/lib/email", () => ({
  sendMagicLinkEmail: mockSendMagicLinkEmail,
  sendEmail: mockSendEmail,
  escapeHtml: (s: string) => s,
  emailLayout: (opts: { body: string }) => opts.body,
  emailButton: (_label: string, _url: string) => "",
}));

vi.mock("@/lib/require-client", () => ({
  requireClient: mockRequireClient,
  AuthError: HoistedAuthError,
  getErrorMessage: (e: unknown) => (e instanceof Error ? e.message : String(e)),
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

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: mockCookiesGet,
  })),
}));

// ---------------------------------------------------------------------------
// Lazy route imports (after mocks are wired)
// ---------------------------------------------------------------------------
const magicLinkRoute = () => import("@/app/api/auth/send-magic-link/route");
const verifyRoute = () => import("@/app/api/auth/verify/route");
const signupFreeRoute = () => import("@/app/api/auth/signup-free/route");
const signoutRoute = () => import("@/app/api/auth/signout/route");
const sessionRoute = () => import("@/app/api/auth/session/route");
const sessionsRoute = () => import("@/app/api/auth/sessions/route");
const rotateSessionRoute = () => import("@/app/api/auth/rotate-session/route");
const acceptTermsRoute = () => import("@/app/api/auth/accept-terms/route");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const FIXED_RESET_AT = 1800000000;

function allowRateLimit() {
  const rl = { allowed: true, remaining: 9, limit: 10, resetAt: FIXED_RESET_AT };
  mockRateLimitByIP.mockResolvedValue(rl);
  return rl;
}

function denyRateLimit() {
  const rl = { allowed: false, remaining: 0, limit: 10, resetAt: FIXED_RESET_AT };
  mockRateLimitByIP.mockResolvedValue(rl);
  return rl;
}

function makePostRequest(
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

function makeGetRequest(url: string): NextRequest {
  return new NextRequest(url, { method: "GET" });
}

function makeDeleteRequest(
  url: string,
  body: unknown,
): NextRequest {
  return new NextRequest(url, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const CLIENT_ID = "client_test_123";
const ACCOUNT_ID = "account_test_456";

// ---------------------------------------------------------------------------
// Reset all mocks between tests
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  allowRateLimit();
});

// ===========================================================================
// 1. POST /api/auth/send-magic-link
// ===========================================================================
describe("POST /api/auth/send-magic-link", () => {
  const url = "http://localhost/api/auth/send-magic-link";

  it("returns 200 with success on valid email", async () => {
    mockGenerateMagicLink.mockResolvedValue({ url: "https://example.com/auth?token=abc" });
    mockSendMagicLinkEmail.mockResolvedValue(undefined);
    const { POST } = await magicLinkRoute();
    const res = await POST(makePostRequest(url, { email: "user@example.com" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("calls generateMagicLink with lowercased trimmed email", async () => {
    mockGenerateMagicLink.mockResolvedValue({ url: "https://example.com/auth?token=abc" });
    mockSendMagicLinkEmail.mockResolvedValue(undefined);
    const { POST } = await magicLinkRoute();
    await POST(makePostRequest(url, { email: "USER@Example.COM" }));
    expect(mockGenerateMagicLink).toHaveBeenCalledWith("user@example.com");
  });

  it("returns 200 even when account does not exist (no information leakage)", async () => {
    mockGenerateMagicLink.mockResolvedValue(null);
    const { POST } = await magicLinkRoute();
    const res = await POST(makePostRequest(url, { email: "nonexistent@example.com" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockSendMagicLinkEmail).not.toHaveBeenCalled();
  });

  it("returns 400 when email is missing", async () => {
    const { POST } = await magicLinkRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
    expect(body).toHaveProperty("details");
  });

  it("returns 400 when email is invalid format", async () => {
    const { POST } = await magicLinkRoute();
    const res = await POST(makePostRequest(url, { email: "not-an-email" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });

  it("returns 429 when rate limited", async () => {
    denyRateLimit();
    const { POST } = await magicLinkRoute();
    const res = await POST(makePostRequest(url, { email: "user@example.com" }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
  });

  it("returns 500 when an unexpected error occurs", async () => {
    mockGenerateMagicLink.mockRejectedValue(new Error("DB down"));
    const { POST } = await magicLinkRoute();
    const res = await POST(makePostRequest(url, { email: "user@example.com" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to send magic link");
  });

  it("sends magic link email when account exists", async () => {
    mockGenerateMagicLink.mockResolvedValue({ url: "https://example.com/auth?token=abc" });
    mockSendMagicLinkEmail.mockResolvedValue(undefined);
    const { POST } = await magicLinkRoute();
    await POST(makePostRequest(url, { email: "user@example.com" }));
    expect(mockSendMagicLinkEmail).toHaveBeenCalledWith(
      "user@example.com",
      "https://example.com/auth?token=abc",
    );
  });
});

// ===========================================================================
// 2. GET /api/auth/verify
// ===========================================================================
describe("GET /api/auth/verify", () => {
  const baseUrl = "http://localhost/api/auth/verify";
  const validToken = "a".repeat(64); // 64 hex chars

  it("redirects to /dashboard on successful verification", async () => {
    mockVerifyMagicLink.mockResolvedValue({
      session: { token: "session_token_abc" },
      account: { id: ACCOUNT_ID },
    });
    mockSetSessionCookie.mockResolvedValue(undefined);
    const { GET } = await verifyRoute();
    const res = await GET(makeGetRequest(`${baseUrl}?token=${validToken}`));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/dashboard");
  });

  it("redirects to /login?error=missing_token when token is absent", async () => {
    const { GET } = await verifyRoute();
    const res = await GET(makeGetRequest(baseUrl));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=missing_token");
  });

  it("redirects to /login?error=invalid_or_expired when token format is invalid", async () => {
    const { GET } = await verifyRoute();
    const res = await GET(makeGetRequest(`${baseUrl}?token=short`));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=invalid_or_expired");
  });

  it("redirects to /login?error=invalid_or_expired when token has non-hex chars", async () => {
    const badToken = "g".repeat(64); // 'g' is not hex
    const { GET } = await verifyRoute();
    const res = await GET(makeGetRequest(`${baseUrl}?token=${badToken}`));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=invalid_or_expired");
  });

  it("redirects to /login?error=invalid_or_expired when verifyMagicLink returns null", async () => {
    mockVerifyMagicLink.mockResolvedValue(null);
    const { GET } = await verifyRoute();
    const res = await GET(makeGetRequest(`${baseUrl}?token=${validToken}`));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=invalid_or_expired");
  });

  it("redirects to /login?error=too_many_attempts when rate limited", async () => {
    denyRateLimit();
    const { GET } = await verifyRoute();
    const res = await GET(makeGetRequest(`${baseUrl}?token=${validToken}`));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=too_many_attempts");
  });

  it("calls setSessionCookie with the session token on success", async () => {
    mockVerifyMagicLink.mockResolvedValue({
      session: { token: "new_session_token" },
      account: { id: ACCOUNT_ID },
    });
    mockSetSessionCookie.mockResolvedValue(undefined);
    const { GET } = await verifyRoute();
    await GET(makeGetRequest(`${baseUrl}?token=${validToken}`));
    expect(mockSetSessionCookie).toHaveBeenCalledWith("new_session_token");
  });

  it("passes userAgent and ipAddress to verifyMagicLink", async () => {
    mockVerifyMagicLink.mockResolvedValue({
      session: { token: "tok" },
      account: { id: ACCOUNT_ID },
    });
    mockSetSessionCookie.mockResolvedValue(undefined);
    const { GET } = await verifyRoute();
    const req = new NextRequest(`${baseUrl}?token=${validToken}`, {
      method: "GET",
      headers: { "user-agent": "TestBrowser/1.0", "x-forwarded-for": "1.2.3.4" },
    });
    await GET(req);
    expect(mockVerifyMagicLink).toHaveBeenCalledWith(validToken, {
      userAgent: "TestBrowser/1.0",
      ipAddress: "1.2.3.4",
    });
  });

  it("redirects to /login?error=invalid_or_expired when verifyMagicLink throws", async () => {
    mockVerifyMagicLink.mockRejectedValue(new Error("DB error"));
    const { GET } = await verifyRoute();
    const res = await GET(makeGetRequest(`${baseUrl}?token=${validToken}`));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=invalid_or_expired");
  });
});

// ===========================================================================
// 3. POST /api/auth/signup-free
// ===========================================================================
describe("POST /api/auth/signup-free", () => {
  const url = "http://localhost/api/auth/signup-free";
  const validBody = {
    name: "Jane Doe",
    email: "jane@example.com",
    businessName: "Jane's Plumbing",
  };

  it("returns 201 with success on valid new signup", async () => {
    mockPrisma.account.findUnique.mockResolvedValue(null);
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        account: { create: vi.fn().mockResolvedValue({ id: "acc_new", name: "Jane Doe" }) },
        client: { create: vi.fn().mockResolvedValue({ id: "cli_new" }) },
        subscription: { create: vi.fn().mockResolvedValue({}) },
        clientService: { create: vi.fn().mockResolvedValue({}) },
        onboardingStep: { create: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });
    mockGenerateMagicLink.mockResolvedValue({ url: "https://example.com/auth?token=abc" });
    mockSendEmail.mockResolvedValue(undefined);

    const { POST } = await signupFreeRoute();
    const res = await POST(makePostRequest(url, validBody));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain("Account created");
    expect(body).toHaveProperty("trialEndsAt");
  });

  it("returns 201 and sends login link when account already exists with client", async () => {
    mockPrisma.account.findUnique.mockResolvedValue({ id: "acc_existing", email: "jane@example.com" });
    mockPrisma.client.findUnique.mockResolvedValue({ id: "cli_existing", accountId: "acc_existing" });
    mockGenerateMagicLink.mockResolvedValue({ url: "https://example.com/auth?token=xyz" });
    mockSendEmail.mockResolvedValue(undefined);

    const { POST } = await signupFreeRoute();
    const res = await POST(makePostRequest(url, validBody));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    // Should not reveal the account already existed
    expect(body.message).toContain("Account created");
  });

  it("returns 400 when name is missing", async () => {
    const { POST } = await signupFreeRoute();
    const res = await POST(makePostRequest(url, { email: "a@b.com", businessName: "Biz" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });

  it("returns 400 when email is missing", async () => {
    const { POST } = await signupFreeRoute();
    const res = await POST(makePostRequest(url, { name: "Jane", businessName: "Biz" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });

  it("returns 400 when email is invalid format", async () => {
    const { POST } = await signupFreeRoute();
    const res = await POST(makePostRequest(url, { name: "Jane", email: "not-email", businessName: "Biz" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when businessName is missing", async () => {
    const { POST } = await signupFreeRoute();
    const res = await POST(makePostRequest(url, { name: "Jane", email: "a@b.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when name is too short", async () => {
    const { POST } = await signupFreeRoute();
    const res = await POST(makePostRequest(url, { name: "J", email: "a@b.com", businessName: "Biz" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when businessName is too short", async () => {
    const { POST } = await signupFreeRoute();
    const res = await POST(makePostRequest(url, { name: "Jane", email: "a@b.com", businessName: "B" }));
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limited", async () => {
    denyRateLimit();
    const { POST } = await signupFreeRoute();
    const res = await POST(makePostRequest(url, validBody));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
  });

  it("returns 500 when transaction fails", async () => {
    mockPrisma.account.findUnique.mockResolvedValue(null);
    mockPrisma.$transaction.mockRejectedValue(new Error("Transaction failed"));

    const { POST } = await signupFreeRoute();
    const res = await POST(makePostRequest(url, validBody));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });

  it("accepts optional vertical field", async () => {
    mockPrisma.account.findUnique.mockResolvedValue(null);
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        account: { create: vi.fn().mockResolvedValue({ id: "acc_v", name: "Jane" }) },
        client: { create: vi.fn().mockResolvedValue({ id: "cli_v" }) },
        subscription: { create: vi.fn().mockResolvedValue({}) },
        clientService: { create: vi.fn().mockResolvedValue({}) },
        onboardingStep: { create: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });
    mockGenerateMagicLink.mockResolvedValue({ url: "https://example.com" });
    mockSendEmail.mockResolvedValue(undefined);

    const { POST } = await signupFreeRoute();
    const res = await POST(
      makePostRequest(url, { ...validBody, vertical: "plumbing" }),
    );
    expect(res.status).toBe(201);
  });

  it("still returns 201 when welcome email fails (non-blocking)", async () => {
    mockPrisma.account.findUnique.mockResolvedValue(null);
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const tx = {
        account: { create: vi.fn().mockResolvedValue({ id: "acc_e", name: "Jane" }) },
        client: { create: vi.fn().mockResolvedValue({ id: "cli_e" }) },
        subscription: { create: vi.fn().mockResolvedValue({}) },
        clientService: { create: vi.fn().mockResolvedValue({}) },
        onboardingStep: { create: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });
    mockGenerateMagicLink.mockResolvedValue({ url: "https://example.com" });
    mockSendEmail.mockRejectedValue(new Error("SendGrid down"));

    const { POST } = await signupFreeRoute();
    const res = await POST(makePostRequest(url, validBody));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

// ===========================================================================
// 4. POST /api/auth/signout
// ===========================================================================
describe("POST /api/auth/signout", () => {
  const url = "http://localhost/api/auth/signout";

  it("returns 200 with success on successful signout", async () => {
    mockSignOut.mockResolvedValue(undefined);
    const { POST } = await signoutRoute();
    const res = await POST(makePostRequest(url, {}));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("returns 429 when rate limited", async () => {
    denyRateLimit();
    const { POST } = await signoutRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
  });

  it("still returns success when signOut throws (clears cookie as fallback)", async () => {
    mockSignOut.mockRejectedValue(new Error("DB delete failed"));
    mockClearSessionCookie.mockResolvedValue(undefined);
    const { POST } = await signoutRoute();
    const res = await POST(makePostRequest(url, {}));
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("calls signOut", async () => {
    mockSignOut.mockResolvedValue(undefined);
    const { POST } = await signoutRoute();
    await POST(makePostRequest(url, {}));
    expect(mockSignOut).toHaveBeenCalled();
  });
});

// ===========================================================================
// 5. GET /api/auth/session
// ===========================================================================
describe("GET /api/auth/session", () => {
  const url = "http://localhost/api/auth/session";

  it("returns 200 with user data when authenticated", async () => {
    mockGetSession.mockResolvedValue({
      account: {
        id: ACCOUNT_ID,
        email: "user@test.com",
        name: "Test User",
        role: "client",
        client: {
          id: CLIENT_ID,
          businessName: "Test Business",
          ownerName: "Test User",
          vertical: "plumbing",
          city: "Austin",
          state: "TX",
        },
      },
    });
    const { GET } = await sessionRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.id).toBe(ACCOUNT_ID);
    expect(body.user.email).toBe("user@test.com");
    expect(body.user.client.id).toBe(CLIENT_ID);
    expect(body.user.client.businessName).toBe("Test Business");
  });

  it("returns 200 with user data and null client when no client exists", async () => {
    mockGetSession.mockResolvedValue({
      account: {
        id: ACCOUNT_ID,
        email: "user@test.com",
        name: "Test User",
        role: "admin",
        client: null,
      },
    });
    const { GET } = await sessionRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.client).toBeNull();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const { GET } = await sessionRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
    expect(body.user).toBeNull();
  });

  it("returns 429 when rate limited", async () => {
    denyRateLimit();
    const { GET } = await sessionRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
  });

  it("returns 500 when getSession throws", async () => {
    mockGetSession.mockRejectedValue(new Error("DB error"));
    const { GET } = await sessionRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});

// ===========================================================================
// 6. GET /api/auth/sessions (list sessions)
// ===========================================================================
describe("GET /api/auth/sessions", () => {
  const url = "http://localhost/api/auth/sessions";

  function authenticatedSession() {
    mockGetSession.mockResolvedValue({
      id: "session_current",
      accountId: ACCOUNT_ID,
    });
  }

  it("returns 200 with list of sessions when authenticated", async () => {
    authenticatedSession();
    mockListSessions.mockResolvedValue([
      {
        id: "session_current",
        createdAt: new Date("2025-01-01"),
        lastUsedAt: new Date("2025-06-01"),
        userAgent: "Chrome",
        ipAddress: "1.2.3.4",
        expiresAt: new Date("2025-12-31"),
      },
      {
        id: "session_other",
        createdAt: new Date("2025-02-01"),
        lastUsedAt: new Date("2025-05-01"),
        userAgent: "Firefox",
        ipAddress: "5.6.7.8",
        expiresAt: new Date("2025-12-31"),
      },
    ]);
    const { GET } = await sessionsRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.sessions).toHaveLength(2);
    // The current session should be marked
    const current = body.data.sessions.find((s: { id: string }) => s.id === "session_current");
    expect(current.isCurrent).toBe(true);
    const other = body.data.sessions.find((s: { id: string }) => s.id === "session_other");
    expect(other.isCurrent).toBe(false);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const { GET } = await sessionsRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 429 when rate limited", async () => {
    denyRateLimit();
    const { GET } = await sessionsRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(429);
  });

  it("returns 500 when listSessions throws", async () => {
    authenticatedSession();
    mockListSessions.mockRejectedValue(new Error("DB error"));
    const { GET } = await sessionsRoute();
    const res = await GET(makeGetRequest(url));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to list sessions");
  });
});

// ===========================================================================
// 7. DELETE /api/auth/sessions (revoke session)
// ===========================================================================
describe("DELETE /api/auth/sessions", () => {
  const url = "http://localhost/api/auth/sessions";

  function authenticatedSession() {
    mockGetSession.mockResolvedValue({
      id: "session_current",
      accountId: ACCOUNT_ID,
    });
  }

  it("returns 200 on successful session revocation", async () => {
    authenticatedSession();
    mockRevokeSession.mockResolvedValue(true);
    const { DELETE } = await sessionsRoute();
    const res = await DELETE(makeDeleteRequest(url, { sessionId: "session_other" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("calls revokeSession with correct args", async () => {
    authenticatedSession();
    mockRevokeSession.mockResolvedValue(true);
    const { DELETE } = await sessionsRoute();
    await DELETE(makeDeleteRequest(url, { sessionId: "session_other" }));
    expect(mockRevokeSession).toHaveBeenCalledWith("session_other", ACCOUNT_ID);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const { DELETE } = await sessionsRoute();
    const res = await DELETE(makeDeleteRequest(url, { sessionId: "session_other" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when sessionId is missing", async () => {
    authenticatedSession();
    const { DELETE } = await sessionsRoute();
    const res = await DELETE(makeDeleteRequest(url, {}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });

  it("returns 400 when trying to revoke the current session", async () => {
    authenticatedSession();
    const { DELETE } = await sessionsRoute();
    const res = await DELETE(makeDeleteRequest(url, { sessionId: "session_current" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("current session");
  });

  it("returns 404 when session not found or not owned by user", async () => {
    authenticatedSession();
    mockRevokeSession.mockResolvedValue(false);
    const { DELETE } = await sessionsRoute();
    const res = await DELETE(makeDeleteRequest(url, { sessionId: "session_unknown" }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("not found");
  });

  it("returns 429 when rate limited", async () => {
    denyRateLimit();
    const { DELETE } = await sessionsRoute();
    const res = await DELETE(makeDeleteRequest(url, { sessionId: "session_other" }));
    expect(res.status).toBe(429);
  });

  it("returns 500 when revokeSession throws", async () => {
    authenticatedSession();
    mockRevokeSession.mockRejectedValue(new Error("DB error"));
    const { DELETE } = await sessionsRoute();
    const res = await DELETE(makeDeleteRequest(url, { sessionId: "session_other" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to revoke session");
  });
});

// ===========================================================================
// 8. POST /api/auth/rotate-session
// ===========================================================================
describe("POST /api/auth/rotate-session", () => {
  const url = "http://localhost/api/auth/rotate-session";

  it("returns 200 with ok:true on successful rotation", async () => {
    mockCookiesGet.mockReturnValue({ value: "old_session_token" });
    mockRotateSession.mockResolvedValue("new_session_token");
    const { POST } = await rotateSessionRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("returns 401 when no session cookie is present", async () => {
    mockCookiesGet.mockReturnValue(undefined);
    const { POST } = await rotateSessionRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("No session");
  });

  it("returns 401 when rotateSession returns null (invalid session)", async () => {
    mockCookiesGet.mockReturnValue({ value: "old_session_token" });
    mockRotateSession.mockResolvedValue(null);
    const { POST } = await rotateSessionRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Session invalid");
  });

  it("returns 429 when rate limited", async () => {
    denyRateLimit();
    const { POST } = await rotateSessionRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
  });

  it("calls rotateSession with the old token", async () => {
    mockCookiesGet.mockReturnValue({ value: "my_token" });
    mockRotateSession.mockResolvedValue("new_token");
    const { POST } = await rotateSessionRoute();
    await POST(makePostRequest(url, {}));
    expect(mockRotateSession).toHaveBeenCalledWith("my_token");
  });

  it("returns 500 when rotateSession throws", async () => {
    mockCookiesGet.mockReturnValue({ value: "old_token" });
    mockRotateSession.mockRejectedValue(new Error("DB error"));
    const { POST } = await rotateSessionRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Session rotation failed");
  });
});

// ===========================================================================
// 9. POST /api/auth/accept-terms
// ===========================================================================
describe("POST /api/auth/accept-terms", () => {
  const url = "http://localhost/api/auth/accept-terms";

  function authenticatedClient() {
    mockRequireClient.mockResolvedValue({
      clientId: CLIENT_ID,
      accountId: ACCOUNT_ID,
    });
  }

  function unauthenticated() {
    mockRequireClient.mockRejectedValue(new HoistedAuthError("Unauthorized", 401));
  }

  it("returns 200 with success on valid terms acceptance", async () => {
    authenticatedClient();
    mockPrisma.auditLog.create.mockResolvedValue({ id: "audit_1" });
    const { POST } = await acceptTermsRoute();
    const res = await POST(makePostRequest(url, { version: "1.0" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.version).toBe("1.0");
    expect(body).toHaveProperty("acceptedAt");
  });

  it("creates an audit log entry with correct data", async () => {
    authenticatedClient();
    mockPrisma.auditLog.create.mockResolvedValue({ id: "audit_2" });
    const { POST } = await acceptTermsRoute();
    await POST(makePostRequest(url, { version: "2.0" }));
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        accountId: ACCOUNT_ID,
        action: "terms_accepted",
        resource: "account",
        resourceId: ACCOUNT_ID,
      }),
    });
    // Check metadata contains the version
    const callArgs = mockPrisma.auditLog.create.mock.calls[0][0];
    const metadata = JSON.parse(callArgs.data.metadata);
    expect(metadata.version).toBe("2.0");
    expect(metadata.clientId).toBe(CLIENT_ID);
  });

  it("returns 401 when not authenticated", async () => {
    unauthenticated();
    const { POST } = await acceptTermsRoute();
    const res = await POST(makePostRequest(url, { version: "1.0" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when version is missing", async () => {
    authenticatedClient();
    const { POST } = await acceptTermsRoute();
    const res = await POST(makePostRequest(url, {}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid request");
  });

  it("returns 400 when version is empty string", async () => {
    authenticatedClient();
    const { POST } = await acceptTermsRoute();
    const res = await POST(makePostRequest(url, { version: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limited", async () => {
    denyRateLimit();
    const { POST } = await acceptTermsRoute();
    const res = await POST(makePostRequest(url, { version: "1.0" }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Too many requests");
  });

  it("returns 500 when audit log creation fails", async () => {
    authenticatedClient();
    mockPrisma.auditLog.create.mockRejectedValue(new Error("DB error"));
    const { POST } = await acceptTermsRoute();
    const res = await POST(makePostRequest(url, { version: "1.0" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to record terms acceptance");
  });

  it("returns 400 when body is invalid JSON", async () => {
    authenticatedClient();
    const { POST } = await acceptTermsRoute();
    const req = new NextRequest(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid JSON body");
  });
});
