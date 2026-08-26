import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspect2() {
  const tiqs = await prisma.testInstanceQuestion.findMany({
    include: { section: true }
  });

  for (const tiq of tiqs) {
    const snap: any = tiq.questionSnapshot || {};
    const isCoding = (tiq.section?.sectionName || "").toLowerCase().includes("coding") || snap.questionType === "CODING";

    if (isCoding && (!snap.codingData || !snap.codingData.starterCode)) {
      console.log("TIQ ID:", tiq.id);
      console.log("Section:", tiq.section?.sectionName);
      console.log("QuestionId:", tiq.questionId);
      console.log("Snapshot:", JSON.stringify(snap, null, 2));
    }
  }
}

inspect2().catch(console.error).finally(() => prisma.$disconnect());
