import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runQueries() {
  try {
    console.log("--- Query 1: GeneratedQuestion Count ---");
    const countResult =
      await prisma.$queryRaw`SELECT COUNT(*) FROM "GeneratedQuestion";`;
    // Prisma raw count usually returns BigInt, so we convert to string for safe logging
    console.log(
      JSON.stringify(
        countResult,
        (key, value) => (typeof value === "bigint" ? value.toString() : value),
        2,
      ),
    );

    console.log("\n--- Query 2: Duplicate hash verification ---");
    const duplicateResult = await prisma.$queryRaw`
      SELECT "questionHash", COUNT(*)
      FROM "GeneratedQuestion"
      GROUP BY "questionHash"
      HAVING COUNT(*) > 1;
    `;
    console.log(
      JSON.stringify(
        duplicateResult,
        (key, value) => (typeof value === "bigint" ? value.toString() : value),
        2,
      ),
    );
  } catch (error) {
    console.error("Error executing queries:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runQueries();
