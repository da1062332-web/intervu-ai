import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const oracles = await prisma.codingOracle.findMany();
    console.log(`ORACLE_COUNT: ${oracles.length}`);
    console.log("KEYS:", oracles.map((o) => o.key));
    const patterns = await prisma.codingPattern.findMany({
      include: { oracle: true },
    });
    console.log(`PATTERN_COUNT: ${patterns.length}`);
  } catch (err) {
    console.error("DB Query Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
