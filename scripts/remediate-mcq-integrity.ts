import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function remediateMcqs() {
  console.log("Remediating MCQ questions (schema alignment, metadata options, answer sync)...");

  // 1. Fetch all MCQs
  const mcqs = await prisma.question.findMany({
    where: { questionType: "MCQ" }
  });

  console.log(`Found ${mcqs.length} MCQs to process.`);

  let updatedMissingCorrectAnswer = 0;
  let updatedMetadataOptions = 0;

  for (const q of mcqs) {
    let needsUpdate = false;
    const mcq: any = q.mcqData || {};
    const meta: any = q.metadata || {};
    let options: string[] = Array.isArray(mcq.options) ? mcq.options : [];

    // Ensure correctAnswer is present in mcqData
    if (!mcq.correctAnswer && q.answer) {
      mcq.correctAnswer = q.answer;
      needsUpdate = true;
      updatedMissingCorrectAnswer++;
    }

    // Ensure metadata.options matches mcq.options
    if (options.length > 0 && Array.isArray(meta.options)) {
      const sortedMeta = [...meta.options].sort().join("|||");
      const sortedMcq = [...options].sort().join("|||");
      if (sortedMeta !== sortedMcq) {
        meta.options = [...options];
        needsUpdate = true;
        updatedMetadataOptions++;
      }
    }

    if (needsUpdate) {
      await prisma.question.update({
        where: { id: q.id },
        data: {
          mcqData: mcq,
          metadata: meta
        }
      });
    }
  }

  console.log(`Updated ${updatedMissingCorrectAnswer} MCQs with missing correctAnswer in mcqData.`);
  console.log(`Updated ${updatedMetadataOptions} MCQs with metadata.options float mismatches.`);

  // 2. Fix the single answer mismatch in Blood Relation: cms5q1c1h00bnebnmfg83b1qx
  const bloodRelQ = await prisma.question.findUnique({
    where: { id: "cms5q1c1h00bnebnmfg83b1qx" }
  });

  if (bloodRelQ) {
    console.log("Inspecting Blood Relation question:", bloodRelQ.questionText);
    console.log("Explanation:", bloodRelQ.explanation);
    // Align mcqData.correctAnswer and answer with explanation logic
    const mcq: any = bloodRelQ.mcqData || {};
    const meta: any = bloodRelQ.metadata || {};
    const targetAns = "Both I and II together are sufficient.";
    if (mcq.options && mcq.options.includes(targetAns)) {
      mcq.correctAnswer = targetAns;
      await prisma.question.update({
        where: { id: bloodRelQ.id },
        data: {
          answer: targetAns,
          mcqData: mcq
        }
      });
      console.log(`Updated cms5q1c1h00bnebnmfg83b1qx to have consistent answer="${targetAns}"`);
    }
  }
}

remediateMcqs().catch(console.error).finally(() => prisma.$disconnect());
