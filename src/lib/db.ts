import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { logger } from "@/lib/logger";

let pool: Pool | undefined;
let _prisma: PrismaClient | undefined;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,                    // Reduced for serverless — each function instance gets its own pool
      idleTimeoutMillis: 10000,  // 10s idle timeout — release connections faster in serverless
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,  // 30s query timeout to prevent runaway queries
    });

    // Pool extends EventEmitter at runtime, but @types/pg ESM declarations
    // (index.d.mts) lose the EventEmitter inheritance when resolved via
    // moduleResolution: "bundler". Cast through EventEmitter to call .on().
    (pool as unknown as import("events").EventEmitter).on("error", (err: Error) => {
      logger.errorWithCause("Unexpected PG pool error", err);
    });
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
