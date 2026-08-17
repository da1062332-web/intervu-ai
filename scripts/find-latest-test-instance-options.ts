import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== INSPECTING LATEST TEST INSTANCES FOR EMPTY OPTIONS ===");

  const instances = await prisma.testInstance.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    include: {
      sections: {
        include: {
          questions: true,
        },
      },
    },
  });

  for (const inst of instances) {
    console.log(`\nTestInstance ID: ${inst.id}`);
    console.log(`- Config ID: ${inst.examConfigId || inst.testConfigId}`);
    console.log(`- Status: ${inst.status}`);
    console.log(`- Sections: ${inst.sections.length}`);

    for (const sec of inst.sections) {
      for (const q of sec.questions) {
        const snap = (q.questionSnapshot as any) || {};
        const text = snap.questionText || snap.stem || "";
        const options = snap.options || snap.mcqData?.options || [];
        if (!options || !Array.isArray(options) || options.length === 0) {
          console.log(`\n  ⚠️ EMPTY OPTIONS QUESTION FOUND in Section '${sec.sectionName}', Question Order ${q.questionOrder}:`);
          console.log(`  - Question ID: ${q.questionId}`);
          console.log(`  - Question Text: "${text.substring(0, 70)}..."`);
          console.log(`  - Snapshot Keys:`, Object.keys(snap));
          console.log(`  - Options:`, options);
        }
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
