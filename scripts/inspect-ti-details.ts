import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectTestInstance() {
  const ti = await prisma.testInstance.findUnique({
    where: { id: "zzg3o84k9jpqvdeu4ocqhny6" },
    include: {
      sections: {
        include: {
          questions: {
            orderBy: { questionOrder: "asc" }
          }
        },
        orderBy: { orderIndex: "asc" }
      }
    }
  });

  if (!ti) {
    console.log("Test instance not found!");
    return;
  }

  console.log(`Test Instance: ${ti.id} (${ti.status})`);
  for (const sec of ti.sections) {
    console.log(`\n================ Section: ${sec.sectionName} (${sec.questions.length} questions) ================`);
    for (const q of sec.questions) {
      const snap = (q.questionSnapshot || {}) as any;
      const meta = snap.metadata || {};
      const mcq = snap.mcqData || {};
      const answer = snap.answer || meta.answer || mcq.correctAnswer || snap.expectedAnswer;
      const isCoding = snap.questionType === "CODING" || !!snap.codingData;

      if (isCoding) {
        const cd = snap.codingData || {};
        console.log(`[CODING] Q${q.questionOrder} (${q.questionId}):`);
        console.log(`  Public tests: ${(cd.publicTests || meta.publicTests || []).length}`);
        console.log(`  Hidden tests: ${(cd.hiddenTests || meta.hiddenTests || []).length}`);
        console.log(`  Boundary tests: ${(cd.boundaryTests || meta.boundaryTests || []).length}`);
        console.log(`  Stress tests: ${(cd.stressTests || meta.stressTests || []).length}`);
        console.log(`  Oracle Key: ${cd.oracleKey || meta.oracleKey}`);
        console.log(`  Sample Public Test Input:`, JSON.stringify((cd.publicTests || meta.publicTests || [])[0]?.input));
        console.log(`  Sample Hidden Test Input:`, JSON.stringify((cd.hiddenTests || meta.hiddenTests || [])[0]?.input));
      } else {
        console.log(`[MCQ] Q${q.questionOrder} (${q.questionId}): Answer = ${answer || "MISSING!"} | Options: ${(snap.options || mcq.options || meta.options || []).length}`);
      }
    }
  }
}

inspectTestInstance().catch(console.error).finally(() => prisma.$disconnect());
