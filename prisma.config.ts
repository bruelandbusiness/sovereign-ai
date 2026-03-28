import { config } from "dotenv";
config({ path: ".env.local" });
config(); // also load .env as fallback
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder",
    directUrl: process.env.DIRECT_URL,
  } as Record<string, unknown>,
});
