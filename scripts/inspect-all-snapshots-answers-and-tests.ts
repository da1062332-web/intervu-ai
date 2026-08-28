import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectAllSnapshots() {
  console.log("==================================================");
  console.log("INSPECTING ALL SNAPSHOTS ACROSS TABLES FOR ANSWERS & TESTS");
  console.log("==================================================");

  // 1. Check TestInstanceQuestion
  const tiqs = await prisma.testInstanceQuestion.findMany();
  let tiqMissingAnswer = 0;
  let tiqBadCodingTests = 0;

  for (const tiq of tiqs) {
    const snap = (tiq.questionSnapshot || {}) as any;
    const meta = snap.metadata || {};
    const mcq = snap.mcqData || {};
    const isCoding = snap.questionType === "CODING" || !!snap.codingData;

    if (isCoding) {
      const cd = snap.codingData || {};
      const publicTests = cd.publicTests || meta.publicTests || [];
      const hiddenTests = cd.hiddenTests || meta.hiddenTests || [];
      const pubKeys = publicTests[0]?.input ? Object.keys(publicTests[0].input).sort().join(",") : "";
      const hidKeys = hiddenTests[0]?.input ? Object.keys(hiddenTests[0].input).filter((k: string) => k !== "hidden").sort().join(",") : "";

      if (pubKeys && hidKeys && pubKeys !== hidKeys) {
        tiqBadCodingTests++;
      }
    } else {
      const answer = snap.answer || meta.answer || mcq.correctAnswer || snap.expectedAnswer;
      if (!answer) {
        tiqMissingAnswer++;
      }
    }
  }

  console.log(`TestInstanceQuestion (${tiqs.length} total):`);
  console.log(`  Missing Answer: ${tiqMissingAnswer}`);
  console.log(`  Bad Coding Tests: ${tiqBadCodingTests}`);

  // 2. Check AssembledTestQuestion
  const atqs = await prisma.assembledTestQuestion.findMany();
  let atqMissingAnswer = 0;
  let atqBadCodingTests = 0;

  for (const atq of atqs) {
    const snap = (atq.questionSnapshot || {}) as any;
    const meta = snap.metadata || {};
    const mcq = snap.mcqData || {};
    const isCoding = snap.questionType === "CODING" || !!snap.codingData;

    if (isCoding) {
      const cd = snap.codingData || {};
      const publicTests = cd.publicTests || meta.publicTests || [];
      const hiddenTests = cd.hiddenTests || meta.hiddenTests || [];
      const pubKeys = publicTests[0]?.input ? Object.keys(publicTests[0].input).sort().join(",") : "";
      const hidKeys = hiddenTests[0]?.input ? Object.keys(hiddenTests[0].input).filter((k: string) => k !== "hidden").sort().join(",") : "";

      if (pubKeys && hidKeys && pubKeys !== hidKeys) {
        atqBadCodingTests++;
      }
    } else {
      const answer = snap.answer || meta.answer || mcq.correctAnswer || snap.expectedAnswer;
      if (!answer) {
        atqMissingAnswer++;
      }
    }
  }

  console.log(`\nAssembledTestQuestion (${atqs.length} total):`);
  console.log(`  Missing Answer: ${atqMissingAnswer}`);
  console.log(`  Bad Coding Tests: ${atqBadCodingTests}`);

  // 3. Check GeneratedQuestion
  const genQs = await prisma.generatedQuestion.findMany();
  let genMissingAnswer = 0;
  for (const gq of genQs) {
    const snap = (gq.questionSnapshot || {}) as any;
    const meta = snap.metadata || (gq.metadata as any) || {};
    const mcq = snap.mcqData || {};
    const isCoding = gq.questionType === "CODING" || snap.questionType === "CODING";
    if (!isCoding) {
      const answer = gq.expectedAnswer || snap.answer || meta.answer || mcq.correctAnswer;
      if (!answer) {
        genMissingAnswer++;
      }
    }
  }
  console.log(`\nGeneratedQuestion (${genQs.length} total):`);
  console.log(`  Missing Answer: ${genMissingAnswer}`);
}

inspectAllSnapshots().catch(console.error).finally(() => prisma.$disconnect());
