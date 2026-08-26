import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function patchLegacyCodingSnapshots() {
  console.log("Patching legacy coding snapshots in TestInstanceQuestion...");

  const tiqs = await prisma.testInstanceQuestion.findMany({
    include: { section: true }
  });

  let patched = 0;

  for (const tiq of tiqs) {
    const snap: any = tiq.questionSnapshot || {};
    const isCoding = (tiq.section?.sectionName || "").toLowerCase().includes("coding") || snap.questionType === "CODING";

    if (isCoding && (!snap.codingData || !snap.codingData.starterCode)) {
      // Find matching Question in DB
      const dbQ = await prisma.question.findUnique({
        where: { id: tiq.questionId }
      });

      if (dbQ && dbQ.codingData) {
        const updatedSnap = {
          ...snap,
          questionType: "CODING",
          codingData: dbQ.codingData
        };

        await prisma.testInstanceQuestion.update({
          where: { id: tiq.id },
          data: { questionSnapshot: updatedSnap }
        });
        patched++;
        console.log(`Patched coding snapshot for TIQ ${tiq.id} (Question: ${dbQ.questionTitle})`);
      }
    }
  }

  console.log(`Successfully patched ${patched} legacy coding snapshots.`);
}

patchLegacyCodingSnapshots().catch(console.error).finally(() => prisma.$disconnect());
