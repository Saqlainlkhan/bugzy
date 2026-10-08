import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
