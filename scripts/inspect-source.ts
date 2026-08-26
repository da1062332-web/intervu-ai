import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectSource() {
  const ids = ["cmt6u8ipd002dxojm76nxwibs", "cmt6u8g4f002bxojm76nxwibs"];

  const genQs = await prisma.generatedQuestion.findMany({
    where: { id: { in: ids } }
  });
  console.log("Found in GeneratedQuestion by id:", JSON.stringify(genQs, null, 2));

  const questions = await prisma.question.findMany({
    where: { id: { in: ids } }
  });
  console.log("Found in Question by id:", JSON.stringify(questions, null, 2));

  // Let's search all GeneratedQuestions that have these texts
  const genByText = await prisma.generatedQuestion.findMany({
    where: {
      OR: [
        { questionText: { contains: "organizing the items" } },
        { questionText: { contains: "the delightful feedback" } }
      ]
    }
  });
  console.log("Found in GeneratedQuestion by text:", JSON.stringify(genByText, null, 2));
}

inspectSource().catch(console.error).finally(() => prisma.$disconnect());
