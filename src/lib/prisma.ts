import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const config = { 
  url: process.env.DATABASE_URL || "file:./dev.db" 
};
console.log("[PRISMA INIT] Creating adapter with config:", config);
const adapter = new PrismaBetterSqlite3(config);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
