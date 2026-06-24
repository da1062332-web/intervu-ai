import { PrismaClient } from "@prisma/client";
import { seedUsers } from "./users.seed";
import { seedTemplates } from "./templates.seed";
import { seedEvaluations } from "./evaluations.seed";
import { seedExamConfig } from "./exam-config.seed";
import { seedTestConfigs } from "./test-config.seed";
import { seedTopics } from "./topics.seed";
import { seedModule1QA } from "../seeds/module1/seed";

const prisma = new PrismaClient();

async function main() {
  console.log("--- Database Seeding Started ---");
  await prisma.$connect();

  await seedTopics(prisma);
  await seedExamConfig(prisma);
  await seedTestConfigs(prisma);
  await seedUsers(prisma);
  await seedTemplates(prisma);
  await seedEvaluations(prisma);
  await seedModule1QA(prisma);

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
