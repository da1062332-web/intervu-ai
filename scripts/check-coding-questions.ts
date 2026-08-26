import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkCoding() {
  const codingQuestions = await prisma.question.findMany({
    where: { questionType: "CODING" },
    take: 5
  });

  for (const q of codingQuestions) {
    console.log("==================================================");
    console.log("ID:", q.id);
    console.log("Title:", q.questionTitle);
    console.log("Text:", q.questionText);
    console.log("Coding Data:", JSON.stringify(q.codingData, null, 2));
  }
}

checkCoding().catch(console.error).finally(() => prisma.$disconnect());
