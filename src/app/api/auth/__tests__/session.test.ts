import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSession: mockGetSession,
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

const sessionRoute = () => import("@/app/api/auth/session/route");

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("GET /api/auth/session", () => {
  it("returns 401 with null user when no session exists", async () => {
    mockGetSession.mockResolvedValue(null);

    const { GET } = await sessionRoute();
    const res = await GET();
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.user).toBeNull();
  });

  it("returns 200 with user data when session exists", async () => {
    mockGetSession.mockResolvedValue({
      account: {
        id: "acc_1",
        email: "alice@example.com",
        name: "Alice",
        role: "owner",
        client: {
          id: "client_1",
          businessName: "Alice Plumbing",
          ownerName: "Alice",
          vertical: "plumbing",
          city: "Denver",
          state: "CO",
        },
      },
    });

    const { GET } = await sessionRoute();
    const res = await GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.user).toEqual({
      id: "acc_1",
      email: "alice@example.com",
      name: "Alice",
      role: "owner",
      client: {
        id: "client_1",
        businessName: "Alice Plumbing",
        ownerName: "Alice",
        vertical: "plumbing",
        city: "Denver",
        state: "CO",
      },
    });
  });

  it("returns null client when account has no linked client", async () => {
    mockGetSession.mockResolvedValue({
      account: {
        id: "acc_2",
        email: "bob@example.com",
        name: "Bob",
        role: "admin",
        client: null,
      },
    });

    const { GET } = await sessionRoute();
    const json = await (await GET()).json();
    expect(json.user.client).toBeNull();
  });

  it("returns 500 when getSession throws", async () => {
    mockGetSession.mockRejectedValue(new Error("DB unavailable"));

    const { GET } = await sessionRoute();
    const res = await GET();
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.error).toBe("Internal server error");
  });

  it("does not leak error details in the response body", async () => {
    mockGetSession.mockRejectedValue(
      new Error("connect ECONNREFUSED 127.0.0.1:5432"),
    );

    const { GET } = await sessionRoute();
    const json = await (await GET()).json();
    expect(JSON.stringify(json)).not.toContain("ECONNREFUSED");
  });
});
