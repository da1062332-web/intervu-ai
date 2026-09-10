import { PrismaClient } from "@prisma/client";

const directUrl =
  process.env.DIRECT_URL ||
  "postgresql://postgres.ayklmzeqfezrlbkdusqc:MARVEL7ace%4077090@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

const prisma = new PrismaClient({
  datasources: { db: { url: directUrl } },
});

async function auditAllCodingQuestions() {
  console.log("=== COMPREHENSIVE CODING AUDIT ACROSS ENTIRE DATABASE ===");

  // 1. Audit Master Question table
  const allQuestions = await prisma.question.findMany();
  const codingQuestions = allQuestions.filter(
    (q) =>
      q.questionType === "CODING" ||
      (q.codingData as any)?.publicTests ||
      (q.metadata as any)?.codingData ||
      (q.questionText || "").startsWith("### Problem Statement"),
  );

  console.log(`\n1. Master Question Table: Total = ${allQuestions.length}, Coding = ${codingQuestions.length}`);

  let masterMissingCodingData = 0;
  for (const q of codingQuestions) {
    const cd = (q.codingData as any) || (q.metadata as any)?.codingData || (q.metadata as any);
    const hasTests = !!(
      (cd && Array.isArray(cd.publicTests) && cd.publicTests.length > 0) ||
      (cd && cd.oracleKey) ||
      (cd && Array.isArray(cd.hiddenTests) && cd.hiddenTests.length > 0)
    );

    if (!hasTests) {
      console.log(`⚠️ Master Question ${q.id} ("${q.questionText?.slice(0, 40)}...") is missing test data!`);
      masterMissingCodingData++;
    }
  }

  if (masterMissingCodingData === 0) {
    console.log(`✅ All ${codingQuestions.length} master coding questions have valid codingData & testcases!`);
  } else {
    console.log(`❌ ${masterMissingCodingData} master coding questions have missing test data.`);
  }

  // 2. Audit AssembledTestQuestion table
  const atqs = await prisma.assembledTestQuestion.findMany({
    include: { section: true },
  });
  const codingAtqs = atqs.filter(
    (atq) =>
      (atq.section?.sectionKey || atq.section?.sectionName || "").toLowerCase().includes("coding") ||
      (atq.questionSnapshot as any)?.questionType === "CODING" ||
      (atq.questionSnapshot as any)?.codingData,
  );

  console.log(`\n2. AssembledTestQuestion Table: Total = ${atqs.length}, Coding = ${codingAtqs.length}`);
  let atqMissing = 0;
  const atqUpdates: Array<{ id: string; snap: any }> = [];

  for (const atq of codingAtqs) {
    const snap = (atq.questionSnapshot as any) || {};
    const cd = snap.codingData || snap.metadata?.codingData || snap.metadata;
    const hasTests = !!(
      (cd && Array.isArray(cd.publicTests) && cd.publicTests.length > 0) ||
      (cd && cd.oracleKey) ||
      (cd && Array.isArray(cd.hiddenTests) && cd.hiddenTests.length > 0)
    );

    if (!hasTests) {
      atqMissing++;
      // Find from master
      const master = codingQuestions.find((mq) => mq.id === atq.questionId);
      if (master) {
        const masterCd = master.codingData || master.metadata?.codingData || master.metadata;
        const updatedSnap = {
          ...snap,
          questionType: "CODING",
          codingData: masterCd,
          questionText: snap.questionText || master.questionText,
          questionStatement: snap.questionStatement || master.questionStatement,
          instructions: snap.instructions || master.instructions,
        };
        atqUpdates.push({ id: atq.id, snap: updatedSnap });
      }
    }
  }

  if (atqUpdates.length > 0) {
    console.log(`Fixing ${atqUpdates.length} AssembledTestQuestion snapshots...`);
    for (let i = 0; i < atqUpdates.length; i += 20) {
      const chunk = atqUpdates.slice(i, i + 20);
      await Promise.all(
        chunk.map((item) =>
          prisma.assembledTestQuestion.update({
            where: { id: item.id },
            data: { questionSnapshot: item.snap },
          }),
        ),
      );
    }
    console.log(`✅ Fixed ${atqUpdates.length} AssembledTestQuestion records.`);
  } else {
    console.log(`✅ All ${codingAtqs.length} AssembledTestQuestion records have valid codingData!`);
  }

  // 3. Audit TestInstanceQuestion table
  const tiqs = await prisma.testInstanceQuestion.findMany({
    include: { section: true },
  });
  const codingTiqs = tiqs.filter(
    (tiq) =>
      (tiq.section?.sectionKey || tiq.section?.sectionName || "").toLowerCase().includes("coding") ||
      (tiq.questionSnapshot as any)?.questionType === "CODING" ||
      (tiq.questionSnapshot as any)?.codingData,
  );

  console.log(`\n3. TestInstanceQuestion Table: Total = ${tiqs.length}, Coding = ${codingTiqs.length}`);
  let tiqMissing = 0;
  const tiqUpdates: Array<{ id: string; snap: any }> = [];

  for (const tiq of codingTiqs) {
    const snap = (tiq.questionSnapshot as any) || {};
    const cd = snap.codingData || snap.metadata?.codingData || snap.metadata;
    const hasTests = !!(
      (cd && Array.isArray(cd.publicTests) && cd.publicTests.length > 0) ||
      (cd && cd.oracleKey) ||
      (cd && Array.isArray(cd.hiddenTests) && cd.hiddenTests.length > 0)
    );

    if (!hasTests) {
      tiqMissing++;
      const master = codingQuestions.find((mq) => mq.id === tiq.questionId);
      if (master) {
        const masterCd = master.codingData || master.metadata?.codingData || master.metadata;
        const updatedSnap = {
          ...snap,
          questionType: "CODING",
          codingData: masterCd,
          questionText: snap.questionText || master.questionText,
          questionStatement: snap.questionStatement || master.questionStatement,
          instructions: snap.instructions || master.instructions,
        };
        tiqUpdates.push({ id: tiq.id, snap: updatedSnap });
      }
    }
  }

  if (tiqUpdates.length > 0) {
    console.log(`Fixing ${tiqUpdates.length} TestInstanceQuestion snapshots...`);
    for (let i = 0; i < tiqUpdates.length; i += 20) {
      const chunk = tiqUpdates.slice(i, i + 20);
      await Promise.all(
        chunk.map((item) =>
          prisma.testInstanceQuestion.update({
            where: { id: item.id },
            data: { questionSnapshot: item.snap },
          }),
        ),
      );
    }
    console.log(`✅ Fixed ${tiqUpdates.length} TestInstanceQuestion records.`);
  } else {
    console.log(`✅ All ${codingTiqs.length} TestInstanceQuestion records have valid codingData!`);
  }

  console.log("\n=== FINAL AUDIT VERIFICATION COMPLETE ===");
}

auditAllCodingQuestions().catch(console.error).finally(() => prisma.$disconnect());
