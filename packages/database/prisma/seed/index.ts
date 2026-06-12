import { PrismaClient } from "@prisma/client";
import { seedUsers } from "./users.seed";
import { seedTemplates } from "./templates.seed";
import { seedEvaluations } from "./evaluations.seed";

const prisma = new PrismaClient();

async function main() {
  console.log("--- Database Seeding Started ---");
  await prisma.$connect();

  await seedUsers(prisma);
  await seedTemplates(prisma);
  await seedEvaluations(prisma);

  console.log("--- Database Seeding Completed ---");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
