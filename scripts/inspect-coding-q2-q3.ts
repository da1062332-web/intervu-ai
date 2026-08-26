import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectCodingQuestions() {
  const q2 = await prisma.question.findMany({
    where: { questionText: { contains: "1-indexed sorted array" } }
  });
  console.log("Q2 in Question table:", JSON.stringify(q2, null, 2));

  const q2Gen = await prisma.generatedQuestion.findMany({
    where: { questionText: { contains: "1-indexed sorted array" } }
  });
  console.log("Q2 in GeneratedQuestion table:", JSON.stringify(q2Gen, null, 2));

  const q3 = await prisma.question.findMany({
    where: { questionText: { contains: "needle" } }
  });
  console.log("Q3 in Question table:", JSON.stringify(q3, null, 2));

  const q3Gen = await prisma.generatedQuestion.findMany({
    where: { questionText: { contains: "needle" } }
  });
  console.log("Q3 in GeneratedQuestion table:", JSON.stringify(q3Gen, null, 2));
}

inspectCodingQuestions().catch(console.error).finally(() => prisma.$disconnect());
