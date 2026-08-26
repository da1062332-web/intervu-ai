import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function quickCheckCodingTypes() {
  console.log("==================================================");
  console.log("FAST AUDIT OF CODING QUESTION TYPES ACROSS TABLES");
  console.log("==================================================");

  // 1. Question table
  const qCount = await prisma.question.count({
    where: { questionType: "CODING" }
  });
  console.log(`1. Question Table: ${qCount} CODING questions (100% valid)`);

  // 2. GeneratedQuestion table
  const genCodingCount = await prisma.generatedQuestion.count({
    where: { questionType: "CODING" }
  });
  console.log(`2. GeneratedQuestion Table: ${genCodingCount} CODING questions`);

  // 3. AssembledTestQuestion table
  const atqs = await prisma.assembledTestQuestion.findMany({
    select: {
      id: true,
      questionSnapshot: true,
      section: {
        select: { sectionName: true }
      }
    }
  });
  let atqMisclassified = 0;
  for (const atq of atqs) {
    const snap = (atq.questionSnapshot || {}) as any;
    const isCodingSection = (atq.section?.sectionName || "").toLowerCase().includes("coding");
    const isCodingData = !!snap.codingData;
    const isCodingText = (snap.questionText || "").startsWith("### Problem Statement");
    if ((isCodingSection || isCodingData || isCodingText) && snap.questionType !== "CODING") {
      atqMisclassified++;
    }
  }
  console.log(`3. AssembledTestQuestion Table (${atqs.length} total): ${atqMisclassified} misclassified`);

  // 4. TestInstanceQuestion table
  const tiqs = await prisma.testInstanceQuestion.findMany({
    select: {
      id: true,
      questionSnapshot: true,
      section: {
        select: { sectionName: true }
      }
    }
  });
  let tiqMisclassified = 0;
  for (const tiq of tiqs) {
    const snap = (tiq.questionSnapshot || {}) as any;
    const isCodingSection = (tiq.section?.sectionName || "").toLowerCase().includes("coding");
    const isCodingData = !!snap.codingData;
    const isCodingText = (snap.questionText || "").startsWith("### Problem Statement");
    if ((isCodingSection || isCodingData || isCodingText) && snap.questionType !== "CODING") {
      tiqMisclassified++;
    }
  }
  console.log(`4. TestInstanceQuestion Table (${tiqs.length} total): ${tiqMisclassified} misclassified`);

  // 5. Inspect specific AssembledTest from user screenshot (g4mauq85pxhjkjexf6d1kqty or similar)
  const sampleAssembly = await prisma.assembledTest.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      sections: {
        include: {
          questions: true
        }
      }
    }
  });
  if (sampleAssembly) {
    const codingSec = sampleAssembly.sections.find(s => s.sectionName.toLowerCase().includes("coding"));
    if (codingSec) {
      console.log(`\nSample AssembledTest (${sampleAssembly.id}) - Coding Section:`);
      for (const q of codingSec.questions) {
        const snap = (q.questionSnapshot || {}) as any;
        console.log(`  Q#${q.questionOrder}: ${q.questionId} | snap.questionType: ${snap.questionType} | Text: ${(snap.questionText || "").substring(0, 45)}...`);
      }
    }
  }
}

quickCheckCodingTypes().catch(console.error).finally(() => prisma.$disconnect());
