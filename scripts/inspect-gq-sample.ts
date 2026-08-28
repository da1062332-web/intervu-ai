import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectGeneratedQuestions() {
  const gqs = await prisma.generatedQuestion.findMany({ take: 5 });
  console.log("Sample GeneratedQuestion:");
  console.log(JSON.stringify(gqs[0], null, 2));
}

inspectGeneratedQuestions().catch(console.error).finally(() => prisma.$disconnect());
