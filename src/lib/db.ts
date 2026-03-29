import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { logger } from "@/lib/logger";

// NOTE: Cron routes (api/cron/*) share this same connection pool.
// If crons run long-lived transactions, they may compete with user-facing
// API routes for connections. Consider a dedicated pool or shorter cron
// transactions if P2024 errors appear during cron windows.

let pool: Pool | undefined;
let _prisma: PrismaClient | undefined;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 15,                   // Sized for 338 API routes under Vercel serverless concurrency
      idleTimeoutMillis: 10000,  // 10s idle timeout — release connections faster in serverless
      connectionTimeoutMillis: 15000, // 15s — allow headroom when pool is near capacity
      statement_timeout: 30000,  // 30s query timeout to prevent runaway queries
    });

    // Pool extends EventEmitter at runtime, but @types/pg ESM declarations
    // (index.d.mts) lose the EventEmitter inheritance when resolved via
    // moduleResolution: "bundler". Cast through EventEmitter to call .on().
    const emitter = pool as unknown as import("events").EventEmitter;

    emitter.on("error", (err: Error) => {
      logger.errorWithCause("Unexpected PG pool error", err);
    });

    // Warn when waiting connections approach pool capacity (P2024 early warning).
    // pg Pool exposes waitingCount/idleCount/totalCount at runtime, but the
    // ESM type declarations (index.d.mts) omit them — cast to access safely.
    const warnThreshold = 10; // ~2/3 of max
    const poolAny = pool as unknown as {
      waitingCount: number;
      idleCount: number;
      totalCount: number;
      options: { max?: number };
    };
    const checkInterval = setInterval(() => {
      if (pool && poolAny.waitingCount >= warnThreshold) {
        logger.warn(
          `PG pool pressure: ${poolAny.waitingCount} waiting, ${poolAny.idleCount} idle, ${poolAny.totalCount} total (max ${poolAny.options.max})`,
        );
      }
    }, 5_000);
    // Don't keep the process alive just for monitoring
    checkInterval.unref();
  }
  return pool;
}

function createPrismaClient() {
  const adapter = new PrismaPg(getPool());
  return new PrismaClient({ adapter } as never);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Lazy Prisma client — only connects when first accessed.
 * Prevents crashes during Next.js static build when DATABASE_URL is absent.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (!_prisma) {
      _prisma = globalForPrisma.prisma ?? createPrismaClient();
      if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = _prisma;
      }
    }
    return Reflect.get(_prisma, prop, receiver);
  },
});

// Graceful shutdown
const shutdown = async () => {
  if (_prisma) await _prisma.$disconnect();
  if (pool) {
    await pool.end();
    pool = undefined;
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
