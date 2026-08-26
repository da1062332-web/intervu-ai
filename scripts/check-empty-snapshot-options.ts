import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkEmptySnapshotOptions() {
  const allTiqs = await prisma.testInstanceQuestion.findMany({
    include: {
      section: true
    }
  });

  console.log(`Checking ${allTiqs.length} total TestInstanceQuestion snapshots...`);

  const emptyOptionsTiqs: any[] = [];

  for (const tiq of allTiqs) {
    const snap: any = tiq.questionSnapshot || {};
    const qType = (snap.questionType || snap.type || "").toUpperCase();
    const isMcq = qType === "MCQ" || qType === "MULTIPLE_CHOICE";

    const options = snap.options || snap.mcqData?.options || [];
    if (isMcq && (!Array.isArray(options) || options.length === 0)) {
      emptyOptionsTiqs.push({
        tiqId: tiq.id,
        testInstanceId: tiq.testInstanceId,
        sectionName: tiq.section?.sectionName,
        questionOrder: tiq.questionOrder,
        questionId: tiq.questionId,
        questionText: (snap.questionText || "").substring(0, 70),
        snapOptions: snap.options,
        snapMcqData: snap.mcqData
      });
    }
  }

  console.log(`Found ${emptyOptionsTiqs.length} TestInstanceQuestions with empty options!`);
  console.log(JSON.stringify(emptyOptionsTiqs, null, 2));
}

checkEmptySnapshotOptions().catch(console.error).finally(() => prisma.$disconnect());
