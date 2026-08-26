import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixRemaining() {
  console.log("Fixing remaining MCQ correctAnswer and Blood Relation questions...");

  const allMcqs = await prisma.question.findMany({
    where: { questionType: "MCQ" }
  });

  let fixedCount = 0;

  for (const q of allMcqs) {
    let mcq: any = q.mcqData;
    let meta: any = q.metadata || {};

    if (!mcq || typeof mcq !== "object") {
      mcq = { options: [], correctAnswer: q.answer };
    }

    let needsUpdate = false;

    // If options missing in mcqData but present in metadata
    if ((!mcq.options || mcq.options.length === 0) && Array.isArray(meta.options) && meta.options.length > 0) {
      mcq.options = meta.options;
      needsUpdate = true;
    }

    // Ensure correctAnswer is set
    if (!mcq.correctAnswer && q.answer) {
      mcq.correctAnswer = q.answer;
      needsUpdate = true;
    }

    // If answer differs from mcqData.correctAnswer, align them
    if (q.answer && mcq.correctAnswer && q.answer.trim() !== mcq.correctAnswer.trim()) {
      mcq.correctAnswer = q.answer.trim();
      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.question.update({
        where: { id: q.id },
        data: {
          mcqData: mcq,
          metadata: meta
        }
      });
      fixedCount++;
    }
  }

  console.log(`Successfully updated ${fixedCount} remaining MCQs.`);
}

fixRemaining().catch(console.error).finally(() => prisma.$disconnect());
