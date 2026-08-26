import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectCodingQuestionTypes() {
  console.log("Checking all coding questions across DB tables...");

  // 1. Question table
  const codingQuestions = await prisma.question.findMany({
    where: {
      OR: [
        { questionType: "CODING" },
        { codingData: { not: Prisma.JsonNull } }
      ]
    }
  });
  console.log(`Question table: found ${codingQuestions.length} coding questions`);
  for (const q of codingQuestions) {
    if (q.questionType !== "CODING") {
      console.log(`  Question ${q.id} has codingData but questionType = '${q.questionType}'`);
    }
  }

  // 2. GeneratedQuestion table
  const genQuestions = await prisma.generatedQuestion.findMany();
  console.log(`GeneratedQuestion table: ${genQuestions.length} total records`);
  let genCodingMisclassified = 0;
  for (const g of genQuestions) {
    const text = g.questionText || "";
    const isCodingText = text.startsWith("### Problem Statement") || text.includes("Write a program") || text.includes("starterCode") || (g.metadata as any)?.codingData;
    if (isCodingText && g.questionType !== "CODING") {
      genCodingMisclassified++;
      console.log(`  GenQuestion ${g.id} (Text: "${text.substring(0, 40)}...") has questionType = '${g.questionType}'`);
    }
  }
  console.log(`GeneratedQuestion misclassified coding: ${genCodingMisclassified}`);

  // 3. AssembledTestQuestion table
  const atqs = await prisma.assembledTestQuestion.findMany({
    include: { section: true }
  });
  console.log(`AssembledTestQuestion table: ${atqs.length} total records`);
  let atqCodingMisclassified = 0;
  for (const atq of atqs) {
    const snap: any = atq.questionSnapshot || {};
    const isCodingSection = (atq.section?.sectionName || "").toLowerCase().includes("coding");
    const isCodingData = !!snap.codingData;
    const isCodingText = (snap.questionText || "").startsWith("### Problem Statement");
    if ((isCodingSection || isCodingData || isCodingText) && snap.questionType !== "CODING") {
      atqCodingMisclassified++;
      console.log(`  ATQ ${atq.id} in section "${atq.section?.sectionName}" has snap.questionType = '${snap.questionType}'`);
    }
  }
  console.log(`AssembledTestQuestion misclassified coding: ${atqCodingMisclassified}`);

  // 4. TestInstanceQuestion table
  const tiqs = await prisma.testInstanceQuestion.findMany({
    include: { section: true }
  });
  console.log(`TestInstanceQuestion table: ${tiqs.length} total records`);
  let tiqCodingMisclassified = 0;
  for (const tiq of tiqs) {
    const snap: any = tiq.questionSnapshot || {};
    const isCodingSection = (tiq.section?.sectionName || "").toLowerCase().includes("coding");
    const isCodingData = !!snap.codingData;
    const isCodingText = (snap.questionText || "").startsWith("### Problem Statement");
    if ((isCodingSection || isCodingData || isCodingText) && snap.questionType !== "CODING") {
      tiqCodingMisclassified++;
      console.log(`  TIQ ${tiq.id} in section "${tiq.section?.sectionName}" has snap.questionType = '${snap.questionType}'`);
    }
  }
  console.log(`TestInstanceQuestion misclassified coding: ${tiqCodingMisclassified}`);
}

inspectCodingQuestionTypes().catch(console.error).finally(() => prisma.$disconnect());
