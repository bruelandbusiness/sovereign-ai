import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma before importing the module under test
const mockFindFirst = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    budgetTracker: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

// Mock notifications (fire-and-forget helpers)
vi.mock("@/lib/notifications", () => ({
  createNotificationForClient: vi.fn().mockResolvedValue(undefined),
}));

const { checkBudget, spendBudget } = await import("./budget");

beforeEach(() => {
  // mockReset clears calls AND resets implementations/return values,
  // unlike clearAllMocks which only clears call history.
  mockFindFirst.mockReset();
  mockTransaction.mockReset();
});

describe("checkBudget", () => {
  it("allows spend when no budget trackers exist", async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await checkBudget("client-1", 100);
    expect(result.allowed).toBe(true);
    // When no trackers exist, remaining should be -1 (Infinity mapped)
    expect(result.remaining).toBe(-1);
  });

  it("allows spend when daily budget has sufficient remaining", async () => {
    // First call: daily tracker
    mockFindFirst
      .mockResolvedValueOnce({
        clientId: "client-1",
        period: "daily",
        limitCents: 1000,
        spentCents: 200,
      })
      // Second call: monthly tracker (none)
      .mockResolvedValueOnce(null);

    const result = await checkBudget("client-1", 500);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(800); // 1000 - 200
  });

  it("rejects when daily budget is exceeded", async () => {
    mockFindFirst
      .mockResolvedValueOnce({
        clientId: "client-1",
        period: "daily",
        limitCents: 1000,
        spentCents: 900,
      })
      // Monthly tracker is not reached because daily check fails first
      .mockResolvedValueOnce(null);

    const result = await checkBudget("client-1", 200);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(100);
    expect(result.reason).toBe("Daily budget limit exceeded");
  });

  it("rejects when monthly budget is exceeded (daily passes)", async () => {
    // Daily tracker has enough room (low usage so no approaching warning)
    mockFindFirst
      .mockResolvedValueOnce({
        clientId: "client-1",
        period: "daily",
        limitCents: 5000,
        spentCents: 0,
      })
      // Monthly tracker is nearly exhausted
      .mockResolvedValueOnce({
        clientId: "client-1",
        period: "monthly",
        limitCents: 10000,
        spentCents: 9950,
      });

    const result = await checkBudget("client-1", 100);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(50); // 10000 - 9950
    expect(result.reason).toBe("Monthly budget limit exceeded");
  });

  it("returns the minimum remaining across daily and monthly", async () => {
    // Both trackers have enough room and are under the warning threshold
    mockFindFirst
      .mockResolvedValueOnce({
        clientId: "client-1",
        period: "daily",
        limitCents: 1000,
        spentCents: 200, // 20% usage, under 80% threshold
      })
      .mockResolvedValueOnce({
        clientId: "client-1",
        period: "monthly",
        limitCents: 10000,
        spentCents: 5000, // 50% usage, under 80% threshold
      });

    const result = await checkBudget("client-1", 100);
    expect(result.allowed).toBe(true);
    // min(1000-200, 10000-5000) = min(800, 5000) = 800
    expect(result.remaining).toBe(800);
  });

  it("handles zero cost request against a tracker with zero remaining", async () => {
    // Daily tracker is fully spent: remaining = 0
    // costCents (0) > remaining (0) is false, so it passes the daily check
    mockFindFirst
      .mockResolvedValueOnce({
        clientId: "client-1",
        period: "daily",
        limitCents: 1000,
        spentCents: 1000, // 100% usage => will trigger approaching warning
      })
      .mockResolvedValueOnce(null);

    const result = await checkBudget("client-1", 0);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0); // 1000 - 1000 = 0
  });

  it("allows when cost exactly equals remaining", async () => {
    // remaining = 100, cost = 100 => cost > remaining (100 > 100) is false => allowed
    mockFindFirst
      .mockResolvedValueOnce({
        clientId: "client-1",
        period: "daily",
        limitCents: 1000,
        spentCents: 900, // 90% usage => triggers approaching warning
      })
      .mockResolvedValueOnce(null);

    const result = await checkBudget("client-1", 100);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(100);
  });

  it("rejects when cost is 1 cent over remaining", async () => {
    mockFindFirst
      .mockResolvedValueOnce({
        clientId: "client-1",
        period: "daily",
        limitCents: 1000,
        spentCents: 900,
      })
      .mockResolvedValueOnce(null);

    const result = await checkBudget("client-1", 101);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(100);
    expect(result.reason).toBe("Daily budget limit exceeded");
  });
});

describe("spendBudget", () => {
  it("succeeds when transaction completes without budget exceeded", async () => {
    mockTransaction.mockImplementation(async (callback: Function) => {
      const tx = {
        $executeRaw: vi.fn().mockResolvedValue(1), // 1 row updated
        budgetTracker: {
          findFirst: vi.fn().mockResolvedValue({
            clientId: "client-1",
            period: "daily",
            limitCents: 1000,
            spentCents: 100,
          }),
        },
      };
      return callback(tx);
    });

    const result = await spendBudget("client-1", 50);
    expect(result.success).toBe(true);
  });

  it("fails when daily budget is exceeded (tracker exists but update returns 0)", async () => {
    mockTransaction.mockImplementation(async (callback: Function) => {
      const tx = {
        $executeRaw: vi.fn().mockResolvedValue(0), // 0 rows updated — budget exceeded
        budgetTracker: {
          findFirst: vi.fn().mockResolvedValue({
            clientId: "client-1",
            period: "daily",
            limitCents: 1000,
            spentCents: 999,
          }),
        },
      };
      try {
        return await callback(tx);
      } catch (err) {
        throw err;
      }
    });

    const result = await spendBudget("client-1", 50);
    expect(result.success).toBe(false);
    expect(result.reason).toBe("Daily budget limit exceeded");
  });

  it("re-throws non-BudgetExceeded errors", async () => {
    mockTransaction.mockRejectedValue(new Error("Database connection lost"));

    await expect(spendBudget("client-1", 50)).rejects.toThrow(
      "Database connection lost"
    );
  });
});
