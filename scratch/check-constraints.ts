import { prisma } from "../packages/database/src/client";

async function main() {
  try {
    const res = await prisma.$queryRawUnsafe(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = '"EvaluationResult"'::regclass;
    `);
    console.log("EvaluationResult Constraints:", JSON.stringify(res, null, 2));
  } catch (error) {
    console.error("Error fetching constraints:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
