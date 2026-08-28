import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectUnmatchedQuestions() {
  const allBankQuestions = await prisma.question.findMany();
  const bankById = new Map(allBankQuestions.map(q => [q.id, q]));
  const bankByHash = new Map(allBankQuestions.map(q => [q.questionHash || q.id, q]));
  const bankByText = new Map(allBankQuestions.map(q => [q.questionText.trim().toLowerCase(), q]));

  console.log(`Loaded ${allBankQuestions.length} questions from Question table.`);

  // Inspect TestInstanceQuestions
  const tiqs = await prisma.testInstanceQuestion.findMany();
  let matchedCount = 0;
  let unmatchedCount = 0;
  const unmatchedSamples: any[] = [];

  for (const tiq of tiqs) {
    const snap = (tiq.questionSnapshot || {}) as any;
    const qid = tiq.questionId || snap.id;
    const hash = snap.questionHash || qid;
    const text = (snap.questionText || "").trim().toLowerCase();

    const bankQ = bankById.get(qid) || bankByHash.get(hash) || bankByText.get(text);
    if (bankQ) {
      matchedCount++;
    } else {
      unmatchedCount++;
      if (unmatchedSamples.length < 15) {
        unmatchedSamples.push({
          id: qid,
          type: snap.questionType,
          text: snap.questionText?.substring(0, 70),
          options: snap.options || snap.mcqData?.options || snap.metadata?.options,
          explanation: snap.metadata?.explanation || snap.explanation,
          templateId: snap.templateId
        });
      }
    }
  }

  console.log(`\nTestInstanceQuestion matching: ${matchedCount} matched to Question bank, ${unmatchedCount} unmatched.`);
  console.log("\nUnmatched Samples:");
  for (const s of unmatchedSamples) {
    console.log(JSON.stringify(s, null, 2));
  }
}

inspectUnmatchedQuestions().catch(console.error).finally(() => prisma.$disconnect());
