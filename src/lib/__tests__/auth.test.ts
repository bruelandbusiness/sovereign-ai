 
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
        update: vi.fn(),
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
  createSession,
  generateMagicLink,
  revokeSession,
  revokeAllSessions,
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

describe("createSession", () => {
  it("creates a session with a 64-char hex token and 7-day expiry", async () => {
    const fakeSession = {
      id: "sess-1",
      token: "abc123",
      accountId: "acct-1",
      expiresAt: new Date(),
    };
    mockSession.create.mockResolvedValue(fakeSession as any);

    const before = Date.now();
    const result = await createSession("acct-1", {
      userAgent: "Mozilla/5.0",
      ipAddress: "127.0.0.1",
    });
    const after = Date.now();

    expect(mockSession.create).toHaveBeenCalledTimes(1);

    const callArgs = (mockSession.create as any).mock.calls[0][0].data;
    // Token should be a 64-char hex string (32 random bytes)
    expect(callArgs.token).toMatch(/^[0-9a-f]{64}$/);
    expect(callArgs.accountId).toBe("acct-1");
    expect(callArgs.ipAddress).toBe("127.0.0.1");

    // Expiry should be ~7 days from now — bracket with before/after to avoid
    // flaky failures when Date.now() drifts between implementation and assertion.
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const expiryMs = callArgs.expiresAt.getTime();
    expect(expiryMs).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
    expect(expiryMs).toBeLessThanOrEqual(after + sevenDaysMs + 1000);

    expect(result).toEqual(fakeSession);
  });

  it("truncates long user agent strings to 512 characters", async () => {
    mockSession.create.mockResolvedValue({ id: "sess-2" } as any);
    const longUA = "X".repeat(1000);

    await createSession("acct-1", { userAgent: longUA });

    const callArgs = (mockSession.create as any).mock.calls[0][0].data;
    expect(callArgs.userAgent).toHaveLength(512);
  });

  it("handles missing metadata gracefully", async () => {
    mockSession.create.mockResolvedValue({ id: "sess-3" } as any);

    await createSession("acct-1");

    const callArgs = (mockSession.create as any).mock.calls[0][0].data;
    expect(callArgs.userAgent).toBeNull();
    expect(callArgs.ipAddress).toBeNull();
  });
});

describe("generateMagicLink", () => {
  it("upserts an account and always returns a magic link result", async () => {
    const fakeAccount = { id: "acct-1", email: "nobody@example.com" };
    mockAccount.upsert.mockResolvedValue(fakeAccount as any);
    mockMagicLink.deleteMany.mockResolvedValue({ count: 0 } as any);
    mockMagicLink.create.mockResolvedValue({} as any);

    const result = await generateMagicLink("nobody@example.com");

    expect(mockAccount.upsert).toHaveBeenCalledTimes(1);
    expect(result).not.toBeNull();
    expect(result!.url).toContain("/api/auth/verify?token=");
    expect(result!.account).toEqual(fakeAccount);
  });

  it("deletes old unused magic links and creates a new one", async () => {
    const fakeAccount = { id: "acct-1", email: "user@example.com" };
    mockAccount.upsert.mockResolvedValue(fakeAccount as any);
    mockMagicLink.deleteMany.mockResolvedValue({ count: 1 } as any);
    mockMagicLink.create.mockResolvedValue({} as any);

    const result = await generateMagicLink("user@example.com");

    expect(mockMagicLink.deleteMany).toHaveBeenCalledWith({
      where: { accountId: "acct-1", usedAt: null },
    });
    expect(mockMagicLink.create).toHaveBeenCalledTimes(1);
    expect(result).not.toBeNull();
    expect(result!.url).toContain("/api/auth/verify?token=");
    expect(result!.account).toEqual(fakeAccount);
  });
});

describe("revokeSession", () => {
  it("deletes a session if it belongs to the given account", async () => {
    mockSession.findUnique.mockResolvedValue({
      id: "sess-1",
      accountId: "acct-1",
    } as any);
    mockSession.delete.mockResolvedValue({} as any);

    const result = await revokeSession("sess-1", "acct-1");

    expect(result).toBe(true);
    expect(mockSession.delete).toHaveBeenCalledWith({
      where: { id: "sess-1" },
    });
  });

  it("returns false if the session belongs to a different account", async () => {
    mockSession.findUnique.mockResolvedValue({
      id: "sess-1",
      accountId: "acct-other",
    } as any);

    const result = await revokeSession("sess-1", "acct-1");

    expect(result).toBe(false);
    expect(mockSession.delete).not.toHaveBeenCalled();
  });

  it("returns false if the session does not exist", async () => {
    mockSession.findUnique.mockResolvedValue(null);

    const result = await revokeSession("nonexistent", "acct-1");

    expect(result).toBe(false);
  });
});

describe("revokeAllSessions", () => {
  it("deletes all sessions for the given account", async () => {
    mockSession.deleteMany.mockResolvedValue({ count: 3 } as any);

    await revokeAllSessions("acct-1");

    expect(mockSession.deleteMany).toHaveBeenCalledWith({
      where: { accountId: "acct-1" },
    });
  });
});
