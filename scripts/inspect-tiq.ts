import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectTestInstanceQuestions() {
  const latestQuestions = await prisma.testInstanceQuestion.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      section: true
    }
  });

  console.log(`Found ${latestQuestions.length} recent TestInstanceQuestions:`);

  for (const tiq of latestQuestions) {
    const snap: any = tiq.questionSnapshot || {};
    const text = snap.questionText || snap.text || snap.question || "";
    if (
      text.includes("organizing the items") || 
      text.includes("delightful feedback") ||
      snap.options === undefined ||
      (Array.isArray(snap.options) && snap.options.length === 0)
    ) {
      console.log("==========================================");
      console.log("TIQ ID:", tiq.id);
      console.log("TestInstanceId:", tiq.testInstanceId);
      console.log("Section:", tiq.section.sectionName);
      console.log("Question Order:", tiq.questionOrder);
      console.log("Question ID in Question table:", tiq.questionId);
      console.log("Snapshot questionType:", snap.questionType || snap.type);
      console.log("Snapshot options:", JSON.stringify(snap.options));
      console.log("Full Snapshot:", JSON.stringify(snap, null, 2));

      // Also check what is in Question table for tiq.questionId
      const dbQ = await prisma.question.findUnique({
        where: { id: tiq.questionId }
      });
      console.log("DB Question row exists?", !!dbQ);
      if (dbQ) {
        console.log("DB Question mcqData:", JSON.stringify(dbQ.mcqData));
      }
    }
  }
}

inspectTestInstanceQuestions().catch(console.error).finally(() => prisma.$disconnect());
