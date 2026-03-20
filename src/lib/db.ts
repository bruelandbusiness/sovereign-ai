import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- pg Pool emits errors
(pool as any).on("error", (err: Error) => {
  console.error("Unexpected PG pool error:", err);
});


function createPrismaClient() {
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter } as never);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
const shutdown = async () => {
  await prisma.$disconnect();
  await pool.end();
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
