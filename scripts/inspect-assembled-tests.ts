import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectAssembledTests() {
  const tests = await prisma.assembledTest.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      sections: {
        include: {
          questions: true
        }
      }
    }
  });

  console.log(`Found ${tests.length} AssembledTests:`);
  for (const t of tests) {
    console.log("==========================================");
    console.log("AssembledTest ID:", t.id);
    console.log("Config ID:", t.configId);
    console.log("Status:", t.status);
    console.log("Created At:", t.createdAt);
    for (const s of t.sections) {
      console.log(`  Section: ${s.sectionName} (${s.sectionKey}) - ${s.questions.length} questions`);
      for (const q of s.questions) {
        const snap = (q.questionSnapshot || {}) as any;
        console.log(`    Q#${q.questionOrder}: ${q.questionId} | snap.questionType: ${snap.questionType} | codingData: ${!!snap.codingData} | text: ${(snap.questionText || "").substring(0, 40)}`);
      }
    }
  }
}

inspectAssembledTests().catch(console.error).finally(() => prisma.$disconnect());
