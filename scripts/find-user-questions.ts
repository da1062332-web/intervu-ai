import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function findQuestions() {
  const q1 = await prisma.question.findMany({
    where: {
      questionText: { contains: "organizing the items found during the office cleanup", mode: "insensitive" }
    }
  });
  console.log("Q1 matches (cleanup):", JSON.stringify(q1, null, 2));

  const q2 = await prisma.question.findMany({
    where: {
      questionText: { contains: "the delightful feedback", mode: "insensitive" }
    }
  });
  console.log("Q2 matches (feedback):", JSON.stringify(q2, null, 2));

  const qGen1 = await prisma.generatedQuestion.findMany({
    where: {
      questionText: { contains: "organizing the items found during the office cleanup", mode: "insensitive" }
    }
  });
  console.log("Q1 in GeneratedQuestion:", JSON.stringify(qGen1, null, 2));

  const qGen2 = await prisma.generatedQuestion.findMany({
    where: {
      questionText: { contains: "the delightful feedback", mode: "insensitive" }
    }
  });
  console.log("Q2 in GeneratedQuestion:", JSON.stringify(qGen2, null, 2));
}

findQuestions().catch(console.error).finally(() => prisma.$disconnect());
