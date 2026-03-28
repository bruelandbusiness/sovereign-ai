 
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — vi.mock factories are hoisted, so no external variables allowed
// ---------------------------------------------------------------------------

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

vi.mock("@/lib/db", () => {
  return {
    prisma: {
      account: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      magicLink: {
        findUnique: vi.fn(),
        create: vi.fn(),
        deleteMany: vi.fn(),
        updateMany: vi.fn(),
      },
      session: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
    },
  };
});

// ---------------------------------------------------------------------------
// Import after mocks are established
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/db";
import {
  generateMagicLink,
  verifyMagicLink,
} from "@/lib/auth";

// Typed references for convenience
const mockSession = vi.mocked(prisma.session);
const mockMagicLink = vi.mocked(prisma.magicLink);
const mockAccount = vi.mocked(prisma.account);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// generateMagicLink
// ---------------------------------------------------------------------------

describe("generateMagicLink", () => {
  it("creates account when none exists, generates token, and returns URL", async () => {
    const upsertedAccount = { id: "acct-new", email: "new@example.com", role: "client" };
    (mockAccount as any).upsert.mockResolvedValue(upsertedAccount);
    mockMagicLink.deleteMany.mockResolvedValue({ count: 0 } as any);
    mockMagicLink.create.mockResolvedValue({} as any);

    const before = Date.now();
    const result = await generateMagicLink("new@example.com");
    const after = Date.now();

    // Should have upserted the account
    expect((mockAccount as any).upsert).toHaveBeenCalledWith({
      where: { email: "new@example.com" },
      update: {},
      create: { email: "new@example.com", role: "client" },
    });

    // Should have cleaned up old unused magic links
    expect(mockMagicLink.deleteMany).toHaveBeenCalledWith({
      where: { accountId: "acct-new", usedAt: null },
    });

    // Should have created a new magic link
    expect(mockMagicLink.create).toHaveBeenCalledTimes(1);
    const createCall = (mockMagicLink.create as any).mock.calls[0][0].data;
    expect(createCall.token).toMatch(/^[0-9a-f]{64}$/);
    expect(createCall.accountId).toBe("acct-new");
    // Expiry should be ~15 minutes from now — use before/after bracket to
    // avoid flaky failures when Date.now() drifts between impl and assertion.
    const fifteenMinMs = 15 * 60 * 1000;
    const expiryMs = createCall.expiresAt.getTime();
    expect(expiryMs).toBeGreaterThanOrEqual(before + fifteenMinMs - 1000);
    expect(expiryMs).toBeLessThanOrEqual(after + fifteenMinMs + 1000);

    // Should return the URL, token, and account
    expect(result.url).toContain("/api/auth/verify?token=");
    expect(result.token).toMatch(/^[0-9a-f]{64}$/);
    expect(result.account).toEqual(upsertedAccount);
  });

  it("uses existing account when upsert resolves an existing row", async () => {
    const existingAccount = { id: "acct-1", email: "user@example.com" };
    (mockAccount as any).upsert.mockResolvedValue(existingAccount);
    mockMagicLink.deleteMany.mockResolvedValue({ count: 2 } as any);
    mockMagicLink.create.mockResolvedValue({} as any);

    const result = await generateMagicLink("user@example.com");

    expect(mockMagicLink.deleteMany).toHaveBeenCalledWith({
      where: { accountId: "acct-1", usedAt: null },
    });
    expect(result.url).toContain("/api/auth/verify?token=");
    expect(result.account).toEqual(existingAccount);
  });

  it("generates a unique token each invocation", async () => {
    const account = { id: "acct-1", email: "user@example.com" };
    (mockAccount as any).upsert.mockResolvedValue(account);
    mockMagicLink.deleteMany.mockResolvedValue({ count: 0 } as any);
    mockMagicLink.create.mockResolvedValue({} as any);

    const result1 = await generateMagicLink("user@example.com");
    const result2 = await generateMagicLink("user@example.com");

    expect(result1.token).not.toBe(result2.token);
  });

  it("uses localhost URL in non-production environment", async () => {
    const account = { id: "acct-1", email: "user@example.com" };
    (mockAccount as any).upsert.mockResolvedValue(account);
    mockMagicLink.deleteMany.mockResolvedValue({ count: 0 } as any);
    mockMagicLink.create.mockResolvedValue({} as any);

    const result = await generateMagicLink("user@example.com");

    expect(result.url).toMatch(/\/api\/auth\/verify\?token=/);
  });
});

// ---------------------------------------------------------------------------
// verifyMagicLink
// ---------------------------------------------------------------------------

describe("verifyMagicLink", () => {
  it("returns session and account for a valid, unused, non-expired token", async () => {
    const fakeAccount = { id: "acct-1", email: "user@example.com" };
    const fakeMagicLink = {
      token: "valid-token",
      accountId: "acct-1",
      account: fakeAccount,
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    };
    const fakeSession = {
      id: "sess-1",
      token: "session-token",
      accountId: "acct-1",
    };

    // updateMany returns count 1 = token was valid and atomically marked used
    (mockMagicLink as any).updateMany.mockResolvedValue({ count: 1 });
    mockMagicLink.findUnique.mockResolvedValue(fakeMagicLink as any);
    mockSession.create.mockResolvedValue(fakeSession as any);

    const result = await verifyMagicLink("valid-token");

    expect(result).not.toBeNull();
    expect(result!.account).toEqual(fakeAccount);
    expect(result!.session).toEqual(fakeSession);
  });

  it("returns null for an expired token", async () => {
    // updateMany returns count 0 when token is expired
    (mockMagicLink as any).updateMany.mockResolvedValue({ count: 0 });

    const result = await verifyMagicLink("expired-token");

    expect(result).toBeNull();
    // Should not attempt to fetch or create session
    expect(mockMagicLink.findUnique).not.toHaveBeenCalled();
    expect(mockSession.create).not.toHaveBeenCalled();
  });

  it("returns null for an already-used token", async () => {
    // updateMany returns count 0 when token is already used (usedAt IS NOT NULL)
    (mockMagicLink as any).updateMany.mockResolvedValue({ count: 0 });

    const result = await verifyMagicLink("used-token");

    expect(result).toBeNull();
  });

  it("returns null for a completely invalid (non-existent) token", async () => {
    (mockMagicLink as any).updateMany.mockResolvedValue({ count: 0 });

    const result = await verifyMagicLink("nonexistent-token");

    expect(result).toBeNull();
  });

  it("returns null if magic link record cannot be found after atomic update", async () => {
    // Edge case: updateMany succeeds but findUnique returns null (race/delete)
    (mockMagicLink as any).updateMany.mockResolvedValue({ count: 1 });
    mockMagicLink.findUnique.mockResolvedValue(null);

    const result = await verifyMagicLink("vanished-token");

    expect(result).toBeNull();
    expect(mockSession.create).not.toHaveBeenCalled();
  });

  it("passes metadata to createSession when provided", async () => {
    const fakeAccount = { id: "acct-1", email: "user@example.com" };
    (mockMagicLink as any).updateMany.mockResolvedValue({ count: 1 });
    mockMagicLink.findUnique.mockResolvedValue({
      token: "t",
      accountId: "acct-1",
      account: fakeAccount,
    } as any);
    mockSession.create.mockResolvedValue({ id: "sess-1" } as any);

    await verifyMagicLink("t", {
      userAgent: "TestBrowser/1.0",
      ipAddress: "192.168.1.1",
    });

    const sessionData = (mockSession.create as any).mock.calls[0][0].data;
    expect(sessionData.accountId).toBe("acct-1");
    expect(sessionData.ipAddress).toBe("192.168.1.1");
    expect(sessionData.userAgent).toBe("TestBrowser/1.0");
  });

  it("uses atomic updateMany to prevent double-use race conditions", async () => {
    (mockMagicLink as any).updateMany.mockResolvedValue({ count: 1 });
    mockMagicLink.findUnique.mockResolvedValue({
      token: "race-token",
      accountId: "acct-1",
      account: { id: "acct-1" },
    } as any);
    mockSession.create.mockResolvedValue({ id: "s" } as any);

    await verifyMagicLink("race-token");

    // Verify the updateMany was called with correct atomic conditions
    expect((mockMagicLink as any).updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          token: "race-token",
          usedAt: null,
          expiresAt: expect.objectContaining({ gt: expect.any(Date) }),
        }),
      })
    );
  });
});
