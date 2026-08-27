import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectAllCodingTestsDetail() {
  const codingQuestions = await prisma.question.findMany({
    where: { questionType: "CODING" }
  });

  console.log(`Checking test cases across all ${codingQuestions.length} coding questions...`);
  let issues = 0;

  for (const q of codingQuestions) {
    const cd = (q.codingData || {}) as any;
    const pub = cd.publicTests || [];
    const hid = cd.hiddenTests || [];
    const bound = cd.boundaryTests || [];
    const stress = cd.stressTests || [];

    if (pub.length === 0 || hid.length === 0 || bound.length === 0 || stress.length === 0) {
      issues++;
      console.log(`[EMPTY TESTS] ${q.id} (${q.questionTitle}): pub=${pub.length}, hid=${hid.length}, bound=${bound.length}, stress=${stress.length}`);
    }

    // Check key consistency
    const pubKey = pub[0]?.input ? Object.keys(pub[0].input).sort().join(",") : "";
    const hidKey = hid[0]?.input ? Object.keys(hid[0].input).filter((k: string) => k !== "hidden").sort().join(",") : "";
    const bndKey = bound[0]?.input ? Object.keys(bound[0].input).filter((k: string) => k !== "boundary").sort().join(",") : "";
    const strKey = stress[0]?.input ? Object.keys(stress[0].input).filter((k: string) => k !== "stress").sort().join(",") : "";

    if (pubKey && (pubKey !== hidKey || pubKey !== bndKey || pubKey !== strKey)) {
      issues++;
      console.log(`[KEY MISMATCH] ${q.id} (${q.questionTitle}):`);
      console.log(`  pubKey: ${pubKey}`);
      console.log(`  hidKey: ${hidKey}`);
      console.log(`  bndKey: ${bndKey}`);
      console.log(`  strKey: ${strKey}`);
    }
  }

  console.log(`Total issues found: ${issues}`);
}

inspectAllCodingTestsDetail().catch(console.error).finally(() => prisma.$disconnect());
