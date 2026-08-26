import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixAllCodingSnapshots() {
  console.log("Fixing all misclassified coding question snapshots in AssembledTestQuestion and TestInstanceQuestion...");

  // 1. Fix AssembledTestQuestion
  const atqs = await prisma.assembledTestQuestion.findMany({
    include: { section: true }
  });

  let atqFixed = 0;
  for (const atq of atqs) {
    const snap = (atq.questionSnapshot || {}) as any;
    const isCodingSection = (atq.section?.sectionName || "").toLowerCase().includes("coding");
    const isCodingData = !!snap.codingData;
    const isCodingText = (snap.questionText || "").startsWith("### Problem Statement");

    if (isCodingSection || isCodingData || isCodingText) {
      if (snap.questionType !== "CODING") {
        const updatedSnap = {
          ...snap,
          questionType: "CODING"
        };
        await prisma.assembledTestQuestion.update({
          where: { id: atq.id },
          data: { questionSnapshot: updatedSnap }
        });
        atqFixed++;
      }
    }
  }
  console.log(`Successfully fixed ${atqFixed} AssembledTestQuestion records.`);

  // 2. Fix TestInstanceQuestion
  const tiqs = await prisma.testInstanceQuestion.findMany({
    include: { section: true }
  });

  let tiqFixed = 0;
  for (const tiq of tiqs) {
    const snap = (tiq.questionSnapshot || {}) as any;
    const isCodingSection = (tiq.section?.sectionName || "").toLowerCase().includes("coding");
    const isCodingData = !!snap.codingData;
    const isCodingText = (snap.questionText || "").startsWith("### Problem Statement");

    if (isCodingSection || isCodingData || isCodingText) {
      if (snap.questionType !== "CODING") {
        const updatedSnap = {
          ...snap,
          questionType: "CODING"
        };
        await prisma.testInstanceQuestion.update({
          where: { id: tiq.id },
          data: { questionSnapshot: updatedSnap }
        });
        tiqFixed++;
      }
    }
  }
  console.log(`Successfully fixed ${tiqFixed} TestInstanceQuestion records.`);
}

fixAllCodingSnapshots().catch(console.error).finally(() => prisma.$disconnect());
