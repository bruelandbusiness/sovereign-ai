import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    $queryRawUnsafe: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
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

// Lazy import so mocks are wired first
const healthRoute = () => import("@/app/api/health/route");

beforeEach(() => {
  vi.clearAllMocks();
  // Defaults: all env vars configured
  process.env.STRIPE_SECRET_KEY = "sk_test_abc";
  process.env.SENDGRID_API_KEY = "SG.test_key";
  process.env.npm_package_version = "1.2.3";
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("GET /api/health", () => {
  it("returns ok when all checks pass", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ ok: 1 }]);

    const { GET } = await healthRoute();
    const res = await GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.version).toBe("1.2.3");
    expect(json).toHaveProperty("timestamp");
    expect(json.checks.database.status).toBe("ok");
    expect(json.checks.stripe.status).toBe("ok");
    expect(json.checks.sendgrid.status).toBe("ok");
  });

  it("includes responseTimeMs for every check", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ ok: 1 }]);

    const { GET } = await healthRoute();
    const json = await (await GET()).json();

    for (const check of Object.values(json.checks) as Array<{ responseTimeMs: number }>) {
      expect(typeof check.responseTimeMs).toBe("number");
      expect(check.responseTimeMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns error (503) when database fails even if other checks pass", async () => {
    mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error("connection refused"));

    const { GET } = await healthRoute();
    const res = await GET();
    expect(res.status).toBe(503);

    const json = await res.json();
    expect(json.status).toBe("error");
    expect(json.checks.database.status).toBe("error");
    expect(json.checks.database.message).toBe("connection refused");
    expect(json.checks.stripe.status).toBe("ok");
    expect(json.checks.sendgrid.status).toBe("ok");
  });

  it("returns degraded when Stripe is not configured", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ ok: 1 }]);
    delete process.env.STRIPE_SECRET_KEY;

    const { GET } = await healthRoute();
    const json = await (await GET()).json();

    expect(json.status).toBe("degraded");
    expect(json.checks.stripe.status).toBe("error");
    expect(json.checks.stripe.message).toContain("STRIPE_SECRET_KEY");
  });

  it("returns degraded when SendGrid is not configured", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ ok: 1 }]);
    delete process.env.SENDGRID_API_KEY;

    const { GET } = await healthRoute();
    const json = await (await GET()).json();

    expect(json.status).toBe("degraded");
    expect(json.checks.sendgrid.status).toBe("error");
    expect(json.checks.sendgrid.message).toContain("SENDGRID_API_KEY");
  });

  it("returns error (503) when ALL checks fail", async () => {
    mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error("db down"));
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.SENDGRID_API_KEY;

    const { GET } = await healthRoute();
    const res = await GET();
    expect(res.status).toBe(503);

    const json = await res.json();
    expect(json.status).toBe("error");
  });

  it("treats Stripe placeholder key as not configured", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ ok: 1 }]);
    process.env.STRIPE_SECRET_KEY = "sk_placeholder_for_build";

    const { GET } = await healthRoute();
    const json = await (await GET()).json();
    expect(json.checks.stripe.status).toBe("error");
  });

  it("returns unknown version when env var is missing", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ ok: 1 }]);
    delete process.env.npm_package_version;

    const { GET } = await healthRoute();
    const json = await (await GET()).json();
    expect(json.version).toBe("unknown");
  });

  it("includes memory and uptime checks", async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ ok: 1 }]);

    const { GET } = await healthRoute();
    const json = await (await GET()).json();
    expect(json.checks.memory).toHaveProperty("heapUsedMB");
    expect(json.checks.memory).toHaveProperty("rssMB");
    expect(json.checks.uptime).toHaveProperty("seconds");
    expect(json.checks.uptime).toHaveProperty("human");
  });
});
