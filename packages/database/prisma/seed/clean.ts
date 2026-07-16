import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Template" CASCADE;');

  console.log("Deleted old configurations.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
