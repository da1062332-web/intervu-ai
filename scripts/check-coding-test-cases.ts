import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectAllCodingQuestions() {
  const codingQuestions = await prisma.question.findMany({
    where: { questionType: "CODING" }
  });

  console.log(`Total coding questions in Question table: ${codingQuestions.length}`);
  let invalidTestCount = 0;

  for (const q of codingQuestions) {
    const cd = (q.codingData || {}) as any;
    const meta = (q.metadata || {}) as any;
    const publicTests = cd.publicTests || meta.publicTests || [];
    const hiddenTests = cd.hiddenTests || meta.hiddenTests || [];
    const boundaryTests = cd.boundaryTests || meta.boundaryTests || [];
    const stressTests = cd.stressTests || meta.stressTests || [];

    // Check if public tests have keys that differ from hidden tests
    const pubKeys = publicTests[0]?.input ? Object.keys(publicTests[0].input).sort().join(",") : "NONE";
    const hidKeys = hiddenTests[0]?.input ? Object.keys(hiddenTests[0].input).filter((k: string) => k !== "hidden").sort().join(",") : "NONE";

    if (pubKeys !== "NONE" && hidKeys !== "NONE" && pubKeys !== hidKeys) {
      invalidTestCount++;
      console.log(`\n[MISMATCH] ${q.id} | ${q.questionTitle || q.questionText.substring(0, 40)}`);
      console.log(`  Public Keys: ${pubKeys} | Sample:`, JSON.stringify(publicTests[0]?.input));
      console.log(`  Hidden Keys: ${hidKeys} | Sample:`, JSON.stringify(hiddenTests[0]?.input));
    }
  }

  console.log(`\nTotal questions with mismatched hidden/public keys: ${invalidTestCount} / ${codingQuestions.length}`);
}

inspectAllCodingQuestions().catch(console.error).finally(() => prisma.$disconnect());
