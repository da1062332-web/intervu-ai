import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== INSPECTING QUESTION NO 70 (63 units of work...) ===");

  const questions = await prisma.question.findMany({
    where: { questionText: { contains: "63 units of work" } },
  });

  console.log(`Found ${questions.length} Question(s) in DB matching "63 units of work":`);
  for (const q of questions) {
    console.log(`\nQuestion ID: ${q.id}`);
    console.log(`- Question Text: ${q.questionText}`);
    console.log(`- Question Type: ${q.questionType}`);
    console.log(`- Difficulty: ${q.difficulty}`);
    console.log(`- mcqData:`, JSON.stringify(q.mcqData, null, 2));
    console.log(`- Answer: ${q.answer}`);
  }

  // Also search GeneratedQuestion table if used in pool
  const genQuestions = await prisma.generatedQuestion.findMany({
    where: { questionText: { contains: "63 units of work" } },
  });

  console.log(`\nFound ${genQuestions.length} GeneratedQuestion(s) matching "63 units of work":`);
  for (const g of genQuestions) {
    console.log(`\nGenQuestion ID: ${g.id}`);
    console.log(`- Options:`, JSON.stringify(g.options, null, 2));
  }

  // Also search latest TestInstance / AssembledTest snapshots for this question
  const assembledTests = await prisma.assembledTest.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  console.log(`\nChecking AssembledTest snapshots for options array...`);
  for (const at of assembledTests) {
    const sections = (at.sections as any[]) || [];
    for (const sec of sections) {
      const qs = (sec.questions as any[]) || [];
      for (const q of qs) {
        const text = q.questionSnapshot?.questionText || q.questionSnapshot?.stem || "";
        if (text.includes("63 units of work")) {
          console.log(`\nFound in AssembledTest ${at.id} -> Section ${sec.sectionName}:`);
          console.log(`- Snapshot Keys:`, Object.keys(q.questionSnapshot || {}));
          console.log(`- Options in snapshot:`, JSON.stringify(q.questionSnapshot?.options, null, 2));
          console.log(`- mcqData in snapshot:`, JSON.stringify(q.questionSnapshot?.mcqData, null, 2));
        }
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
