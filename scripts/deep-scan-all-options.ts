import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function scanAllTables() {
  console.log("==================================================================");
  console.log("SCANNING ALL TABLES FOR MISSING OR EMPTY OPTIONS (MCQ / VERBAL / ETC.)");
  console.log("==================================================================");

  // 1. Scan Question table
  const allQuestions = await prisma.question.findMany({
    where: { questionType: "MCQ" }
  });
  console.log(`\n1. Question Table: ${allQuestions.length} MCQs`);
  const brokenQuestions: any[] = [];
  for (const q of allQuestions) {
    const mcq: any = q.mcqData;
    const opts = Array.isArray(mcq?.options) ? mcq.options : [];
    if (opts.length < 4) {
      brokenQuestions.push({
        id: q.id,
        text: (q.questionText || "").substring(0, 60),
        optionsCount: opts.length,
        mcqData: q.mcqData
      });
    }
  }
  console.log(`   --> Broken in Question table: ${brokenQuestions.length}`);
  if (brokenQuestions.length > 0) {
    console.log("   Broken Questions:", JSON.stringify(brokenQuestions.slice(0, 5), null, 2));
  }

  // 2. Scan GeneratedQuestion table
  const allGenQuestions = await prisma.generatedQuestion.findMany();
  console.log(`\n2. GeneratedQuestion Table: ${allGenQuestions.length} total records`);
  const brokenGenQuestions: any[] = [];
  for (const g of allGenQuestions) {
    const isMcq = !g.questionType || g.questionType === "MULTIPLE_CHOICE" || g.questionType === "MCQ";
    const opts = Array.isArray(g.options) ? g.options : [];
    if (isMcq && opts.length < 4) {
      brokenGenQuestions.push({
        id: g.id,
        text: (g.questionText || "").substring(0, 60),
        optionsCount: opts.length,
        options: g.options,
        correctAnswer: g.correctAnswer
      });
    }
  }
  console.log(`   --> Broken in GeneratedQuestion table: ${brokenGenQuestions.length}`);
  if (brokenGenQuestions.length > 0) {
    console.log("   Broken GeneratedQuestions:", JSON.stringify(brokenGenQuestions.slice(0, 10), null, 2));
  }

  // 3. Scan TestInstanceQuestion table
  const allTiqs = await prisma.testInstanceQuestion.findMany({
    include: { section: true }
  });
  console.log(`\n3. TestInstanceQuestion Table: ${allTiqs.length} snapshot records`);
  const brokenTiqs: any[] = [];
  for (const tiq of allTiqs) {
    const snap: any = tiq.questionSnapshot || {};
    const qType = (snap.questionType || snap.type || "").toUpperCase();
    const isCoding = (tiq.section?.sectionName || "").toLowerCase().includes("coding") || qType === "CODING";
    if (isCoding) continue; // Coding questions don't have options

    const opts = snap.options || snap.mcqData?.options || [];
    if (!Array.isArray(opts) || opts.length < 4) {
      brokenTiqs.push({
        tiqId: tiq.id,
        testInstanceId: tiq.testInstanceId,
        sectionName: tiq.section?.sectionName,
        questionOrder: tiq.questionOrder,
        questionId: tiq.questionId,
        text: (snap.questionText || "").substring(0, 60),
        optionsCount: Array.isArray(opts) ? opts.length : 0,
        options: snap.options
      });
    }
  }
  console.log(`   --> Broken in TestInstanceQuestion table: ${brokenTiqs.length}`);
  if (brokenTiqs.length > 0) {
    console.log("   Broken TestInstanceQuestions:", JSON.stringify(brokenTiqs.slice(0, 10), null, 2));
  }
}

scanAllTables().catch(console.error).finally(() => prisma.$disconnect());
