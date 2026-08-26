import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectActiveTestInstance() {
  const instances = await prisma.testInstance.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    include: {
      sections: true
    }
  });

  console.log(`Found ${instances.length} recent test instances:`);

  for (const inst of instances) {
    console.log("==================================================");
    console.log("Instance ID:", inst.id);
    console.log("Candidate Email:", inst.candidateEmail);
    console.log("Created At:", inst.createdAt);
    console.log("Status:", inst.status);

    const snapshot: any = inst.snapshot;
    console.log("Snapshot Sections Count:", snapshot?.sections?.length);

    if (snapshot?.sections) {
      for (const sec of snapshot.sections) {
        console.log(`\nSection: ${sec.sectionName} (${sec.sectionKey}) - Questions: ${sec.questions?.length}`);
        for (let i = 0; i < (sec.questions || []).length; i++) {
          const q = sec.questions[i];
          const qSnap = q.questionSnapshot || {};
          const isTarget = 
            JSON.stringify(qSnap).includes("organizing the items") || 
            JSON.stringify(qSnap).includes("delightful feedback");
          
          if (isTarget) {
            console.log(`  --> Question #${i + 1} (ID: ${q.questionId}):`);
            console.log("      Type:", qSnap.questionType || qSnap.type);
            console.log("      Options in Snapshot:", JSON.stringify(qSnap.options));
            console.log("      Full Snapshot:", JSON.stringify(qSnap, null, 2));
          }
        }
      }
    }
  }
}

inspectActiveTestInstance().catch(console.error).finally(() => prisma.$disconnect());
